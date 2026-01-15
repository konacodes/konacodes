import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import "./index.css";

// ============================================
// Multiplane Camera System
// ============================================

// Layer depth positions (higher = closer to camera, appears first when scrolling in)
// Much wider spacing for dramatic depth separation
const LAYER_DEPTHS = {
  opening: 0,
  whoami: -3500,
  philosophy: -7000,
  whatimake: -10500,
  duck: -14000,
  platforms: -17500,
  null: -21000,
  lab: -24500,
  art: -28000,
  interests: -31500,
  connect: -35000,
  end: -38500,
};

const TOTAL_DEPTH = Math.abs(LAYER_DEPTHS.end);
const SCROLL_MULTIPLIER = 8; // How much scroll affects depth

// Earthy/warm color palette
const colors = {
  bg: '#0f0d0a',
  bgLight: '#1a1714',
  cream: '#f5f0e8',
  amber: '#d4a574',
  terracotta: '#c4765a',
  sage: '#8b9a7d',
  rust: '#a65d4e',
  warmGray: '#6b635a',
  deepBrown: '#2d261f',
};

// ============================================
// Whimsical Shape Components
// ============================================

interface PlateProps {
  children: ReactNode;
  depth: number;
  shape?: 'blob' | 'torn' | 'angular' | 'organic' | 'default';
  className?: string;
  style?: React.CSSProperties;
}

