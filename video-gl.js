/**
 * video-gl.js — OGL WebGL background for the Videos section
 * Dark cinematic aurora effect, mouse-reactive
 */
import { Renderer, Program, Mesh, Triangle } from 'ogl';

/* ── Vertex ─────────────────────────────────────────── */
const vert = /* glsl */`
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

/* ── Fragment ────────────────────────────────────────── */
const frag = /* glsl */`
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform float uActive;

  varying vec2 vUv;

  /* ── Hash / noise ── */
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),              hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
      u.y
    );
  }

  /* ── Fractional Brownian Motion ── */
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2( 0.8660, 0.5000, -0.5000, 0.8660 ); /* 30° */
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p  = rot * p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float ar = uResolution.x / uResolution.y;
    vec2 suv = vec2(uv.x * ar, uv.y);

    float t = uTime * 0.14;

    /* mouse influence */
    vec2  mouse = vec2(uMouse.x * ar, uMouse.y);
    float md    = distance(suv, mouse);
    float mg    = exp(-md * 2.2) * uActive * 0.28;

    /* domain-warped fbm */
    vec2 q = vec2(
      fbm(suv + t),
      fbm(suv + vec2(1.4, -0.9) + t * 0.65)
    );
    vec2 r = vec2(
      fbm(suv + 1.7 * q + vec2(1.7, 9.2) + 0.14 * t),
      fbm(suv + 1.7 * q + vec2(8.3, 2.8) + 0.12 * t)
    );
    float f = fbm(suv + 1.9 * r) + mg;
    f = clamp(f, 0.0, 1.0);

    /* dark cinematic palette: deep-indigo → violet → teal */
    vec3 col = vec3(0.04, 0.01, 0.09);
    col = mix(col, vec3(0.09, 0.02, 0.20), smoothstep(0.20, 0.50, f));
    col = mix(col, vec3(0.03, 0.06, 0.18), smoothstep(0.40, 0.68, f));
    col = mix(col, vec3(0.17, 0.04, 0.28), smoothstep(0.60, 0.90, f));

    /* cursor hot-glow */
    col += vec3(0.10, 0.02, 0.18) * exp(-md * 2.8) * uActive;

    /* subtle scan-line grain */
    float grain = hash(uv * uResolution + uTime * 300.0) * 0.025;
    col += grain;

    /* radial vignette */
    vec2 vig = vUv * 2.0 - 1.0;
    col *= 1.0 - 0.38 * dot(vig * vec2(0.75, 1.0), vig * vec2(0.75, 1.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ── Public init ─────────────────────────────────────── */
export function initVideoGL(sectionEl) {
  const renderer = new Renderer({
    alpha:     false,
    antialias: false,
    dpr:       Math.min(window.devicePixelRatio, 2),
  });
  const gl = renderer.gl;
  gl.clearColor(0.04, 0.01, 0.09, 1.0);

  /* inject canvas behind section content */
  const canvas = gl.canvas;
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  sectionEl.style.position = 'relative';
  sectionEl.insertBefore(canvas, sectionEl.firstChild);

  const geometry = new Triangle(gl);
  const program  = new Program(gl, {
    vertex:   vert,
    fragment: frag,
    uniforms: {
      uTime:       { value: 0 },
      uResolution: { value: [0, 0] },
      uMouse:      { value: [0.5, 0.5] },
      uActive:     { value: 0 },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  /* resize */
  function onResize() {
    const w = sectionEl.offsetWidth;
    const h = sectionEl.offsetHeight;
    renderer.setSize(w, h);
    program.uniforms.uResolution.value = [w, h];
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(sectionEl);
  onResize();

  /* mouse tracking with lerp */
  const cur   = { x: 0.5, y: 0.5, a: 0 };
  const tgt   = { x: 0.5, y: 0.5, a: 0 };

  sectionEl.addEventListener('mousemove', e => {
    const r = sectionEl.getBoundingClientRect();
    tgt.x = (e.clientX - r.left) / r.width;
    tgt.y = 1 - (e.clientY - r.top)  / r.height;
    tgt.a = 1;
  });
  sectionEl.addEventListener('mouseleave', () => { tgt.a = 0; });

  /* card hover — brighten nearest area */
  sectionEl.querySelectorAll('.reel-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const cr = card.getBoundingClientRect();
      const sr = sectionEl.getBoundingClientRect();
      tgt.x = (cr.left + cr.width  * 0.5 - sr.left) / sr.width;
      tgt.y = 1 - (cr.top + cr.height * 0.5 - sr.top) / sr.height;
      tgt.a = 1.4;
    });
    card.addEventListener('mouseleave', () => { tgt.a = 0; });
  });

  /* render loop */
  let raf;
  function update(t) {
    raf = requestAnimationFrame(update);
    const k = 0.055;
    cur.x += (tgt.x - cur.x) * k;
    cur.y += (tgt.y - cur.y) * k;
    cur.a += (tgt.a - cur.a) * 0.048;

    program.uniforms.uTime.value       = t * 0.001;
    program.uniforms.uMouse.value      = [cur.x, cur.y];
    program.uniforms.uActive.value     = cur.a;

    renderer.render({ scene: mesh });
  }
  raf = requestAnimationFrame(update);

  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}
