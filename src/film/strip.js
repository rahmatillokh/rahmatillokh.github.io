// Scene 04 in 3D: the supporting cast on a 35mm strip that snakes through the dark.
// Frames are colour negatives until they stop in the projector gate and turn positive.
import * as THREE from "three";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => t * t * (3 - 2 * t);

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function createStrip(gl, frames) {
  const N = frames.length, LEAD = 7;
  const FW = 8, FH = 4.5, PITCH = 9.15, BH = 6.7;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050302);
  scene.fog = new THREE.Fog(0x050302, 17, 66);
  const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.1, 500);

  const curve = new THREE.CatmullRomCurve3([V(-82, -11, -56), V(-42, -4.4, -21), V(-15.5, -1.05, -3.5), V(0, 0, 0), V(15.5, 1.15, -3.5), V(42, 4.8, -21), V(82, 12, -56)], false, "centripetal");
  const L = curve.getLength(), S0 = L / 2;

  const baseTex = (edge, lit) => canvasTex(512, 374, (g, w, h) => {
    g.fillStyle = lit ? "#1d130b" : "#160e08"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,180,110,0.05)"; g.fillRect(0, 54, w, h - 108);
    for (let x = 6; x < w; x += 32) { g.fillStyle = "#e8dfcf"; rrect(g, x, 14, 18, 22, 5); g.fill(); rrect(g, x, h - 36, 18, 22, 5); g.fill(); }
    g.fillStyle = "#ff9a4a"; g.font = "700 15px 'JetBrains Mono', Menlo, monospace"; g.fillText(edge, 12, 52);
    g.fillStyle = "#000"; g.fillRect(w - 6, 0, 6, h);
  });
  const textTex = (title, sub) => canvasTex(1024, 576, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6);
    gr.addColorStop(0, "#1a110b"); gr.addColorStop(1, "#070403");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.textAlign = "center"; g.fillStyle = "#ffe0bc"; g.font = "400 112px Anton, Impact, sans-serif"; g.fillText(title.toUpperCase(), w / 2, h / 2 + 18);
    g.fillStyle = "#a59a8e"; g.font = "600 24px 'JetBrains Mono', Menlo, monospace"; g.fillText(sub.toUpperCase().split("").join(" "), w / 2, h / 2 + 84);
  });

  const imgVS = `varying vec2 vUv;
#include <fog_pars_vertex>
void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
  const imgFS = `uniform sampler2D uMap; uniform float uPos, uHover; uniform vec2 uCover; varying vec2 vUv;
