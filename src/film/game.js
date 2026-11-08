// Scene 03: the keyboard is the weapon. While the film plays, the director plays (autoplay);
// any letter key — or a tap on a word — hands the keyboard to the viewer.
const LIST = ["hello", "namangan", "unity", "pixel", "dragon", "keyboard", "winter", "season", "combo", "blade", "hero", "level", "synth", "code", "build", "ship", "play", "word", "boss", "type", "night", "studio", "reel", "scene", "film", "neon", "quest", "fire", "magic", "jump"];
const rand = (a, b) => a + Math.random() * (b - a);

export function createGame(sound, el, hooks) {
  const { arena, screen, field, dragon, hpI, hpNum, wpmEl, comboEl, win, winWpm, bubble, promptT, modeT, banner } = el;
  const MAX = 300, DMG = 60;
  let words = [], target = null, hp = MAX, dead = false, chars = 0, t0 = 0, combo = 0;
  let mode = "demo", clock = 0, nextSpawn = 0.4, ghostAt = 0;
  const touch = matchMedia("(hover: none)").matches;

  function render(w) {
    w.el.firstChild.textContent = w.text.slice(0, w.typed);
    w.el.lastChild.textContent = w.text.slice(w.typed);
    w.el.classList.toggle("tgt", w === target);
  }
  function place(w, width) { w.el.style.transform = `translate3d(${(w.x * width + Math.sin(w.ph) * 14).toFixed(1)}px,${w.y.toFixed(1)}px,0) translateX(-50%)`; }
  function spawn() {
    if (words.length >= (innerWidth < 700 ? 2 : 3)) return;
    const firsts = words.map((w) => w.text[0]);
    const pool = LIST.filter((s) => !firsts.includes(s[0]));
    const text = pool[(Math.random() * pool.length) | 0];
    const node = document.createElement("span");
    node.className = "word";
    node.innerHTML = "<b></b><span></span>";
    field.appendChild(node);
    const w = { text, el: node, typed: 0, x: rand(0.12, 0.88), y: -12, v: rand(32, 46) * Math.max(0.7, field.clientHeight / 520), ph: rand(0, 6.28), dead: false };
    node.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (mode === "demo") hooks.takeover(); auto(w); });
    words.push(w); render(w); place(w, field.clientWidth);
  }
  function remove(w) { w.dead = true; const i = words.indexOf(w); if (i >= 0) words.splice(i, 1); if (target === w) target = null; }
  const wpm = () => (t0 ? Math.round(chars / 5 / Math.max((performance.now() - t0) / 60000, 1 / 30)) : 0);
  function stats() { wpmEl.textContent = chars ? wpm() : "—"; comboEl.textContent = combo; }

  function key(k, ghost) {
    if (dead) return;
    if (!ghost && mode !== "user") return;
    if (!ghost && !t0) t0 = performance.now();
    let w = null;
    if (target && !target.dead && target.text[target.typed] === k) w = target;
    else {
      // The keyboard re-routes to the word you meant, just like the game.
      const pre = (target ? target.text.slice(0, target.typed) : "") + k;
      w = words.find((c) => c !== target && c.text.startsWith(pre)) || null;
      if (w) w.typed = pre.length - 1;
      else { w = words.find((c) => c.text[0] === k) || null; if (w) w.typed = 0; }
      if (w && target && target !== w) { const old = target; old.typed = 0; target = w; render(old); }
    }
    if (!w) { combo = 0; stats(); sound.miss(); field.classList.remove("miss"); void field.offsetWidth; field.classList.add("miss"); return; }
    target = w; w.typed++; if (!ghost) chars++; sound.key(); render(w);
    if (w.typed >= w.text.length) { combo++; complete(w); }
    if (!ghost) stats();
  }
  function complete(w) {
    remove(w);
    burst(w.el);
    w.el.classList.add("pop");
    setTimeout(() => w.el.remove(), 340);
    setTimeout(damage, 300);
  }
  function burst(node) {
    const a = screen.getBoundingClientRect(), r = node.getBoundingClientRect(), dr = dragon.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("i");
      p.className = "pix";
      p.style.transform = `translate(${r.left - a.left + rand(0, r.width)}px,${r.top - a.top + r.height / 2}px)`;
      screen.appendChild(p); void p.offsetWidth;
      p.style.transform = `translate(${dr.left - a.left + dr.width * rand(0.3, 0.7)}px,${dr.top - a.top + dr.height * rand(0.3, 0.6)}px) scale(0.4)`;
      p.style.opacity = "0";
      setTimeout(() => p.remove(), 560);
    }
  }
  function damage() {
    if (dead) return;
    hp = Math.max(0, hp - DMG);
    hpI.style.transform = `scaleX(${hp / MAX})`; hpNum.textContent = `${hp} / ${MAX}`;
    dragon.classList.remove("hit"); void dragon.offsetWidth; dragon.classList.add("hit");
    screen.classList.remove("shake"); void screen.offsetWidth; screen.classList.add("shake");
    const a = screen.getBoundingClientRect(), dr = dragon.getBoundingClientRect(), n = document.createElement("p");
    n.className = "dmg"; n.textContent = "−" + DMG;
    n.style.left = dr.left - a.left + dr.width * rand(0.25, 0.65) + "px"; n.style.top = dr.top - a.top + dr.height * 0.25 + "px";
    screen.appendChild(n); setTimeout(() => n.remove(), 1000);
    sound.hit();
    if (hp <= 0) defeat();
  }
  function defeat() {
    dead = true;
    dragon.classList.add("dead");
    words.slice().forEach((w) => { w.el.classList.add("gone"); remove(w); setTimeout(() => w.el.remove(), 320); });
    sound.win();
    if (mode === "user") {
      winWpm.textContent = wpm();
      bubble.textContent = "…rematch?";
      setTimeout(() => win.classList.add("on"), 800);
      hooks.won && hooks.won();
    } else {
      setTimeout(() => banner.classList.add("on"), 700);
    }
  }
  function reset(m = "demo") {
    mode = m; dead = false; hp = MAX; chars = 0; t0 = 0; combo = 0; target = null; clock = 0; nextSpawn = 0.3; ghostAt = 0.9;
    words.slice().forEach((w) => { w.el.remove(); remove(w); });
    field.querySelectorAll(".word").forEach((n) => n.remove());
    dragon.classList.remove("dead", "hit");
    hpI.style.transform = ""; hpNum.textContent = `${MAX} / ${MAX}`;
    win.classList.remove("on"); banner.classList.remove("on");
    arena.classList.toggle("user", m === "user");
    promptT.textContent = m === "user" ? (touch ? "Your turn — tap the falling words" : "Your turn — type the falling words") : (touch ? "Tap a word to take over" : "Press any letter to take over");
    modeT.textContent = m === "user" ? "You are playing" : "Autoplay · director's cut";
    stats();
  }
  function auto(w) {
    if (dead || w.dead) return;
    if (target && target !== w) { const old = target; old.typed = 0; target = w; render(old); }
    target = w;
    const iv = setInterval(() => { if (w.dead || target !== w || dead) { clearInterval(iv); return; } key(w.text[w.typed], false); }, 55);
  }
  // The director types like a person: a beat to read the word, then quick keys.
  function ghost() {
    if (clock < ghostAt) return;
    if (!target || target.dead) {
      const ready = words.filter((w) => w.y > 50).sort((a, b) => b.y - a.y)[0];
      if (!ready) return;
      target = ready; render(ready); ghostAt = clock + rand(0.35, 0.55);
      return;
    }
    key(target.text[target.typed], true);
    ghostAt = clock + (target && !target.dead ? rand(0.08, 0.15) : rand(0.5, 0.8));
  }

  return {
    reset,
    key: (k) => key(k, false),
    get mode() { return mode; },
    tick(dt, run) {
      if (!run) return;
      clock += dt;
      if (!dead && clock > nextSpawn) { spawn(); nextSpawn = clock + rand(1.0, 1.45); }
      const H = field.clientHeight, width = field.clientWidth;
      for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];
        w.y += w.v * dt; w.ph += dt * 1.3; place(w, width);
        if (w.y > H) { const n = w.el; n.classList.add("gone"); setTimeout(() => n.remove(), 320); if (target === w) combo = 0; remove(w); stats(); }
      }
      if (mode === "demo" && !dead) ghost();
    },
  };
}
