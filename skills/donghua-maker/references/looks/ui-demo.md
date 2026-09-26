# Look: Cute software demo / 可爱软件演示 (kawaii flat + meta UI)

A flat 2D look for introducing any software product. A small mascot (小克 by default) stands on the product's own UI and operates it: it drags, types, clicks, cuts, throws and drags sliders. The product reacts on the same frame. It is verified on two different products:
- `assets/example-ui-demo-editor.html`: 小克剪辑, a video editor. 8 s: play, blurry preview, stop, two cuts at the playhead, bin the clip, ripple, clean preview.
- `assets/example-ui-demo-dashboard.html`: 小克数据台, a sales dashboard in a browser. 4 s: type a query, press Search, bars, KPI and ranking update.

Both files contain the same `UI-DEMO KIT` block, byte-identical. The dashboard was built by copying that block and writing only a new app block, which is the evidence that the kit generalises. Read `../shot-contract.md` for the engine API first.

## What makes it work (the user rejected a version without these)
1. **The UI is a working simulation, not a decoration.** Keep one state model: `stateAt(t, INIT, EVENTS)`, where each event is a pure `state => newState` at the moment an action lands. Every view reads that state: lists, previews, charts, counters, timeline strips. If a timeline thumbnail and the preview both show a clip, both call the same `renderSrc()` or frame function, so they can't disagree.
2. **Actions land where the product says they do.** A cut happens at the playhead, a press on the button's centre, a typed character on its beat. Put the mascot at the operative spot (it rides the playhead, or reaches the field) and put the event time exactly where the hand arrives.
3. **Cause and effect on the same frame.** The preview goes grey as the playhead enters the bad stretch; the bars start moving the frame the button squashes; the gap closes and the preview turns clean. Verify with a still at each action frame, checking that the mascot, the widget and the product view agree.
4. **The product's sound follows the product's state.** In the editor the BGM plays only while the timeline plays (`PLAY` windows), so pausing the timeline pauses the music. Every action gets foley: a tick per keypress, a clink per cut or press, a thump plus clinks for the trash.

## File structure
```
UI-DEMO KIT   (copy verbatim) palette tokens C, rr/box/txt, backOut/elastic/seg01, bubble, sfxTxt,
              knife, trash, hose, mascotDraw + MASCOT, stateAt, keys, uiButton/uiSlider/uiToggle/
              uiTabs/uiField/uiProgress, deviceFrame(phone|browser|window), clickRing
APP           product-specific: static plate bake (bakePlate/bakeDash), content renderers, INIT + EVENTS,
              derived views (layout(), bars, list)
SHOT(S)       timing constants K/T, cam(), pose(t) for the mascot, draw(), score()
```
Set `FLAT = true`: no grain, flicker or dark vignette, and the canvas is cleared to the paper colour. Set `EXPO = 2` for 30 poses/s, which keeps motion fluid and springy rather than stop-motion.

## Visual rules
- **Ground and lines:** warm paper `#f5f1e8`, panels `#fbf8f2`, one warm-dark hairline `#4a4340` at 3–6 px for every outline. Pastel accents: tab yellow `#f4cf63`, lavender `#dcd6f5`, cream `#fbe7a6`, mint `#6cc7b7`. The playhead and focus colour is `#e0504a`. There are no gradients on UI chrome; gradients live only inside product content.
- **Mascot (`MASCOT`):** a flat block about 200×168 world px with 16 px corners, muted brick `#d9593f` and edge `#8f3a2a`, tall oval eyes with one highlight, and stub legs. Arms are short stubs until they work; then one becomes a long same-colour hose (`armR: [x, y]`) that sags when short and straightens when stretched.
  - Expressions: `n`, `shock` (bigger eyes plus mouth), `squint` (focused), `happy` (^ ^), `x`.
  - The mascot stays **small**, about ⅛ of the frame height. Emphasis comes from the camera pushing in, not from a bigger character; enlarging it was the wrong direction.
  - To re-brand, change `MASCOT` colours and size only.
- **Mascot placement:** it stands on a UI edge (the ruler or clip row, a window's bottom border, or the desk beside the window), never inside a content card where it hides the data.
- **Comic layer:** `bubble()` for speech (开工！ 清爽！ 搞定！) and `sfxTxt()` for impact lettering (啊！ 咔！ 哐当！ 噔！): heavy stroke, yellow or white fill, pop with overshoot. Use one per beat at most.
- **Camera:** wide at the start of each shot, pushing to z 1.2–1.3 on the action area with the product view still in frame, then pulling back when playback resumes. First check the frame edges at the widest zoom; the clear colour is the paper colour, so zooming out below 1 is safe.

## Motion vocabulary (with a worked example of each in the two files)
| action | how |
|---|---|
| pop in | `s: backOut(seg01(t, 0, .35), 2)` plus a sine `chip` 400→900 |
| ride the playhead | `x = PX(playT(t))`, a hop per beat `sin(PI·phase)`, `walk` legs |
| reach, type, press | `keys(t, [[t, [x, y]], …], eo)` for the hand; dip 40 px on each keypress; `uiButton(…, {press})` squash and `clickRing` |
| cut | knife raised, then swung to `[PX(p), row]` over 0.12 s, a white flash line, sparks and 咔！. The split is an EVENT at that exact time |
| grab and throw | the item follows the hand (`held(t)`), is released, then flies an arc with a spin into `trash()`, which pops up just before and whose lid kicks with `elastic` |
| ripple, count-up, re-rank | derive from state plus `backOut(seg01(t, since, since + .35..6))`; stagger bars and rows by 0.06–0.1 s |
| shock / done | `eyes: 'shock'`, a small jump and 啊！; `eyes: 'happy'`, both arms up and a bubble |

## Adapting to a new product (checklist)
1. List 3–5 real features you want to show, one per action. Each needs a visible **before → after** in the product view.
2. Write `INIT` and `EVENTS` first, as data. Then write views that read only `stateAt(t, …)`. Time is used only to animate *toward* the state (with `since` stamps).
3. Pick a frame with `deviceFrame`: `'phone'` for apps, `'browser'` for SaaS, `'window'` for desktop tools. Bake everything static into a plate.
4. Choose the mascot's stage (an edge or the desk) and hand targets taken from the widget rects. Keep the rects as named constants so hand keys and hit points share them.
5. Put the action times on the beat grid (120 bpm → 0.25 s steps), then write `score()` from the same constants.
6. Verify: a still at every EVENT time and 0.1 s after it, 0 console errors, and the `wav()` length. Then make a stills sheet (a 2×N canvas from `__film.seek`) and check the mascot, widget and product view for agreement.

Portrait (phone app demos): same rules, with the phone frame filling the middle 60% and the mascot on the phone's bottom bezel (unverified).
