# rahmatillokh.github.io

Personal site of Rahmatillokh Dev — founder of [AYS Apps](https://aysapps.uz), maker of
[Typing Me](https://github.com/rahmatillokh/typing-me). Live at **https://rahmatillokh.github.io/**.

A single static page (`index.html`), no build step. Fonts are self-hosted (Orbitron, Rajdhani,
Share Tech Mono — all SIL OFL). Project sites — `/typing-me/` and any future repo with GitHub
Pages enabled — publish from their own repositories and sit under this domain automatically.

The project card images are drawn, not screenshotted: `tools/make_cards.py` describes each scene
in HTML/CSS/SVG and renders it through headless Chrome into `assets/img/cards/`. Add a scene
there for a new project and re-run it (`python3 tools/make_cards.py`; needs Pillow).

To change content, edit `index.html` and push to `main`; GitHub Pages redeploys within a minute.
