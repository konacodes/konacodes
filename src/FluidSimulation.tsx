import { useEffect, useRef, useCallback } from 'react';

/**
 * WebGL Fluid Simulation
 * Based on Pavel Dobryakov's implementation (MIT License)
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 *
 * Implements Navier-Stokes equations for incompressible fluid
 */

// Configuration
const config = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 512,
  SPLAT_RADIUS: 0.3,
  SPLAT_FORCE: 6000,
  CURL: 20,
  PRESSURE_ITERATIONS: 20,
  VELOCITY_DISSIPATION: 0.98,
  DENSITY_DISSIPATION: 0.97,
};

// Shader sources
const baseVertexShader = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const copyShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;

  void main () {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`;

const clearShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const splatShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const advectionShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  void main () {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const divergenceShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const curlShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;

  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const pressureShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const displayShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uIsDark;

  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;

    // Background colors
    vec3 lightBg = vec3(0.973, 0.961, 0.941);
    vec3 darkBg = vec3(0.059, 0.055, 0.051);
    vec3 bgColor = mix(lightBg, darkBg, uIsDark);

    // Subtle color tinting
    float intensity = length(c) * 0.15;

    // Mix with background - very subtle effect
    vec3 tint = mix(vec3(0.95, 0.92, 0.88), vec3(0.98, 0.96, 0.94), c.r);
    tint = mix(tint, vec3(0.15, 0.13, 0.11), uIsDark);

    vec3 finalColor = bgColor + (tint - bgColor) * intensity;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: [number, number, number];
}

export function FluidSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const extRef = useRef<{ formatRGBA: { internalFormat: number; format: number }; formatRG: { internalFormat: number; format: number }; formatR: { internalFormat: number; format: number }; halfFloatTexType: number; supportLinearFiltering: boolean } | null>(null);
  const programsRef = useRef<Record<string, { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }>>({});
  const fboRef = useRef<{
    dye: { read: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number }; write: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number }; swap: () => void } | null;
    velocity: { read: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number }; write: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number }; swap: () => void } | null;
    divergence: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number } | null;
    curl: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number } | null;
    pressure: { read: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number }; write: { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number }; swap: () => void } | null;
  }>({ dye: null, velocity: null, divergence: null, curl: null, pressure: null });
  const pointersRef = useRef<Pointer[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const isDarkRef = useRef(false);
  const blitRef = useRef<((target: { fbo: WebGLFramebuffer; width: number; height: number } | null) => void) | null>(null);

  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }, [compileShader]);

  const getUniforms = useCallback((gl: WebGLRenderingContext, program: WebGLProgram) => {
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) {
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
    }
    return uniforms;
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const params = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params) as WebGLRenderingContext | null;
    const isWebGL2 = !!gl;
    if (!gl) {
      gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params) as WebGLRenderingContext;
    }
    if (!gl) return false;

    glRef.current = gl;

    // Get extensions
    let halfFloat: OES_texture_half_float | null = null;
    let supportLinearFiltering = false;

    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = !!gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
    }

    const halfFloatTexType = isWebGL2 ? (gl as WebGL2RenderingContext).HALF_FLOAT : (halfFloat?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE);

    const formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA };
    const formatRG = { internalFormat: gl.RGBA, format: gl.RGBA };
    const formatR = { internalFormat: gl.RGBA, format: gl.RGBA };

    if (isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      formatRGBA.internalFormat = gl2.RGBA16F;
      formatRGBA.format = gl2.RGBA;
      formatRG.internalFormat = gl2.RG16F;
      formatRG.format = gl2.RG;
      formatR.internalFormat = gl2.R16F;
      formatR.format = gl2.RED;
    }

    extRef.current = { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering };

    // Create programs
    const programs: Record<string, { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }> = {};

    const programDefs = [
      ['copy', copyShader],
      ['clear', clearShader],
      ['splat', splatShader],
      ['advection', advectionShader],
      ['divergence', divergenceShader],
      ['curl', curlShader],
      ['vorticity', vorticityShader],
      ['pressure', pressureShader],
      ['gradientSubtract', gradientSubtractShader],
      ['display', displayShader],
    ];

    for (const [name, fragShader] of programDefs) {
      const program = createProgram(gl, baseVertexShader, fragShader);
      if (program) {
        programs[name] = { program, uniforms: getUniforms(gl, program) };
      }
    }

    programsRef.current = programs;

    // Create vertex buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Blit function
    blitRef.current = (target) => {
      if (!gl) return;
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    return true;
  }, [createProgram, getUniforms]);

  const createFBO = useCallback((w: number, h: number, internalFormat: number, format: number, type: number, filter: number) => {
    const gl = glRef.current;
    if (!gl) return null;

    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    if (!fbo) return null;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX: 1.0 / w,
      texelSizeY: 1.0 / h,
    };
  }, []);

  const createDoubleFBO = useCallback((w: number, h: number, internalFormat: number, format: number, type: number, filter: number) => {
    let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
    let fbo2 = createFBO(w, h, internalFormat, format, type, filter);
    if (!fbo1 || !fbo2) return null;

    return {
      read: fbo1,
      write: fbo2,
      swap() {
        const temp = this.read;
        this.read = this.write;
        this.write = temp;
      },
    };
  }, [createFBO]);

  const initFramebuffers = useCallback(() => {
    const gl = glRef.current;
    const ext = extRef.current;
    if (!gl || !ext) return;

    const simRes = getResolution(config.SIM_RESOLUTION);
    const dyeRes = getResolution(config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    fboRef.current.dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
    fboRef.current.velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
    fboRef.current.divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    fboRef.current.curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    fboRef.current.pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
  }, [createFBO, createDoubleFBO]);

  const getResolution = (resolution: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: resolution, height: resolution };

    const aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) {
      return { width: Math.round(resolution * aspectRatio), height: resolution };
    }
    return { width: resolution, height: Math.round(resolution / aspectRatio) };
  };

  const splat = useCallback((x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
    const gl = glRef.current;
    const programs = programsRef.current;
    const blit = blitRef.current;
    const velocity = fboRef.current.velocity;
    const dye = fboRef.current.dye;

    if (!gl || !programs.splat || !blit || !velocity || !dye) return;

    const { program, uniforms } = programs.splat;
    gl.useProgram(program);

    gl.uniform1i(uniforms['uTarget'], 0);
    gl.uniform1f(uniforms['aspectRatio'], canvasRef.current!.width / canvasRef.current!.height);
    gl.uniform2f(uniforms['point'], x, y);
    gl.uniform3f(uniforms['color'], dx, dy, 0);
    gl.uniform1f(uniforms['radius'], config.SPLAT_RADIUS / 100.0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(velocity.write);
    velocity.swap();

    gl.uniform3f(uniforms['color'], color[0], color[1], color[2]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
    blit(dye.write);
    dye.swap();
  }, []);

  const step = useCallback((dt: number) => {
    const gl = glRef.current;
    const programs = programsRef.current;
    const blit = blitRef.current;
    const { velocity, dye, curl, divergence, pressure } = fboRef.current;

    if (!gl || !blit || !velocity || !dye || !curl || !divergence || !pressure) return;

    gl.disable(gl.BLEND);

    // Curl
    let prog = programs.curl;
    gl.useProgram(prog.program);
    gl.uniform2f(prog.uniforms['texelSize'], velocity.read.texelSizeX, velocity.read.texelSizeY);
    gl.uniform1i(prog.uniforms['uVelocity'], 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(curl);

    // Vorticity
    prog = programs.vorticity;
    gl.useProgram(prog.program);
    gl.uniform2f(prog.uniforms['texelSize'], velocity.read.texelSizeX, velocity.read.texelSizeY);
    gl.uniform1i(prog.uniforms['uVelocity'], 0);
    gl.uniform1i(prog.uniforms['uCurl'], 1);
    gl.uniform1f(prog.uniforms['curl'], config.CURL);
    gl.uniform1f(prog.uniforms['dt'], dt);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, curl.texture);
    blit(velocity.write);
    velocity.swap();

    // Divergence
    prog = programs.divergence;
    gl.useProgram(prog.program);
    gl.uniform2f(prog.uniforms['texelSize'], velocity.read.texelSizeX, velocity.read.texelSizeY);
    gl.uniform1i(prog.uniforms['uVelocity'], 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(divergence);

    // Clear pressure
    prog = programs.clear;
    gl.useProgram(prog.program);
    gl.uniform1i(prog.uniforms['uTexture'], 0);
    gl.uniform1f(prog.uniforms['value'], 0.8);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
    blit(pressure.write);
    pressure.swap();

    // Pressure iterations
    prog = programs.pressure;
    gl.useProgram(prog.program);
    gl.uniform2f(prog.uniforms['texelSize'], velocity.read.texelSizeX, velocity.read.texelSizeY);
    gl.uniform1i(prog.uniforms['uDivergence'], 0);
    gl.uniform1i(prog.uniforms['uPressure'], 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, divergence.texture);
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
      blit(pressure.write);
      pressure.swap();
    }

    // Gradient subtract
    prog = programs.gradientSubtract;
    gl.useProgram(prog.program);
    gl.uniform2f(prog.uniforms['texelSize'], velocity.read.texelSizeX, velocity.read.texelSizeY);
    gl.uniform1i(prog.uniforms['uPressure'], 0);
    gl.uniform1i(prog.uniforms['uVelocity'], 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(velocity.write);
    velocity.swap();

    // Advect velocity
    prog = programs.advection;
    gl.useProgram(prog.program);
    gl.uniform2f(prog.uniforms['texelSize'], velocity.read.texelSizeX, velocity.read.texelSizeY);
    gl.uniform2f(prog.uniforms['dyeTexelSize'], velocity.read.texelSizeX, velocity.read.texelSizeY);
    gl.uniform1i(prog.uniforms['uVelocity'], 0);
    gl.uniform1i(prog.uniforms['uSource'], 1);
    gl.uniform1f(prog.uniforms['dt'], dt);
    gl.uniform1f(prog.uniforms['dissipation'], config.VELOCITY_DISSIPATION);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(velocity.write);
    velocity.swap();

    // Advect dye
    gl.uniform2f(prog.uniforms['dyeTexelSize'], dye.read.texelSizeX, dye.read.texelSizeY);
    gl.uniform1i(prog.uniforms['uSource'], 1);
    gl.uniform1f(prog.uniforms['dissipation'], config.DENSITY_DISSIPATION);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
    blit(dye.write);
    dye.swap();
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const programs = programsRef.current;
    const blit = blitRef.current;
    const dye = fboRef.current.dye;

    if (!gl || !programs.display || !blit || !dye) return;

    // Check theme
    isDarkRef.current = document.documentElement.getAttribute('data-theme') === 'dark';

    const { program, uniforms } = programs.display;
    gl.useProgram(program);
    gl.uniform1i(uniforms['uTexture'], 0);
    gl.uniform1f(uniforms['uIsDark'], isDarkRef.current ? 1.0 : 0.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
    blit(null);
  }, []);

  const update = useCallback(() => {
    const now = Date.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.016666);
    lastTimeRef.current = now;

    const canvas = canvasRef.current;
    const gl = glRef.current;

    if (canvas && gl) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        initFramebuffers();
      }
    }

    // Process pointer inputs
    for (const p of pointersRef.current) {
      if (p.moved) {
        p.moved = false;
        splat(p.texcoordX, p.texcoordY, p.deltaX * config.SPLAT_FORCE, p.deltaY * config.SPLAT_FORCE, p.color);
      }
    }

    step(dt);
    render();

    animationRef.current = requestAnimationFrame(update);
  }, [initFramebuffers, splat, step, render]);

  const updatePointerMoveData = useCallback((pointer: Pointer, posX: number, posY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.deltaX = pointer.texcoordX - pointer.prevTexcoordX;
    pointer.deltaY = pointer.texcoordY - pointer.prevTexcoordY;
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
  }, []);

  useEffect(() => {
    const success = initWebGL();
    if (!success) return;

    initFramebuffers();

    // Initialize pointer
    pointersRef.current = [{
      id: -1,
      texcoordX: 0.5,
      texcoordY: 0.5,
      prevTexcoordX: 0.5,
      prevTexcoordY: 0.5,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: [0.3, 0.3, 0.3],
    }];

    const handleMouseMove = (e: MouseEvent) => {
      const pointer = pointersRef.current[0];
      updatePointerMoveData(pointer, e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        const pointer = pointersRef.current[i] || {
          id: i,
          texcoordX: 0.5,
          texcoordY: 0.5,
          prevTexcoordX: 0.5,
          prevTexcoordY: 0.5,
          deltaX: 0,
          deltaY: 0,
          down: true,
          moved: false,
          color: [0.3, 0.3, 0.3],
        };
        if (!pointersRef.current[i]) pointersRef.current[i] = pointer;
        updatePointerMoveData(pointer, touches[i].clientX, touches[i].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    animationRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initWebGL, initFramebuffers, update, updatePointerMoveData]);

  return (
    <canvas
      ref={canvasRef}
      className="water-ripple-shader"
      aria-hidden="true"
    />
  );
}

export default FluidSimulation;
