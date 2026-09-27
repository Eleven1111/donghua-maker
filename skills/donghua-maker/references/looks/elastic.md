# Look: elastic / 弹性线条

Thick, saturated hand-gesture lines on black that write themselves on and then keep wobbling like plucked springs, and jelly blobs that bounce on the notes. Playful and immediate: every stroke keeps a little life after it is drawn. Studied from published interactive-drawing sketches; gestures are generated, never copied.

Verified in 弹一弹 (`assets/example-elastic.html`, 16:9, 12 s, 3 shots, 120 bpm).

## Toolkit (`toolkit-elastic.js`)
| call | what it does |
|---|---|
| `elSpring(τ, k, w)` | damped spring response to a kick at τ = 0 |
| `elGesture(seed, box, n)` + `elPath(C, n)` | a random doodle's control points, resampled with Catmull-Rom |
| `elStroke(g, P, t, {t0, dur, amp, w, kicks, cols})` | writes the line on over `dur`; each point rings when laid and again on every kick (a travelling wave); tapered, colour bands along the length |
| `elBlob(g, x, y, r, t, kicks, col, seed, {face})` | jelly blob: angular modes ring on each kick, squash and stretch; optional two-dot face |
| `elBurst(g, x, y, t, tk, n, col, seed)` | dots that burst from the pen tip on a kick and fall |

## Rules
- Line width 45–65 px at 2560 wide; thinner reads as a wire, not a gesture.
- Every note is a kick: the line or blob that owns it rings visibly.
- Several lines at once only as near-parallel "strings" (box height about 150 px, 200 px apart); free doodles on top of each other tangle into noise.

## Pitfalls met while building it
- First pass at 26–34 px looked like thin wire; shot 3's five free doodles knotted together. Both fixed as above.
