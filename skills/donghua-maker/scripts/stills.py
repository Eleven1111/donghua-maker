#!/usr/bin/env python3
"""Full-resolution stills of a donghua film at given times, plus a contact sheet — the visual self-check input.

    python3 stills.py <film>.html --at 0,3.9,4.05,7.9            # explicit times (s)
    python3 stills.py <film>.html --shots                         # first frame + last frame + midpoint of every shot
    python3 stills.py <film>.html --shots -o out/ --width 1280

Serves the film's folder on a free local port, drives headless Chrome (Playwright), seeks with __film.seek(),
copies the canvas (not a page screenshot, so no UI and no pane downscale), writes s_<t>.jpg and sheet.jpg,
and prints page errors. Exit 1 if the page threw any error.
"""
import argparse
import asyncio
import base64
import functools
import http.server
import socketserver
import subprocess
import sys
import threading
import urllib.parse
from pathlib import Path


def serve(root: Path) -> tuple:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(root))
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


async def grab(url: str, times, shots: bool, out: Path, width: int) -> list:
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        try:
            b = await p.chromium.launch(channel="chrome")
        except Exception:
            b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1400, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(url)
        await pg.wait_for_function("window.__READY === true")
        await pg.wait_for_timeout(600)
        if shots:
            spans = await pg.evaluate("SHOTS.map(s => [s.t0, s.t1])")
            times = sorted({round(t, 3) for a, z in spans for t in (a + 1 / 60, (a + z) / 2, z - .1)})
        for t in times:
            d = await pg.evaluate(f"""(() => {{ window.__film.seek(Math.round({t} * 60)); const c = document.getElementById('film');
                const o = document.createElement('canvas'); o.width = {width}; o.height = Math.round({width} * c.height / c.width);
                o.getContext('2d').drawImage(c, 0, 0, o.width, o.height); return o.toDataURL('image/jpeg', .85); }})()""")
            (out / f"s_{t:06.2f}.jpg").write_bytes(base64.b64decode(d.split(",")[1]))
        await b.close()
        return errs


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--at", help="comma-separated times in seconds")
    ap.add_argument("--shots", action="store_true", help="first/mid/last frame of every shot")
    ap.add_argument("-o", "--out", type=Path, help="default <film>-stills/")
    ap.add_argument("--width", type=int, default=1280)
    a = ap.parse_args()
    if not a.at and not a.shots:
        ap.error("give --at or --shots")
    film = a.film.resolve()
    out = (a.out or film.with_name(film.stem + "-stills")).resolve()
    out.mkdir(parents=True, exist_ok=True)
    if a.shots:   # a full pass starts clean; --at adds key moments without deleting stills that facts.json cites
        for old in out.glob("s_*.jpg"):
            old.unlink()
    srv, port = serve(film.parent)
    try:
        url = f"http://127.0.0.1:{port}/{urllib.parse.quote(film.name)}?ui=0"
        times = [float(x) for x in a.at.split(",")] if a.at else []
        errs = asyncio.run(grab(url, times, a.shots, out, a.width))
    finally:
        srv.shutdown()
    files = sorted(out.glob("s_*.jpg"))
    cols = 3
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-pattern_type", "glob", "-i", str(out / "s_*.jpg"),
                    "-vf", f"scale=640:-2,tile={cols}x{-(-len(files) // cols)}", "-frames:v", "1", str(out / "sheet.jpg")], check=False)
    print(f"{len(files)} stills → {out} (sheet.jpg)")
    print("page errors:", errs or "none")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
