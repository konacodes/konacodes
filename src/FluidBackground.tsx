import { useEffect, useRef, useCallback } from 'react';

// =============================================================================
// Configuration
// =============================================================================
interface FluidConfig {
  g: number;
  friction: number;
  dx: number;
  initialWater: number;
  resolution: number;  // Pixels per simulation cell
}

const DEFAULT_CONFIG: FluidConfig = {
  g: 9.81,
  friction: 0.008,      // Lower friction = more fluid movement
  dx: 1.0,
  initialWater: 0.35,
  resolution: 6,        // Pixels per simulation cell
};

// Render at lower resolution for performance, then scale up
const RENDER_SCALE = 0.25;  // Render at 25% resolution

// =============================================================================
// Color palette for depth visualization
// =============================================================================
interface ColorStop {
  depth: number;
  r: number;
  g: number;
  b: number;
}

// Light theme: warm paper tones with depth
const LIGHT_PALETTE: ColorStop[] = [
  { depth: 0.0, r: 248, g: 245, b: 240 },   // Paper (shallow/surface)
  { depth: 0.3, r: 210, g: 195, b: 170 },   // Tan
  { depth: 0.5, r: 180, g: 160, b: 140 },   // Warm brown
  { depth: 0.7, r: 140, g: 120, b: 100 },   // Deep brown
  { depth: 1.0, r: 80, g: 70, b: 60 },      // Dark (deep)
];

// Dark theme: rich warm shadows
const DARK_PALETTE: ColorStop[] = [
  { depth: 0.0, r: 35, g: 32, b: 28 },      // Surface
  { depth: 0.3, r: 55, g: 48, b: 40 },      // Mid
  { depth: 0.5, r: 85, g: 72, b: 58 },      // Warm
  { depth: 0.7, r: 140, g: 115, b: 85 },    // Golden
  { depth: 1.0, r: 212, g: 176, b: 120 },   // Bright accent
];

function lerpColor(palette: ColorStop[], t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));

  // Find surrounding color stops
  let lower = palette[0];
  let upper = palette[palette.length - 1];

  for (let i = 0; i < palette.length - 1; i++) {
    if (clamped >= palette[i].depth && clamped <= palette[i + 1].depth) {
      lower = palette[i];
      upper = palette[i + 1];
      break;
    }
  }

  // Interpolate
  const range = upper.depth - lower.depth;
  const factor = range > 0 ? (clamped - lower.depth) / range : 0;

  return [
    Math.round(lower.r + (upper.r - lower.r) * factor),
    Math.round(lower.g + (upper.g - lower.g) * factor),
    Math.round(lower.b + (upper.b - lower.b) * factor),
  ];
}

// =============================================================================
// High-Resolution Shallow Water Simulation
// =============================================================================
class FluidSimulation {
  width: number;
  height: number;
  config: FluidConfig;

  // Simulation fields (Float32 for precision)
  h: Float32Array;    // Water height
  hu: Float32Array;   // x-momentum
  hv: Float32Array;   // y-momentum

  // Double buffers
  hNew: Float32Array;
  huNew: Float32Array;
  hvNew: Float32Array;

  // Precomputed values for rendering
  curvature: Float32Array;
  velocity: Float32Array;

  time: number = 0;

  constructor(width: number, height: number, config: FluidConfig = DEFAULT_CONFIG) {
    this.width = width;
    this.height = height;
    this.config = config;

    const size = width * height;
    this.h = new Float32Array(size);
    this.hu = new Float32Array(size);
    this.hv = new Float32Array(size);
    this.hNew = new Float32Array(size);
    this.huNew = new Float32Array(size);
    this.hvNew = new Float32Array(size);
    this.curvature = new Float32Array(size);
    this.velocity = new Float32Array(size);

    this.reset();
  }

  reset() {
    const { width, height, config } = this;
    for (let i = 0; i < width * height; i++) {
      this.h[i] = config.initialWater;
      this.hu[i] = 0;
      this.hv[i] = 0;
    }
    this.time = 0;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    const size = width * height;
    this.h = new Float32Array(size);
    this.hu = new Float32Array(size);
    this.hv = new Float32Array(size);
    this.hNew = new Float32Array(size);
    this.huNew = new Float32Array(size);
    this.hvNew = new Float32Array(size);
    this.curvature = new Float32Array(size);
    this.velocity = new Float32Array(size);
    this.reset();
  }

  idx(x: number, y: number): number {
    return y * this.width + x;
  }

