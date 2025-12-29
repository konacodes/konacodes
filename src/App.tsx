import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import "./index.css";
import { IntroSequence } from "./IntroSequence";

// ============================================
// WebGL Gradient Mesh Background
// ============================================
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouseNorm = u_mouse / u_resolution;

    // Mouse displacement
    float mouseDist = length(uv - mouseNorm);
    float mouseInfluence = smoothstep(0.4, 0.0, mouseDist) * 0.15;
    vec2 displacement = (uv - mouseNorm) * mouseInfluence;

    vec2 distortedUV = uv + displacement;

    // Layered noise for organic movement
    float noise1 = snoise(distortedUV * 2.0 + u_time * 0.1);
    float noise2 = snoise(distortedUV * 3.0 - u_time * 0.15 + 100.0);
    float noise3 = snoise(distortedUV * 1.5 + u_time * 0.08 + 200.0);

    // Color palette - purples, pinks, blues
    vec3 color1 = vec3(0.46, 0.29, 0.64); // #764ba2
    vec3 color2 = vec3(0.94, 0.58, 0.98); // #f093fb
    vec3 color3 = vec3(0.4, 0.5, 0.9);    // Blue accent
    vec3 color4 = vec3(0.02, 0.02, 0.05); // Near black

    // Mix colors based on noise
    vec3 gradient = mix(color4, color1, smoothstep(-0.5, 0.8, noise1) * 0.5);
    gradient = mix(gradient, color2, smoothstep(0.0, 1.0, noise2) * 0.3);
    gradient = mix(gradient, color3, smoothstep(0.2, 1.0, noise3) * 0.2);

    // Add mouse glow
    float glow = smoothstep(0.3, 0.0, mouseDist) * 0.4;
    gradient += vec3(0.94, 0.58, 0.98) * glow;

    // Vignette
    float vignette = 1.0 - smoothstep(0.3, 0.9, length(uv - 0.5) * 1.2);
    gradient *= vignette * 0.7 + 0.3;

    gl_FragColor = vec4(gradient, 1.0);
  }