function Plate({ children, depth, shape = 'default', className = '', style = {} }: PlateProps) {
  const shapeClasses = {
    blob: 'rounded-[40%_60%_70%_30%/30%_30%_70%_70%]',
    torn: 'rounded-[10px_30px_20px_40px]',
    angular: 'rounded-[4px_40px_4px_40px]',
    organic: 'rounded-[60%_40%_30%_70%/60%_30%_70%_40%]',
    default: 'rounded-3xl',
  };

  return (
    <div
      className={`plate absolute ${shapeClasses[shape]} ${className}`}
      style={{
        transform: `translateZ(${depth}px)`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Lifted button with 3D shadow
function LiftedButton({
  children,
  href,
  onClick,
  className = '',
  liftAmount = 8,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  liftAmount?: number;
}) {
  const Component = href ? 'a' : 'button';
  const props = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { onClick };

  return (
    <Component
      className={`lifted-button relative inline-block transition-all duration-300 ${className}`}
      style={{
        transform: `translateZ(${liftAmount}px)`,
        transformStyle: 'preserve-3d',
      }}
      {...props}
    >
      {/* Shadow layer */}
      <span
        className="absolute inset-0 rounded-full bg-black/30 blur-md"
        style={{
          transform: `translateZ(-${liftAmount}px) translateY(${liftAmount / 2}px)`,
        }}
      />
      {/* Button surface */}
      <span className="relative block">{children}</span>
    </Component>
  );
}

// ============================================
// Custom Cursor (earthy version)
// ============================================
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
      cursorX += dx * 0.12;
      cursorY += dy * 0.12;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      requestAnimationFrame(animate);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .lifted-button, .interactive')) {
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
        className={`fixed pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-300 ${
          isHovering
            ? 'w-16 h-16 border-amber-400 bg-amber-400/10'
            : 'w-10 h-10 border-cream/30'
        }`}
        style={{
          mixBlendMode: 'difference',
          borderColor: isHovering ? colors.amber : `${colors.cream}30`,
        }}
      />
      <div
        ref={cursorDotRef}
        className="fixed pointer-events-none z-[10001] w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: colors.cream }}
      />
    </>
  );
}

// ============================================
// Multiplane Container
// ============================================
function MultiplaneWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  // scrollDepth represents how far into the scene we've traveled
  // 0 = at the start (viewing first layer)
  // TOTAL_DEPTH = at the end (viewing last layer)
  const [scrollDepth, setScrollDepth] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const targetDepth = useRef(0);
  const currentDepth = useRef(0);
  const animationRef = useRef<number>(0);

  const MAX_DEPTH = TOTAL_DEPTH + 4000; // Total scrollable depth with buffer

  // Smooth animation
  useEffect(() => {
    const animate = () => {
      const diff = targetDepth.current - currentDepth.current;
      currentDepth.current += diff * 0.1; // Buttery smooth interpolation
      setScrollDepth(currentDepth.current);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Handle scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Normalize delta for different input devices
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 40;
      if (e.deltaMode === 2) delta *= 800;

      // Scroll down (positive deltaY) = go deeper into scene = INCREASE scrollDepth
      const newDepth = Math.max(0, Math.min(MAX_DEPTH, targetDepth.current + delta * SCROLL_MULTIPLIER));
      targetDepth.current = newDepth;

      // Calculate progress (0 = start, 1 = end)
      const progress = newDepth / MAX_DEPTH;
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Calculate visibility for each layer based on scroll depth
  // Each layer has a depth value (0, -3500, -7000, etc.)
  // We convert to positive values for easier math
  const getLayerStyle = (depth: number) => {
    // Convert negative depth to positive distance from start
    const layerDistance = Math.abs(depth);
    // How far past this layer have we scrolled?
    const distancePastLayer = scrollDepth - layerDistance;

    // Layer is far ahead (not reached yet)
    if (distancePastLayer < -3500) {
      const fadeIn = Math.max(0.15, 1 - Math.abs(distancePastLayer + 3500) / 10000);
      return {
        opacity: fadeIn,
        pointerEvents: 'auto' as const,
      };
    }

    // Layer is being passed through (close to camera)
    if (distancePastLayer > 2500) {
      return {
        opacity: Math.max(0, 1 - (distancePastLayer - 2500) / 1500),
        pointerEvents: 'none' as const,
      };
    }

    // Layer is in comfortable viewing range
    return {
      opacity: 1,
      pointerEvents: 'auto' as const,
    };
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        perspective: '1000px',
        perspectiveOrigin: '50% 50%',
        backgroundColor: colors.bg,
      }}
    >
      {/* Depth indicator */}
      <div className="fixed top-6 right-6 z-50 font-mono text-xs" style={{ color: `${colors.cream}50` }}>
        <div className="flex flex-col items-end gap-1">
          <span>{Math.round(scrollProgress * 100)}%</span>
          <div className="w-24 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.cream}10` }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${scrollProgress * 100}%`,
                backgroundColor: colors.amber,
              }}
            />
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      {scrollProgress < 0.05 && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 animate-pulse"
          style={{ color: `${colors.cream}40` }}
        >
          <span className="text-xs font-mono tracking-widest">scroll to explore</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}

      {/* 3D World Container */}
      <div
        ref={worldRef}
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          // As scrollDepth increases, we push the world toward the viewer (positive Z)
          // This creates the effect of moving INTO the scene
          transform: `translateZ(${scrollDepth}px)`,
        }}
      >
        {/* ============================================ */}
        {/* LAYER 1: Opening - Kona title */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.opening}
          shape="default"
          className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            width: 'max-content',
            ...getLayerStyle(LAYER_DEPTHS.opening),
          }}
        >
          <div className="text-center p-12">
            <h1
              className="text-[clamp(5rem,20vw,14rem)] font-bold leading-none tracking-tighter whitespace-nowrap"
              style={{ color: colors.cream }}
            >
              <span style={{ color: colors.amber }}>k</span>ona
            </h1>
            <p
              className="mt-6 text-xl font-light tracking-wide"
              style={{ color: `${colors.cream}60` }}
            >
              creative developer
            </p>
          </div>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 2: Who I Am */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.whoami}
          shape="blob"
          className="left-[5%] top-[10%] w-[700px] p-14"
          style={{
            backgroundColor: `${colors.deepBrown}f5`,
            border: `1px solid ${colors.warmGray}40`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
            ...getLayerStyle(LAYER_DEPTHS.whoami),
          }}
        >
          <div className="flex flex-col gap-6">
            <span
              className="text-xs font-mono tracking-widest uppercase"
              style={{ color: colors.amber }}
            >
              Who I Am
            </span>
            <h2
              className="text-2xl font-light leading-relaxed"
              style={{ color: colors.cream }}
            >
              hey, i'm <span className="font-mono" style={{ color: colors.terracotta }}>kona</span> —
              a self-taught developer who learned by breaking things
            </h2>
            <p style={{ color: `${colors.cream}70` }} className="leading-relaxed text-sm">
              film nerd, music lover, history enthusiast. i draw sometimes.
              also a protogen, hence the name.
            </p>
          </div>
        </Plate>

        {/* Kona character art */}
        <Plate
          depth={LAYER_DEPTHS.whoami + 100}
          shape="torn"
          className="right-[5%] top-[15%] w-[420px] h-[420px] overflow-hidden"
          style={{
            boxShadow: `
              0 50px 100px -20px rgba(0,0,0,0.8),
              0 30px 60px -10px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.05)
            `,
            ...getLayerStyle(LAYER_DEPTHS.whoami + 100),
          }}
        >
          <img
            src="/images/image.png"
            alt="Kona - Protogen character"
            className="w-full h-full object-contain"
          />
        </Plate>

        {/* ============================================ */}
        {/* LAYER 3: Philosophy */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.philosophy}
          shape="angular"
          className="left-[12%] top-[25%] w-[580px] p-12"
          style={{
            backgroundColor: `${colors.terracotta}25`,
            border: `1px solid ${colors.terracotta}50`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.philosophy),
          }}
        >
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: colors.sage }}
          >
            Philosophy
          </span>
          <h3
            className="mt-4 text-4xl font-bold"
            style={{ color: colors.cream }}
          >
            ship it raw
          </h3>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: `${colors.cream}70` }}
          >
            functionality first, polish in post. if the core product isn't there,
            why would anyone use it?
          </p>
        </Plate>

        <Plate
          depth={LAYER_DEPTHS.philosophy - 200}
          shape="blob"
          className="right-[15%] bottom-[20%] w-[380px] p-8"
          style={{
            backgroundColor: `${colors.sage}25`,
            border: `1px solid ${colors.sage}50`,
            boxShadow: `
              0 40px 80px -20px rgba(0,0,0,0.8),
              0 20px 40px -10px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.08)
            `,
            ...getLayerStyle(LAYER_DEPTHS.philosophy - 200),
          }}
        >
          <p
            className="text-base font-mono leading-relaxed"
            style={{ color: `${colors.cream}80` }}
          >
            "done {'>'} perfect — iterate in public"
          </p>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 4: What I Make (intro) */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.whatimake}
          shape="default"
          className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] p-12 text-center"
          style={{
            backgroundColor: `${colors.deepBrown}f5`,
            border: `1px solid ${colors.amber}40`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              0 0 80px -20px ${colors.amber}30,
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
            ...getLayerStyle(LAYER_DEPTHS.whatimake),
          }}
        >
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: colors.amber }}
          >
            What I Make
          </span>
          <h2
            className="mt-4 text-5xl font-light"
            style={{ color: colors.cream }}
          >
            projects
          </h2>
          <p
            className="mt-4 text-base"
            style={{ color: `${colors.cream}60` }}
          >
            a mix of shipped work, experiments, and happy accidents
          </p>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 5: Duck Project */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.duck}
          shape="torn"
          className="left-[6%] top-[8%] w-[620px] p-12"
          style={{
            backgroundColor: `${colors.deepBrown}f5`,
            border: `1px solid ${colors.warmGray}50`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
            ...getLayerStyle(LAYER_DEPTHS.duck),
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h3 className="text-3xl font-light" style={{ color: colors.cream }}>Duck</h3>
              <span className="text-xs font-mono" style={{ color: colors.warmGray }}>Rust</span>
            </div>
          </div>
          <p style={{ color: `${colors.cream}70` }} className="leading-relaxed mb-6 text-base">
            a programming language where you have to say "quack" or the goose won't run your code.
            the goose has opinions and rates your code from 1-10.
          </p>

          {/* Code snippet */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.warmGray}30`,
              boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3)`,
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: `1px solid ${colors.warmGray}20` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${colors.terracotta}80` }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${colors.amber}80` }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${colors.sage}80` }} />
              <span className="ml-2 text-xs font-mono" style={{ color: `${colors.cream}30` }}>hello.duck</span>
            </div>
            <pre className="p-4 font-mono text-sm leading-relaxed overflow-x-auto" style={{ color: `${colors.cream}70` }}>
{`quack
[let greeting be "Hello, World!"]

quack
[print greeting]`}
            </pre>
          </div>

          <LiftedButton
            href="https://github.com/konacodes/duck-lang"
            className="mt-8 px-6 py-3 rounded-full font-mono text-sm interactive"
            style={{
              backgroundColor: colors.amber,
              color: colors.bg,
            }}
            liftAmount={8}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              view on github
            </span>
          </LiftedButton>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 6: Blog/Films Platforms */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.platforms}
          shape="organic"
          className="right-[8%] top-[15%] w-[500px] p-12"
          style={{
            backgroundColor: `${colors.sage}30`,
            border: `1px solid ${colors.sage}50`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.platforms),
          }}
        >
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: colors.sage }}>
            Platforms
          </span>
          <h3 className="mt-4 text-2xl font-light" style={{ color: colors.cream }}>
            Blog & Films
          </h3>
          <p className="mt-4 leading-relaxed text-base" style={{ color: `${colors.cream}70` }}>
            content management systems built on cloudflare workers + D1.
            markdown-first, fast, minimal.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span
              className="px-4 py-2 text-xs font-mono rounded-full"
              style={{ backgroundColor: `${colors.cream}10`, color: `${colors.cream}60`, border: `1px solid ${colors.cream}15` }}
            >
              Cloudflare Workers
            </span>
            <span
              className="px-4 py-2 text-xs font-mono rounded-full"
              style={{ backgroundColor: `${colors.cream}10`, color: `${colors.cream}60`, border: `1px solid ${colors.cream}15` }}
            >
              D1 SQLite
            </span>
          </div>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 7: Null (Claude experiment) */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.null}
          shape="blob"
          className="left-[15%] bottom-[25%] w-[520px] p-12"
          style={{
            backgroundColor: `${colors.rust}20`,
            border: `1px solid ${colors.rust}40`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.null),
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-2xl font-light" style={{ color: colors.cream }}>null</h3>
            <span
              className="px-3 py-1 text-xs font-mono rounded"
              style={{ backgroundColor: `${colors.rust}30`, color: colors.terracotta }}
            >
              broke
            </span>
          </div>
          <p className="leading-relaxed text-base" style={{ color: `${colors.cream}70` }}>
            an experiment built entirely by claude. it worked until it didn't.
            we don't talk about what happened at the very end.
          </p>
          <LiftedButton
            href="https://github.com/konacodes/null"
            className="mt-8 px-6 py-3 rounded-full font-mono text-sm interactive"
            style={{
              backgroundColor: `${colors.rust}40`,
              color: colors.cream,
              border: `1px solid ${colors.rust}60`,
            }}
            liftAmount={6}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              view on github
            </span>
          </LiftedButton>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 8: Lab/Experiments */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.lab}
          shape="angular"
          className="right-[10%] top-[30%] w-[450px] p-12"
          style={{
            backgroundColor: `${colors.deepBrown}f0`,
            border: `1px dashed ${colors.warmGray}50`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.06),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.lab),
          }}
        >
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: colors.warmGray }}>
            The Lab
          </span>
          <h3 className="mt-4 text-2xl font-light" style={{ color: colors.cream }}>
            things brewing...
          </h3>
          <p className="mt-4 text-base leading-relaxed" style={{ color: `${colors.cream}50` }}>
            private experiments and half-baked ideas. some of them might see the light of day. most won't.
          </p>
          <div className="mt-6 flex gap-3">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-10 h-10 rounded flex items-center justify-center text-xs font-mono"
                style={{ backgroundColor: `${colors.warmGray}20`, color: `${colors.cream}30`, border: `1px solid ${colors.warmGray}30` }}
              >
                ?
              </span>
            ))}
          </div>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 9: Art */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.art}
          shape="torn"
          className="left-[10%] top-[12%] w-[500px] p-12"
          style={{
            backgroundColor: `${colors.amber}20`,
            border: `1px solid ${colors.amber}40`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.art),
          }}
        >
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: colors.amber }}>
            Art
          </span>
          <h3 className="mt-4 text-2xl font-light" style={{ color: colors.cream }}>
            i draw sometimes
          </h3>
          <p className="mt-4 leading-relaxed text-base" style={{ color: `${colors.cream}70` }}>
            mostly character art, sketches, and whatever comes to mind.
            the protogen aesthetic runs deep.
          </p>
          {/* Placeholder for art grid */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg"
                style={{ backgroundColor: `${colors.cream}10`, border: `1px solid ${colors.cream}15` }}
              />
            ))}
          </div>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 10: Interests */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.interests}
          shape="organic"
          className="right-[6%] bottom-[15%] w-[520px] p-12"
          style={{
            backgroundColor: `${colors.deepBrown}f5`,
            border: `1px solid ${colors.warmGray}40`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.interests),
          }}
        >
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: colors.sage }}>
            Interests
          </span>
          <h3 className="mt-4 text-2xl font-light" style={{ color: colors.cream }}>
            beyond code
          </h3>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { label: 'film' },
              { label: 'music' },
              { label: 'history' },
              { label: 'drawing' },
              { label: 'books' },
            ].map((interest) => (
              <div
                key={interest.label}
                className="px-5 py-2.5 rounded-full"
                style={{ backgroundColor: `${colors.cream}10`, border: `1px solid ${colors.cream}15` }}
              >
                <span className="text-sm" style={{ color: `${colors.cream}80` }}>{interest.label}</span>
              </div>
            ))}
          </div>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 11: Connect */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.connect}
          shape="blob"
          className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] p-14 text-center"
          style={{
            backgroundColor: `${colors.deepBrown}f5`,
            border: `1px solid ${colors.amber}40`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              0 0 80px -20px ${colors.amber}30,
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.connect),
          }}
        >
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: colors.amber }}>
            Connect
          </span>
          <h2 className="mt-4 text-4xl font-light" style={{ color: colors.cream }}>
            wanna chat?
          </h2>
          <p className="mt-4" style={{ color: `${colors.cream}60` }}>
            say hi, share ideas, or just vibe
          </p>

          <div className="mt-8 flex justify-center gap-4">
            {[
              { name: 'GitHub', href: 'https://github.com/konacodes' },
              { name: 'Discord', href: 'https://discord.com/users/1151230208783945818' },
              { name: 'Email', href: 'mailto:hello@kcodes.me' },
            ].map((link) => (
              <LiftedButton
                key={link.name}
                href={link.href}
                className="px-6 py-3 rounded-full font-mono text-sm interactive"
                style={{
                  backgroundColor: `${colors.cream}10`,
                  color: colors.cream,
                  border: `1px solid ${colors.cream}20`,
                }}
                liftAmount={5}
              >
                {link.name}
              </LiftedButton>
            ))}
          </div>
        </Plate>

        {/* ============================================ */}
        {/* LAYER 12: End (visible when zoomed all the way out) */}
        {/* ============================================ */}
        <Plate
          depth={LAYER_DEPTHS.end}
          shape="blob"
          className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] p-12"
          style={{
            backgroundColor: `${colors.deepBrown}f0`,
            border: `1px solid ${colors.amber}30`,
            boxShadow: `
              0 60px 120px -30px rgba(0,0,0,0.9),
              0 30px 60px -15px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.06),
              inset 0 -1px 0 rgba(0,0,0,0.2)
            `,
            ...getLayerStyle(LAYER_DEPTHS.end),
          }}
        >
          <div className="text-center">
            <p className="text-3xl font-light mb-6" style={{ color: colors.cream }}>
              fin.
            </p>
            <p className="font-mono text-sm" style={{ color: `${colors.cream}40` }}>
              {new Date().getFullYear()} kona
            </p>
            <p className="mt-3 text-sm" style={{ color: `${colors.cream}30` }}>
              made with caffeine and questionable sleep habits
            </p>
          </div>
        </Plate>

        {/* Floating decorative elements */}
        <FloatingDecorations scrollDepth={scrollDepth} />
      </div>
    </div>
  );
}

// ============================================
// Floating Decorations (scattered throughout depth)
// ============================================
function FloatingDecorations({ scrollDepth }: { scrollDepth: number }) {
  const decorations = [
    { depth: -1500, x: '85%', y: '20%', size: 60, color: colors.amber, shape: 'circle' },
    { depth: -4500, x: '10%', y: '70%', size: 40, color: colors.sage, shape: 'circle' },
    { depth: -8000, x: '75%', y: '60%', size: 80, color: colors.terracotta, shape: 'blob' },
    { depth: -11500, x: '5%', y: '30%', size: 50, color: colors.warmGray, shape: 'circle' },
    { depth: -15000, x: '90%', y: '80%', size: 70, color: colors.amber, shape: 'blob' },
    { depth: -18500, x: '15%', y: '15%', size: 45, color: colors.sage, shape: 'circle' },
    { depth: -22000, x: '80%', y: '45%', size: 55, color: colors.rust, shape: 'blob' },
    { depth: -25500, x: '25%', y: '75%', size: 65, color: colors.terracotta, shape: 'circle' },
    { depth: -29000, x: '70%', y: '25%', size: 35, color: colors.amber, shape: 'blob' },
    { depth: -33000, x: '40%', y: '85%', size: 50, color: colors.sage, shape: 'circle' },
  ];

  return (
    <>
      {decorations.map((dec, i) => {
        const layerDistance = Math.abs(dec.depth);
        const distancePastLayer = scrollDepth - layerDistance;
        const opacity = Math.max(0, Math.min(0.3, 1 - Math.abs(distancePastLayer) / 5000));

        return (
          <div
            key={i}
            className={`absolute pointer-events-none ${dec.shape === 'blob' ? 'rounded-[40%_60%_70%_30%/30%_30%_70%_70%]' : 'rounded-full'}`}
            style={{
              left: dec.x,
              top: dec.y,
              width: dec.size,
              height: dec.size,
              backgroundColor: `${dec.color}15`,
              border: `1px solid ${dec.color}20`,
              transform: `translateZ(${dec.depth}px)`,
              opacity,
              filter: 'blur(1px)',
            }}
          />
        );
      })}
    </>
  );
}

// ============================================
// Main App
// ============================================
export function App() {
  return (
    <div className="relative">
      <CustomCursor />
      <MultiplaneWorld />
    </div>
  );
}

export default App;
