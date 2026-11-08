// Scenes 01–02 in 3D: the extruded title, the flight through its O, Namangan at night,
// and the push into one lit window — past the person at the desk — into the monitor.
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry(a) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Time-keyed cubic Hermite track (Catmull-Rom tangents unless a key gives its own velocity).
function track(keys) {
  const n = keys.length, T = keys.map((k) => k[0]), P = keys.map((k) => k[1]);
  const M = P.map((p, i) => {
    if (keys[i][2]) return keys[i][2];
    if (i === 0 || i === n - 1) return V(0, 0, 0);
    return P[i + 1].clone().sub(P[i - 1]).divideScalar(T[i + 1] - T[i - 1]);
  });
  return (t, out) => {
    if (t <= T[0]) return out.copy(P[0]);
    if (t >= T[n - 1]) return out.copy(P[n - 1]);
    let i = 0;
    while (t > T[i + 1]) i++;
    const dt = T[i + 1] - T[i], s = (t - T[i]) / dt, s2 = s * s, s3 = s2 * s;
    return out.set(0, 0, 0)
      .addScaledVector(P[i], 2 * s3 - 3 * s2 + 1).addScaledVector(M[i], (s3 - 2 * s2 + s) * dt)
      .addScaledVector(P[i + 1], -2 * s3 + 3 * s2).addScaledVector(M[i + 1], (s3 - s2) * dt);
  };
}
function scalarTrack(keys) {
  const t3 = track(keys.map((k) => [k[0], V(k[1], 0, 0)])), tmp = V(0, 0, 0);
  return (t) => t3(t, tmp).x;
}

