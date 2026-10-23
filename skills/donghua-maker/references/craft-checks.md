# Craft checks: what the maker's own eye misses

Each check here exists because the maker, who knows what every frame is meant to say, read intent into a frame that
did not carry it. They are borrowed from three other code-animation projects (lemo-opuscar's DIRECTOR.md,
huashu-art-motion's film_gate.py, opus-video-skills' kinetic-reel) and adapted to this engine; the evidence line says
what each one caught here. Where a script exists it is the check; the rest are steps with a written result.

| # | check | when | how | verdict |
|---|---|---|---|---|
| 1 | action test sheet | step 3, before a rig enters a shot | one big sheet, stills | look |
| 2 | faces at final size | step 3 and 5b | phone-width crops, blind naming | defect if misnamed |
| 3 | not the demo again | step 1 brief, again at step 6 | six-row table | ≥ 4 of 6 differ |
| 4 | schematic label | 4d | `fact_check.py` (`schematic` + `label`) | FAIL |
| 5 | reading hold | step 5 | `platform_check.py` (creator), `--read-only` (any format) | FAIL / note |
| 6 | voice transcribes back | 4b | `voice_check.py` | FAIL → listen |
| 7 | pace | step 5 | `pace.py` | BLANK FAIL, rest notes |

## 1. Action test sheet
A code rig that looks right standing still breaks when it reaches, raises an arm, runs or kneels: shoulders tear open,
a forearm detaches, shading leaks through a joint. Before the rig goes into any shot, draw it on one large sheet in
those four poses plus every key action of this film, at twice the size it will appear, and look at the stills
(`stills.py`). Check: jointed pieces overlap with no background at the seam; held props sit between the palms; the
silhouette reads. Then step through each key action at 0.2 s intervals, enlarged.
Also confirm: the character's hue and value differ from what it stands on, and its whole motion path stays clear of
other focal props. Animals and people get real anatomy from a photo before the sheet (小猫钓鱼's first cat head, drawn
from memory, was rejected).
Evidence: on the elevator film (2026-10-21) shading the passenger's overlapping capsules with `ink()`'s evenodd shade
punched dark discs at every joint (fixed by shading the union with a clip and an offset refill).

## 2. Faces at final size
The maker checks faces zoomed in; the viewer sees them once, phone-sized. Scale the whole still to the phone width
(390 px for 9:16, 640 px for 16:9), then crop the face without enlarging it. At that size:
- **Brow direction carries the emotion.** Inner ends raised = worried, scared, sad. Inner ends pulled down toward the
  nose = angry. "Worried" and "angry" are one flip apart.
- **Watch what covers the eyes.** Brows under a fringe carry nothing, and a fringe, hat brim or glasses frame that
  clips an arched lid line can turn it into a frown.
- Then have a fresh reviewer name each face blind (`review.md`, Faces at final size). A face named differently from
  what it was meant to show is a defect, not taste.
Evidence: on the elevator film (2026-10-21) the new passenger's scared face read as angry on the cover. The brows were
hidden under the fringe, which clipped the arched upper-lid line into a frown; dropping that line for 'scared' fixed it.

## 3. Not the demo again
Every look has an example film (`catalog.md`). Copying its structure is the easy failure: the new film becomes the
demo with a different topic. After the brief exists, open the example and write a six-row table in the film's
checkpoint section: **structure, opening, signature shot, camera path, score shape, ending**, each as "this film /
the example". At least four rows must differ; rethink the ones that match before writing shots. At step 6, put
the contact sheet next to the example's stills as a last look. A user who asked for "like the example" overrides
this; say so in the report.

## 4. Schematic label
A picture that simplifies (a cutaway, a curve drawn without data, a map with places moved for clarity) must tell the
viewer so on screen, or it reads as measured fact. In `facts.json`, give that `visual` entry `"schematic": true` and
`"label"`: the on-screen string that says 示意 (for example 「议题突然消失（示意）」). `fact_check.py` fails when the
label is missing, is not in the film or does not say 示意 (English films: "schematic", "not to scale", "illustrative").

## 5. Reading hold
Once a text is fully drawn it stays up for 汉字 ÷ 4.5 + letters and digits ÷ 15 + 1.5 s. Fast is fine; make it fast
with fewer words per screen, not by cutting before people finish reading. `platform_check.py` measures every text at
least 2.5 % of the short side tall, following counters and typewriter reveals as one text: a shorter hold is a note;
a sentence of 6+ units held under half its time fails. For lessons and landscape films run it with `--read-only`.
Watch the end card: the film's end cuts it short.
Calibration (2026-10-22): the elevator film had 13 notes and no failure (its end card 「你信过“跳一下”吗？」 is up
1.8 s of 3.1 s); a verified example (flatsci) holds its 13-character closing line 1.0 s. Launch-style films flash
labels for 0.3 s on purpose; there the hold rule is a note to weigh, not a fix to make.

## 6. Voice transcribes back
`voice_check.py <film>.html` transcribes every embedded narration line with whisper.cpp and compares it with the
script (digits read as Chinese numerals). A line over 0.25 character error is listed to listen to: the text-to-speech
misread it, or the speech-to-text misheard it, and only a person can tell which. After listening to a line that is
right, record what the model hears in `<film>-vo/heard.json`; it then passes until the audio changes. Never fill
heard.json without listening. Passing means transcribed, not auditioned: tone and pace stay UNVERIFIED.
Calibration (2026-10-22, ggml-small): correct lines 0–0.21, a line compared with another line's script ≥ 0.86;
swapping two clips failed both.

## 7. Pace
`pace.py <film>.html` renders the film as exported, subtitles off, 12 frames a second, and reports per shot how much
the picture changes. It fails on a near-empty screen for ≥ 0.3 s in mid-film (BLANK), unless the blank is designed
and declared with `--allow-blank START-END:reason` (the launch look's black "stop"); the reason goes in the delivery
report. STILL notes (a shot of 3 s or more that barely changes), OPEN notes (more than 0.3 s of empty screen before the
first image) and BLUE notes (mostly blue-violet frames) point at shots to look at: a hold that lands, or dead time?
Calibration (2026-10-22, 48 local films): film_gate's fast-motion red line (0.035) does not transfer: 12 of the 34
verified examples read 0.000, since this engine moves in small stop-motion steps. On the elevator film the STILL note on
22.25–27 s matched a reviewer's "flat" remark; the reviewer's 31–42 s did not show up.
