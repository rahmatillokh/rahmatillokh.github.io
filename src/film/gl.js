// One WebGL renderer for every 3D shot, with a cinematic finishing chain:
// scene → bloom → ACES tone mapping → lens (chromatic aberration, vignette, grain, fades).
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uFade: { value: 0 },
    uFlash: { value: 0 },
    uCA: { value: 0.5 },
    uAspect: { value: 1.6 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uFade, uFlash, uCA, uAspect;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d * vec2(uAspect, 1.0), d * vec2(uAspect, 1.0));
      vec2 off = d * r2 * 0.012 * uCA;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float vig = smoothstep(1.05, 0.25, length(d * vec2(1.0, 1.08)) * 1.25);
      col *= mix(0.42, 1.0, vig);
      float g = hash(vUv * vec2(1931.0, 1153.0) + fract(uTime * 7.31));
      col += (g - 0.5) * 0.045;
      col = mix(col, vec3(0.0), clamp(uFade, 0.0, 1.0));
      col = mix(col, vec3(1.0, 0.985, 0.96), clamp(uFlash, 0.0, 1.0));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function createGL(canvas) {
  const small = Math.min(innerWidth, innerHeight) < 640;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", stencil: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: small ? 0 : 4 });
  const composer = new EffectComposer(renderer, target);
  const pass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.88);
  const lens = new ShaderPass(LensShader);
  composer.addPass(pass);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.addPass(lens);

  let pr = 1;
  function size() {
    const w = innerWidth, h = innerHeight;
    // Keep the frame under ~3.2 megapixels so big screens stay smooth.
    pr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75, Math.sqrt(3.2e6 / (w * h)));
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    lens.uniforms.uAspect.value = w / h;
  }
  size();

  return {
    THREE,
    renderer,
    size,
    compile(scene, camera) { try { renderer.compile(scene, camera); } catch (e) { /* first frame will compile */ } },
    render(scene, camera, o) {
      pass.scene = scene;
      pass.camera = camera;
      lens.uniforms.uTime.value = o.time || 0;
      lens.uniforms.uFade.value = o.fade || 0;
      lens.uniforms.uFlash.value = o.flash || 0;
      bloom.strength = o.bloom == null ? 0.55 : o.bloom;
      composer.render();
    },
  };
}
