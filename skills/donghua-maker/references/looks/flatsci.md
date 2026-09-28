# Look: flatsci / 扁平科普

The flat-vector science-explainer look. The space is deep indigo-violet with tiny twinkling stars and soft nebula blobs. Planets are flat discs with simple land blobs, cloud pills, a hard terminator shadow and a thin rim light on the lit edge, inside a soft atmosphere glow. Accents are saturated candy colours (cyan, pink, yellow, green) with a slight glow. Captions are bold, rounded and white. Orbits are dashed. Objects have no outlines. Motion is smooth and eased. This is the general language of flat science animation; no specific film or studio artwork is copied, so don't name one in a film.

Verified in 月亮为什么会变 (`assets/example-flatsci.html`, 16:9, 12 s, 3 shots, 90 bpm): sunlight on the Earth, the moon orbiting with its sunward half lit, and five phases as seen from Earth.

## Toolkit (`toolkit-flatsci.js`)
| call | what it does |
|---|---|
| `fsSpace(g, t, rect, seed)` | gradient, nebulae, twinkling stars (world coords, call after `setCam`) |
| `fsPlanet(g, x, y, r, {rot, light, seed, lands, clouds})` | flat planet; `light` = direction of the sun (radians) |
| `fsMoon(g, x, y, r, light)` | half lit toward `light` (the orbit view) |
| `fsPhase(g, x, y, r, ph)` | phase seen from Earth: 0 new, .25 first quarter, .5 full, .75 last quarter (waxing lit on the right) |
| `fsSun`, `fsBeams`, `fsOrbit`, `fsCallout`, `fsTitle(g, str, x, y, size, k, {sub})` | sun + light bands, dashed orbit, pointer label, captions |

## Rules
- Facts in science explainers go through the fact-check gate. Here that covered the phase cause (how much of the sunlit half faces us) and the ≈ 29.5-day synodic month.
- Keep geometry consistent between views. With the sun on the left and the orbit anticlockwise seen from the north, the canvas angle is `π − 2π·ph`: new at the left, first quarter at the bottom, full at the right.
- The terminator should leave roughly half the planet lit when the sun is to the side: a shadow disc offset about 0.95 r with radius 1.05 r.
- Callouts fade out before the next caption appears in the same area.

## Pitfalls met while building it
- The first shadow disc (offset .55 r, radius 1.12 r) left only a thin crescent lit, which reads as the wrong sun direction.
