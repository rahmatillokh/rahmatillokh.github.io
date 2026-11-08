// Every sound in the film is synthesised live with the Web Audio API — no audio files.
// Nothing plays until the viewer asks for sound.
export function createSound(btn) {
  let AC = null, master = null, nb = null, on = false, proj = false, night = null, music = null;
  const rand = (a, b) => a + Math.random() * (b - a);

  function init() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return true; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return false;
    AC = new C();
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5;
    master = AC.createGain(); master.gain.value = 0;
    master.connect(comp); comp.connect(AC.destination);
    const len = AC.sampleRate * 2;
    nb = AC.createBuffer(1, len, AC.sampleRate);
    const ch = nb.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    return true;
  }
  const T = () => AC.currentTime;
  const noise = () => { const s = AC.createBufferSource(); s.buffer = nb; s.loop = true; return s; };
  const osc = (type, f) => { const o = AC.createOscillator(); o.type = type; o.frequency.value = f; return o; };
  const filt = (type, f, q) => { const b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; };
  function env(peak, a, d, t) {
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    return g;
  }
  function out(chain, src, t, dur) {
    for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
    chain[chain.length - 1].connect(master);
    if (src.buffer) src.start(t, Math.random()); else src.start(t);
    src.stop(t + dur);
  }
  function projector() {
    if (proj) return; proj = true;
    const n = noise(), bp = filt("bandpass", 1500, 0.7), g = AC.createGain(), lfo = osc("square", 24), lg = AC.createGain();
    g.gain.value = 0.01; lg.gain.value = 0.007;
    lfo.connect(lg); lg.connect(g.gain); n.connect(bp); bp.connect(g); g.connect(master);
    n.start(); lfo.start();
    const hum = osc("sine", 55), hg = AC.createGain(); hg.gain.value = 0.008; hum.connect(hg); hg.connect(master); hum.start();
  }
  function set(v) {
    if (v && !init()) return;
    on = v;
    if (AC) master.gain.setTargetAtTime(v ? 0.9 : 0, T(), 0.12);
    if (v) projector();
    if (!v) { api.night(false); api.music(false); }
    btn.setAttribute("aria-pressed", v ? "true" : "false");
    btn.setAttribute("aria-label", v ? "Mute sound" : "Turn sound on");
  }

  const api = {
    get on() { return on; },
    set,
    toggle() { set(!on); },
    beep(f = 1000, dur = 0.12, v = 0.22) { if (!on) return; const t = T(), o = osc("sine", f); out([o, env(v, 0.004, dur, t)], o, t, dur + 0.05); },
    key() {
      if (!on) return; const t = T(), n = noise();
      out([n, filt("highpass", 2400 + Math.random() * 1800), env(0.18, 0.001, 0.035, t)], n, t, 0.06);
      const o = osc("square", 160 + Math.random() * 80); out([o, env(0.035, 0.001, 0.02, t)], o, t, 0.04);
    },
    ding() {
      if (!on) return; const t = T(), o = osc("sine", 2350), o2 = osc("sine", 4710);
      out([o, env(0.07, 0.003, 1.3, t)], o, t, 1.4); out([o2, env(0.02, 0.003, 0.8, t)], o2, t, 0.9);
    },
    clack() {
      if (!on) return; const t = T(), n = noise();
      out([n, filt("highpass", 900), env(0.24, 0.001, 0.045, t)], n, t, 0.07);
      const o = osc("square", 115); out([o, filt("lowpass", 600), env(0.1, 0.001, 0.035, t)], o, t, 0.06);
    },
    whoosh(dur = 0.9, down = false) {
      if (!on) return; const t = T(), n = noise(), bp = filt("bandpass", 400, 1.3);
      bp.frequency.setValueAtTime(down ? 3200 : 240, t); bp.frequency.exponentialRampToValueAtTime(down ? 240 : 3600, t + dur);
      out([n, bp, env(0.36, dur * 0.7, dur * 0.3, t)], n, t, dur + 0.1);
    },
    braam() {
      if (!on) return;
      const t = T() + 0.02, sh = AC.createWaveShaper(), curve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) curve[i] = Math.tanh((i / 512 - 1) * 3);
      sh.curve = curve;
      const lp = filt("lowpass", 2400, 4);
      lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(150, t + 3.4);
      const g = AC.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.34, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.4);
      [55, 55.7, 82.6, 110.4].forEach((f) => { const o = osc("sawtooth", f), og = AC.createGain(); og.gain.value = 0.35; o.connect(og); og.connect(sh); o.start(t); o.stop(t + 4.5); });
      sh.connect(lp); lp.connect(g); g.connect(master);
      const sub = osc("sine", 41); out([sub, env(0.55, 0.03, 3.4, t)], sub, t, 3.6);
      const n = noise(); out([n, filt("lowpass", 700), env(0.32, 0.004, 0.7, t)], n, t, 0.8);
    },
    flash() {
      if (!on) return; const t = T(), n = noise();
      out([n, filt("lowpass", 5000), env(0.3, 0.003, 0.5, t)], n, t, 0.6);
      const o = osc("sine", 70); o.frequency.exponentialRampToValueAtTime(30, t + 0.6); out([o, env(0.4, 0.005, 0.6, t)], o, t, 0.7);
    },
    zap(up = true) {
      if (!on) return; const t = T(), o = osc("sawtooth", up ? 60 : 900);
      o.frequency.exponentialRampToValueAtTime(up ? 900 : 50, t + 0.35);
      out([o, filt("lowpass", 2200), env(0.07, 0.01, 0.35, t)], o, t, 0.4);
      const n = noise(); out([n, filt("highpass", 3000), env(0.06, 0.005, 0.25, t)], n, t, 0.3);
    },
    hit() {
      if (!on) return; const t = T(), o = osc("square", 640);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.2);
      out([o, env(0.12, 0.002, 0.2, t)], o, t, 0.26);
      const n = noise(); out([n, filt("lowpass", 1300), env(0.32, 0.002, 0.26, t)], n, t, 0.3);
    },
    miss() { if (!on) return; const t = T(), o = osc("sawtooth", 98); out([o, filt("lowpass", 500), env(0.07, 0.002, 0.09, t)], o, t, 0.12); },
    win() {
      if (!on) return; const t = T();
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => { const o = osc("triangle", f); out([o, env(0.13, 0.005, 0.3, t + i * 0.09)], o, t + i * 0.09, 0.4); });
    },
    pop() { if (!on) return; const t = T(), o = osc("square", 330); o.frequency.exponentialRampToValueAtTime(660, t + 0.08); out([o, filt("lowpass", 1800), env(0.08, 0.004, 0.12, t)], o, t, 0.16); },
    night(v) {
      if (v && !on) return;
      if (v && !night) {
        const w = noise(), lp = filt("lowpass", 420), wg = AC.createGain(), lfo = osc("sine", 0.09), lg = AC.createGain();
        wg.gain.value = 0; wg.gain.setTargetAtTime(0.03, T(), 1.5); lg.gain.value = 0.014;
        lfo.connect(lg); lg.connect(wg.gain); w.connect(lp); lp.connect(wg); wg.connect(master); w.start(); lfo.start();
        const iv = setInterval(() => {
          if (!on || Math.random() < 0.35) return;
          const t = T(), o = osc("sine", rand(4200, 4800)), am = osc("square", 34), ag = AC.createGain(), g = AC.createGain(), cg = AC.createGain();
          ag.gain.value = 0.5; am.connect(ag); ag.connect(g.gain); g.gain.value = 0.5;
          cg.gain.setValueAtTime(0, t); cg.gain.linearRampToValueAtTime(0.028, t + 0.02); cg.gain.linearRampToValueAtTime(0, t + 0.24);
          o.connect(g); g.connect(cg); cg.connect(master); o.start(t); am.start(t); o.stop(t + 0.3); am.stop(t + 0.3);
        }, 650);
        night = { stop() { clearInterval(iv); wg.gain.setTargetAtTime(0, T(), 0.6); setTimeout(() => { try { w.stop(); lfo.stop(); } catch (e) { /* already stopped */ } }, 2500); } };
      } else if (!v && night) { night.stop(); night = null; }
    },
    music(v) {
      if (v && !on) return;
      if (v && !music) {
        const bpm = 96, step = 60 / bpm / 4, chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
        let next = T() + 0.1, i = 0;
        const bus = AC.createGain(); bus.gain.value = 0; bus.gain.setTargetAtTime(1, T(), 1.2); bus.connect(master);
        const dl = AC.createDelay(1), fb = AC.createGain(), wet = AC.createGain();
        dl.delayTime.value = step * 3; fb.gain.value = 0.33; wet.gain.value = 0.45;
        bus.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
        const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
        const timer = setInterval(() => {
          while (next < T() + 0.25) {
            const ch = chords[Math.floor(i / 16) % 4], k = i % 16, m = ch[k % 3] + 12 * (1 + ((k >> 2) % 2));
            const o = osc("sawtooth", mtof(m)), lp = filt("lowpass", 1700, 2), g = env(0.045, 0.005, step * 1.8, next);
            o.connect(lp); lp.connect(g); g.connect(bus); o.start(next); o.stop(next + step * 2.2);
            if (k % 4 === 0) { const b = osc("square", mtof(ch[0] - 12)), bl = filt("lowpass", 380), bg = env(0.075, 0.01, step * 3.4, next); b.connect(bl); bl.connect(bg); bg.connect(bus); b.start(next); b.stop(next + step * 3.8); }
            next += step; i++;
          }
        }, 60);
        music = { stop() { clearInterval(timer); bus.gain.setTargetAtTime(0, T(), 0.5); wet.gain.setTargetAtTime(0, T(), 0.5); } };
      } else if (!v && music) { music.stop(); music = null; }
    },
  };
  btn.addEventListener("click", () => set(!on));
  return api;
}
