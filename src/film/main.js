// The projector. One clock drives a 2½-minute film; the viewer only watches —
// they can pause, jump between scenes, play the game, open a project, or write in.
import { createSound } from "./sound.js";
import { createGL } from "./gl.js";
import { createOpening } from "./opening.js";
import { createStrip } from "./strip.js";
import { createGame } from "./game.js";

const d = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const pad = (n, l = 2) => String(n).padStart(l, "0");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rand = (a, b) => a + Math.random() * (b - a);

d.classList.add("ready");

/* ======================================================= every mode: grain, toast, the script form */
(function grain() {
  try {
    const c = document.createElement("canvas"), n = 128;
    c.width = c.height = n;
    const x = c.getContext("2d"), im = x.createImageData(n, n);
    for (let i = 0; i < im.data.length; i += 4) { const v = (Math.random() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0);
    const url = `url(${c.toDataURL()})`;
    $(".fx-grain").style.backgroundImage = url;
    d.style.setProperty("--grain", url);
  } catch (e) { /* no grain */ }
})();

const toastEl = $("#toast");
let toastT = 0;
function toast(msg, ms = 3200) {
  toastEl.textContent = msg; toastEl.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), ms);
}

const form = $("#script"), who = $("#who"), lines = $("#lines");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = who.value.trim(), msg = lines.value.trim();
  const subject = "A new scene" + (name ? " — from " + name : "");
  const body = (msg || "Hi Rahmatillokh,\n\n") + (name ? "\n\n— " + name : "");
  location.href = "mailto:webcoder292@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  toast("Your script is on its way — your mail app has it.");
});
$("#tg").addEventListener("click", () => {
  const msg = lines.value.trim();
  if (msg && navigator.clipboard) navigator.clipboard.writeText(msg).then(() => toast("Your lines are copied — paste them into Telegram."), () => {});
});

if (d.classList.contains("cine")) film();
else $("#replay").addEventListener("click", () => { scrollTo(0, 0); location.reload(); });

