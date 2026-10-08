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
session. A director agent can't start one (it is a subagent itself): it reports the review as **pending** and gives the
main conversation the packet path below.

## The packet: the film only
Give the reviewer:
- the film path and how to serve it (`python3 -m http.server`, then `<film>.html`; Space plays, 1–N jumps to a shot);
- `<film>-stills/` (from `scripts/stills.py --shots`) and the `shot_NN.jpg` strips from `scripts/qa.py`;
- one line on who the film is for (e.g. "a 30 s vertical short for 小红书", "a lesson for grade 8").

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
Do not suggest fixes and do not rewrite anything. If you find nothing in a category, say what you checked.
```

## After
Fix what is clearly wrong, then list in the step-6 report what the review raised, what you fixed, and what you are
leaving for the user to judge. What the reviewer says is missing ("needs a joke at the end") is information for the
user, not permission to add it. A review that found nothing is still reported, with the categories it covered.
