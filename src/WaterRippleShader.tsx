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
  uniform vec2 u_ripples[16];
  uniform float u_rippleTimes[16];
  uniform float u_rippleStrengths[16];

  // Hash function for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // 2D noise
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

  // Fractal Brownian Motion for fine detail
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  // Pattern that mixes squares and circles
  float pattern(vec2 p, float scale) {
    vec2 grid = fract(p * scale);
    vec2 gridCenter = grid - 0.5;

    // Circle pattern
    float circle = length(gridCenter);

    // Square pattern (using max for box SDF)
    float square = max(abs(gridCenter.x), abs(gridCenter.y));

    // Mix between circle and square based on noise
    float mixFactor = noise(floor(p * scale) * 0.1 + u_time * 0.02);
    float shape = mix(circle, square, mixFactor);

    // Create fine detail by combining multiple scales
    float detail = fbm(p * scale * 2.0 + u_time * 0.05);

    return shape + detail * 0.3;
  }

  // Single ripple contribution
  float ripple(vec2 uv, vec2 center, float time, float strength) {
    float dist = length(uv - center);
    float rippleSpeed = 0.4;
    float rippleWidth = 0.08;

    // Expanding ring
    float ring = dist - time * rippleSpeed;

    // Smooth ring shape
    float wave = sin(ring * 40.0) * 0.5 + 0.5;

    // Fade based on distance and time
    float fade = exp(-dist * 3.0) * exp(-time * 2.0) * strength;

    // Width falloff
    float width = smoothstep(rippleWidth, 0.0, abs(ring - 0.1));

    return wave * fade * width;
  }

  void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uvAspect = uv * aspect;
    vec2 mouseAspect = u_mouse * aspect;

    // Base pattern - very fine-grained
    float basePattern = pattern(uvAspect, 80.0);
    float finePattern = pattern(uvAspect, 160.0);
    float tinyPattern = pattern(uvAspect, 320.0);

    // Combine patterns at different scales
    float combinedPattern = basePattern * 0.4 + finePattern * 0.35 + tinyPattern * 0.25;

    // Mouse influence - subtle displacement based on velocity
    float mouseDistance = length(uvAspect - mouseAspect);
    float velocityMag = length(u_mouseVelocity);

    // Create water push effect
    vec2 toMouse = normalize(uvAspect - mouseAspect + 0.001);
    float pushStrength = exp(-mouseDistance * 4.0) * velocityMag * 0.5;

    // Displace the pattern based on mouse push
    vec2 displacement = toMouse * pushStrength * 0.02;
    float displacedPattern = pattern(uvAspect + displacement, 80.0);

    // Accumulate ripples from trail
    float rippleSum = 0.0;
    for (int i = 0; i < 16; i++) {
      if (u_rippleStrengths[i] > 0.01) {
        vec2 ripplePos = u_ripples[i] * aspect;
        float rippleTime = u_time - u_rippleTimes[i];
        rippleSum += ripple(uvAspect, ripplePos, rippleTime, u_rippleStrengths[i]);
      }
    }

    // Subtle wave motion in background
    float ambientWave = sin(uvAspect.x * 20.0 + u_time * 0.3) *
                        sin(uvAspect.y * 15.0 + u_time * 0.2) * 0.02;

    // Combine all effects
    float finalPattern = mix(combinedPattern, displacedPattern, min(pushStrength * 2.0, 1.0));
    finalPattern += rippleSum * 0.3;
    finalPattern += ambientWave;

    // Very subtle intensity - this is key for the "barely noticeable" effect
    float intensity = (finalPattern - 0.5) * 0.025;

    // Add slight highlight near mouse with gentle falloff
    float mouseGlow = exp(-mouseDistance * 2.0) * velocityMag * 0.02;
    intensity += mouseGlow;

    // Output subtle luminosity variation
    // In light mode: slightly darker/lighter variations of the paper color
    // In dark mode: slightly lighter variations
    float baseValue = mix(0.0, 0.0, u_isDark);
    float variation = intensity;

    // Alpha determines how visible the effect is
    float alpha = abs(variation) * 2.0 + 0.01;
    alpha = min(alpha, 0.08); // Cap maximum visibility

    // Color: slight warm/cool shift based on pattern
    vec3 warmShift = vec3(0.02, 0.01, -0.01);
    vec3 coolShift = vec3(-0.01, 0.0, 0.02);
    vec3 colorShift = mix(coolShift, warmShift, finalPattern) * 0.5;

    // Final color with very subtle variation
    vec3 color = vec3(0.5 + variation) + colorShift;

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

  // Ripple trail buffer
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
    const damping = 0.92;
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
    ripplesRef.current = ripples.filter(r => currentTime - r.time < 2.0);

    for (let i = 0; i < 16; i++) {
      if (i < ripplesRef.current.length) {
        const r = ripplesRef.current[i];
        ripplePositions.push(r.x, 1.0 - r.y);
        rippleTimes.push(r.time);
        rippleStrengths.push(r.strength * Math.exp(-(currentTime - r.time) * 1.5));
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
      mouseVelocityRef.current.x = mouseVelocityRef.current.x * 0.7 + vx * 0.3;
      mouseVelocityRef.current.y = mouseVelocityRef.current.y * 0.7 + vy * 0.3;

      // Add ripple if moving fast enough and enough time has passed
      const speed = Math.sqrt(vx * vx + vy * vy);
      const time = (Date.now() - startTimeRef.current) / 1000;

      if (speed > 0.3 && time - lastRippleTimeRef.current > 0.05) {
        ripplesRef.current.push({
          x: newX,
          y: newY,
          time: time,
          strength: Math.min(speed * 0.3, 1.0),
        });
        lastRippleTimeRef.current = time;

        // Keep only recent ripples
        if (ripplesRef.current.length > 16) {
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
