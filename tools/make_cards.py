"""Renders the project card illustrations.

Each card is a small HTML/CSS/SVG scene in the site's own palette and fonts, rendered by
headless Chrome at 2× into assets/img/cards/. No screenshots — every image is drawn.
Run from the repo root:  python3 tools/make_cards.py
"""
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = f"file://{ROOT}/assets/fonts"
OUT = f"{ROOT}/assets/img/cards"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DRAGON = "file:///Users/imac/Developer/typer/Assets/Art/Bosses/S-ajdar.png"

BASE_CSS = f"""
@font-face {{ font-family: "Orbitron"; src: url("{FONTS}/Orbitron-Variable.ttf"); font-weight: 400 900; }}
@font-face {{ font-family: "Rajdhani"; src: url("{FONTS}/Rajdhani-SemiBold.ttf"); }}
@font-face {{ font-family: "Mono"; src: url("{FONTS}/ShareTechMono-Regular.ttf"); }}
html, body {{ margin: 0; background: #0b0f18; }}
.card {{
  position: relative; width: W px; height: H px; overflow: hidden;
  font-family: "Rajdhani", sans-serif; color: #e8faff;
  background:
    radial-gradient(ellipse 55% 75% at GLOWX GLOWY, GLOW, transparent 65%),
    repeating-linear-gradient(0deg, rgba(122,140,166,.075) 0 1px, transparent 1px 48px),
    repeating-linear-gradient(90deg, rgba(122,140,166,.075) 0 1px, transparent 1px 48px),
    linear-gradient(#0f1626, #05070c);
}}
.chip {{
  position: absolute; padding: 9px 15px; border-radius: 9px;
  font-family: "Mono", monospace; font-size: 16px; letter-spacing: .12em; text-transform: uppercase;
  color: #c6d3e2; background: rgba(5,7,12,.72); border: 1px solid #263048;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
}}
.chip.on {{ color: ACCENT; border-color: ACCENT; box-shadow: 0 0 22px GLOW; }}
.plate {{
  position: absolute; border-radius: 18px; background: linear-gradient(#151c2d, #0d1220);
  border: 1px solid #263048; border-bottom-width: 4px; box-shadow: 0 18px 40px rgba(0,0,0,.45);
}}
.mono {{ font-family: "Mono", monospace; }}
.disp {{ font-family: "Orbitron", sans-serif; font-weight: 800; }}
"""


def html(body: str, w: int, h: int, accent: str, glow: str, glow_at=("76%", "55%")) -> str:
    css = (BASE_CSS.replace("W px", f"{w}px").replace("H px", f"{h}px")
           .replace("GLOWX", glow_at[0]).replace("GLOWY", glow_at[1])
           .replace("GLOW", glow).replace("ACCENT", accent))
    return f"<!doctype html><meta charset='utf-8'><style>{css}</style><div class='card'>{body}</div>"


# ---------------------------------------------------------------- Typing Me (the game)
def game() -> str:
    keys = "".join(
        f"<div style='position:absolute;left:{330 + i * 74}px;top:498px;width:64px;height:64px;"
        f"border-radius:12px;border:1px solid {'#3bff9e' if k == 'G' else '#1e2a3c'};"
        f"background:{'#3bff9e' if k == 'G' else 'rgba(11,15,24,.9)'};"
        f"color:{'#052b18' if k == 'G' else '#7a8ca6'};font-family:Rajdhani;font-size:26px;"
        f"display:grid;place-items:center;{'box-shadow:0 0 26px rgba(59,255,158,.6);' if k == 'G' else ''}'>{k}</div>"
        for i, k in enumerate("QWERTYUIOP"))
    return f"""
    <div style="position:absolute;left:0;top:0;width:100%;height:100%;
         background:repeating-linear-gradient(0deg, rgba(59,255,158,.06) 0 1px, transparent 1px 3px)"></div>
    <div style="position:absolute;left:470px;top:34px;width:460px;height:10px;border-radius:5px;background:rgba(255,255,255,.1)">
      <div style="width:58%;height:100%;border-radius:5px;background:#ff3860;box-shadow:0 0 18px #ff3860"></div>
    </div>
    <div class="mono" style="position:absolute;left:470px;top:52px;width:460px;text-align:center;font-size:18px;letter-spacing:.1em;color:#c6d3e2">HP 165 / 285</div>
    <div style="position:absolute;left:1010px;top:70px;width:300px;height:44px;border-radius:50%;background:rgba(242,180,55,.35);filter:blur(28px)"></div>
    <img src="{DRAGON}" style="position:absolute;left:1040px;top:10px;width:260px;height:260px;image-rendering:pixelated">
    <div style="position:absolute;left:1142px;top:252px;width:56px;height:56px;border-radius:50%;background:#f2b437;display:grid;place-items:center">
      <div class="disp" style="width:46px;height:46px;border-radius:50%;background:#05070c;color:#f2b437;font-size:24px;display:grid;place-items:center">N</div>
    </div>
    <div class="mono" style="position:absolute;left:250px;top:170px;font-size:72px;letter-spacing:.02em;text-shadow:0 0 22px rgba(0,255,242,.35)">
      <span style="color:#3bff9e">dra</span><span style="color:#ff6ec7;font-weight:700">g</span><span style="color:#e8faff">on</span></div>
    <div class="mono" style="position:absolute;left:700px;top:300px;font-size:54px;color:#e8faff;text-shadow:0 0 16px rgba(232,250,255,.25)">blade</div>
    <div class="mono" style="position:absolute;left:430px;top:390px;font-size:48px;color:#e8faff;opacity:.85">hero</div>
    <div style="position:absolute;left:120px;top:478px;width:1160px;height:2px;background:rgba(59,255,158,.45)"></div>
    {keys}
    <div class="chip on" style="left:64px;top:44px">Season 4 · Winter</div>
    <div class="chip" style="left:64px;top:96px">Rank S · The Dragon</div>
    """


