import { useEffect, useRef, useCallback } from 'react';

// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - water ripple effect
const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_mouseSpeed;
  uniform float u_isDark;

  // Ripple data
  uniform vec2 u_ripples[20];
  uniform float u_rippleTimes[20];
  uniform float u_rippleStrengths[20];

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

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

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  // Water ripple function
  float waterRipple(vec2 uv, vec2 center, float time, float strength) {
    float dist = length(uv - center);
    float speed = 0.3;
    float freq = 30.0;

    // Expanding ring
    float t = time * speed;
    float ripple = sin((dist - t) * freq) * 0.5 + 0.5;

    // Decay with distance and time
    float decay = exp(-dist * 5.0) * exp(-time * 2.0) * strength;

    // Only show the wavefront
    float wavefront = smoothstep(t + 0.05, t, dist) * smoothstep(t - 0.15, t - 0.05, dist);

    return ripple * decay * wavefront;
  }

  void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);
    vec2 mouseAspect = vec2(u_mouse.x * aspect, u_mouse.y);

    // Background colors
    vec3 lightBg = vec3(0.973, 0.961, 0.941); // #f8f5f0
    vec3 darkBg = vec3(0.059, 0.055, 0.051);  // #0f0e0d
    vec3 bgColor = mix(lightBg, darkBg, u_isDark);

    // Pattern - fine grid of shapes
    float scale1 = 40.0;
    float scale2 = 80.0;

    vec2 grid1 = fract(uvAspect * scale1);
    vec2 grid2 = fract(uvAspect * scale2);

    // Mix circles and squares
    float circles = length(grid1 - 0.5) * 2.0;
    float squares = max(abs(grid1.x - 0.5), abs(grid1.y - 0.5)) * 2.0;
    float diamonds = (abs(grid2.x - 0.5) + abs(grid2.y - 0.5));

    // Animate which shape shows where
    float shapeMix = noise(floor(uvAspect * scale1) * 0.1 + u_time * 0.05);
    float pattern = mix(circles, squares, shapeMix);
    pattern = pattern * 0.7 + diamonds * 0.3;

    // Add flowing noise
    float flow = fbm(uvAspect * 3.0 + u_time * 0.1);
    pattern += flow * 0.3;

    // Mouse distance effect
    float mouseDist = length(uvAspect - mouseAspect);
    float mouseInfluence = exp(-mouseDist * 4.0) * u_mouseSpeed;

    // Displacement near mouse
    vec2 toMouse = normalize(uvAspect - mouseAspect + 0.001);
    vec2 displaced = uvAspect + toMouse * mouseInfluence * 0.1;
    float displacedPattern = length(fract(displaced * scale1) - 0.5) * 2.0;
    pattern = mix(pattern, displacedPattern, min(mouseInfluence * 2.0, 1.0));

    // Accumulate ripples
    float rippleEffect = 0.0;
    for (int i = 0; i < 20; i++) {
      if (u_rippleStrengths[i] > 0.01) {
        vec2 ripplePos = vec2(u_ripples[i].x * aspect, u_ripples[i].y);
        float rippleTime = u_time - u_rippleTimes[i];
        if (rippleTime > 0.0 && rippleTime < 2.5) {
          rippleEffect += waterRipple(uvAspect, ripplePos, rippleTime, u_rippleStrengths[i]);
        }
      }
    }

    // Ambient movement
    float ambient = sin(uvAspect.x * 15.0 + u_time * 0.4) *
                    sin(uvAspect.y * 12.0 + u_time * 0.3) * 0.1;

    // Combine effects
    float effect = (pattern - 0.5) * 0.15 + rippleEffect * 0.4 + ambient;

    // Mouse glow
    float glow = exp(-mouseDist * 3.0) * (0.1 + u_mouseSpeed * 0.3);
    effect += glow;

    // Apply effect to background color
    vec3 highlight = mix(vec3(1.0, 0.98, 0.95), vec3(0.2, 0.18, 0.15), u_isDark);
    vec3 shadow = mix(vec3(0.9, 0.88, 0.85), vec3(0.02, 0.02, 0.02), u_isDark);

    vec3 color = bgColor;
    color = mix(color, highlight, max(effect, 0.0));
    color = mix(color, shadow, max(-effect, 0.0));

    // Add ripple highlights
    color += vec3(rippleEffect * 0.15);

    gl_FragColor = vec4(color, 1.0);
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

  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseSpeedRef = useRef(0);
  const lastMouseRef = useRef({ x: 0.5, y: 0.5, time: Date.now() });

  const ripplesRef = useRef<RipplePoint[]>([]);
  const lastRippleTimeRef = useRef(0);

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
    if (!canvas) return false;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      console.warn('WebGL not supported');
      return false;
    }

    glRef.current = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return false;

    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return false;
    }

    programRef.current = program;
    gl.useProgram(program);

    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,  1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return true;
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

    // Decay mouse speed
    mouseSpeedRef.current *= 0.92;

    const time = (Date.now() - startTimeRef.current) / 1000;

    // Set uniforms
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), mouseRef.current.x, 1.0 - mouseRef.current.y);
    gl.uniform1f(gl.getUniformLocation(program, 'u_mouseSpeed'), mouseSpeedRef.current);
    gl.uniform1f(gl.getUniformLocation(program, 'u_isDark'), isDarkRef.current ? 1.0 : 0.0);

    // Clean old ripples
    ripplesRef.current = ripplesRef.current.filter(r => time - r.time < 2.5);

    // Prepare ripple data
    const ripplePositions: number[] = [];
    const rippleTimes: number[] = [];
    const rippleStrengths: number[] = [];

    for (let i = 0; i < 20; i++) {
      if (i < ripplesRef.current.length) {
        const r = ripplesRef.current[i];
        ripplePositions.push(r.x, 1.0 - r.y);
        rippleTimes.push(r.time);
        rippleStrengths.push(r.strength * Math.exp(-(time - r.time) * 0.5));
      } else {
        ripplePositions.push(0, 0);
        rippleTimes.push(0);
        rippleStrengths.push(0);
      }
    }

    gl.uniform2fv(gl.getUniformLocation(program, 'u_ripples'), ripplePositions);
    gl.uniform1fv(gl.getUniformLocation(program, 'u_rippleTimes'), rippleTimes);
    gl.uniform1fv(gl.getUniformLocation(program, 'u_rippleStrengths'), rippleStrengths);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    const success = initWebGL();
    if (!success) return;

    resize();

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = Math.max((now - lastMouseRef.current.time) / 1000, 0.001);

      const newX = e.clientX / window.innerWidth;
      const newY = e.clientY / window.innerHeight;

      const dx = newX - lastMouseRef.current.x;
      const dy = newY - lastMouseRef.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;

      // Smooth speed
      mouseSpeedRef.current = mouseSpeedRef.current * 0.5 + Math.min(speed, 3) * 0.5;

      // Create ripples when moving
      const time = (Date.now() - startTimeRef.current) / 1000;
      if (speed > 0.1 && time - lastRippleTimeRef.current > 0.04) {
        ripplesRef.current.push({
          x: newX,
          y: newY,
          time: time,
          strength: Math.min(speed * 0.4, 1.2),
        });
        lastRippleTimeRef.current = time;

        if (ripplesRef.current.length > 20) {
          ripplesRef.current.shift();
        }
      }

      lastMouseRef.current = { x: newX, y: newY, time: now };
      mouseRef.current = { x: newX, y: newY };
    };

    window.addEventListener('mousemove', handleMouseMove);
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
