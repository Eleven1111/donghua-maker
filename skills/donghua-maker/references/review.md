# Independent review (step 5b)

The maker has seen every frame many times and knows what each one is meant to show, so the maker reads intent into the
picture. A reviewer who sees only the film reads what is actually there. In another code-animation skill's projects
(not yet measured on donghua films), reviewers who saw only the finished film caught a cut landing late on the beat, a whole-frame flicker,
a "raises the cup five times" continuity break, a see-through arm and a Cyrillic word that read as a different word,
all after the maker had checked the film three times. A number phrased "rose 9×" where "rose to 9×" was meant passed
the picture check and was caught only because the reviewer read the text for sense.

## When
Before step 6, for every film that will be shown to anyone but its maker. After a revision round, review again only if
shots were added or re-cut; a colour or wording fix doesn't need a new review.

## Who
A fresh-context agent that took no part in making the film: a subagent if your terminal has them, otherwise a new
session; an agent that made the film reports it as pending with the packet path below.

## The packet: the film only
Give the reviewer:
- the film path and how to serve it (`python3 -m http.server`, then `<film>.html`; Space plays, 1–N jumps to a shot);
- `<film>-stills/` (from `scripts/stills.py --shots`) and the `shot_NN.jpg` strips from `scripts/qa.py`;
- besides the `--shots` stills, a still at every key action (each strike, slam, reveal; `stills.py --at`): an event that lives 0.3 s falls between first/middle/last frames (a pilot review called a present bolt missing);
- one line on who the film is for (e.g. "a 30 s vertical short for 小红书", "a lesson for grade 8");
- films with characters: `faces/`, each character's key expressions at final size (below);
- the look's **Signature features** section from `looks/<look>.md`, when it has one: it describes the look, not this film.

Don't give the shot table, the brief, the code or your own verdict. They tell the reviewer what to see.

## Prompt
```
You are reviewing an animated short you did not make. Look only at the film and the stills in the packet.
Find what a first-time viewer would trip over. For each problem give: time (s) or still name, what you see,
why it is a problem, and how sure you are (sure / likely / unsure). Look at:
1. Reading: does the main subject read in each shot? Is anything cropped, floating, see-through or detached?
2. Continuity: across each cut, do characters, props and positions carry over? Does any action restart?
3. Motion: does anything flicker, stutter, jump or freeze where it should move?
4. Text: every on-screen word and number — spelling, wrong characters, ambiguous wording ("rose 9×" vs "rose to 9×"),
   units, numbers that contradict each other, text that sits on busy picture or under subtitles.
5. Logic: does each shot follow from the one before? Does the ending land?
6. Attention: at which time (s) does your attention first drift, and where does it go flat? Name every stretch where nothing new
   happens for several seconds, and say whether something just landed there (a good hold) or nothing did (dead time).
   Also say what in the first 3 s made you keep watching, or that nothing did. "Nothing drifted" is allowed, but state what you watched,
   and if you only had stills, say so: pacing in motion is then UNVERIFIED.
7. Faces (if the packet has faces/): name the emotion of each face_NN.png in one word, and how sure you are.
   Judge only the face in front of you, not what the story would suggest.
8. Template look: name every moment that reads as a generic template or an AI default (a stock layout, filler motion,
   an effect you have seen a hundred times), with its time. Name the hero moment, the one image a viewer would remember,
   or say there is none, and whether the last frame lands. Then score style (against the Signature features, if given),
   idea and motion 1–10: 5 = competent student work, 6 = template level, 7 = solid professional, 8 = high-end studio,
   9 = award shortlist. Most first cuts deserve 5–7; do not inflate.
Do not suggest fixes and do not rewrite anything. If you find nothing in a category, say what you checked.
```

Why item 6 exists: a check that only asks "right or wrong?" cannot catch "boring", and boring is the defect users reject most often.
It is judged by the reviewer's reading of the stills and `qa.py` strips, so a still-only review cannot see pacing in motion: the
reviewer must say whether the verdict on item 6 rests on stills only (then report live pacing as UNVERIFIED).

Why item 8 exists: a film can pass every check and still look like everyone else's. Item 6 asks whether it holds
attention; item 8 asks whether it is generic. The anchored scale and "most first cuts deserve 5–7" come from
mg-styles-15's jury prompt. The scores are reported, not a gate: a reviewer's number is an opinion, not a measurement.
What gets acted on is the named template moments and a missing hero moment.

## Faces at final size
Packet steps: for each character, take the still of every key expression, scale the whole still to what a phone shows
(390 px wide for 9:16, 640 px for 16:9), then crop the face without enlarging it. Save the crops as `faces/face_01.png`…
in shuffled order, and keep the key (file → intended emotion) outside the packet. What to check, and when a face counts
as a defect: `crew/picture.md` › Faces at final size.

## After
Fix what is clearly wrong, then list in the step-6 report what the review raised, what you fixed, and what you are
leaving for the user to judge. What the reviewer says is missing ("needs a joke at the end") is information for the
user, not permission to add it. A review that found nothing is still reported, with the categories it covered.