# ---------------------------------------------------------------- MarketPOS
def marketpos() -> str:
    bars = "".join(
        f"<div style='position:absolute;left:{28 + i * 46}px;bottom:26px;width:34px;height:{h}px;"
        f"border-radius:6px 6px 2px 2px;background:linear-gradient(#8b7cff,#5b4fd6)'></div>"
        for i, h in enumerate([64, 92, 70, 118, 96, 140, 112]))
    tiles = "".join(
        f"<div style='position:absolute;left:{28 + i * 118}px;top:26px;width:104px;height:70px;border-radius:10px;"
        f"background:{bg};padding:10px 12px;box-sizing:border-box'>"
        f"<div class='mono' style='font-size:11px;letter-spacing:.1em;color:rgba(232,250,255,.6)'>{lab}</div>"
        f"<div class='disp' style='font-size:22px;margin-top:6px'>{val}</div></div>"
        for i, (lab, val, bg) in enumerate([("PRODUCTS", "1,842", "#1e3a4a"), ("ORDERS", "284", "#3a2a1e"), ("CLIENTS", "637", "#3d1f3a")]))
    lines = "".join(
        f"<div style='position:absolute;left:24px;top:{88 + i * 30}px;width:{w}px;height:8px;border-radius:4px;background:#2a3245'></div>"
        f"<div style='position:absolute;right:24px;top:{88 + i * 30}px;width:46px;height:8px;border-radius:4px;background:#2a3245'></div>"
        for i, w in enumerate([120, 96, 132, 84, 110]))
    barcode = "".join(
        f"<div style='position:absolute;left:{28 + i * 7}px;bottom:26px;width:{w}px;height:34px;background:#1a2030'></div>"
        for i, w in enumerate([3, 2, 4, 2, 3, 5, 2, 3, 2, 4, 3, 2, 5, 2, 3, 4, 2, 3, 2, 4, 3, 2, 3, 5, 2, 3, 2, 4]))
    return f"""
    <div class="plate" style="left:80px;top:96px;width:400px;height:300px">
      {tiles}
      <div style="position:absolute;left:0;top:0;width:100%;height:100%">{bars}</div>
    </div>
    <div style="position:absolute;left:150px;top:396px;width:260px;height:14px;border-radius:0 0 12px 12px;background:#0a0e18;border:1px solid #263048;border-top:0"></div>
    <div style="position:absolute;left:250px;top:410px;width:60px;height:26px;background:#141b2b;border:1px solid #263048;border-top:0;border-radius:0 0 8px 8px"></div>
    <div style="position:absolute;left:760px;top:60px;width:260px;height:400px;background:#e9edf3;border-radius:6px;transform:rotate(6deg);box-shadow:0 24px 48px rgba(0,0,0,.5);
         -webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 14px) no-repeat, radial-gradient(circle 8px at 8px 100%, transparent 8px, #000 9px) bottom/16px 16px repeat-x">
      <div class="mono" style="position:absolute;left:24px;top:24px;font-size:16px;letter-spacing:.14em;color:#1a2030">MARKETPOS · #04812</div>
      <div style="position:absolute;left:24px;top:52px;width:212px;height:2px;background:#1a2030;opacity:.2"></div>
      {lines}
      <div style="position:absolute;left:24px;top:248px;width:212px;height:2px;background:#1a2030;opacity:.2"></div>
      <div class="mono" style="position:absolute;left:24px;top:262px;font-size:14px;letter-spacing:.14em;color:#5b6577">TOTAL</div>
      <div class="disp" style="position:absolute;right:24px;top:256px;font-size:26px;color:#1a2030">248 000</div>
      {barcode}
    </div>
    <div class="chip on" style="left:80px;top:440px">Multi-warehouse</div>
    <div class="chip" style="left:318px;top:440px">Offline mode</div>
    <div class="chip" style="left:520px;top:440px">Telegram alerts</div>
    """