function radialTexture(stops, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d"), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => r.addColorStop(o, col));
  g.fillStyle = r; g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createOpening(gl, fontJson, cardImg) {
  const { renderer } = gl;
  const GROUND = -16, WZ = -150;
  const FOG = new THREE.Color(0x0b0a14), FOG_DENSITY = 0.0031;
  const uTime = { value: 0 }, uFogColor = { value: FOG }, uFogDensity = { value: FOG_DENSITY };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020308);
  scene.fog = new THREE.FogExp2(FOG, FOG_DENSITY);
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.03, 6000);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  /* ================================================================ the title */
  const font = new Font(fontJson);
  const S = 10, DEPTH = 2.4, BEV = 0.24, TEXT = "RAHMATILLOKH";
  const faceMat = new THREE.MeshPhysicalMaterial({ color: 0xd8cfc0, roughness: 0.42, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.3, envMap: env, envMapIntensity: 0.22, transparent: true });
  const sideMat = new THREE.MeshPhysicalMaterial({ color: 0x8e0e18, roughness: 0.32, metalness: 0.55, clearcoat: 0.5, envMap: env, envMapIntensity: 0.35, emissive: 0x220205, transparent: true });
  const title = new THREE.Group();
  scene.add(title);
  const scale = S / font.data.resolution, letters = [];
  let x = 0;
  for (const ch of TEXT) {
    const geo = new TextGeometry(ch, { font, size: S, depth: DEPTH, curveSegments: 10, bevelEnabled: true, bevelThickness: BEV, bevelSize: 0.13, bevelSegments: 5 });
    const mesh = new THREE.Mesh(geo, [faceMat.clone(), sideMat.clone()]);
    mesh.userData.x = x;
    letters.push(mesh);
    title.add(mesh);
    x += font.data.glyphs[ch].ha * scale;
  }
  const totalW = x;
  letters[2].geometry.computeBoundingBox();
  const capH = letters[2].geometry.boundingBox.max.y;
  letters.forEach((m, i) => {
    m.position.set(m.userData.x - totalW / 2, -capH / 2, 0);
    m.userData.home = m.position.clone();
    m.userData.from = V((i - 5.5) * 0.35, -1.6 - (i % 3) * 0.4, -9 - (i % 4) * 2);
  });

  // The O's counter, exactly as the font draws it — the window we will fly through.
  const oMesh = letters[9];
  const oShape = font.generateShapes("O", S)[0];
  const holePts = oShape.holes[0].getPoints(48).map((p) => new THREE.Vector2(p.x + oMesh.position.x, p.y + oMesh.position.y));
  const hb = new THREE.Box2().setFromPoints(holePts);
  const OC = V((hb.min.x + hb.max.x) / 2, (hb.min.y + hb.max.y) / 2, DEPTH / 2);

  // A dark plate behind the title with that counter cut out of it: the city only shows through the O.
  const plate = new THREE.Shape([V(-3000, -3000), V(3000, -3000), V(3000, 3000), V(-3000, 3000)].map((v) => new THREE.Vector2(v.x, v.y)));
  plate.holes.push(new THREE.Path(holePts));
  const backMat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: { uGlow: { value: 0 } },
    vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform float uGlow; varying vec2 vP;
      void main(){ float r = length(vP * vec2(0.022, 0.05)); vec3 c = vec3(0.012, 0.009, 0.010) + vec3(0.11, 0.022, 0.03) * exp(-r * r * 2.2) * uGlow; gl_FragColor = vec4(c, 1.0); }`,
  });
  const backdrop = new THREE.Mesh(new THREE.ShapeGeometry(plate, 1), backMat);
  backdrop.position.z = -BEV - 0.08;
  scene.add(backdrop);

  scene.add(new THREE.AmbientLight(0xffffff, 0.05));
  const key = new THREE.DirectionalLight(0xffe7cc, 1.35);
  key.position.set(-30, 36, 90);
  scene.add(key);
  const rim = new THREE.PointLight(0xff2a3c, 260, 140, 2);
  rim.position.set(0, -10, -16);
  scene.add(rim);
  const sweep = new THREE.PointLight(0xfff2de, 0, 70, 2);
  scene.add(sweep);

  // Dust hanging in the light in front of the title.
  const dustTex = radialTexture([[0, "rgba(255,240,220,1)"], [0.4, "rgba(255,230,200,0.35)"], [1, "rgba(255,230,200,0)"]], 64);
  const dustGeo = new THREE.BufferGeometry(), dustN = 700, dp = new Float32Array(dustN * 3), rr = mulberry(5);
  for (let i = 0; i < dustN; i++) { dp[i * 3] = (rr() - 0.5) * 140; dp[i * 3 + 1] = (rr() - 0.5) * 60; dp[i * 3 + 2] = 4 + rr() * 120; }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.28, map: dustTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe6c8, opacity: 0.55, fog: false }));
  scene.add(dust);

  /* ================================================================ sky */
  const skyGroup = new THREE.Group();
  scene.add(skyGroup);
  skyGroup.add(new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `varying vec3 vD;
      void main(){ float h = vD.y;
        vec3 top = vec3(0.002, 0.004, 0.016), mid = vec3(0.012, 0.016, 0.05), hor = vec3(0.16, 0.055, 0.085);
        vec3 c = mix(hor, mid, smoothstep(-0.01, 0.16, h)); c = mix(c, top, smoothstep(0.16, 0.75, h));
        c = mix(c, vec3(0.03, 0.016, 0.02), smoothstep(0.0, -0.12, h));
        gl_FragColor = vec4(c, 1.0); }`,
  })));
  {
    const n = 2200, pos = new Float32Array(n * 3), aS = new Float32Array(n), aP = new Float32Array(n), r = mulberry(9);
    for (let i = 0; i < n; i++) {
      const th = r() * Math.PI * 2, y = 0.04 + Math.pow(r(), 0.8) * 0.96, rad = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(th) * rad * 2800; pos[i * 3 + 1] = y * 2800; pos[i * 3 + 2] = Math.sin(th) * rad * 2800;
      aS[i] = r() < 0.95 ? 1 + r() * 1.6 : 2.6 + r() * 2.4; aP[i] = r() * 6.28;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aS", new THREE.BufferAttribute(aS, 1));
    g.setAttribute("aP", new THREE.BufferAttribute(aP, 1));
    skyGroup.add(new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute float aS; attribute float aP; uniform float uTime; uniform float uPR; varying float vA;
        void main(){ vA = (0.55 + 0.45 * sin(uTime * (0.6 + aP * 0.3) + aP * 7.0)) * smoothstep(0.0, 400.0, position.y);
          gl_PointSize = aS * uPR; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(vec3(1.0, 0.97, 0.92) * a * vA * 1.4, 1.0); }`,
    })));
  }
  {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#fff7ea"; g.beginPath(); g.arc(128, 128, 92, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(88, 108, 86, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const dir = V(0.42, 0.3, -1).normalize();
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: new THREE.Color(2.4, 2.2, 1.9), fog: false, depthWrite: false, transparent: true }));
    moon.position.copy(dir).multiplyScalar(2600); moon.scale.setScalar(120);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture([[0, "rgba(255,226,190,0.5)"], [0.3, "rgba(255,210,170,0.12)"], [1, "rgba(255,210,170,0)"]]), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    halo.position.copy(moon.position); halo.scale.setScalar(900);
    skyGroup.add(halo, moon);
  }

  /* ================================================================ mountains & haze */
  function ridge(z, base, amp, color, seed) {
    const r = mulberry(seed), pts = [], N = 260, X = 5200;
    const lat = []; for (let i = 0; i <= 64; i++) lat.push(r());
    const noise = (u) => { const i = Math.floor(u), f = u - i, s = f * f * (3 - 2 * f); return lat[i % 64] + (lat[(i + 1) % 64] - lat[i % 64]) * s; };
    for (let i = 0; i <= N; i++) {
      const xx = -X / 2 + (X * i) / N, u = (i / N) * 40;
      const h = base + amp * (0.6 * noise(u * 0.35) + 0.3 * noise(u * 1.1 + 9) + 0.1 * noise(u * 3.3 + 21));
      pts.push(xx, GROUND - 40, z, xx, GROUND + h, z);
    }
    const idx = [];
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.setIndex(idx);
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, fog: false }));
  }
  scene.add(ridge(-2200, 150, 260, 0x0b0d1c, 3), ridge(-1700, 90, 170, 0x07080f, 4));
  {
    const c = document.createElement("canvas"); c.width = 4; c.height = 128;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "rgba(255,130,90,0)"); gr.addColorStop(0.62, "rgba(255,140,95,0.22)"); gr.addColorStop(1, "rgba(255,140,95,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(6000, 260), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    haze.position.set(0, GROUND + 70, -1500);
    scene.add(haze);
  }

  /* ================================================================ the city */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshBasicMaterial({ color: 0x040407 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND;
  scene.add(ground);

  const BLD_VS = `
    #ifdef INST
    attribute float aSeed;
    #endif
    uniform float uSeed;
    varying vec3 vW; varying vec3 vN; varying float vS;
    void main() {
      mat4 m = modelMatrix;
      #ifdef USE_INSTANCING
      m = modelMatrix * instanceMatrix;
      #endif
      vec4 w = m * vec4(position, 1.0);
      vW = w.xyz; vN = normalize(mat3(m) * normal);
      #ifdef INST
      vS = aSeed;
      #else
      vS = uSeed;
      #endif
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const BLD_FS = `
    uniform float uTime, uFogDensity, uLit, uGround;
    uniform vec3 uFogColor;
    varying vec3 vW; varying vec3 vN; varying float vS;
    float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    void main() {
      vec3 n = normalize(vN);
      float y = vW.y - uGround;
      vec3 col = vec3(0.009, 0.010, 0.017) * (0.5 + 0.9 * clamp(y / 60.0, 0.0, 1.0));
      if (abs(n.y) < 0.5) {
        float u = abs(n.x) > 0.5 ? vW.z : vW.x;
        vec2 g = vec2(u / 1.7, y / 2.4);
        vec2 cell = floor(g), f = fract(g);
        float win = step(0.24, f.x) * step(f.x, 0.76) * step(0.3, f.y) * step(f.y, 0.78) * step(1.0, cell.y);
        float side = n.x * 3.0 + n.z * 7.0;
        float r = h1(cell + vS * 13.7 + side);
        float lit = step(r, uLit);
        float tw = h1(cell * 1.31 + vS * 3.3 + side);
        if (tw > 0.986) lit = step(0.5, fract(uTime * 0.05 + tw * 13.0));
        float r2 = h1(cell + 7.7 + vS + side);
        vec3 warm = mix(vec3(1.0, 0.56, 0.26), vec3(1.0, 0.78, 0.5), r2);
        vec3 lc = (r2 > 0.87 ? vec3(0.5, 0.66, 1.0) : warm) * (0.75 + 1.55 * h1(cell + 3.3 + side));
        vec3 off = vec3(0.02, 0.024, 0.04);
        vec3 wc = mix(col, mix(off, lc, lit), win);
        float lod = clamp(max(fwidth(g.x), fwidth(g.y)) * 1.6 - 0.35, 0.0, 1.0);
        col = mix(wc, col + warm * uLit * 0.55 + off * 0.3, lod);
      } else if (n.y > 0.5) {
        col = vec3(0.008, 0.009, 0.014);
      }
      float dist = length(vW - cameraPosition);
      float fog = 1.0 - exp(-pow(uFogDensity * dist, 2.0));
      gl_FragColor = vec4(mix(col, uFogColor, fog), 1.0);
    }`;
  const bldUniforms = (seed) => ({ uTime, uFogColor, uFogDensity, uSeed: { value: seed }, uLit: { value: 0.13 }, uGround: { value: GROUND } });
  const bldMatInst = new THREE.ShaderMaterial({ defines: { INST: "" }, uniforms: bldUniforms(0), vertexShader: BLD_VS, fragmentShader: BLD_FS });
  const bldMat = new THREE.ShaderMaterial({ uniforms: bldUniforms(4.2), vertexShader: BLD_VS, fragmentShader: BLD_FS });

  const rnd = mulberry(11), B = [];
  for (let gx = -340; gx <= 340; gx += 34) {
    for (let gz = -64; gz >= -1000; gz -= 30) {
      if (rnd() < 0.1) continue;
      const count = rnd() < 0.42 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const w = 9 + rnd() * 15, dd = 9 + rnd() * 12, h = 7 + Math.pow(rnd(), 2.5) * 48;
        B.push({ x: gx + (rnd() - 0.5) * (34 - w) * 0.8, z: gz + (rnd() - 0.5) * (30 - dd) * 0.8, w, d: dd, h, hh: h, seed: rnd() * 100 });
      }
    }
  }
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0);
  const instGeo = boxGeo.clone();
  instGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(new Float32Array(B.map((b) => b.seed)), 1));
  const city = new THREE.InstancedMesh(instGeo, bldMatInst, B.length);
  city.frustumCulled = false;
  scene.add(city);
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = V(1, 1, 1), tmpP = V(0, 0, 0);
  function writeCity() {
    B.forEach((b, i) => {
      tmpP.set(b.x, GROUND, b.z); tmpS.set(b.w, Math.max(0.001, b.hh), b.d);
      tmpM.compose(tmpP, tmpQ, tmpS); city.setMatrixAt(i, tmpM);
    });
    city.instanceMatrix.needsUpdate = true;
  }

  // street lamps, their pools of light, and poplars
  const lampPos = [];
  for (let gx = -323; gx <= 340; gx += 34) for (let gz = -70; gz >= -760; gz -= 32) lampPos.push([gx, gz]);
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 2.6, 1.0) }), lampPos.length);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 6.6, 6), new THREE.MeshBasicMaterial({ color: 0x0a0a0e }), lampPos.length);
  const poolGeo = new THREE.PlaneGeometry(1, 1); poolGeo.rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(poolGeo, new THREE.MeshBasicMaterial({ map: radialTexture([[0, "rgba(255,170,90,0.55)"], [0.5, "rgba(255,150,80,0.14)"], [1, "rgba(255,150,80,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), lampPos.length);
  lampPos.forEach(([lx, lz], i) => {
    tmpM.makeTranslation(lx, GROUND + 6.7, lz); lamps.setMatrixAt(i, tmpM);
    tmpM.makeTranslation(lx, GROUND + 3.3, lz); poles.setMatrixAt(i, tmpM);
    tmpM.compose(V(lx, GROUND + 0.05, lz), tmpQ, V(16, 1, 16)); pools.setMatrixAt(i, tmpM);
  });
  [lamps, poles, pools].forEach((m) => { m.frustumCulled = false; scene.add(m); });

  const poplarPos = [], pr = mulberry(21);
  for (let gx = -323; gx <= 340; gx += 34) for (let gz = -66; gz >= -700; gz -= 11) if (pr() > 0.42) poplarPos.push([gx + (pr() < 0.5 ? -3 : 3), gz, 9 + pr() * 8, 0.9 + pr() * 0.5]);
  const popGeo = new THREE.SphereGeometry(1, 10, 12); popGeo.translate(0, 1, 0);
  const poplars = new THREE.InstancedMesh(popGeo, new THREE.MeshBasicMaterial({ color: 0x030306 }), poplarPos.length);
  poplarPos.forEach(([px, pz, h, r], i) => { tmpM.compose(V(px, GROUND, pz), tmpQ, V(r, h / 2, r)); poplars.setMatrixAt(i, tmpM); });
  poplars.frustumCulled = false;
  scene.add(poplars);

  // a mosque with two minarets on the skyline
  const mosque = new THREE.Group();
  {
    const m = new THREE.MeshBasicMaterial({ color: 0x0b0c16 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(26, 10, 22), m); base.position.y = 5;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.4, 5, 24), m); drum.position.y = 12.5;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(7.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.position.y = 15;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 6), m); tip.position.y = 23.5;
    mosque.add(base, drum, dome, tip);
    [-1, 1].forEach((sd) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 38, 12), m); t.position.set(sd * 17, 19, 0);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.2, 12), m); b.position.set(sd * 17, 30, 0);
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.5, 12), m); c.position.set(sd * 17, 40.3, 0);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 1.6) })); l.position.set(sd * 17, 30.9, 0);
      mosque.add(t, b, c, l);
    });
  }
  scene.add(mosque);

  /* ================================================================ the studio and its room */
  const roomTex = (() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 614;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 614);
    gr.addColorStop(0, "#0d1426"); gr.addColorStop(1, "#05070d");
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 614);
    g.strokeStyle = "rgba(122,140,166,0.16)"; g.lineWidth = 2;
    for (let i = 0; i < 1024; i += 46) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 614); g.stroke(); }
    for (let i = 0; i < 614; i += 46) { g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke(); }
    const glow = g.createRadialGradient(780, 170, 10, 780, 170, 260);
    glow.addColorStop(0, "rgba(242,180,55,0.22)"); glow.addColorStop(1, "rgba(242,180,55,0)");
    g.fillStyle = glow; g.fillRect(0, 0, 1024, 614);
    g.fillStyle = "#fff"; g.font = "400 64px Anton, Impact, sans-serif"; g.fillText("THE KEYBOARD IS", 60, 130); g.fillText("THE", 60, 200);
    g.fillStyle = "#ff4655"; g.fillText("WEAPON.", 182, 200);
    g.fillStyle = "#ff3d55"; g.fillRect(640, 60, 300, 9);
    if (cardImg) { g.globalCompositeOperation = "lighten"; g.drawImage(cardImg, 2070, 10, 545, 485, 690, 92, 220, 196); g.globalCompositeOperation = "source-over"; }
    g.font = "700 38px 'JetBrains Mono', Menlo, monospace";
    g.fillStyle = "#3bff9e"; g.fillText("dra", 520, 360); g.fillStyle = "#e8faff"; g.fillText("gon", 520 + g.measureText("dra").width, 360);
    g.fillText("hello", 740, 450); g.fillText("night", 610, 540);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  })();
  const posterTex = cardImg ? new THREE.Texture(cardImg) : null;
  if (posterTex) { posterTex.colorSpace = THREE.SRGBColorSpace; posterTex.needsUpdate = true; }

  const studio = new THREE.Group();
  scene.add(studio);
  const W = V(0, 0, WZ), MON = V(0, 0, WZ);
  const WIN_W = 2.9, WIN_H = 1.9, FT = 0.4, RW = 7.4, RH = 3.4, RD = 5.6, BW = 22, BD = 18;

  function boxAt(x0, x1, y0, y1, z0, z1, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.01, x1 - x0), Math.max(0.01, y1 - y0), Math.max(0.01, z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    studio.add(m);
    return m;
  }
  function planeAt(w, h, mat, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0);
    studio.add(m);
    return m;
  }
  const basic = (c) => new THREE.MeshBasicMaterial({ color: c, fog: true });

  function placeStudio() {
    studio.children.slice().forEach((c) => { studio.remove(c); c.geometry.dispose(); });
    const top = GROUND + 34, x = W.x, y = W.y, z = W.z;
    const l = x - BW / 2, r = x + BW / 2, wl = x - WIN_W / 2, wr = x + WIN_W / 2, wb = y - WIN_H / 2, wt = y + WIN_H / 2;
    const fl = y - 1.45, ce = fl + RH, rl = x - RW / 2, rr2 = x + RW / 2, zf = z - FT, zb = z - FT - RD;
    // facade frame around the window
    boxAt(l, wl, GROUND, top, zf, z, bldMat); boxAt(wr, r, GROUND, top, zf, z, bldMat);
    boxAt(wl, wr, GROUND, wb, zf, z, bldMat); boxAt(wl, wr, wt, top, zf, z, bldMat);
    // body around the room, then the back of the building
    boxAt(l, rl, GROUND, top, zb, zf, bldMat); boxAt(rr2, r, GROUND, top, zb, zf, bldMat);
    boxAt(rl, rr2, GROUND, fl, zb, zf, bldMat); boxAt(rl, rr2, ce, top, zb, zf, bldMat);
    boxAt(l, r, GROUND, top, z - BD, zb, bldMat);
    // the room — lighting baked into flat colours, so it glows like a lived-in space at night
    planeAt(RW, RH, basic(0x3d2416), x, fl + RH / 2, zb + 0.01);
    planeAt(RD, RH, basic(0x26160c), rl + 0.01, fl + RH / 2, zb + RD / 2, Math.PI / 2);
    planeAt(RD, RH, basic(0x22140b), rr2 - 0.01, fl + RH / 2, zb + RD / 2, -Math.PI / 2);
    planeAt(RW, RD, basic(0x120a06), x, fl + 0.01, zb + RD / 2, 0, -Math.PI / 2);
    planeAt(RW, RD, basic(0x1a0f08), x, ce - 0.01, zb + RD / 2, 0, Math.PI / 2);
    const pool = new THREE.MeshBasicMaterial({ map: radialTexture([[0, "rgba(255,190,120,0.32)"], [0.5, "rgba(255,160,90,0.08)"], [1, "rgba(255,160,90,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    planeAt(5.5, 3.4, pool, x - 2.2, fl + 2.2, zb + 0.03);
    if (posterTex) planeAt(2.33, 1.0, new THREE.MeshBasicMaterial({ map: posterTex, color: 0x6a6258 }), x - 2.3, fl + 2.15, zb + 0.04);
    const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.0, 0.9) });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lampM); lamp.position.set(x - 1.9, fl + 1.32, zb + 1.1); studio.add(lamp);
    boxAt(x - 1.95, x - 1.85, fl + 0.82, fl + 1.28, zb + 1.05, zb + 1.15, basic(0x0a0806));
    // desk, monitor, the person at it
    boxAt(x - 2.4, x + 2.2, fl + 0.74, fl + 0.8, zb + 0.4, zb + 1.5, basic(0x1d120a));
    boxAt(x - 2.3, x - 2.2, fl, fl + 0.74, zb + 0.5, zb + 1.4, basic(0x0e0905));
    boxAt(x + 2.0, x + 2.1, fl, fl + 0.74, zb + 0.5, zb + 1.4, basic(0x0e0905));
    MON.set(x + 0.55, fl + 1.32, zb + 0.66);
    boxAt(MON.x - 0.68, MON.x + 0.68, MON.y - 0.42, MON.y + 0.42, zb + 0.56, zb + 0.645, basic(0x07080b));
    boxAt(MON.x - 0.04, MON.x + 0.04, fl + 0.8, MON.y - 0.4, zb + 0.58, zb + 0.62, basic(0x07080b));
    const screen = planeAt(1.26, 0.756, new THREE.MeshBasicMaterial({ map: roomTex, toneMapped: false }), MON.x, MON.y, zb + 0.651);
    screen.renderOrder = 1;
    const sglow = planeAt(3.2, 2.2, new THREE.MeshBasicMaterial({ map: radialTexture([[0, "rgba(140,180,255,0.16)"], [1, "rgba(140,180,255,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), MON.x, MON.y, zb + 0.7);
    sglow.renderOrder = 2;
    const sil = basic(0x020101);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), sil); head.position.set(x - 0.05, fl + 1.24, zb + 1.95); head.scale.set(1, 1.12, 1); studio.add(head);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), sil); body.position.set(x - 0.05, fl + 0.86, zb + 2.0); body.scale.set(1, 0.72, 0.55); studio.add(body);
    boxAt(x - 0.32, x + 0.22, fl + 0.45, fl + 1.02, zb + 2.25, zb + 2.33, sil);
    // the window glass glow seen from the street
    const halo = planeAt(5, 3.4, new THREE.MeshBasicMaterial({ map: radialTexture([[0, "rgba(255,190,130,0.14)"], [1, "rgba(255,190,130,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), x, y, z + 0.05);
    halo.renderOrder = 3;
  }

  /* ================================================================ layout & camera */
  let z0 = 90, tracks = null;
  const C = { pos: V(0, 0, 0), look: V(0, 0, 0) };
  function layout(aspect) {
    camera.aspect = aspect;
    const vf = (35 * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    z0 = Math.max((totalW * 0.56) / Math.tan(hf / 2), (capH * 2.4) / Math.tan(vf / 2)) + DEPTH;
    // The studio window sits on the line from the opening camera through the O's counter.
    const s = (z0 - WZ) / (z0 - OC.z);
    W.set(OC.x * s, OC.y * s, WZ);
    B.forEach((b) => {
      b.hh = b.h;
      const si = (z0 - b.z) / (z0 - OC.z), xl = OC.x * si;
      if (b.z > WZ - 4 && Math.abs(b.x - xl) < b.w / 2 + 34) b.hh = Math.min(b.h, b.z > WZ + 40 ? 14 : 8);
      if (Math.abs(b.x - W.x) < b.w / 2 + BW / 2 + 3 && b.z < W.z + b.d / 2 + 2 && b.z > W.z - BD - b.d / 2 - 2) b.hh = 0;
    });
    writeCity();
    placeStudio();
    mosque.position.set(W.x - 95, GROUND, WZ - 150);

    const C0 = V(0, 0, z0), OCf = V(OC.x, OC.y, DEPTH + BEV + 0.9), OCb = V(OC.x, OC.y, -BEV - 2.6);
    const vThru = V(0, 0, (OCb.z - OCf.z) / 0.7);
    const est = V(OC.x + (W.x - OC.x) * 0.25, 26, -34), estT = V(W.x, GROUND + 8, WZ - 40);
    const mid = V(W.x - 15, 13, WZ + 62), near = V(W.x - 3.5, W.y + 1.6, WZ + 15);
    const win = V(W.x, W.y + 0.05, WZ + 2.4), inside = V(W.x - 0.12, W.y + 0.12, WZ - FT - 2.1);
    const monF = V(MON.x, MON.y, MON.z + 0.6);
    tracks = {
      pos: track([
        [0, C0], [7.6, V(0, 0, z0 * 0.95)], [10.2, C0.clone().lerp(OCf, 0.6)], [11.0, V(OC.x, OC.y, OCf.z + 7)],
        [11.7, OCf, vThru], [12.4, OCb, vThru], [16.5, est], [28, mid], [38.6, near], [41.8, win], [43.9, inside], [45.5, monF],
      ]),
      look: track([
        [0, V(0, 0, 0)], [7.6, V(0, 0, 0)], [10.2, V(OC.x * 0.8, OC.y, 0)], [11.0, V(OC.x, OC.y, -20)], [11.7, V(W.x * 0.6 + OC.x * 0.4, W.y * 0.6, -80)],
        [12.4, W.clone()], [16.5, estT], [28, W.clone()], [38.6, W.clone()], [41.8, V(W.x, W.y, WZ - 3)], [43.9, MON.clone()], [45.5, MON.clone()],
      ]),
      fov: scalarTrack([[0, 35], [10.2, 35], [12.4, 42], [16.5, 47], [28, 41], [38.6, 34], [41.8, 44], [43.9, 48], [45.5, 36]]),
    };
  }
  layout(innerWidth / innerHeight);

  /* ================================================================ per frame */
  const roll = (t) => Math.sin(Math.PI * seg(t, 9.5, 15)) * 0.07;
  function update(t, time) {
    uTime.value = time;
    for (let i = 0; i < letters.length; i++) {
      const m = letters[i], a = 0.45 + i * 0.085, p = ease(seg(t, a, a + 1.8));
      m.position.copy(m.userData.home).addScaledVector(m.userData.from, 1 - p);
      m.rotation.set(0.6 * (1 - p), -0.22 * (1 - p), 0);
      m.material[0].opacity = m.material[1].opacity = p;
    }
    const sp = seg(t, 2.1, 5.4);
    sweep.position.set(lerp(-totalW * 0.75, totalW * 0.75, sp), 3, 16);
    sweep.intensity = Math.sin(Math.PI * sp) * 700;
    backMat.uniforms.uGlow.value = seg(t, 0.2, 3) * (1 - seg(t, 9, 12));
    const titleOn = t < 12.7;
    title.visible = backdrop.visible = titleOn;
    rim.visible = sweep.visible = titleOn;
    dust.visible = t < 15;
    dust.material.opacity = 0.55 * seg(t, 0.2, 2.5);

    tracks.pos(t, C.pos);
    tracks.look(t, C.look);
    camera.position.copy(C.pos);
    const amp = t < 12 ? 0.012 : t < 41 ? 0.05 : 0.008;
    camera.position.x += Math.sin(time * 0.9) * amp + Math.sin(time * 2.3) * amp * 0.4;
    camera.position.y += Math.sin(time * 1.1 + 1.3) * amp * 0.8;
    camera.lookAt(C.look);
    camera.rotateZ(roll(t));
    camera.fov = tracks.fov(t);
    camera.updateProjectionMatrix();
    skyGroup.position.copy(camera.position);
  }

  const tmpV = V(0, 0, 0);
  function titleBox() {
    const xs = [-totalW / 2, totalW / 2], ys = [-capH / 2, capH / 2];
    let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
    xs.forEach((xx) => ys.forEach((yy) => {
      tmpV.set(xx, yy, DEPTH).project(camera);
      const sx = (tmpV.x * 0.5 + 0.5) * innerWidth, sy = (-tmpV.y * 0.5 + 0.5) * innerHeight;
      top = Math.min(top, sy); bottom = Math.max(bottom, sy); left = Math.min(left, sx); right = Math.max(right, sx);
    }));
    return { top, bottom, left, right };
  }

  return {
    scene, camera, update, titleBox,
    resize(aspect) { layout(aspect); },
  };
}
