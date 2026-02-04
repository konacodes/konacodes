import { useEffect, useRef, useCallback } from "react";

// ============================================
// Vector2D utility class
// ============================================
class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vec2): Vec2 { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2): Vec2 { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number): Vec2 { return new Vec2(this.x * s, this.y * s); }
  div(s: number): Vec2 { return s !== 0 ? new Vec2(this.x / s, this.y / s) : new Vec2(); }
  dot(v: Vec2): number { return this.x * v.x + this.y * v.y; }
  length(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq(): number { return this.x * this.x + this.y * this.y; }
  normalize(): Vec2 { const len = this.length(); return len > 0 ? this.div(len) : new Vec2(); }
  clone(): Vec2 { return new Vec2(this.x, this.y); }
  set(x: number, y: number): void { this.x = x; this.y = y; }
}

// ============================================
// Water Particle class
// ============================================
interface Particle {
  pos: Vec2;
  vel: Vec2;
  acc: Vec2;
  prevPos: Vec2;
  density: number;
  pressure: number;
  mass: number;
  restDensity: number;
  size: number;
  color: { r: number; g: number; b: number; a: number };
  age: number;
  lifespan: number;
  isSplash: boolean;
}

// ============================================
// Spatial Hash Grid for efficient neighbor lookup
// ============================================
class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, Particle[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private hash(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(particle: Particle): void {
    const key = this.hash(particle.pos.x, particle.pos.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(particle);
  }

  getNearby(pos: Vec2, radius: number): Particle[] {
    const nearby: Particle[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(pos.x / this.cellSize);
    const centerCellY = Math.floor(pos.y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this.grid.get(key);
        if (cell) {
          nearby.push(...cell);
        }
      }
    }
    return nearby;
  }
}

// ============================================
// SPH Fluid Simulation Engine
// ============================================
class FluidSimulator {
  // Simulation parameters - tuned for cinematic water feel
  readonly GRAVITY = new Vec2(0, 320);
  readonly REST_DENSITY = 1000;
  readonly GAS_CONSTANT = 2500; // Higher = more responsive to compression
  readonly H = 18; // Smoothing radius - slightly larger for smoother flow
  readonly H2 = this.H * this.H;
  readonly MASS = 2.8;
  readonly VISCOSITY = 180; // Lower = more fluid motion
  readonly DT = 1 / 60;
  readonly DAMPING = 0.985; // Higher = longer momentum, more wave propagation
  readonly BOUNCE = 0.4; // Higher = more energetic bounces
  readonly SURFACE_TENSION = 0.12; // Higher = water holds together better

  // Kernel coefficients (precomputed)
  readonly POLY6: number;
  readonly SPIKY_GRAD: number;
  readonly VISC_LAP: number;

  particles: Particle[] = [];
  private spatialGrid: SpatialHashGrid;
  private width: number;
  private height: number;

  // Ambient perturbation state - stronger for constant water movement
  private time = 0;
  private wavePhases: number[] = [];
  private numWaves = 7; // More overlapping waves for organic motion

  // Wave propagation system for ripple chains
  private waveOrigins: { x: number; y: number; strength: number; time: number }[] = [];

  // Mouse interaction - stronger for more dramatic splashes
  private mousePos = new Vec2(-1000, -1000);
  private prevMousePos = new Vec2(-1000, -1000);
  private mouseVel = new Vec2(0, 0);
  private isMouseDown = false;
  private mouseForceRadius = 100;
  private mouseForceStrength = 12000;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.spatialGrid = new SpatialHashGrid(this.H);

    // Precompute kernel coefficients
    this.POLY6 = 315 / (64 * Math.PI * Math.pow(this.H, 9));
    this.SPIKY_GRAD = -45 / (Math.PI * Math.pow(this.H, 6));
    this.VISC_LAP = 45 / (Math.PI * Math.pow(this.H, 6));

    // Initialize wave phases for ambient undulation
    for (let i = 0; i < this.numWaves; i++) {
      this.wavePhases.push(Math.random() * Math.PI * 2);
    }
  }

  // SPH Kernel functions
  private poly6Kernel(r2: number): number {
    if (r2 >= this.H2) return 0;
    const diff = this.H2 - r2;
    return this.POLY6 * diff * diff * diff;
  }

  private spikyGradient(r: number, rVec: Vec2): Vec2 {
    if (r >= this.H || r < 0.0001) return new Vec2();
    const diff = this.H - r;
    const coeff = this.SPIKY_GRAD * diff * diff / r;
    return rVec.mul(coeff);
  }

  private viscosityLaplacian(r: number): number {
    if (r >= this.H) return 0;
    return this.VISC_LAP * (this.H - r);
  }

  // Create water particles in a region
  createWaterBlock(x: number, y: number, w: number, h: number, spacing: number = 8): void {
    for (let i = x; i < x + w; i += spacing) {
      for (let j = y; j < y + h; j += spacing) {
        this.addParticle(i + Math.random() * 2, j + Math.random() * 2);
      }
    }
  }

  // Add a single particle
  addParticle(x: number, y: number, vel?: Vec2, isSplash = false): void {
    const particle: Particle = {
      pos: new Vec2(x, y),
      vel: vel || new Vec2(0, 0),
      acc: new Vec2(0, 0),
      prevPos: new Vec2(x, y),
      density: this.REST_DENSITY,
      pressure: 0,
      mass: this.MASS,
      restDensity: this.REST_DENSITY,
      size: isSplash ? 3 + Math.random() * 3 : 5,
      color: { r: 100, g: 180, b: 255, a: isSplash ? 0.6 : 0.85 },
      age: 0,
      lifespan: isSplash ? 60 + Math.random() * 60 : -1,
      isSplash
    };
    this.particles.push(particle);
  }

  // Create splash particles with dramatic upward spray
  createSplash(x: number, y: number, intensity: number = 1): void {
    // Primary splash particles - upward spray
    const numParticles = Math.floor(12 + intensity * 18);
    for (let i = 0; i < numParticles; i++) {
      // Concentrate particles in upward arc
      const baseAngle = -Math.PI / 2; // Upward
      const spread = Math.PI * 0.6; // 108 degree spread
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const speed = (200 + Math.random() * 300) * intensity;
      const vel = new Vec2(
        Math.cos(angle) * speed * 0.6,
        Math.sin(angle) * speed - 150
      );
      this.addParticle(x + (Math.random() - 0.5) * 15, y - 5, vel, true);
    }

    // Secondary droplets - smaller, more spread out
    const numDroplets = Math.floor(6 + intensity * 8);
    for (let i = 0; i < numDroplets; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (80 + Math.random() * 150) * intensity;
      const vel = new Vec2(
        Math.cos(angle) * speed,
        -Math.abs(Math.sin(angle)) * speed * 1.2 - 50
      );
      this.addParticle(x + (Math.random() - 0.5) * 20, y, vel, true);
    }

    // Trigger wave propagation from splash point
    this.addWaveOrigin(x, y, intensity * 2);
  }

  // Create ripple effect (adds velocity to nearby particles and triggers wave propagation)
  createRipple(x: number, y: number, strength: number = 1): void {
    const radius = 80 * strength;

    // Immediate velocity push for nearby particles
    for (const p of this.particles) {
      const dx = p.pos.x - x;
      const dy = p.pos.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist > 0.1) {
        const factor = (1 - dist / radius) * (1 - dist / radius) * strength * 300;
        p.vel.x += (dx / dist) * factor;
        p.vel.y += (dy / dist) * factor * 0.4 - factor * 0.5;
      }
    }

    // Trigger propagating wave for chain reaction
    this.addWaveOrigin(x, y, strength);
  }

  // Mouse interaction handlers
  setMousePos(x: number, y: number): void {
    this.prevMousePos = this.mousePos.clone();
    this.mousePos = new Vec2(x, y);
    this.mouseVel = this.mousePos.sub(this.prevMousePos).mul(1 / this.DT);
  }

  setMouseDown(down: boolean): void {
    this.isMouseDown = down;
    if (down) {
      this.createSplash(this.mousePos.x, this.mousePos.y, 0.8);
    }
  }

  // Compute density and pressure for all particles
  private computeDensityPressure(): void {
    for (const pi of this.particles) {
      pi.density = 0;
      const neighbors = this.spatialGrid.getNearby(pi.pos, this.H);

      for (const pj of neighbors) {
        const rVec = pj.pos.sub(pi.pos);
        const r2 = rVec.lengthSq();
        pi.density += pj.mass * this.poly6Kernel(r2);
      }

      // Compute pressure using equation of state
      pi.pressure = this.GAS_CONSTANT * (pi.density - pi.restDensity);
    }
  }

  // Compute forces (pressure, viscosity, surface tension)
  private computeForces(): void {
    for (const pi of this.particles) {
      const fPressure = new Vec2();
      const fViscosity = new Vec2();
      const fSurface = new Vec2();

      const neighbors = this.spatialGrid.getNearby(pi.pos, this.H);

      for (const pj of neighbors) {
        if (pi === pj) continue;

        const rVec = pi.pos.sub(pj.pos);
        const r = rVec.length();

        if (r > 0 && r < this.H) {
          // Pressure force
          const pressureCoeff = -pj.mass * (pi.pressure + pj.pressure) / (2 * pj.density);
          const gradW = this.spikyGradient(r, rVec);
          fPressure.x += pressureCoeff * gradW.x;
          fPressure.y += pressureCoeff * gradW.y;

          // Viscosity force
          const velDiff = pj.vel.sub(pi.vel);
          const viscCoeff = this.VISCOSITY * pj.mass * this.viscosityLaplacian(r) / pj.density;
          fViscosity.x += viscCoeff * velDiff.x;
          fViscosity.y += viscCoeff * velDiff.y;

          // Surface tension (simplified)
          if (r > 0.01) {
            const tensionCoeff = -this.SURFACE_TENSION * pj.mass / pj.density;
            fSurface.x += tensionCoeff * rVec.x / r;
            fSurface.y += tensionCoeff * rVec.y / r;
          }
        }
      }

      // Total acceleration = forces / density + gravity
      pi.acc = fPressure.add(fViscosity).add(fSurface).div(pi.density).add(this.GRAVITY);

      // Mouse interaction force
      if (this.isMouseDown || this.mouseVel.length() > 50) {
        const toMouse = this.mousePos.sub(pi.pos);
        const dist = toMouse.length();
        if (dist < this.mouseForceRadius && dist > 0.1) {
          const factor = (1 - dist / this.mouseForceRadius);
          const pushDir = this.mouseVel.normalize();
          const strength = this.mouseForceStrength * factor * factor;

          if (this.isMouseDown) {
            // Push particles away from mouse
            const awayDir = toMouse.normalize().mul(-1);
            pi.acc.x += awayDir.x * strength * 0.5;
            pi.acc.y += awayDir.y * strength * 0.5;
          }

          // Drag particles with mouse velocity
          if (this.mouseVel.length() > 10) {
            pi.acc.x += pushDir.x * strength * 0.3;
            pi.acc.y += pushDir.y * strength * 0.3;
          }
        }
      }
    }
  }

  // Add a wave origin for ripple chain effects
  addWaveOrigin(x: number, y: number, strength: number): void {
    this.waveOrigins.push({ x, y, strength, time: this.time });
    // Limit stored wave origins to prevent memory buildup
    if (this.waveOrigins.length > 20) {
      this.waveOrigins.shift();
    }
  }

  // Ambient undulation - keeps water never completely still (Avatar-style)
  private applyAmbientPerturbation(): void {
    this.time += this.DT;

    // Clean up old wave origins
    this.waveOrigins = this.waveOrigins.filter(w => this.time - w.time < 3);

    for (const p of this.particles) {
      if (p.isSplash) continue;

      // Multiple overlapping sine waves create natural undulation
      let perturbX = 0;
      let perturbY = 0;

      // Base ambient waves - constant gentle motion
      for (let i = 0; i < this.numWaves; i++) {
        const freq = 0.4 + i * 0.25;
        const amp = 5 / (i + 1); // Stronger amplitude
        const phase = this.wavePhases[i];

        // Spatial variation creates traveling wave patterns
        const spatialFreqX = 0.015 + i * 0.008;
        const spatialFreqY = 0.012 + i * 0.006;

        // Create circular/diagonal wave patterns for more organic motion
        const angle = i * Math.PI / this.numWaves;
        const wavePos = p.pos.x * Math.cos(angle) + p.pos.y * Math.sin(angle);

        perturbX += Math.sin(this.time * freq + wavePos * spatialFreqX + phase) * amp;
        perturbY += Math.cos(this.time * freq * 0.8 + wavePos * spatialFreqY + phase) * amp * 0.6;
      }

      // Add swell effect - slow large-scale movement
      const swellFreq = 0.15;
      const swellAmp = 8;
      perturbX += Math.sin(this.time * swellFreq + p.pos.y * 0.005) * swellAmp * 0.3;
      perturbY += Math.sin(this.time * swellFreq * 1.3 + p.pos.x * 0.004) * swellAmp * 0.5;

      // Apply propagating waves from interactions
      for (const wave of this.waveOrigins) {
        const dx = p.pos.x - wave.x;
        const dy = p.pos.y - wave.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const waveAge = this.time - wave.time;
        const waveSpeed = 150; // Wave propagation speed
        const waveRadius = waveAge * waveSpeed;

        // Ring wave effect
        const ringWidth = 40;
        const distFromRing = Math.abs(dist - waveRadius);
        if (distFromRing < ringWidth) {
          const ringFactor = 1 - distFromRing / ringWidth;
          const decay = Math.exp(-waveAge * 1.5); // Wave decays over time
          const strength = wave.strength * ringFactor * decay * 30;

          if (dist > 0.1) {
            // Push particles outward from wave center
            perturbX += (dx / dist) * strength;
            perturbY += (dy / dist) * strength * 0.5 - strength * 0.3;
          }
        }
      }

      // Add subtle random turbulence for micro-motion
      perturbX += (Math.random() - 0.5) * 2;
      perturbY += (Math.random() - 0.5) * 1;

      p.acc.x += perturbX;
      p.acc.y += perturbY;
    }
  }

  // Integrate particle positions
  private integrate(): void {
    for (const p of this.particles) {
      // Store previous position for collision detection
      p.prevPos = p.pos.clone();

      // Verlet integration with damping
      p.vel = p.vel.add(p.acc.mul(this.DT)).mul(this.DAMPING);

      // Limit velocity
      const maxVel = 500;
      const velLen = p.vel.length();
      if (velLen > maxVel) {
        p.vel = p.vel.mul(maxVel / velLen);
      }

      p.pos = p.pos.add(p.vel.mul(this.DT));

      // Update age for splash particles
      if (p.isSplash) {
        p.age++;
        p.color.a = 0.6 * (1 - p.age / p.lifespan);
      }
    }
  }

  // Handle boundary collisions with chain reaction splashes
  private handleBoundaries(): void {
    const margin = 5;

    for (const p of this.particles) {
      let collided = false;
      let impactStrength = 0;

      // Left boundary
      if (p.pos.x < margin) {
        p.pos.x = margin;
        impactStrength = Math.max(impactStrength, Math.abs(p.vel.x));
        p.vel.x *= -this.BOUNCE;
        collided = true;
      }
      // Right boundary
      if (p.pos.x > this.width - margin) {
        p.pos.x = this.width - margin;
        impactStrength = Math.max(impactStrength, Math.abs(p.vel.x));
        p.vel.x *= -this.BOUNCE;
        collided = true;
      }
      // Top boundary
      if (p.pos.y < margin) {
        p.pos.y = margin;
        impactStrength = Math.max(impactStrength, Math.abs(p.vel.y));
        p.vel.y *= -this.BOUNCE;
        collided = true;
      }
      // Bottom boundary
      if (p.pos.y > this.height - margin) {
        impactStrength = Math.max(impactStrength, Math.abs(p.vel.y));
        p.pos.y = this.height - margin;
        p.vel.y *= -this.BOUNCE;
        collided = true;
      }

      // Create chain reaction effects on high-velocity collision
      if (collided && impactStrength > 100 && !p.isSplash) {
        // Create mini splash on very high velocity impacts
        if (impactStrength > 200 && Math.random() < 0.4) {
          this.createSplash(p.pos.x, p.pos.y - 5, impactStrength / 500);
        }

        // Create propagating wave from impact point
        if (impactStrength > 150) {
          this.addWaveOrigin(p.pos.x, p.pos.y, impactStrength / 300);
        }
      }
    }
  }

  // Remove dead splash particles
  private removeDeadParticles(): void {
    this.particles = this.particles.filter(p => !p.isSplash || p.age < p.lifespan);
  }

  // Main simulation step
  step(): void {
    // Rebuild spatial hash grid
    this.spatialGrid.clear();
    for (const p of this.particles) {
      this.spatialGrid.insert(p);
    }

    this.computeDensityPressure();
    this.computeForces();
    this.applyAmbientPerturbation();
    this.integrate();
    this.handleBoundaries();
    this.removeDeadParticles();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

// ============================================
// Water Simulation React Component
// ============================================
interface WaterSimulationProps {
  className?: string;
}

export function WaterSimulation({ className }: WaterSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulatorRef = useRef<FluidSimulator | null>(null);
  const animationRef = useRef<number>(0);

  // Initialize water block
  const initializeWater = useCallback((sim: FluidSimulator, width: number, height: number) => {
    sim.particles = [];

    // Create a pool of water at the bottom
    const waterHeight = height * 0.35;
    const waterTop = height - waterHeight;
    sim.createWaterBlock(10, waterTop, width - 20, waterHeight - 10, 10);
  }, []);

  // Render particles with metaball-like effect
  const render = useCallback((ctx: CanvasRenderingContext2D, sim: FluidSimulator, displayWidth: number, displayHeight: number) => {
    // Clear canvas completely with solid dark background
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Create gradient background (deep ocean)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, displayHeight);
    bgGradient.addColorStop(0, '#0a192f');
    bgGradient.addColorStop(0.4, '#112240');
    bgGradient.addColorStop(0.7, '#1a365d');
    bgGradient.addColorStop(1, '#234876');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw water body glow at the bottom
    const waterGlow = ctx.createLinearGradient(0, displayHeight * 0.5, 0, displayHeight);
    waterGlow.addColorStop(0, 'rgba(30, 80, 150, 0)');
    waterGlow.addColorStop(0.5, 'rgba(40, 100, 180, 0.3)');
    waterGlow.addColorStop(1, 'rgba(50, 120, 200, 0.5)');
    ctx.fillStyle = waterGlow;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Render particles - larger and more visible
    for (const p of sim.particles) {
      const size = p.isSplash ? p.size * 1.5 : p.size * 2;

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        p.pos.x, p.pos.y, 0,
        p.pos.x, p.pos.y, size * 4
      );
      const glowAlpha = p.isSplash ? p.color.a * 0.3 : 0.25;
      glowGradient.addColorStop(0, `rgba(100, 180, 255, ${glowAlpha})`);
      glowGradient.addColorStop(0.5, `rgba(60, 140, 220, ${glowAlpha * 0.5})`);
      glowGradient.addColorStop(1, 'rgba(30, 100, 180, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Main particle body
      const bodyGradient = ctx.createRadialGradient(
        p.pos.x - size * 0.3, p.pos.y - size * 0.3, 0,
        p.pos.x, p.pos.y, size
      );

      const brightness = Math.min(1.2, 0.7 + p.vel.length() / 200);
      const r = Math.floor(Math.min(255, p.color.r * brightness + 50));
      const g = Math.floor(Math.min(255, p.color.g * brightness + 30));
      const b = Math.floor(Math.min(255, p.color.b * brightness));
      const alpha = p.isSplash ? p.color.a : 0.9;

      bodyGradient.addColorStop(0, `rgba(${r + 80}, ${g + 60}, ${b + 20}, ${alpha})`);
      bodyGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.9})`);
      bodyGradient.addColorStop(1, `rgba(${r - 30}, ${g - 20}, ${b}, ${alpha * 0.6})`);

      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Bright highlight/reflection
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.pos.x - size * 0.3, p.pos.y - size * 0.3, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add animated caustic light patterns
    const time = Date.now() / 1000;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) {
      const x = displayWidth * (0.2 + i * 0.15) + Math.sin(time * 0.4 + i * 1.5) * 50;
      const y = displayHeight * (0.55 + i * 0.08) + Math.cos(time * 0.3 + i) * 30;
      const causticGradient = ctx.createRadialGradient(x, y, 0, x, y, 80 + i * 20);
      causticGradient.addColorStop(0, `rgba(150, 220, 255, ${0.15 - i * 0.02})`);
      causticGradient.addColorStop(0.5, `rgba(100, 180, 240, ${0.08 - i * 0.01})`);
      causticGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = causticGradient;
      ctx.beginPath();
      ctx.arc(x, y, 80 + i * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Render particle count
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px monospace';
    ctx.fillText(`Particles: ${sim.particles.length}`, 10, 25);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track display dimensions separately from canvas buffer
    let displayWidth = 0;
    let displayHeight = 0;

    // Set canvas size - use 1:1 pixel ratio for simplicity and performance
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      displayWidth = rect.width;
      displayHeight = rect.height;

      // Set canvas buffer size to match display size (1:1 ratio)
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      if (simulatorRef.current) {
        simulatorRef.current.resize(displayWidth, displayHeight);
        initializeWater(simulatorRef.current, displayWidth, displayHeight);
      }
    };

    // Initialize simulator
    const rect = canvas.getBoundingClientRect();
    simulatorRef.current = new FluidSimulator(rect.width, rect.height);
    updateSize();
    initializeWater(simulatorRef.current, rect.width, rect.height);

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      simulatorRef.current?.setMousePos(x, y);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        simulatorRef.current?.setMousePos(x, y);
        simulatorRef.current?.setMouseDown(true);
        simulatorRef.current?.createRipple(x, y, 1.5);
      }
    };

    const handleMouseUp = () => {
      simulatorRef.current?.setMouseDown(false);
    };

    // Touch event handlers
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      simulatorRef.current?.setMousePos(x, y);
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      simulatorRef.current?.setMousePos(x, y);
      simulatorRef.current?.setMouseDown(true);
      simulatorRef.current?.createRipple(x, y, 1.5);
    };

    const handleTouchEnd = () => {
      simulatorRef.current?.setMouseDown(false);
    };

    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', updateSize);

    // Animation loop
    const animate = () => {
      if (!simulatorRef.current) return;

      simulatorRef.current.step();
      render(ctx, simulatorRef.current, displayWidth, displayHeight);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', updateSize);
    };
  }, [initializeWater, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`water-simulation ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
      }}
    />
  );
}

export default WaterSimulation;