# ---------------------------------------------------------------- Avtolingo
def avtolingo() -> str:
    hearts = "".join(
        f"<span style='color:{'#ff5a4e' if i < 2 else '#3a2a30'};font-size:22px;margin-right:6px'>&#9829;</span>" for i in range(3))
    return f"""
    <svg style="position:absolute;left:0;top:0" width="1200" height="525" viewBox="0 0 1200 525">
      <defs>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#151b2a"/><stop offset="1" stop-color="#232c40"/>
        </linearGradient>
        <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff5a4e" stop-opacity=".0"/><stop offset="1" stop-color="#ff5a4e" stop-opacity=".18"/>
        </linearGradient>
      </defs>
      <rect x="0" y="230" width="1200" height="60" fill="url(#horizon)"/>
      <path d="M 520 290 L 680 290 L 1040 525 L 160 525 Z" fill="url(#road)"/>
      <path d="M 520 290 L 160 525 M 680 290 L 1040 525" stroke="#3bff9e" stroke-opacity=".55" stroke-width="3"/>
      <path d="M 600 292 L 600 525" stroke="#f2b437" stroke-width="6" stroke-dasharray="26 22" stroke-opacity=".9"/>
      <g transform="translate(300 88)">
        <polygon points="0,0 210,0 105,182" fill="#ff5a4e"/>
        <polygon points="26,16 184,16 105,152" fill="#f5f2ea"/>
      </g>
      <g transform="translate(900 120)">
        <polygon points="52,0 128,0 180,52 180,128 128,180 52,180 0,128 0,52" fill="#ff5a4e" stroke="#f5f2ea" stroke-width="8"/>
        <text x="90" y="104" text-anchor="middle" font-family="Orbitron" font-weight="800" font-size="40" fill="#f5f2ea">STOP</text>
      </g>
    </svg>
    <div class="chip on" style="left:64px;top:44px">7 / 20 · Road signs</div>
    <div class="chip" style="left:64px;top:96px;padding-top:6px;padding-bottom:6px">{hearts}</div>
    <div class="chip" style="left:64px;top:150px"><span style="color:#4fb3ff">&#9670;</span>&nbsp; 120 gems</div>
    <div class="chip" style="left:64px;top:440px">Weekly leaderboard</div>
    <div class="chip on" style="left:328px;top:440px">Free</div>
    """


# ---------------------------------------------------------------- Edu360
def edu360() -> str:
    def test_card(x, y, rot, rows, done):
        items = "".join(
            f"<div style='position:absolute;left:24px;top:{70 + i * 40}px;width:22px;height:22px;border-radius:6px;"
            f"border:2px solid {'#3bff9e' if i == done else '#3a4660'};background:{'#3bff9e' if i == done else 'transparent'};"
            f"color:#05070c;font-size:16px;display:grid;place-items:center;font-weight:700'>{'&#10003;' if i == done else ''}</div>"
            f"<div style='position:absolute;left:60px;top:{77 + i * 40}px;width:{w}px;height:9px;border-radius:5px;background:#2a3245'></div>"
            for i, w in enumerate(rows))
        return (f"<div class='plate' style='left:{x}px;top:{y}px;width:330px;height:260px;transform:rotate({rot}deg)'>"
                f"<div class='mono' style='position:absolute;left:24px;top:24px;font-size:14px;letter-spacing:.14em;color:#7a8ca6'>QUESTION 18 / 20</div>"
                f"<div style='position:absolute;left:24px;top:48px;width:230px;height:10px;border-radius:5px;background:#2a3245'></div>"
                f"{items}</div>")
    return f"""
    {test_card(110, 210, -7, [150, 190, 120], 1)}
    {test_card(150, 150, -3, [170, 130, 200], 2)}
    {test_card(190, 90, 0, [160, 200, 140], 0)}
    <svg style="position:absolute;left:0;top:0" width="1200" height="525" viewBox="0 0 1200 525">
      <defs>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#2f7bff"/><stop offset="1" stop-color="#ff9a3c"/>
        </linearGradient>
      </defs>
      <g transform="translate(880 262)">
        <circle r="168" fill="none" stroke="#1e2a3c" stroke-width="18"/>
        <circle r="168" fill="none" stroke="url(#ring)" stroke-width="18" stroke-linecap="round"
                stroke-dasharray="1056" stroke-dashoffset="211" transform="rotate(-90)"/>
        <g stroke="#3a4660" stroke-width="3">
          {"".join(f'<line x1="0" y1="-140" x2="0" y2="-128" transform="rotate({a})"/>' for a in range(0, 360, 15))}
        </g>
        <text y="18" text-anchor="middle" font-family="Orbitron" font-weight="800" font-size="72" fill="#e8faff">360°</text>
        <text y="58" text-anchor="middle" font-family="Mono" font-size="16" letter-spacing="4" fill="#7a8ca6">EVERY SUBJECT</text>
      </g>
    </svg>
    <div class="chip on" style="left:64px;top:44px">IELTS section</div>
    <div class="chip" style="left:64px;top:440px">Teacher-made tests</div>
    <div class="chip" style="left:318px;top:440px">Free for students</div>
    """


