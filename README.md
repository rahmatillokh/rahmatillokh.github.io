# rahmatillokh.github.io

Personal site of Rahmatillokh Dev — founder of [AYS Apps](https://aysapps.uz), maker of
[Typing Me](https://github.com/rahmatillokh/typing-me). Live at **https://rahmatillokh.github.io/**.

## The idea: the website is a film

Press play and it runs by itself — a 2½-minute film in six scenes. The page never scrolls; the
viewer only watches. They can pause at any moment (Space, a click on the picture, or ▶), jump
between scenes on the player bar (← → skip 5 s), open a project, play the game, or write in.

1. **Pre-show** — a dark cinema, a projector beam with dust in it, *Play with sound* / *watch it
   muted*. A classic 5-4-3-2 countdown leader runs once per tab session.
2. **Title (3D)** — RAHMATILLOKH as extruded letters (cream faces, red metal sides) on a dark
   plate with the O's counter cut out of it, so the city is visible only through the O. The
   camera flies *through* the O.
3. **Namangan at night (3D)** — a procedural city (instanced buildings with shader-drawn windows,
   Fergana-valley ridges, a mosque, poplars, street lamps, moon, stars, fog, bloom), sluglines and
   subtitles. The camera pushes into one lit window, past the person at the desk, into the monitor.
4. **The keyboard is the weapon** — the game plays itself ("director's cut"); any letter or a tap
   on a word hands the keyboard to the viewer, pauses the film, and reports their WPM.
5. **The supporting cast (3D)** — the apps on a 35 mm strip that snakes through a projector beam;
   frames are colour negatives until they stop in the gate. Click a frame or a chip to pause on it.
6. **Your scene** — a screenplay page that types itself in; focusing it pauses the film. *Send the
   script* opens an email with the viewer's lines; *Open Telegram* copies them first.
7. **End credits** — a real roll with a synthwave score, then a post-credits scene.

All sound is synthesised live with the Web Audio API — no audio files — and only plays after the
viewer asks for it. Film grain, dust, scratches, flicker and reel-change cue marks sit on top.

Reduced-motion users, browsers without WebGL 2, and no-JavaScript visitors get a calm, readable,
scrollable page with the same content.

## Building

The 3D runs on three.js, bundled with the film code into one file:

```sh
npm install
npm run build        # src/film/*.js  →  assets/js/film.js
```

`assets/js/film.js` is committed, so GitHub Pages needs no build. Re-run the build after editing
anything in `src/film/`. Copy and layout live in `index.html`.

| File | What it does |
| --- | --- |
| `src/film/main.js` | the clock, scene layers, player bar, pausing, scroll lock, pre-show |
| `src/film/opening.js` | 3D title, the flight through the O, the city, the studio room |
| `src/film/strip.js` | 3D film strip, projector beam and gate |
| `src/film/game.js` | the typing game with autoplay and take-over |
| `src/film/sound.js` | every sound effect and the credits music |
| `src/film/gl.js` | renderer, bloom, tone mapping, lens pass |

`assets/fonts/anton.typeface.json` (the 3D title font) is made from Anton with
`node tools/make-typeface.mjs path/to/Anton-Regular.ttf`.

## Assets

Fonts are self-hosted and subset to Latin (`assets/fonts/*.woff2`, all SIL OFL): Anton, Plus
Jakarta Sans, JetBrains Mono, Courier Prime, Kaushan Script. Orbitron, Rajdhani and Share Tech Mono
stay for the card renderer below.

The project card images are drawn, not screenshotted: `tools/make_cards.py` describes each scene
in HTML/CSS/SVG and renders it through headless Chrome into `assets/img/cards/`. Add a scene
there for a new project and re-run it (`python3 tools/make_cards.py`; needs Pillow). The dragon
in the game is cropped from `typing-me.jpg` with CSS.

Project sites — `/typing-me/` and any future repo with GitHub Pages enabled — publish from their
own repositories and sit under this domain automatically.