#include <fog_pars_fragment>
void main() {
  vec2 uv = vec2(0.5 + (vUv.x - 0.5) * uCover.x, 0.5 + (vUv.y - 0.5) * uCover.y);
  vec3 c = texture2D(uMap, uv).rgb;
  vec3 neg = (1.0 - c) * vec3(1.0, 0.58, 0.32) * 0.7 + vec3(0.05, 0.015, 0.0);
  vec3 col = mix(neg, c * (0.9 + 0.1 * uPos + 0.16 * uHover), uPos);
  gl_FragColor = vec4(col, 1.0);
#include <fog_fragment>
}`;

  const slots = [], picks = [];
  const planeImg = new THREE.PlaneGeometry(FW, FH), planeBase = new THREE.PlaneGeometry(PITCH + 0.02, BH);
  for (let j = -LEAD; j < N + LEAD; j++) {
    const f = frames[j];
    const group = new THREE.Group();
    const base = new THREE.Mesh(planeBase, new THREE.MeshBasicMaterial({ map: baseTex(f ? f.edge : j < 0 ? "AYS ▸ LEADER" : "AYS ▸ TAIL", !!f) }));
    group.add(base);
    let img = null;
    if (f) {
      const map = f.img ? new THREE.Texture(f.img) : textTex(f.title, f.sub);
      map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; map.needsUpdate = true;
      const aspect = f.img ? f.img.naturalWidth / f.img.naturalHeight : 16 / 9;
      const cover = aspect > FW / FH ? new THREE.Vector2((FW / FH) / aspect, 1) : new THREE.Vector2(1, aspect / (FW / FH));
      img = new THREE.Mesh(planeImg, new THREE.ShaderMaterial({
        fog: true,
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uPos: { value: 0 }, uHover: { value: 0 }, uCover: { value: cover } }]),
        vertexShader: imgVS, fragmentShader: imgFS,
      }));
      img.material.uniforms.uMap = { value: map };
      img.position.z = 0.012;
      img.userData.index = j;
      group.add(img);
      picks.push(img);
    }
    scene.add(group);
    slots.push({ j, group, img });
  }

  // The projector gate: a dark plate with a glowing aperture, and the beam that feeds it.
  const plate = new THREE.Shape([[-60, -40], [60, -40], [60, 40], [-60, 40]].map(([x, y]) => new THREE.Vector2(x, y)));
  const hw = FW / 2 + 0.28, hh = FH / 2 + 0.28, r = 0.3, hole = new THREE.Path();
  hole.moveTo(-hw + r, -hh); hole.lineTo(hw - r, -hh); hole.quadraticCurveTo(hw, -hh, hw, -hh + r); hole.lineTo(hw, hh - r); hole.quadraticCurveTo(hw, hh, hw - r, hh);
  hole.lineTo(-hw + r, hh); hole.quadraticCurveTo(-hw, hh, -hw, hh - r); hole.lineTo(-hw, -hh + r); hole.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  plate.holes.push(hole);
  const gate = new THREE.Mesh(new THREE.ShapeGeometry(plate, 6), new THREE.MeshBasicMaterial({ color: 0x030202, transparent: true, opacity: 0.6, depthWrite: false }));
  gate.position.z = 1.4;
  scene.add(gate);
  const rimPts = hole.getPoints(12).map((p) => V(p.x, p.y, 1.42));
  const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rimPts), new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.9), transparent: true, opacity: 0.55 }));
  scene.add(rim);

  const src = V(-8, 12.5, 28), dst = V(0, 0, 0.6), len = src.distanceTo(dst);
  const beamGeo = new THREE.CylinderGeometry(0.25, 5.4, len, 64, 1, true);
  const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uLen: { value: len }, uBoost: { value: 1 } },
    vertexShader: `uniform float uLen; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vY = position.y / uLen + 0.5; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uBoost; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
        float a = f * (0.035 + 0.06 * vY) * smoothstep(0.0, 0.08, vY) * uBoost;
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * a, 1.0); }`,
  }));
  beam.position.copy(src).add(dst).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(V(0, 1, 0), src.clone().sub(dst).normalize());
  scene.add(beam);

  const dustN = 1100, dpos = new Float32Array(dustN * 3), dseed = [];
  for (let i = 0; i < dustN; i++) dseed.push([Math.random(), Math.random() * Math.PI * 2, Math.sqrt(Math.random()), 0.2 + Math.random() * 0.8]);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dustTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,240,220,1)"); gr.addColorStop(1, "rgba(255,240,220,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.07, map: dustTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe2c0, opacity: 0.85, fog: false }));
  scene.add(dust);
  const axis = src.clone().sub(dst).normalize(), side1 = new THREE.Vector3().crossVectors(axis, V(0, 0, 1)).normalize(), side2 = new THREE.Vector3().crossVectors(axis, side1);

  /* ---------- timing: the strip moves like a projector — pull, stop, show, pull ---------- */
  const T0 = 1.5, SLOT = 5, MOVE = 0.22;
  function posAt(c) {
    const f = clamp((c - T0) / SLOT, 0, N - 1);
    if (f >= N - 1) return N - 1;
    const i0 = Math.floor(f), u = f - i0;
    return i0 + smooth(clamp((u - (1 - MOVE)) / MOVE, 0, 1));
  }
  // When frame k has just settled in the gate (frame 0 starts there).
  const slotTime = (k) => (k <= 0 ? 0.6 : T0 + k * SLOT + 0.3);

  const tmp = V(0, 0, 0), tan = V(0, 0, 0), yA = V(0, 0, 0), zA = V(0, 0, 0), mtx = new THREE.Matrix4();
  let hover = -1;
  function update(c, time, aspect) {
    const pos = posAt(c);
    for (const s of slots) {
      const arc = S0 + (s.j - pos) * PITCH;
      if (arc < 0 || arc > L) { s.group.visible = false; continue; }
      s.group.visible = true;
      const u = arc / L;
      curve.getPointAt(u, tmp);
      curve.getTangentAt(u, tan);
      yA.set(0, 1, 0).addScaledVector(tan, -tan.y).normalize();
      zA.crossVectors(tan, yA);
      mtx.makeBasis(tan, yA, zA);
      s.group.position.copy(tmp);
      s.group.quaternion.setFromRotationMatrix(mtx);
      if (s.img) {
        const p = clamp(1 - Math.abs(s.j - pos) * 1.6, 0, 1);
        s.img.material.uniforms.uPos.value = p;
        s.img.material.uniforms.uHover.value += ((hover === s.j ? 1 : 0) - s.img.material.uniforms.uHover.value) * 0.15;
      }
    }
    const settled = Math.abs(pos - Math.round(pos)) < 0.02;
    rim.material.opacity = settled ? 0.75 : 0.35;
    beam.material.uniforms.uBoost.value = settled ? 1.15 : 0.85;
    for (let i = 0; i < dustN; i++) {
      const d = dseed[i], along = (d[0] + time * 0.004 * d[3]) % 1, rad = d[2] * (0.25 + 5.1 * (1 - along)) * 0.92, ang = d[1] + time * 0.05 * d[3];
      tmp.copy(dst).addScaledVector(axis, along * len).addScaledVector(side1, Math.cos(ang) * rad).addScaledVector(side2, Math.sin(ang) * rad);
      dpos[i * 3] = tmp.x; dpos[i * 3 + 1] = tmp.y; dpos[i * 3 + 2] = tmp.z;
    }
    dustGeo.attributes.position.needsUpdate = true;
    const portrait = aspect < 1;
    const vf = (36 * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const dist = Math.max(21, (FW * 0.72) / Math.tan(hf / 2));
    camera.position.set(Math.sin(time * 0.21) * 0.35, (portrait ? 0.2 : 0.9) + Math.sin(time * 0.17) * 0.16, dist);
    camera.lookAt(0, portrait ? -1.2 : -1.6, 0);
    return pos;
  }

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(x, y) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(picks, false)[0];
    return hit ? hit.object.userData.index : -1;
  }

  return {
    scene, camera, update, posAt, pick, slotTime,
    setHover(i) { hover = i; },
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
  };
}