# ---------------------------------------------------------------- Typing Me speed test
def speedtest() -> str:
    keys = "".join(
        f"<div style='position:absolute;left:{910 + (i % 6) * 54 + (i // 6) * 18}px;top:{420 + (i // 6) * 54}px;width:46px;height:46px;"
        f"border-radius:9px;border:1px solid #1e2a3c;background:rgba(11,15,24,.9);color:#7a8ca6;font-size:18px;"
        f"display:grid;place-items:center'>{k}</div>" for i, k in enumerate("ERTYUIDFGHJK"))
    return f"""
    <svg style="position:absolute;left:0;top:0" width="1200" height="525" viewBox="0 0 1200 525">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#3bff9e"/><stop offset="1" stop-color="#f2b437"/>
        </linearGradient>
      </defs>
      <g transform="translate(300 330)">
        <path d="M -200 0 A 200 200 0 0 1 200 0" fill="none" stroke="#1e2a3c" stroke-width="26" stroke-linecap="round"/>
        <path d="M -200 0 A 200 200 0 0 1 200 0" fill="none" stroke="url(#g)" stroke-width="26" stroke-linecap="round"
              stroke-dasharray="628" stroke-dashoffset="188"/>
        <g stroke="#3a4660" stroke-width="3">
          {"".join(f'<line x1="-160" y1="0" x2="-148" y2="0" transform="rotate({a})"/>' for a in range(0, 181, 15))}
        </g>
        <line x1="0" y1="0" x2="118" y2="-138" stroke="#f2b437" stroke-width="6" stroke-linecap="round"/>
        <circle r="12" fill="#f2b437"/>
        <text y="88" text-anchor="middle" font-family="Orbitron" font-weight="800" font-size="84" fill="#e8faff">84</text>
        <text y="126" text-anchor="middle" font-family="Mono" font-size="20" letter-spacing="6" fill="#7a8ca6">WPM</text>
      </g>
    </svg>
    <div class="mono" style="position:absolute;left:600px;top:150px;font-size:40px;line-height:1.5;width:560px;color:#3f4a5e">
      <span style="color:#3bff9e">the quick brown fox</span> <span style="color:#e8faff">jumps</span><span style="display:inline-block;width:4px;height:40px;background:#f2b437;vertical-align:-6px;margin:0 2px"></span> over the lazy dog and keeps every</div>
    <div class="chip on" style="left:600px;top:44px">Accuracy 98%</div>
    <div class="chip" style="left:812px;top:44px">Consistency 91%</div>
    <div class="chip" style="left:600px;top:380px">5 modes</div>
    <div class="chip" style="left:760px;top:380px">No sign-up</div>
    {keys}
    """


CARDS = {
    "typing-me": (game, 1400, 600, "#f2b437", "rgba(242,180,55,.28)", ("82%", "40%")),
    "marketpos": (marketpos, 1200, 525, "#8b7cff", "rgba(91,79,214,.32)", ("74%", "50%")),
    "avtolingo": (avtolingo, 1200, 525, "#ff5a4e", "rgba(255,90,78,.26)", ("70%", "40%")),
    "edu360": (edu360, 1200, 525, "#2f7bff", "rgba(47,123,255,.28)", ("74%", "50%")),
    "speedtest": (speedtest, 1200, 525, "#3bff9e", "rgba(59,255,158,.22)", ("30%", "60%")),
}


def main() -> None:
    from PIL import Image

    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for name, (build, w, h, accent, glow, at) in CARDS.items():
            page = f"{tmp}/{name}.html"
            shot = f"{tmp}/{name}.png"
            with open(page, "w") as f:
                f.write(html(build(), w, h, accent, glow, at))
            subprocess.run([
                CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--allow-file-access-from-files", "--force-device-scale-factor=2",
                f"--window-size={w},{h}", f"--screenshot={shot}", f"file://{page}",
            ], check=True, capture_output=True)

            # Flat dark scenes compress to a fifth of the PNG size as JPEG with no visible loss.
            out = f"{OUT}/{name}.jpg"
            Image.open(shot).convert("RGB").save(out, quality=90, optimize=True, subsampling=0)
            print(f"wrote {out} ({w}x{h} @2x, {os.path.getsize(out) // 1024} KB)")


if __name__ == "__main__":
    main()