/* ======================================================= the film */
function film() {
  const sound = createSound($("#snd"));
  [who, lines].forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") sound.ding(); else if (e.key.length === 1 || e.key === "Backspace") sound.key(); }));

  const SC = [
    { id: "top", label: "Title", a: 0, b: 13 },
    { id: "city", label: "Namangan", a: 13, b: 46 },
    { id: "weapon", label: "The weapon", a: 46, b: 68 },
    { id: "cast", label: "The cast", a: 68, b: 100 },
    { id: "contact", label: "Your scene", a: 100, b: 120 },
    { id: "credits", label: "Credits", a: 120, b: 152 },
  ];
  const DUR = 152;
  const F = { t: 0, clock: 0, playing: false, ended: false, started: false, seeked: true };
  const touch = matchMedia("(hover: none)").matches;
  if (touch) {
    $(".t-hint").textContent = "Tap the screen to pause · use the bar to jump";
    $(".pausenote").textContent = "Paused · tap ▶ to continue";
    $(".gate-note").textContent = "Sit back — it plays by itself · tap to pause";
  }

  /* ---------- loading the reel ---------- */
  const loadBar = $("#load i"), loadPct = $("#load-pct"), gateBtns = $$(".gate [data-go]");
  let progress = 0, ready = false;
  function setP(p) { progress = Math.max(progress, p); loadBar.style.transform = `scaleX(${progress.toFixed(3)})`; loadPct.textContent = pad(Math.round(progress * 100), 3) + "%"; }
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  let done = 0;
  const step = (x) => { done++; setP((done / 8) * 0.9); return x; };
  const stopGateDust = gateDust();
  const fontsP = Promise.all([document.fonts.load("400 100px Anton"), document.fonts.load("700 20px 'JetBrains Mono'"), document.fonts.load("700 20px Jakarta")]).catch(() => {}).then(step);
  const typeP = fetch("assets/fonts/anton.typeface.json").then((r) => r.json()).then(step);
  const imgPs = ["typing-me", "marketpos", "avtolingo", "edu360", "speedtest"].map((n) => loadImg(`assets/img/cards/${n}.jpg`).then(step));

  let gl, opening, strip, game, FR;
  Promise.all([fontsP, typeP, ...imgPs]).then(([, fontJson, typing, mp, av, ed, sp]) => {
    gl = createGL($("#gl"));
    opening = createOpening(gl, fontJson, typing);
    FR = [
      { title: "AYS Apps", sub: "presents the supporting cast", edge: "AYS ▸ 00 ▸ LEADER", url: "https://aysapps.uz" },
      { img: mp, edge: "AYS ▸ 01 ▸ MARKETPOS ▸ 24", url: "https://marketpos.uz" },
      { img: av, edge: "AYS ▸ 02 ▸ AVTOLINGO ▸ 25", url: "https://avtolingo.uz" },
      { img: ed, edge: "AYS ▸ 03 ▸ EDU360 ▸ 26", url: "https://edu360.uz" },
      { img: sp, edge: "AYS ▸ 04 ▸ SPEED TEST ▸ 27", url: "https://typing-me.aysapps.uz" },
      { title: "aysapps.uz", sub: "Android · iOS · Web · SaaS", edge: "AYS ▸ 05 ▸ TAIL", url: "https://aysapps.uz" },
    ];
    strip = createStrip(gl, FR);
    game = createGame(sound, {
      arena: $("#s-game"), screen: $("#arscreen"), field: $("#field"), dragon: $("#dragon"), hpI: $("#hp"), hpNum: $("#hpnum"),
      wpmEl: $("#wpm"), comboEl: $("#combo"), win: $("#win"), winWpm: $("#win-wpm"), bubble: $("#bubble"),
      promptT: $("#prompt-t"), modeT: $("#mode-t"), banner: $("#banner"),
    }, { takeover, won: () => {} });
    opening.update(0, 0);
    gl.compile(opening.scene, opening.camera);
    strip.update(0, 0, innerWidth / innerHeight);
    gl.compile(strip.scene, strip.camera);
    setP(1);
    ready = true;
    d.classList.add("loaded");
    gateBtns.forEach((b) => (b.disabled = false));
    try { $("#play-sound").focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    requestAnimationFrame(frame);
  }).catch((err) => {
    console.error(err);
    d.classList.remove("cine", "preshow");
    d.classList.add("still");
  });

  /* ---------- the pre-show ---------- */
  function gateDust() {
    const cv = $("#gdust"), g = cv.getContext("2d"), P = [];
    let W = (cv.width = innerWidth), H = (cv.height = innerHeight), run = true;
    for (let i = 0; i < 150; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: rand(0.4, 1.8), vx: rand(-0.06, 0.06), vy: rand(-0.1, 0.03), a: rand(0.15, 0.7) });
    (function draw() {
      if (!run) return;
      requestAnimationFrame(draw);
      g.clearRect(0, 0, W, H);
      for (const p of P) {
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.05; p.y += p.vy;
        if (p.y < -5) p.y = H + 5; if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
        const ang = Math.abs(Math.atan2(p.x - W / 2, p.y + H * 0.06)), inBeam = ang < 0.24 ? 1 - ang / 0.24 : 0;
        g.fillStyle = `rgba(255,236,210,${(p.a * (0.18 + inBeam * 0.82)).toFixed(3)})`;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
      }
    })();
    return () => { run = false; };
  }
  function leader(done) {
    const cv = $("#leader"), q = Math.min(devicePixelRatio || 1, 1.5), W = innerWidth, H = innerHeight, g = cv.getContext("2d");
    cv.width = Math.round(W * q); cv.height = Math.round(H * q); g.setTransform(q, 0, 0, q, 0, 0);
    d.classList.add("leading");
    const nums = [5, 4, 3, 2], per = 560, start = performance.now();
    let lastN = -1;
    (function draw() {
      const t = performance.now() - start, idx = Math.floor(t / per);
      if (idx >= nums.length) {
        g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
        if (t > per * nums.length + 380) { done(); return; }
        requestAnimationFrame(draw); return;
      }
      requestAnimationFrame(draw);
      const u = (t % per) / per, n = nums[idx], cx = W / 2 + rand(-1.2, 1.2), cy = H / 2 + rand(-1.2, 1.2), R = Math.min(W, H) * 0.34;
      if (idx !== lastN) { lastN = idx; if (n === 2) sound.beep(1000, 0.12, 0.25); else sound.clack(); }
      g.fillStyle = "#1c1a17"; g.fillRect(0, 0, W, H);
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, Math.max(W, H), -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2); g.closePath();
      g.fillStyle = "#34312c"; g.fill();
      g.strokeStyle = "rgba(242,236,226,0.8)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, cy); g.lineTo(W, cy); g.moveTo(cx, 0); g.lineTo(cx, H); g.stroke();
      g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(cx, cy, R * 0.84, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "#f2ece2"; g.font = `800 ${Math.round(R * 1.2)}px Jakarta, system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(n), cx, cy + R * 0.06);
      for (let i = 0; i < 6; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.55)"; g.fillRect(Math.random() * W, Math.random() * H, rand(1, 3), rand(1, 3)); }
      if (Math.random() < 0.5) { g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(Math.random() * W, 0, 1, H); }
      const vg = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, Math.max(W, H) * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.7)");
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    })();
  }
  const hashTime = () => {
    const h = location.hash.replace("#", "");
    const s = SC.find((x) => x.id === h);
    return s ? s.a + (s.id === "top" ? 0 : 0.2) : 0;
  };
  function begin(withSound, skipLeader) {
    if (F.started || !ready) return;
    F.started = true;
    sound.set(!!withSound);
    d.classList.add("rolling");
    let seen = false;
    try { seen = sessionStorage.getItem("film-seen") === "1"; } catch (e) { /* private mode */ }
    const go = () => {
      stopGateDust();
      d.classList.remove("preshow", "rolling", "leading");
      try { sessionStorage.setItem("film-seen", "1"); } catch (e) { /* private mode */ }
      seek(hashTime());
      play(true);
      poke();
    };
    if (skipLeader || seen) setTimeout(go, 650);
    else setTimeout(() => leader(go), 450);
  }
  $("#play-sound").addEventListener("click", () => begin(true));
  $("#play-muted").addEventListener("click", () => begin(false));
  $("#gate-skip").addEventListener("click", () => begin(false, true));

  /* ---------- transport ---------- */
  const ppBtn = $("#pp"), big = $("#bigicon");
  function syncPP() {
    const s = F.ended ? "replay" : F.playing ? "pause" : "play";
    ppBtn.dataset.state = s;
    ppBtn.setAttribute("aria-label", s === "pause" ? "Pause" : s === "replay" ? "Watch again" : "Play");
    d.classList.toggle("paused", !F.playing && F.started);
  }
  function bigIcon(kind) { big.dataset.kind = kind; big.classList.remove("show"); void big.offsetWidth; big.classList.add("show"); }
  function play(silent) {
    if (F.ended || F.t >= DUR) { seek(0); }
    F.playing = true; F.ended = false; syncPP();
    if (!silent) bigIcon("play");
    poke();
  }
  function pause(silent) {
    if (!F.playing) return;
    F.playing = false; syncPP();
    if (!silent) bigIcon("pause");
    d.classList.remove("idle");
  }
  function toggle() { if (!F.started) return; if (F.playing) pause(); else play(); }
  function seek(t) { F.t = clamp(t, 0, DUR); F.seeked = true; F.ended = false; syncPP(); }
  function end() { F.playing = false; F.ended = true; syncPP(); d.classList.remove("idle"); }
  ppBtn.addEventListener("click", () => { if (F.ended) { seek(0); play(); } else toggle(); });
  $("#fs").addEventListener("click", fullscreen);
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (d.requestFullscreen) d.requestFullscreen().catch(() => {});
  }

  /* ---------- the player bar ---------- */
  const track = $("#track"), tcEl = $("#tc"), nowEl = $("#now");
  track.innerHTML = SC.map((s, i) => `<button type="button" style="--w:${s.b - s.a}" aria-label="Scene ${i + 1}: ${s.label}"><i></i><span>${pad(i + 1)} ${s.label}</span></button>`).join("");
  const chBtns = $$("button", track);
  chBtns.forEach((b, i) => b.addEventListener("click", (e) => {
    const r = b.getBoundingClientRect(), f = e.detail ? clamp((e.clientX - r.left) / r.width, 0, 1) : 0;
    seek(SC[i].a + f * (SC[i].b - SC[i].a));
    if (!F.playing) play(true);
  }));
  const fmt = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
  let curCh = -1, lastSec = -1;
  function player(t) {
    let k = 0;
    SC.forEach((s, i) => { if (t >= s.a) k = i; });
    chBtns.forEach((b, i) => b.style.setProperty("--f", seg(t, SC[i].a, SC[i].b).toFixed(4)));
    if (k !== curCh) { chBtns[curCh]?.classList.remove("on"); chBtns[k].classList.add("on"); curCh = k; nowEl.textContent = `${pad(k + 1)} · ${SC[k].label}`; }
    const sec = Math.floor(t);
    if (sec !== lastSec) { lastSec = sec; tcEl.textContent = `${fmt(t)} / ${fmt(DUR)}`; }
  }

  /* ---------- idle: a real player hides its controls ---------- */
  let idleT = 0;
  function poke() {
    d.classList.remove("idle");
    clearTimeout(idleT);
    idleT = setTimeout(() => { if (F.playing && !d.classList.contains("preshow") && !document.activeElement?.closest?.(".player")) d.classList.add("idle"); }, 2800);
  }
  ["pointermove", "pointerdown", "keydown", "touchstart"].forEach((ev) => addEventListener(ev, poke, { passive: true }));

  /* ---------- no scrolling, ever: the film moves, the page doesn't ---------- */
  let nudgeAt = 0;
  function nudge() {
    if (d.classList.contains("preshow")) return;
    const n = performance.now();
    if (n - nudgeAt < 5000) return;
    nudgeAt = n;
    toast(touch ? "It plays by itself — tap the screen to pause." : "It plays by itself — Space pauses · ← → jump between moments.");
  }
  addEventListener("wheel", (e) => { if (e.ctrlKey) return; e.preventDefault(); nudge(); }, { passive: false });
  addEventListener("touchmove", (e) => { if (e.target.closest?.("textarea")) return; e.preventDefault(); nudge(); }, { passive: false });
  addEventListener("scroll", () => { if (scrollY || scrollX) scrollTo(0, 0); });

  addEventListener("keydown", (e) => {
    if (d.classList.contains("preshow")) return;
    const tg = e.target;
    if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if ((k === " " || k === "Enter") && tg?.closest?.("button, a")) return;
    if (k === " " || k === "Spacebar") { e.preventDefault(); toggle(); return; }
    if (k === "ArrowLeft") { e.preventDefault(); seek(F.t - 5); return; }
    if (k === "ArrowRight") { e.preventDefault(); seek(F.t + 5); return; }
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(k)) { e.preventDefault(); nudge(); return; }
    if (gameLive() && /^[a-zA-Z]$/.test(k)) { if (game.mode !== "user") takeover(); game.key(k.toLowerCase()); return; }
    const kl = k.toLowerCase();
    if (kl === "k") toggle();
    else if (kl === "m") sound.toggle();
    else if (kl === "f") fullscreen();
    else if (kl === "j") seek(F.t - 10);
    else if (kl === "l") seek(F.t + 10);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(true); });
  $$('a[href^="http"], a[href^="mailto"]').forEach((a) => {
    if (a.href.startsWith("http")) { a.target = "_blank"; a.rel = "noopener"; }
    a.addEventListener("click", () => pause(true));
  });
  [who, lines].forEach((el) => el.addEventListener("focus", () => { if (F.playing) { pause(true); toast("Paused — take your time. ▶ or Space (outside the page) resumes."); } }));

  /* ---------- scene layers ---------- */
  const L = { open: $("#top"), game: $("#weapon"), cast: $("#cast"), contact: $("#contact"), credits: $("#credits") };
  function show(el, on, opacity) {
    if (el._on !== on) { el._on = on; el.classList.toggle("on", on); if (on) el.removeAttribute("inert"); else el.setAttribute("inert", ""); }
    if (on && opacity != null) op(el, opacity);
  }
  function op(el, v) { const s = v.toFixed(3); if (el._op !== s) { el._op = s; el.style.opacity = s; } }
  Object.values(L).forEach((el) => show(el, false));

  // Scene 01–02 overlays
  const tl = $("#tlayer"), presents = $(".t-presents"), tag = $(".t-tag"), logline = $(".t-logline"), billing = $(".t-billing"), hint = $(".t-hint");
  const slug = $("#slug"), subs = $$(".sub"), flash1 = $("#flash1");
  const SLUG1 = "EXT. NAMANGAN, UZBEKISTAN — NIGHT", SLUG2 = "INT. AYS APPS STUDIO — CONTINUOUS";
  let slugText = "";
  function upOpen(t) {
    const on = t < 46.4;
    show(L.open, on, 1);
    if (!on) return;
    const box = opening.titleBox();
    tl.style.setProperty("--tt", box.top.toFixed(1) + "px");
    tl.style.setProperty("--tb", box.bottom.toFixed(1) + "px");
    const out = 1 - seg(t, 7.9, 9.0);
    op(presents, seg(t, 0.3, 1.5) * out);
    op(tag, seg(t, 3.0, 4.0) * out);
    op(logline, seg(t, 3.5, 4.5) * out);
    op(billing, seg(t, 4.1, 5.3) * out);
    op(hint, seg(t, 5.2, 6.0) * (1 - seg(t, 7.5, 8.3)));
    L.open.classList.toggle("boxed", t > 13.6 && t < 43.2);
    let s = "", typing = false;
    if (t >= 15) {
      const [line, a] = t < 41.4 ? [SLUG1, 15] : [SLUG2, 41.4];
      const n = Math.min(line.length, Math.floor((t - a) * 26));
      s = line.slice(0, n); typing = t - a < line.length / 26 + 0.8;
    }
    if (s !== slugText) { if (F.playing && s.length > slugText.length && s.length % 2 === 0) sound.key(); slugText = s; slug.textContent = s; }
    slug.classList.toggle("typing", typing && s.length > 0);
    op(slug, 1 - seg(t, 44.6, 45.2));
    subs.forEach((el, i) => { const a = 17 + i * 4, b = a + 4; op(el, Math.min(seg(t, a, a + 0.35), 1 - seg(t, b - 0.35, b))); });
    op(flash1, seg(t, 45.0, 45.6));
  }

  // Scene 03
  const arena = $("#s-game"), arscreen = $("#arscreen"), arglow = $("#arglow"), flash2 = $("#flash2");
  let gameOn = false;
  const gameLive = () => gameOn && F.t > 46.8 && F.t < 65.9;
  function takeover() {
    if (!game || game.mode === "user") return;
    game.reset("user");
    pause(true);
    toast("You have the keyboard. Beat the dragon — Space or ▶ resumes the film.", 4200);
  }
  $("#continue").addEventListener("click", () => play());
  $("#rematch").addEventListener("click", () => game.reset("user"));
  arena.addEventListener("click", (e) => { if (!e.target.closest("a, button, .word")) toggle(); });
  function upGame(t, dt, seeked) {
    const g = t - 45.6, on = g >= 0 && t < 67.7;
    show(L.game, on, 1);
    if (!on) { gameOn = false; return; }
    if (!gameOn || (seeked && game.mode !== "user")) { gameOn = true; game.reset("demo"); }
    op(flash2, 1 - seg(g, 0, 0.4));
    const pon = ease(seg(g, 0.4, 0.95)), off1 = seg(g, 20.4, 20.9), off2 = seg(g, 20.9, 21.4);
    const sy = Math.max(0.004, pon) * (1 - ease(off1) * 0.996), sx = Math.max(0.002, 1 - ease(off2));
    arscreen.style.transform = `scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    op(arglow, Math.max(1 - pon, off1));
    arena.classList.toggle("slammed", g > 0.95);
    const live = g > 1.2 && g < 20.3;
    game.tick(dt, live && (F.playing || game.mode === "user"));
  }

  // Scene 04
  const infos = $$("#castinfo .ci"), chips = $$("#chips button");
  let curInfo = -1;
  chips.forEach((c) => c.addEventListener("click", () => { seek(68 + strip.slotTime(+c.dataset.k)); pause(true); toast("Paused on " + c.textContent.trim() + " — open it, or ▶ to carry on."); }));
  function upCast(t) {
    const on = t > 67.4 && t < 100.6;
    show(L.cast, on, Math.min(seg(t, 67.8, 68.8), 1 - seg(t, 99.6, 100.5)));
    if (!on) return;
    const k = Math.round(strip.posAt(t - 68));
    if (k !== curInfo) {
      infos[curInfo]?.classList.remove("on"); infos[k].classList.add("on");
      chips.forEach((c) => c.classList.toggle("on", +c.dataset.k === k));
      curInfo = k;
    }
  }

  // Scene 05
  const page = $("#script"), tws = $$("[data-tw]", page), callout = $("#callout");
  tws.forEach((el) => {
    const t = el.textContent; el._t = t;
    el.innerHTML = `<span class="sr-only">${esc(t)}</span><span class="twv" aria-hidden="true"><span class="on"></span><span class="off">${esc(t)}</span></span>`;
    el._onEl = el.querySelector(".on"); el._offEl = el.querySelector(".off"); el._n = -1;
  });
  const TOT = tws.reduce((a, el) => a + el._t.length, 0);
  let lastChars = -1;
  function upContact(t) {
    const on = t > 99.5 && t < 120.5;
    show(L.contact, on, Math.min(seg(t, 99.5, 100.3), 1 - seg(t, 119.7, 120.5)));
    if (!on) return;
    const k = t - 100;
    page.classList.toggle("in", k > 0.05);
    const chars = Math.floor(clamp((k - 1.3) * 80, 0, TOT));
    if (chars !== lastChars) {
      if (F.playing && chars > lastChars && Math.floor(chars / 3) !== Math.floor(lastChars / 3)) sound.key();
      lastChars = chars;
      let rem = chars;
      tws.forEach((el) => {
        const len = el._t.length, n = clamp(rem, 0, len);
        rem -= len;
        if (el._n !== n) { el._n = n; el._onEl.textContent = el._t.slice(0, n); el._offEl.textContent = el._t.slice(n); }
        el.classList.toggle("typing", n > 0 && n < len);
      });
    }
    callout.classList.toggle("on", k > 5.5 && k < 19.4);
  }

  // Scene 06
  const roll = $("#roll"), post = $("#post");
  let rollH = 0;
  $("#replay").addEventListener("click", () => { seek(0); play(); });
  L.credits.addEventListener("click", (e) => { if (!e.target.closest("a, button")) toggle(); });
  function upCredits(t) {
    const on = t > 119.5;
    show(L.credits, on, seg(t, 119.5, 120.4));
    if (!on) return;
    if (!rollH) rollH = roll.offsetHeight;
    const r = t - 120;
    roll.style.transform = `translate3d(0,${lerp(innerHeight, -rollH, seg(r, 0.3, 25.6)).toFixed(1)}px,0)`;
    post.classList.toggle("on", r > 26.2);
  }

  /* ---------- the canvas: click to pause, click a frame to open it ---------- */
  const canvas = $("#gl");
  const inCast = () => F.t > 67.4 && F.t < 100.6;
  canvas.addEventListener("click", (e) => {
    if (inCast()) {
      const k = strip.pick(e.clientX, e.clientY);
      if (k >= 0 && FR[k].url) { pause(true); window.open(FR[k].url, "_blank", "noopener"); return; }
    }
    toggle();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!inCast() || touch) return;
    const k = strip.pick(e.clientX, e.clientY);
    strip.setHover(k);
    canvas.style.cursor = k >= 0 && FR[k].url ? "pointer" : "";
  });

  /* ---------- dust & scratches on the print ---------- */
  const dustCv = $("#dust"), dg = dustCv.getContext("2d");
  let lastDust = 0, scratch = null;
  function dust(now) {
    if (now - lastDust < 80) return;
    lastDust = now;
    const W = dustCv.width, H = dustCv.height;
    dg.clearRect(0, 0, W, H);
    if (Math.random() < 0.55) for (let i = 0, n = 1 + ((Math.random() * 3) | 0); i < n; i++) {
      const x = Math.random() * W, y = Math.random() * H, r = 0.6 + Math.random() * 2.2;
      dg.fillStyle = Math.random() < 0.6 ? "rgba(255,250,240,0.5)" : "rgba(0,0,0,0.55)";
      dg.beginPath(); dg.ellipse(x, y, r, r * (0.4 + Math.random()), Math.random() * 3, 0, Math.PI * 2); dg.fill();
    }
    if (scratch) {
      dg.strokeStyle = `rgba(255,250,240,${scratch.a})`; dg.lineWidth = 0.8;
      dg.beginPath(); dg.moveTo(scratch.x, 0);
      for (let y = 0; y <= H; y += 40) dg.lineTo(scratch.x + Math.sin(y * 0.01 + now * 0.001) * 2 + Math.random() * 0.6, y);
      dg.stroke();
      scratch.x += rand(-1.5, 1.5);
      if (--scratch.life <= 0) scratch = null;
    } else if (Math.random() < 0.03) scratch = { x: Math.random() * W, life: 3 + ((Math.random() * 10) | 0), a: rand(0.05, 0.16).toFixed(2) };
  }
  function sizeDust() { dustCv.width = innerWidth; dustCv.height = innerHeight; }
  sizeDust();

  /* ---------- sound cues on the timeline ---------- */
  const CUES = [
    [0.5, () => sound.braam()],
    [9.3, () => sound.whoosh(2.1)],
    [41.4, () => sound.whoosh(1.7)],
    [44.9, () => sound.whoosh(0.7)],
    [45.55, () => sound.flash()],
    [46.0, () => sound.zap(true)],
    [66.0, () => sound.zap(false)],
    ...[1, 2, 3, 4, 5].map((k) => [68 + 1.5 + k * 5, () => sound.clack()]),
    [146.3, () => sound.pop()],
  ];
  const cues = (a, b) => CUES.forEach(([t, fn]) => { if (t > a && t <= b) fn(); });

  /* ---------- resize ---------- */
  let rT = 0;
  addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      if (!gl) return;
      gl.size(); opening.resize(innerWidth / innerHeight); strip.resize(innerWidth / innerHeight);
      rollH = roll.offsetHeight; sizeDust();
    }, 150);
  });

  /* ---------- the projector loop ---------- */
  let last = performance.now(), glOn = false, cueOn = false, pausedFrame = 0;
  const cueEl = $("#cue");
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (F.playing) {
      const nt = Math.min(DUR, F.t + dt);
      cues(F.t, nt);
      F.t = nt; F.clock += dt;
      if (F.t >= DUR) end();
    }
    const t = F.t, seeked = F.seeked, aspect = innerWidth / innerHeight;
    F.seeked = false;
    let gv = false;
    pausedFrame = F.playing || seeked ? 0 : pausedFrame + 1;
    const draw = pausedFrame < 3 || pausedFrame % 4 === 0;
    if (t < 46.4) {
      opening.update(t, F.clock);
      if (draw) gl.render(opening.scene, opening.camera, { time: now / 1000, fade: 1 - seg(t, 0, 0.7) });
      gv = true;
    } else if (t > 67.4 && t < 100.6) {
      const c = t - 68;
      strip.update(c, F.clock, aspect);
      if (draw) gl.render(strip.scene, strip.camera, { time: now / 1000, fade: Math.max(1 - seg(c, -0.5, 0.8), seg(c, 31.5, 32.5)), bloom: 0.32 });
      gv = true;
    }
    if (gv !== glOn) { glOn = gv; canvas.classList.toggle("on", gv); }
    upOpen(t); upGame(t, dt, seeked); upCast(t); upContact(t); upCredits(t);
    player(t);
    dust(now);
    const cue = SC.some((s) => s.id !== "credits" && ((t > s.b - 2.4 && t < s.b - 2.0) || (t > s.b - 1.0 && t < s.b - 0.6)));
    if (cue !== cueOn) { cueOn = cue; cueEl.classList.toggle("on", cue); }
    sound.night(F.playing && t > 13.6 && t < 43.2);
    sound.music(F.playing && t > 120 && t < 151.5);
  }

  syncPP();
  window.__film = { seek, play, pause, get t() { return F.t; }, get playing() { return F.playing; }, begin, get game() { return game; } };
}
