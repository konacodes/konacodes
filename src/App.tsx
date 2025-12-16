import { useEffect, useRef, useState, useCallback } from "react";
import "./index.css";
import { IntroSequence } from "./IntroSequence";

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
          style={{ animationDelay: '0.3s' }}
        >
          i build things for the web
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
            {greeting}
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

// Projects placeholder section
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

        {/* Coming soon state with creative treatment */}
        <div
          className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="glass-strong rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
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
              <h3 className="text-3xl md:text-4xl font-light mb-4">
                nothing here <span className="font-serif italic text-[#f093fb]">yet</span>
              </h3>
              <p className="text-white/40 max-w-md mx-auto">
                still working on some things. check back in a bit — or don't,
                i'll probably post about it somewhere anyway.
              </p>

              {/* Decorative code snippet */}
              <div className="mt-12 inline-block text-left">
                <pre className="font-mono text-xs text-white/30 leading-relaxed">
                  <code>{`// TODO: ship something
const projects = [];`}</code>
                </pre>
              </div>
            </div>
          </div>
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
          wanna chat? <span className="font-serif italic text-[#f093fb]">say hi</span>
        </h2>

        <div
          className={`flex justify-center gap-6 ${
            isVisible ? 'animate-slide-up' : 'opacity-0'
          }`}
          style={{ animationDelay: '0.2s' }}
        >
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="group relative px-8 py-4 glass rounded-full hover:bg-white/5 transition-all duration-300 magnetic"
            >
              <span className="relative z-10 font-mono text-sm text-white/60 group-hover:text-white transition-colors">
                {link.name}
              </span>
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#764ba2]/20 to-[#f093fb]/20" />
            </a>
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
        <MeshBackground />
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