  // Compute adaptive timestep
  computeDt(): number {
    const { h, hu, hv, config, width, height } = this;
    const eps = 1e-6;
    let maxSpeed = 0.1;

    // Sample for speed (don't check every cell)
    const step = Math.max(1, Math.floor(Math.sqrt(width * height) / 20));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = this.idx(x, y);
        const hVal = h[i] ?? 0;
        const huVal = hu[i] ?? 0;
        const hvVal = hv[i] ?? 0;
        const hSafe = Math.max(hVal, eps);
        const u = huVal / hSafe;
        const v = hvVal / hSafe;
        const c = Math.sqrt(config.g * hSafe);
        const speed = Math.abs(u) + Math.abs(v) + c;
        if (speed > maxSpeed) maxSpeed = speed;
      }
    }

    return Math.min(0.35 * config.dx / maxSpeed, 0.12);
  }

  // Add smooth wave from edge
  addWave(side: 'left' | 'right' | 'top' | 'bottom', strength: number = 0.6) {
    const { width, height, h, hu, hv } = this;
    const falloff = 5;

    switch (side) {
      case 'left':
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < falloff; x++) {
            const i = this.idx(x, y);
            const factor = 1 - x / falloff;
            h[i] += strength * factor;
            hu[i] += strength * 3 * factor;
          }
        }
        break;
      case 'right':
        for (let y = 0; y < height; y++) {
          for (let x = width - falloff; x < width; x++) {
            const i = this.idx(x, y);
            const factor = (x - (width - falloff)) / falloff;
            h[i] += strength * factor;
            hu[i] -= strength * 3 * factor;
          }
        }
        break;
      case 'top':
        for (let y = 0; y < falloff; y++) {
          for (let x = 0; x < width; x++) {
            const i = this.idx(x, y);
            const factor = 1 - y / falloff;
            h[i] += strength * factor;
            hv[i] += strength * 3 * factor;
          }
        }
        break;
      case 'bottom':
        for (let y = height - falloff; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = this.idx(x, y);
            const factor = (y - (height - falloff)) / falloff;
            h[i] += strength * factor;
            hv[i] -= strength * 3 * factor;
          }
        }
        break;
    }
  }

  // Add localized disturbance with smooth falloff
  addDisturbance(px: number, py: number, amount: number = 0.4, radius: number = 8) {
    const { width, height, h } = this;
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(px - radius * 2));
    const maxX = Math.min(width, Math.ceil(px + radius * 2));
    const minY = Math.max(0, Math.floor(py - radius * 2));
    const maxY = Math.min(height, Math.ceil(py + radius * 2));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const dx = x - px;
        const dy = y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2 * 4) {
          const strength = amount * Math.exp(-d2 / (2 * r2));
          h[this.idx(x, y)] += strength;
        }
      }
    }
  }

  // Physics step using Lax-Friedrichs with optimizations
  step() {
    const { width, height, h, hu, hv, hNew, huNew, hvNew, config } = this;
    const { g, dx, friction } = config;
    const eps = 1e-6;
    const dt = this.computeDt();
    const dtDx2 = dt / (2 * dx);
    const frictionFactor = 1 / (1 + dt * friction);

    // Interior update
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = this.idx(x, y);
        const iL = i - 1;
        const iR = i + 1;
        const iU = i - width;
        const iD = i + width;

        const hC = h[i], huC = hu[i], hvC = hv[i];
        const hL = h[iL], huL = hu[iL], hvL = hv[iL];
        const hR = h[iR], huR = hu[iR], hvR = hv[iR];
        const hU = h[iU], huU = hu[iU], hvU = hv[iU];
        const hD = h[iD], huD = hu[iD], hvD = hv[iD];

        // Safe velocities
        const hLs = Math.max(hL, eps), hRs = Math.max(hR, eps);
        const hUs = Math.max(hU, eps), hDs = Math.max(hD, eps);

        const uL = huL / hLs, uR = huR / hRs;
        const vU = hvU / hUs, vD = hvD / hDs;

        // Fluxes
        const F0L = huL, F0R = huR;
        const F1L = huL * uL + 0.5 * g * hL * hL;
        const F1R = huR * uR + 0.5 * g * hR * hR;
        const F2L = hvL * uL, F2R = hvR * uR;

        const G0U = hvU, G0D = hvD;
        const G1U = huU * vU, G1D = huD * vD;
        const G2U = hvU * vU + 0.5 * g * hU * hU;
        const G2D = hvD * vD + 0.5 * g * hD * hD;

        // Lax-Friedrichs
        const hAvg = 0.25 * (hL + hR + hU + hD);
        const huAvg = 0.25 * (huL + huR + huU + huD);
        const hvAvg = 0.25 * (hvL + hvR + hvU + hvD);

        hNew[i] = Math.max(0, hAvg - dtDx2 * ((F0R - F0L) + (G0D - G0U)));
        huNew[i] = (huAvg - dtDx2 * ((F1R - F1L) + (G1D - G1U))) * frictionFactor;
        hvNew[i] = (hvAvg - dtDx2 * ((F2R - F2L) + (G2D - G2U))) * frictionFactor;

        // Stability clamp
        const maxMom = 80;
        huNew[i] = Math.max(-maxMom, Math.min(maxMom, huNew[i]));
        hvNew[i] = Math.max(-maxMom, Math.min(maxMom, hvNew[i]));
      }
    }

    // Boundaries
    for (let x = 0; x < width; x++) {
      hNew[this.idx(x, 0)] = hNew[this.idx(x, 1)];
      huNew[this.idx(x, 0)] = huNew[this.idx(x, 1)];
      hvNew[this.idx(x, 0)] = 0;
      hNew[this.idx(x, height - 1)] = hNew[this.idx(x, height - 2)];
      huNew[this.idx(x, height - 1)] = huNew[this.idx(x, height - 2)];
      hvNew[this.idx(x, height - 1)] = 0;
    }
    for (let y = 0; y < height; y++) {
      hNew[this.idx(0, y)] = hNew[this.idx(1, y)];
      huNew[this.idx(0, y)] = 0;
      hvNew[this.idx(0, y)] = hvNew[this.idx(1, y)];
      hNew[this.idx(width - 1, y)] = hNew[this.idx(width - 2, y)];
      huNew[this.idx(width - 1, y)] = 0;
      hvNew[this.idx(width - 1, y)] = hvNew[this.idx(width - 2, y)];
    }

    // Swap
    [this.h, this.hNew] = [this.hNew, this.h];
    [this.hu, this.huNew] = [this.huNew, this.hu];
    [this.hv, this.hvNew] = [this.hvNew, this.hv];

    this.time += dt;
  }

  // Compute derived quantities for rendering
  computeRenderData() {
    const { width, height, h, hu, hv, curvature, velocity } = this;
    const eps = 1e-6;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = this.idx(x, y);

        // Laplacian for curvature (wave crests/troughs)
        const hC = h[i];
        const hL = h[i - 1];
        const hR = h[i + 1];
        const hU = h[i - width];
        const hD = h[i + width];
        curvature[i] = -(hL + hR + hU + hD - 4 * hC) * 25;

        // Velocity magnitude
        const hSafe = Math.max(hC, eps);
        const u = hu[i] / hSafe;
        const v = hv[i] / hSafe;
        velocity[i] = Math.sqrt(u * u + v * v);
      }
    }
  }
}

