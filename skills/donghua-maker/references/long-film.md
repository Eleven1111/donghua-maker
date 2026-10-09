# Long films: chapters

Past about 9 shots or 30 s, one file gets hard to keep straight: helpers from different scenes collide, an edit to
one scene breaks another, and nothing plays until everything is written. Build such a film in **chapters**: one file
per chapter, assembled into the usual single-file HTML. The deliverable doesn't change; only how you write it does.

```bash
python3 scripts/chapters.py init letter/ --title "一封信的旅程" --format portrait --bpm 120 --narrated \
    --chapters "开场:4,纸艺小镇:12,水墨山路:12,浮世绘海:12,水彩窗边:10"
python3 scripts/chapters.py build letter/          # → letter/letter.html; run after every edit
```

`init` writes:

| file | holds |
|---|---|
| `film.json` | title, format, bpm, look, narrated, bed, and the chapters in order with their lengths |
| `story.js` | what every chapter shares: palette (`Object.assign(C, …)`), `MELODY.push(…)`, rigs that cross chapters, and any number the whole film shows (a counter, a meter) as one function of time |
| `ch/NN-<name>.js` | one chapter: private helpers plus `shot({...})` calls, with times relative to the chapter |

Chapter lengths are scaffold `--durs`: the build warns when a chapter boundary is off the eighth-note grid. Change a
length or add a chapter by editing `film.json`, then build.

## Writing a chapter
```js
// ch/02-纸艺小镇.js
const chimney = (g, x, y, t) => { … };        // private: another chapter may have its own chimney
shot({ name: '邮筒', t0: 0, t1: 3.5, cam(st) { … }, build() { … }, reset() { … }, step() {}, snap() {},
  draw(ctx, st, sq, e, cam) { … }, score() { return []; } });
shot({ name: '石板路', t0: 3.5, t1: 12, … });   // CH = { name, i, t0, t1, dur } if you need absolute times
```
- A shot is a normal shot object (shot-contract §2); `shot()` adds the chapter's start to `t0`/`t1` and pushes it.
- The shots must tile the chapter exactly. A gap or an overlap throws at load, naming the chapter and the shot
  (`chapter 山路: shots end at 1.500 s, the chapter is 2 s`); `stills.py` and `qa.py` report it as a page error. A cut
  inside a chapter off the eighth-note grid is a console warning.
- **A chapter with no shots plays as a placeholder card** (its number, name and time span). Build the whole film on the
  first day: the timeline, the music and the narration can be checked end to end while chapters are still empty.
- Each chapter runs inside its own function scope. Anything another chapter needs goes in `story.js`; a guest
  character introduced in chapter 3 and reused in the finale is defined there, not in chapter 3.
- The `out` of a chapter's last shot (shot-contract §7) is the handover to the next chapter: plan it in the brief, and
  check it on a still at every chapter boundary.

## What the build does
1. Scaffolds the film from `film.json` (engine, story head, look toolkit).
2. Pastes `story.js`, then each chapter wrapped in its own scope, then checks each source file with `node --check`. A
   syntax error names the file and line (`syntax error in ch/03-山路.js: … (line 7: …)`) and the build exits 1.
3. Leaves the timeline bar empty: the engine makes one segment per shot at boot.
4. Carries over what other tools wrote into the previous build: embedded fonts, the SAMPLES block (sfx_import /
   audio_director), the FRAMES block (frames_import) and the NARRATION block (narrate.py). So rebuild freely. After
   changing on-screen text, re-run `font_embed.py` (its `--check` flags a stale subset).

Never edit the built HTML by hand: the next build overwrites everything except those carried blocks.

## Splitting the work
Chapters are independent files, so several agents (or sessions) can write different chapters at once: each edits
only its own `ch/` file, and anything shared is changed in `story.js` by one owner. Give each one the brief, its rows
of the shot table (with the `out` of the chapter before and of its own last shot), and this page. Build and run
`qa.py` on the whole film after merging their files.

