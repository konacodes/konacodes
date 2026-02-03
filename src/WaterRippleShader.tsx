import { useEffect, useRef, useCallback } from 'react';

// Vertex shader - simple passthrough
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - creates the ripple effect
const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec2 u_mouseVelocity;
  uniform float u_isDark;

  // Ripple buffer - stores recent mouse positions for trail effect
  uniform vec2 u_ripples[24];
  uniform float u_rippleTimes[24];
  uniform float u_rippleStrengths[24];

  // Hash function for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(41.1, 289.7))) * 45758.5453);
  }

  // Smooth 2D noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal Brownian Motion for organic detail
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  // Voronoi for cell-like pattern
  float voronoi(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float minDist = 1.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = hash21(i + neighbor) * 0.5 + 0.25;
        point = 0.5 + 0.5 * sin(u_time * 0.3 + 6.2831 * point);
        vec2 diff = neighbor + point - f;
        float dist = length(diff);
        minDist = min(minDist, dist);
      }
    }

    return minDist;
  }

  // Pattern mixing squares and circles
  float cellPattern(vec2 p, float scale) {
    vec2 grid = fract(p * scale);
    vec2 gridId = floor(p * scale);
    vec2 gridCenter = grid - 0.5;

    // Randomize shape per cell
    float shapeType = hash(gridId);

    // Circle
    float circle = length(gridCenter) * 2.0;

    // Square (rounded)
    float square = max(abs(gridCenter.x), abs(gridCenter.y)) * 2.0;

    // Diamond
    float diamond = (abs(gridCenter.x) + abs(gridCenter.y)) * 1.5;

    // Mix shapes based on cell
    float shape;
    if (shapeType < 0.33) {
      shape = circle;
    } else if (shapeType < 0.66) {
      shape = square;
    } else {
      shape = diamond;
    }

    return shape;
  }

  // Single ripple contribution with realistic water physics
  float ripple(vec2 uv, vec2 center, float time, float strength) {
    float dist = length(uv - center);

    // Multiple expanding rings
    float rippleSpeed = 0.5;
    float wavelength = 25.0;

    // Main wave
    float phase = dist * wavelength - time * rippleSpeed * wavelength;
    float wave = sin(phase) * 0.5 + 0.5;

    // Secondary harmonics for realism
    float wave2 = sin(phase * 2.0 + 1.0) * 0.25 + 0.25;
    wave = wave * 0.7 + wave2 * 0.3;

    // Amplitude decay with distance and time
    float distDecay = 1.0 / (1.0 + dist * 4.0);
    float timeDecay = exp(-time * 1.5);

    // Sharper leading edge
    float leading = smoothstep(time * rippleSpeed + 0.02, time * rippleSpeed, dist);

    return wave * distDecay * timeDecay * strength * leading * 2.0;
  }

  void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uvAspect = uv * aspect;
    vec2 mouseAspect = u_mouse * aspect;

    // Base cellular pattern at multiple scales
    float cells1 = cellPattern(uvAspect + u_time * 0.02, 15.0);
    float cells2 = cellPattern(uvAspect - u_time * 0.015, 30.0);
    float cells3 = cellPattern(uvAspect + vec2(u_time * 0.01, -u_time * 0.02), 60.0);

    // Voronoi for organic movement
    float vor = voronoi(uvAspect * 8.0 + u_time * 0.1);

    // FBM for flowing detail
    float flow = fbm(uvAspect * 5.0 + u_time * 0.08);

    // Combine patterns
    float pattern = cells1 * 0.4 + cells2 * 0.3 + cells3 * 0.2 + vor * 0.3 + flow * 0.2;

    // Mouse interaction - displacement field
    float mouseDistance = length(uvAspect - mouseAspect);
    float velocityMag = length(u_mouseVelocity);
    vec2 toMouse = (uvAspect - mouseAspect) / (mouseDistance + 0.001);

    // Push effect - water being displaced
    float pushRadius = 0.3 + velocityMag * 0.2;
    float pushStrength = smoothstep(pushRadius, 0.0, mouseDistance) * velocityMag;

    // Displace pattern coordinates
    vec2 displacement = toMouse * pushStrength * 0.15;
    float displacedPattern = cellPattern(uvAspect + displacement, 15.0);

    // Blend original and displaced pattern
    pattern = mix(pattern, displacedPattern, min(pushStrength * 1.5, 1.0));

    // Accumulate ripples from trail
    float rippleSum = 0.0;
    for (int i = 0; i < 24; i++) {
      if (u_rippleStrengths[i] > 0.001) {
        vec2 ripplePos = u_ripples[i] * aspect;
        float rippleTime = u_time - u_rippleTimes[i];
        if (rippleTime > 0.0 && rippleTime < 3.0) {
          rippleSum += ripple(uvAspect, ripplePos, rippleTime, u_rippleStrengths[i]);
        }
      }
    }

    // Ambient subtle waves
    float ambient = sin(uvAspect.x * 12.0 + u_time * 0.5) *
                    sin(uvAspect.y * 10.0 + u_time * 0.4) * 0.08;
    ambient += sin(uvAspect.x * 25.0 - u_time * 0.3) *
               cos(uvAspect.y * 20.0 + u_time * 0.35) * 0.04;

    // Combine everything
    float finalValue = pattern * 0.6 + rippleSum + ambient;

    // Mouse glow/highlight
    float glow = exp(-mouseDistance * 3.0) * (0.15 + velocityMag * 0.4);
    finalValue += glow;

    // Normalize and create variation
    float intensity = (finalValue - 0.5) * 0.4;

    // Color variation - warm highlights, cool shadows
    vec3 warmColor = vec3(1.0, 0.95, 0.85);
    vec3 coolColor = vec3(0.85, 0.9, 1.0);
    vec3 baseColor = mix(coolColor, warmColor, finalValue);

    // Add subtle color based on ripples
    vec3 rippleColor = vec3(0.95, 0.98, 1.0);
    baseColor = mix(baseColor, rippleColor, rippleSum * 0.5);

    // Final color with intensity
    vec3 color = baseColor * (0.5 + intensity);

    // Alpha - more visible now
    float alpha = 0.08 + abs(intensity) * 0.4 + rippleSum * 0.3 + glow * 0.3;
    alpha = clamp(alpha, 0.0, 0.6);

    // Boost alpha near mouse when moving
    alpha += smoothstep(0.4, 0.0, mouseDistance) * velocityMag * 0.3;
    alpha = clamp(alpha, 0.0, 0.7);

    gl_FragColor = vec4(color, alpha);
  }
