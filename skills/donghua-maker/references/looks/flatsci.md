# Look: flatsci / 扁平科普 (three.js)

The flat science-explainer look, built in real 3D. Space is deep indigo-violet with twinkling star layers and soft nebula glows. Planets are real spheres in two-tone toon shading: a hard terminator where the sun's light really falls, a violet shadow side from the ambient light, flat continents with two land tones and ice caps, cloud pills on a separate shell, and a cyan atmosphere rim. The sun is a flat disc with layered glows. Captions are bold, rounded and white, drawn over the frame; orbits are dashed lines. Because the light is real, moon phases come out of the geometry and are never painted. This is the general language of flat science animation; no specific film or studio artwork is copied, so don't name one in a film.

Verified in 月亮为什么会变 (`assets/example-flatsci.html`, 16:9, 12 s, 3 shots, 90 bpm): sunlight on a turning Earth, the camera rising over the orbit while the moon's sunward half stays lit, and five phases rendered from the same moon lit from five directions.

## Start
`--look flatsci` inlines three.js by itself. The toolkit sets `SMOOTH_DEFAULT = true`.

## Toolkit (`F3`, palette `FS`)
| call | what it does |
|---|---|
| `F3.stage({ sunPos, seed, fov })` | space backdrop and stars (`.space.twinkle(t)`), violet ambient, the sun's directional light |
| `F3.planet(r, { seed, land, clouds, atmo })` | Earth-like planet; `.spin(a)` turns surface and clouds |
| `F3.moon(r)`, `F3.sun(r)`, `F3.glow(size, col, a)` | cratered moon, glowing sun, additive glow sprite |
| `F3.orbit(r, { a0 })` | dashed orbit in the xz plane; `.grow(k)` draws it on |
| `F3.aim(cam, { at, az, el, dist })`, `F3.project(p, cam)` | orbit camera; world point to canvas pixels (for callouts) |
| `F3.frame(ctx, scene, cam)` | render onto the film canvas |
| `F3.views(ctx, [bgScene, bgCam], [{ scene, cam, rect, before }])` | several small views over one backdrop; `before()` runs just before each (e.g. move the light) |
| `fsTitle(g, str, x, y, size, k, { sub, align })`, `fsCallout(g, px, py, tx, ty, str, k)` | 2D captions and pointer labels in screen pixels |

## Rules
- Facts in science explainers go through the fact-check gate. Here that covered the phase cause (how much of the sunlit half faces us) and the ≈ 29.5-day synodic month.
- Keep geometry consistent between views. The sun is at −x; the orbit runs anticlockwise seen from +y: position `(cos a, 0, −sin a)·r` with `a = π + 2π·ph` puts the new moon towards the sun and the first quarter nearest the camera.
- Phases seen from Earth: light the moon from `(sin 2πp, 0, −cos 2πp)` with the camera on +z. That gives new (lit from behind), first quarter lit on the right, and full.
- The toon ramp is `[0, 255]`: direct light is on or off, and the shadow side is only the ambient colour. A ramp with a non-zero dark step lit the shadow side at about two-thirds brightness, so the new moon looked full.
- Captions go where the moving moon will not pass; the orbit crosses the top-left in the rising shot.

## Pitfalls met while building it
- The first framing made Earth so large that the title covered it; pull the camera back and aim below the planet so the caption sits under it.