`;

function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS background');
      return;
    }

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Create geometry (full-screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: canvas.height - e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const startTime = Date.now();
    const animate = () => {
      const time = (Date.now() - startTime) / 1000;

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}

// ============================================
// Ripple Text Component
// ============================================
function RippleText({ children, className = '' }: { children: string; className?: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; charIndex: number }>>([]);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const charWidth = rect.width / children.length;
    const charIndex = Math.floor(x / charWidth);

    const rippleId = rippleIdRef.current++;
    setRipples(prev => [...prev, { id: rippleId, x, charIndex }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);
  };

  return (
    <span
      ref={containerRef}
      className={`inline-block cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {children.split('').map((char, i) => {
        // Calculate wave offset for each character based on active ripples
        const waveOffset = ripples.reduce((acc, ripple) => {
          const distance = Math.abs(i - ripple.charIndex);
          const maxDistance = 8;
          if (distance < maxDistance) {
            const progress = (Date.now() % 600) / 600;
            const wave = Math.sin((distance / maxDistance) * Math.PI + progress * Math.PI * 2);
            const decay = 1 - (distance / maxDistance);
            return acc + wave * decay * 3;
          }
          return acc;
        }, 0);

        return (
          <span
            key={i}
            className="inline-block transition-transform duration-75"
            style={{
              transform: ripples.length > 0 ? `translateY(${waveOffset}px)` : 'none',
              animationName: ripples.some(r => Math.abs(i - r.charIndex) < 8) ? 'rippleWave' : 'none',
              animationDuration: '0.6s',
              animationTimingFunction: 'ease-out',
              animationDelay: `${Math.abs(i - (ripples[ripples.length - 1]?.charIndex ?? 0)) * 0.02}s`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </span>
  );
}

// ============================================
// Magnetic Button Component
// ============================================
function MagneticButton({
  children,
  className = '',
  href,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [impact, setImpact] = useState(false);
  const [shockwaves, setShockwaves] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const shockwaveIdRef = useRef(0);
  const wasHovered = useRef(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      const magneticRadius = 100;
      const isInRange = distance < magneticRadius;

      if (isInRange) {
        const strength = (magneticRadius - distance) / magneticRadius;
        setPosition({
          x: distX * strength * 0.4,
          y: distY * strength * 0.4,
        });
        setIsHovered(true);

        // Trigger impact on first entry
        if (!wasHovered.current) {
          wasHovered.current = true;
          setImpact(true);

          // Add shockwave
          const shockwaveId = shockwaveIdRef.current++;
          setShockwaves(prev => [...prev, {
            id: shockwaveId,
            x: rect.width / 2 + position.x,
            y: rect.height / 2 + position.y
          }]);

          setTimeout(() => setImpact(false), 150);
          setTimeout(() => {
            setShockwaves(prev => prev.filter(s => s.id !== shockwaveId));
          }, 500);
        }
      } else {
        setPosition({ x: 0, y: 0 });
        setIsHovered(false);
        wasHovered.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [position.x, position.y]);

  const Component = href ? 'a' : 'button';
  const props = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { onClick };

  return (
    <Component
      ref={buttonRef as any}
      className={`magnetic relative inline-block ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${impact ? 0.95 : isHovered ? 1.05 : 1})`,
        transition: impact ? 'transform 0.1s ease-out' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      {...props}
    >
      {/* Shockwave rings */}
      {shockwaves.map(shock => (
        <span
          key={shock.id}
          className="absolute pointer-events-none rounded-full border border-[#f093fb]"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'shockwave 0.5s ease-out forwards',
          }}
        />
      ))}
      {children}
    </Component>
  );
}

// Custom cursor component
function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    if (!cursor || !cursorDot) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    };

    const animate = () => {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      cursorX += dx * 0.15;
      cursorY += dy * 0.15;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      requestAnimationFrame(animate);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .magnetic')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className={`fixed pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-300 ${
          isHovering
            ? 'w-16 h-16 border-[#f093fb] bg-[#f093fb]/10'
            : 'w-10 h-10 border-white/30'
        }`}
        style={{ mixBlendMode: 'difference' }}
      />
      <div
        ref={cursorDotRef}
        className="fixed pointer-events-none z-[10001] w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
      />
    </>
  );
}

// Animated mesh gradient background
function MeshBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(120, 0, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 60% 80%, rgba(0, 150, 255, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, #030303 0%, #0a0512 50%, #030303 100%)
          `,
        }}
      />

      {/* Animated aurora layer 1 */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 100% 40% at 50% 0%, rgba(118, 75, 162, 0.3) 0%, transparent 60%)
          `,
          animation: 'auroraShift1 15s ease-in-out infinite',
        }}
      />

      {/* Animated aurora layer 2 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 30% 100%, rgba(240, 147, 251, 0.25) 0%, transparent 50%)
          `,
          animation: 'auroraShift2 20s ease-in-out infinite',
        }}
      />

      {/* Floating gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] -top-[100px] -right-[100px] animate-morph opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.4) 0%, rgba(102, 126, 234, 0.15) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] -bottom-[50px] -left-[100px] animate-morph opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(240, 147, 251, 0.35) 0%, rgba(180, 100, 200, 0.1) 40%, transparent 70%)',
          filter: 'blur(100px)',
          animationDelay: '-4s',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] top-1/3 left-1/4 animate-float opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(100, 150, 255, 0.3) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animationDelay: '-2s',
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(3, 3, 3, 0.4) 100%)',
        }}
      />
    </div>
  );
}

// Animated grid lines
function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none grid-pattern opacity-50" />
  );
}

// Interactive particle system
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    hue: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const particleCount = 80;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      hue: Math.random() * 60 + 260, // Purple-pink range
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        // Mouse interaction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const force = (150 - dist) / 150;
          particle.vx -= (dx / dist) * force * 0.02;
          particle.vy -= (dy / dist) * force * 0.02;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Wrap around
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(i + 1).forEach((other) => {
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(280, 50%, 50%, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-60"
      style={{ zIndex: 1 }}
    />
  );
}

// Hero section
function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - rect.width / 2) / 50,
        y: (e.clientY - rect.top - rect.height / 2) / 50,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="min-h-screen flex flex-col justify-center items-center relative px-6"
    >
      {/* Animated logo/name */}
      <div className="relative mb-8">
        <h1
          className="text-[clamp(4rem,15vw,12rem)] font-bold leading-none tracking-tighter"
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <span className="gradient-text text-glow">k</span>
          <span className="text-white/90">codes</span>
        </h1>

        {/* Decorative elements */}
        <div
          className="absolute -top-8 -right-8 w-24 h-24 border border-white/10 rounded-full animate-pulse-slow"
          style={{
            transform: `translate(${-mousePos.x * 2}px, ${-mousePos.y * 2}px)`,
          }}
        />
        <div
          className="absolute -bottom-4 -left-12 w-16 h-16 border border-[#764ba2]/30 rounded-full animate-pulse-slow"
          style={{
            animationDelay: '-1.5s',
            transform: `translate(${-mousePos.x * 1.5}px, ${-mousePos.y * 1.5}px)`,
          }}
        />
      </div>

      {/* Tagline */}
      <div className="overflow-hidden">
        <p
          className="text-xl md:text-2xl text-white/50 font-light tracking-wide animate-slide-up opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          <RippleText>i build things for the web</RippleText>
        </p>
      </div>

      {/* Status indicator */}
      <div
        className="mt-12 flex items-center gap-3 glass rounded-full px-6 py-3 animate-slide-up opacity-0"
        style={{ animationDelay: '0.6s' }}
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
        <span className="text-sm text-white/60 font-mono">available for projects</span>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-float">
        <div className="flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs font-mono tracking-widest">scroll</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

