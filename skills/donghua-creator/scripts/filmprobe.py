"""Load a donghua film headless and ask it questions (shared by platform_check.py and publish_kit.py)."""
import asyncio
import functools
import http.server
import socketserver
import threading
import urllib.parse
from pathlib import Path


def _serve(root: Path):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(root)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


async def _run(film: Path, job, query: str):
    from playwright.async_api import async_playwright
    srv, port = _serve(film.parent)
    try:
        async with async_playwright() as p:
            try:
                b = await p.chromium.launch(channel="chrome")
            except Exception:
                b = await p.chromium.launch()
            pg = await b.new_page(viewport={"width": 1400, "height": 900})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(f"http://127.0.0.1:{port}/{urllib.parse.quote(film.name)}?ui=0{query}")
            await pg.wait_for_function("window.__READY === true", timeout=30000)
            if not await pg.evaluate("typeof window.__film.textBoxes === 'function'"):
                raise SystemExit(f"{film.name} was made with an older engine (no __film.textBoxes) — re-scaffold it")
            base = await pg.evaluate("""() => ({ W, H, dur: DUR, fps: FPS,
                shots: SHOTS.map(s => ({ name: s.name, t0: s.t0, t1: s.t1 })),
                voice: NARR.ev.map(e => e.said ? e.said[0] : e.t),
                samples: Object.keys(SMP.lib || {}), bgm: SMP.bgm ? SMP.bgm.id : null })""")
            out = await job(pg, base)
            await b.close()
    finally:
        srv.shutdown()
    base["errors"] = errs
    return base, out


def probe(film: Path, job, query: str = ""):
    """job(page, base) -> anything; returns (base info + page errors, job result)."""
    return asyncio.run(_run(film.resolve(), job, query))
