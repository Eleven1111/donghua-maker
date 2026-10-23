# Rebuilding a real object from a photo

When a film depends on a real machine, tool, animal or building (a teardown, a hero prop, a how-it-works shot), build
it from a reference, not from memory (the cases: `crew/picture.md` › Bake and approve the characters before animating any shot). The method is adapted from img2threejs (Apache-2.0; method only, no code): write down what makes the object
itself before writing code, build in passes, and judge each pass on one sheet with the reference beside the render.
It applies to 2D looks too; the 3D looks (clay3d, voxel, flatsci, teardown) need it most, because a wrong part shows
from every angle.

## 1. References
One to three photos or drawings that show the object clearly, logged in `sources.json` (source, licence). They are
for looking at; nothing from them is embedded in the film. Note which sides none of them show.

## 2. Detail inventory (before any code)
In the film's checkpoint section, list what makes this object recognisable: proportions, silhouette, parts and how
they join, bevels and rounding, seams, fasteners, painted or engraved marks, gloss against matte zones, colour. Give
each detail the part it belongs to. A detail you cannot place on a real part is dropped, not faked. Sides no reference
shows are written down as inferred; they stay UNVERIFIED in the report. No shot code until the inventory is complete.

## 3. Part tree
Every part names its parent and the point where it attaches, so nothing floats. That attach point is also its pivot:
the axis it turns on in an animation and the line it travels along when a teardown pulls it out. Left/right pairs are
mirrors (scale −1 across the mirror plane), never a copy turned 180°: a rotation keeps handedness, so a turned copy
gives two left hands.

## 4. Passes
Build in this order and finish each pass before the next: **blockout** (proportions and silhouette, flat colour) →
**structure** (every part of the tree, attached) → **form** (bevels, rounding, seams) → **material** (finish classes,
colours sampled from the reference, not from memory) → **light**. After each pass, render the camera that matches the
reference and make one sheet:

```bash
python3 scripts/compare.py ref.jpg film.html --at 2.4 --crop .3,.2,.4,.6 --ref-crop .1,.05,.8,.9
```

Crop both to the object so the overlay lines up. Then choose exactly one: **continue**, **fix the inventory** (a part
was missing or wrong), **fix the code** (the inventory is right, the build is not), **ask for another view** (the
reference cannot answer it), or **stop** and tell the user what cannot be reached from this reference. Two fix rounds on
one pass without progress means ask.

## 5. What the sheet cannot prove
Look inside the silhouette, not only at the outline: img2threejs found that silhouette overlap scored a model with its
face deleted the same as the finished one. Proportions, part count and the joins are what the sheet is for; material
and light are judged at the film's final size, in the film's look.

## 6. Report
Say which reference each part came from, which parts are inferred, and which details were dropped. "This reference
cannot show it" is a valid result.