// =============================================================================
// Pixel Shader Renderer
// =============================================================================
interface FluidBackgroundProps {
  subtle?: boolean;
  className?: string;
}

export function FluidBackground({ subtle = false, className = '' }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<FluidSimulation | null>(null);
  const animationRef = useRef<number>(0);
  const lastWaveRef = useRef<number>(0);
  const imageDataRef = useRef<ImageData | null>(null);

  const baseOpacity = subtle ? 0.35 : 0.5;

  const render = useCallback((
    ctx: CanvasRenderingContext2D,
    sim: FluidSimulation,
    width: number,
    height: number
  ) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

    // Get or create ImageData
    if (!imageDataRef.current ||
        imageDataRef.current.width !== width ||
        imageDataRef.current.height !== height) {
      imageDataRef.current = ctx.createImageData(width, height);
    }
    const imageData = imageDataRef.current;
    const data = imageData.data;

    const simW = sim.width;
    const simH = sim.height;

    // Compute render data
    sim.computeRenderData();

    // Find depth range for normalization
    let minH = Infinity, maxH = -Infinity;
    for (let i = 0; i < sim.h.length; i++) {
      const hVal = sim.h[i];
      if (hVal < minH) minH = hVal;
      if (hVal > maxH) maxH = hVal;
    }
    const hRange = Math.max(maxH - minH, 0.01);

    // Scale factors from render canvas to simulation grid
    const scaleX = simW / width;
    const scaleY = simH / height;

    // Render each pixel
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        // Map pixel to simulation cell (with bilinear sampling)
        const sx = px * scaleX;
        const sy = py * scaleY;

        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = Math.min(x0 + 1, simW - 1);
        const y1 = Math.min(y0 + 1, simH - 1);

        const fx = sx - x0;
        const fy = sy - y0;

        // Bilinear interpolation of height
        const i00 = y0 * simW + x0;
        const i10 = y0 * simW + x1;
        const i01 = y1 * simW + x0;
        const i11 = y1 * simW + x1;

        const h00 = sim.h[i00] ?? 0;
        const h10 = sim.h[i10] ?? 0;
        const h01 = sim.h[i01] ?? 0;
        const h11 = sim.h[i11] ?? 0;

        const hTop = h00 * (1 - fx) + h10 * fx;
        const hBot = h01 * (1 - fx) + h11 * fx;
        const hInterp = hTop * (1 - fy) + hBot * fy;

        // Bilinear interpolation of curvature
        const c00 = sim.curvature[i00] ?? 0;
        const c10 = sim.curvature[i10] ?? 0;
        const c01 = sim.curvature[i01] ?? 0;
        const c11 = sim.curvature[i11] ?? 0;

        const cTop = c00 * (1 - fx) + c10 * fx;
        const cBot = c01 * (1 - fx) + c11 * fx;
        const curvInterp = cTop * (1 - fy) + cBot * fy;

        // Bilinear interpolation of velocity
        const v00 = sim.velocity[i00] ?? 0;
        const v10 = sim.velocity[i10] ?? 0;
        const v01 = sim.velocity[i01] ?? 0;
        const v11 = sim.velocity[i11] ?? 0;

        const vTop = v00 * (1 - fx) + v10 * fx;
        const vBot = v01 * (1 - fx) + v11 * fx;
        const velInterp = vTop * (1 - fy) + vBot * fy;

        // Normalize depth to [0, 1]
        const depthNorm = (hInterp - minH) / hRange;

        // Curvature affects brightness (crests = bright, troughs = dark)
        const curvatureFactor = Math.tanh(curvInterp * 0.15) * 0.5 + 0.5;

        // Velocity adds shimmer/brightness
        const velFactor = Math.min(velInterp * 0.08, 0.3);

        // Combine for final depth lookup
        let colorDepth: number;
        if (isDark) {
          // Dark mode: deeper = brighter (accent color)
          colorDepth = depthNorm * 0.6 + curvatureFactor * 0.3 + velFactor;
        } else {
          // Light mode: deeper = darker
          colorDepth = depthNorm * 0.5 + (1 - curvatureFactor) * 0.3 + velFactor * 0.2;
        }

        // Get color from palette
        const [r, g, b] = lerpColor(palette, colorDepth);

        // Alpha based on depth variation and curvature (more visible where interesting)
        const interest = Math.abs(curvInterp) * 0.1 + velInterp * 0.05 + 0.3;
        const alpha = Math.min(1, interest) * 255 * baseOpacity;

        // Write pixel
        const pixelIdx = (py * width + px) * 4;
        data[pixelIdx] = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = b;
        data[pixelIdx + 3] = alpha;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [baseOpacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const config = { ...DEFAULT_CONFIG };

    const updateSize = () => {
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // Render at reduced resolution for performance
      const canvasWidth = Math.floor(displayWidth * RENDER_SCALE);
      const canvasHeight = Math.floor(displayHeight * RENDER_SCALE);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const gridW = Math.ceil(displayWidth / config.resolution);
      const gridH = Math.ceil(displayHeight / config.resolution);

      if (!simRef.current) {
        simRef.current = new FluidSimulation(gridW, gridH, config);
      } else if (simRef.current.width !== gridW || simRef.current.height !== gridH) {
        simRef.current.resize(gridW, gridH);
      }

      // Clear imageData cache on resize
      imageDataRef.current = null;
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let lastTime = performance.now();

    const animate = (time: number) => {
      const sim = simRef.current;
      if (!sim) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;

      // Run physics (multiple substeps for fluidity)
      const substeps = Math.min(6, Math.max(2, Math.floor(deltaTime / 8)));
      for (let i = 0; i < substeps; i++) {
        sim.step();
      }

      // Ambient waves
      if (time - lastWaveRef.current > 2500 + Math.random() * 2000) {
        lastWaveRef.current = time;
        const sides: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
        const side = sides[Math.floor(Math.random() * sides.length)];
        sim.addWave(side, 0.25 + Math.random() * 0.35);
      }

      // Random disturbances
      if (Math.random() < 0.025) {
        const rx = Math.random() * sim.width;
        const ry = Math.random() * sim.height;
        sim.addDisturbance(rx, ry, 0.15 + Math.random() * 0.25, 6 + Math.random() * 8);
      }

      // Render
      render(ctx, sim, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={`fluid-background ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}

export default FluidBackground;