// Time-aware greeting
function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "good morning";
  } else if (hour >= 12 && hour < 17) {
    return "good afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "good evening";
  } else {
    // 9pm - 5am
    const lateNightGreetings = [
      "late night huh?",
      "burning the midnight oil?",
      "can't sleep either?",
      "night owl spotted",
    ];
    return lateNightGreetings[Math.floor(Math.random() * lateNightGreetings.length)];
  }
}

// About section
function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [greeting] = useState(getGreeting);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-6 py-32"
    >
      <div className="max-w-4xl">
        <div className="overflow-hidden mb-8">
          <p
            className={`text-sm font-mono text-[#764ba2] tracking-widest uppercase ${
              isVisible ? 'animate-slide-up' : 'opacity-0'
            }`}
          >
            <RippleText>{greeting}</RippleText>
          </p>
        </div>

        <div className="space-y-8">
          <h2
            className={`text-4xl md:text-6xl font-light leading-tight ${
              isVisible ? 'animate-slide-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.1s' }}
          >
            i'm <span className="inline-block font-mono"><span className="text-[#f093fb]">kona</span><span className="animate-blink text-[#f093fb]">_</span></span>, a developer who likes making{' '}
            <span className="font-serif italic text-[#f093fb]">cool stuff</span>
          </h2>

          <p
            className={`text-lg text-white/50 max-w-2xl leading-relaxed ${
              isVisible ? 'animate-slide-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.2s' }}
          >
            right now i'm in a bit of a reset phase — tinkering with new ideas and
            figuring out what's next. this site is basically my corner of the internet
            where i'll share whatever i end up building.
          </p>

          {/* Skills/interests as floating tags */}
          <div
            className={`flex flex-wrap gap-3 pt-4 ${
              isVisible ? 'animate-slide-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.3s' }}
          >
            {['react', 'typescript', 'node', 'creative coding', 'ui/ux'].map(
              (skill, i) => (
                <span
                  key={skill}
                  className="px-4 py-2 glass rounded-full text-sm text-white/60 hover:text-white/90 hover:border-[#764ba2]/50 transition-all duration-300 magnetic"
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                >
                  {skill}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Projects section
const projects = [
  {
    title: 'Duck',
    emoji: '🦆',
    description: 'a programming language where you have to say "quack" or the goose won\'t run your code. the goose has opinions about your code and rates it from 1-10. good luck getting a 10.',
    tech: ['Rust'],
    github: 'https://github.com/konacodes/duck-lang',
    code: `quack
[let greeting be "Hello, World!"]

quack
[print greeting]`,
  },
];

function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-6 py-32"
    >
      <div className="max-w-6xl w-full">
        <div className="overflow-hidden mb-16">
          <p
            className={`text-sm font-mono text-[#764ba2] tracking-widest uppercase ${
              isVisible ? 'animate-slide-up' : 'opacity-0'
            }`}
          >
            Work
          </p>
        </div>

        {/* Projects grid */}
        <div className="grid gap-8">
          {projects.map((project, index) => (
            <div
              key={project.title}
              className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden transition-all duration-500 hover:scale-[1.02]">
                  {/* Animated border on hover */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div
                      className="absolute inset-[-50%] animate-spin"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent, #764ba2, transparent)',
                        animationDuration: '8s',
                      }}
                    />
                  </div>
                  <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />

                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start gap-8">
                      {/* Project info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-4xl">{project.emoji}</span>
                          <h3 className="text-2xl md:text-3xl font-light">
                            {project.title}
                          </h3>
                        </div>

                        <p className="text-white/50 mb-6 max-w-xl leading-relaxed">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                          {project.tech.map((tech) => (
                            <span
                              key={tech}
                              className="px-3 py-1 text-xs font-mono rounded-full bg-white/5 text-white/60 border border-white/10"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-[#f093fb] transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <span>view on github</span>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>

                      {/* Code snippet */}
                      <div className="md:w-80 shrink-0">
                        <div className="rounded-xl bg-black/50 border border-white/10 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                            <div className="w-3 h-3 rounded-full bg-red-500/60" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                            <div className="w-3 h-3 rounded-full bg-green-500/60" />
                            <span className="ml-2 text-xs text-white/30 font-mono">hello.duck</span>
                          </div>
                          <pre className="p-4 font-mono text-xs text-white/60 leading-relaxed overflow-x-auto">
                            <code>{project.code}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact section
function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const links = [
    { name: 'GitHub', href: 'https://github.com/konacodes' },
    { name: 'Discord', href: 'https://discord.com/users/1151230208783945818' },
    { name: 'Email', href: 'mailto:hello@kcodes.me' },
  ];

  return (
    <section
      ref={sectionRef}
      className="min-h-[60vh] flex items-center justify-center px-6 py-32"
    >
      <div className="text-center">
        <div className="overflow-hidden mb-8">
          <p
            className={`text-sm font-mono text-[#764ba2] tracking-widest uppercase ${
              isVisible ? 'animate-slide-up' : 'opacity-0'
            }`}
          >
            Connect
          </p>
        </div>

        <h2
          className={`text-4xl md:text-6xl font-light mb-12 ${
            isVisible ? 'animate-slide-up' : 'opacity-0'
          }`}
          style={{ animationDelay: '0.1s' }}
        >
          <RippleText>wanna chat?</RippleText> <span className="font-serif italic text-[#f093fb]">say hi</span>
        </h2>

        <div
          className={`flex justify-center gap-8 ${
            isVisible ? 'animate-slide-up' : 'opacity-0'
          }`}
          style={{ animationDelay: '0.2s' }}
        >
          {links.map((link) => (
            <MagneticButton
              key={link.name}
              href={link.href}
              className="group relative px-8 py-4 glass rounded-full hover:bg-white/5 transition-colors duration-300"
            >
              <span className="relative z-10 font-mono text-sm text-white/60 group-hover:text-white transition-colors">
                {link.name}
              </span>
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#764ba2]/20 to-[#f093fb]/20" />
            </MagneticButton>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-white/30 font-mono">
          &copy; {new Date().getFullYear()} kcodes.me
        </p>
        <p className="text-sm text-white/20">
          made with caffeine and questionable sleep habits
        </p>
      </div>
    </footer>
  );
}

// Main App
export function App() {
  const [showIntro, setShowIntro] = useState(() => {
    // Check if user has visited before
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('kcodes-visited');
      return !hasVisited;
    }
    return true;
  });
  const [siteVisible, setSiteVisible] = useState(false);

  const handleIntroComplete = useCallback(() => {
    // Mark as visited
    localStorage.setItem('kcodes-visited', 'true');
    setShowIntro(false);
    // Small delay then fade in site
    setTimeout(() => setSiteVisible(true), 100);
  }, []);

  // If skipping intro, show site immediately
  useEffect(() => {
    if (!showIntro) {
      setSiteVisible(true);
    }
  }, [showIntro]);

  return (
    <div className="relative">
      {/* Intro sequence */}
      {showIntro && <IntroSequence onComplete={handleIntroComplete} />}

      {/* Main site */}
      <div
        className={`transition-opacity duration-1000 ${
          siteVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <CustomCursor />
        <WebGLBackground />
        <GridBackground />
        <ParticleField />

        <main className="relative z-10">
          <Hero />
          <About />
          <Projects />
          <Contact />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