`;

interface RipplePoint {
  x: number;
  y: number;
  time: number;
  strength: number;
}

export function WaterRippleShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Mouse state with physics
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseVelocityRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastMouseTimeRef = useRef(Date.now());

  // Ripple trail buffer - increased size
  const ripplesRef = useRef<RipplePoint[]>([]);
  const lastRippleTimeRef = useRef(0);

  // Theme detection
  const isDarkRef = useRef(false);

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });

    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Create fullscreen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }, [createShader]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    gl.viewport(0, 0, canvas.width, canvas.height);
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    // Check theme
    isDarkRef.current = document.documentElement.getAttribute('data-theme') === 'dark';

    // Update velocity with damping (water-like physics)
    const damping = 0.94;
    mouseVelocityRef.current.x *= damping;
    mouseVelocityRef.current.y *= damping;

    // Clear with transparent
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Time
    const time = (Date.now() - startTimeRef.current) / 1000;

    // Set uniforms
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const mouseVelocityLocation = gl.getUniformLocation(program, 'u_mouseVelocity');
    const isDarkLocation = gl.getUniformLocation(program, 'u_isDark');

    gl.uniform1f(timeLocation, time);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(mouseLocation, mouseRef.current.x, 1.0 - mouseRef.current.y);
    gl.uniform2f(mouseVelocityLocation, mouseVelocityRef.current.x, mouseVelocityRef.current.y);
    gl.uniform1f(isDarkLocation, isDarkRef.current ? 1.0 : 0.0);

    // Set ripple uniforms
    const ripples = ripplesRef.current;
    const ripplePositions: number[] = [];
    const rippleTimes: number[] = [];
    const rippleStrengths: number[] = [];

    // Clean up old ripples and prepare data
    const currentTime = time;
    ripplesRef.current = ripples.filter(r => currentTime - r.time < 3.0);

    for (let i = 0; i < 24; i++) {
      if (i < ripplesRef.current.length) {
        const r = ripplesRef.current[i];
        ripplePositions.push(r.x, 1.0 - r.y);
        rippleTimes.push(r.time);
        rippleStrengths.push(r.strength * Math.exp(-(currentTime - r.time) * 0.8));
      } else {
        ripplePositions.push(0, 0);
        rippleTimes.push(0);
        rippleStrengths.push(0);
      }
    }

    const ripplesLocation = gl.getUniformLocation(program, 'u_ripples');
    const rippleTimesLocation = gl.getUniformLocation(program, 'u_rippleTimes');
    const rippleStrengthsLocation = gl.getUniformLocation(program, 'u_rippleStrengths');

    gl.uniform2fv(ripplesLocation, ripplePositions);
    gl.uniform1fv(rippleTimesLocation, rippleTimes);
    gl.uniform1fv(rippleStrengthsLocation, rippleStrengths);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    initWebGL();
    resize();

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = Math.max((now - lastMouseTimeRef.current) / 1000, 0.001);

      const newX = e.clientX / window.innerWidth;
      const newY = e.clientY / window.innerHeight;

      // Calculate velocity
      const vx = (newX - lastMouseRef.current.x) / dt;
      const vy = (newY - lastMouseRef.current.y) / dt;

      // Smooth velocity update
      mouseVelocityRef.current.x = mouseVelocityRef.current.x * 0.6 + vx * 0.4;
      mouseVelocityRef.current.y = mouseVelocityRef.current.y * 0.6 + vy * 0.4;

      // Add ripple more frequently when moving
      const speed = Math.sqrt(vx * vx + vy * vy);
      const time = (Date.now() - startTimeRef.current) / 1000;

      // Lower threshold for ripple creation
      if (speed > 0.15 && time - lastRippleTimeRef.current > 0.03) {
        ripplesRef.current.push({
          x: newX,
          y: newY,
          time: time,
          strength: Math.min(speed * 0.5, 1.5),
        });
        lastRippleTimeRef.current = time;

        // Keep more ripples
        if (ripplesRef.current.length > 24) {
          ripplesRef.current.shift();
        }
      }

      lastMouseRef.current.x = newX;
      lastMouseRef.current.y = newY;
      mouseRef.current.x = newX;
      mouseRef.current.y = newY;
      lastMouseTimeRef.current = now;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Start render loop
    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initWebGL, resize, render]);

  return (
    <canvas
      ref={canvasRef}
      className="water-ripple-shader"
      aria-hidden="true"
    />
  );
}

export default WaterRippleShader;
