# Portfolio keyboard

- `scene.ts` generates a serializable Chibi document from skills. It owns layout,
  key materials, logo decals, lighting, and the projects cat. It imports only
  Chibi's schema entry point.
- `motion.ts` owns GSAP and ScrollTrigger lifecycles. Section placement, reveal,
  rotation, per-key motion, and press states use separate transform groups.
- `input.ts` tracks which pointer/physical key holds each cap. Releasing one
  input leaves other held caps pressed; blur and tab hiding release everything.
- `use-keyboard-sounds.ts` owns AudioContext, decoding, gesture unlock, playback,
  cancellation, and disposal.
- `keyboard-scene.tsx` connects these controllers to Chibi's public API. Skill
  headings are extruded meshes; descriptions are SVG textures on scene planes.
  Labels inherit the keyboard transform and switch on key input. An invisible
  live region provides screen-reader announcements. The scene JSON has no sound,
  DOM selectors, GSAP code, or skill-specific runtime behavior.

The parent `animated-background.tsx` owns capability/preference gating, the
loading deadline, and error fallback. Its dynamic import avoids downloading
Chibi on visits where 3D is disabled. Material or GLB load errors keep the HTML
skills list visible. The 404 page has no 3D dependency.

## Runtime and customization

Portfolio pins the published `@chibi3d/runtime@0.4.0` npm package. No sibling
checkout or package build is needed to work on the keyboard. The checked-in
`patches/@chibi3d__runtime@0.4.0.patch` adds the optional `orthographic` and live `environment` host props
to both module formats and their types. `pnpm install` applies it automatically.
Remove the patch when adopting a release that includes both APIs. Restart the dev
server after installing the patch, since its package path changes.

Set viewport positioning directly on ChibiScene through its `style` prop.
The runtime supplies inline `position: relative`, so a CSS `fixed` class alone
cannot override it. Explicit `100vw`/`100dvh` dimensions avoid percentage heights
resolving against an unsized parent and collapsing the canvas to 150px.

Keycap plastic uses each skill's optional `keyboardColor`, falling back to its
HTML `color` for custom skills. Defaults follow the original keyboard palette,
including charcoal caps behind white logos. Lighting and materials live in
`scene.ts`; section poses and scroll thresholds live in `motion.ts`.

## Verification

Run `pnpm typecheck`, `pnpm test`, and
`pnpm exec eslint src/components/keyboard` for source checks.

Earlier verification covered desktop Skills, Projects, and Contact in the running browser, including
key-driven mesh labels, the unlit original cat artwork at the back rim, and
upright floating contact caps. Also checked Skills at 390×844 and resized back
to desktop. All 24 keyboard tests and typecheck pass; keyboard source lint is
clean. Full-project lint passes with existing warnings elsewhere. Touch chords,
failure fallbacks, and production performance still need separate checks.

Next owns caching for its generated chunks; development responses use
`no-cache, must-revalidate`. The previous custom one-year immutable header
was retaining outdated positioning code. Public keyboard assets use `no-store`
in development. A browser that cached the old immutable responses needs one
hard reload to discard them.

Each runtime `onLoad` increments a load version so the motion controller
rebinds and reveals after the replacement scene nodes mount. A boolean ready
flag alone cannot distinguish subsequent loads.

The placement/reveal/spin origin is the center of the resting case and
keycap geometry, derived from the GLB bounds. Text, logos, and the cat are
excluded. Skills and Projects place this anchor at the camera target; Hero
and Contact apply their section offsets to that same anchor. Label changes,
key presses, and floating caps never recalculate it. Regression tests use the
actual GLB accessors across multiple keyboard layouts, not label dimensions.

## Scene corrections

The camera uses parallel projection and equal x/y/z viewing distances for an
isometric view. The Skills pose tilts the board 9.74° toward that camera, giving the 45°
top-down view in the Spline reference while retaining parallel projection.
Desktop framing is slightly larger, with the board centered horizontally.
Mobile uses a smaller fit while keeping labels anchored to the same keyboard
edge. Orthographic framing
uses the document camera distance and field of view, preserving vertical size
on resize without changing the scene format.

The original Spline cat frames are transparent PNG textures on two colocated
unlit planes, packaged as a GLB with `KHR_materials_unlit`. Visibility alternates every
100 ms in Projects. There is no generated cat geometry.

### Section matching, October 2026

Compared the deployed `https://nareshkhatri.dev` with the existing local preview
at port 3001. The source of the legacy section values is Git's
`src/components/animated-background-config.ts`. The uploaded
`tech_skills_keyboard.gltf` confirms a key width of 296.741333 source units.

Skills keeps its existing calibrated pose and size. GSAP animates the original
Spline Euler components in radians, including Projects' `[π, π/3, π]` target.
Only after sampling that animation do we convert the rotation into the current
camera's coordinates. Although that target is equivalent to a 120° yaw at
rest, a yaw-only tween loses the original flip between sections. Hero spin and
section transitions share the same rotation values, so scrolling away mid-spin
continues from the visible orientation instead of resetting a separate group.
Section transforms use the original one-second `power1.out` tween. The
ScrollTriggers fire at 50%, 70%, and 30% for Skills, Projects, and Contact.
The old timeline's `scrub` flag did not scrub these separate callback-created
tweens; transitions remain time-based after crossing each threshold.
Hero and Contact offsets use camera-right and camera-up vectors instead of
world x/y, so horizontal placement does not also raise the keyboard.

Bongo uses its original Spline center, rotation, and dimensions, converted to
key-width units. It attaches to the positive-z rim. The extracted image quads
have bottom-edge origins, so their positions compensate for the original
center-based frame geometry. The desktop Projects screenshot confirms the
correct board orientation and cat placement.

Contact follows the original repeating teardown sequence. After the 200 ms
cat-hide delay and another 600 ms wait, the board starts at `[0, 0, 0]` and
animates yaw to `-π/2` over five seconds, repeating with `yoyoEase: true`.
The normalized mesh is already upright, so the legacy X half-turn is omitted
to keep the key faces visible throughout the Contact loop. Its yaw and key
animation timings are preserved. The original `.restart()` calls skip the declared 2.5-second tween delay;
Hero's ten-second `back.inOut` spin likewise starts without that delay.
Keys start in randomized order, staggered by 600 ms, rise by 200–400 source
units over 2–4 seconds with `elastic.out(1,0.3)`, and return linearly via
`yoyoEase: "none"`. Heights are converted using the original cap width.
Leaving Contact cancels the board loop immediately; after the cat delay plus
600 ms, it cancels key loops and settles keys to zero over four seconds with
`elastic.out(1,0.7)`. Bongo starts after 300 ms in Projects and hides after
200 ms elsewhere. Pending callbacks are killed on section changes and disposal.

This supersedes the earlier yaw-only transition and one-shot Contact changes.
The user's correction requires preserving the original animation path and
repeating rise/return sequence, not just matching the resting screenshots.

Captured old and pre-fix Hero, Skills, Projects, and Contact screenshots, plus
the corrected resting Projects view. Browser automation is unavailable for the
latest animation correction, so visual checks remain open. Automated coverage
includes the flip midpoint, interrupted Hero rotation, delayed callback
cancellation, and a real-GSAP test of successive key rise/return cycles and
settling after exit. Typecheck, keyboard ESLint, and all 35 tests pass.

Chibi 0.4.0 has a fixed text font URL,
`public/fonts/helvetiker_regular.typeface.json`. Portfolio deliberately serves
Archivo Black at that URL to match the original Spline headings. This asset
alias avoids a runtime change. `scripts/prepare-keyboard-font.py` converts the
original TTF with fontTools and writes matching glyph metrics for left-aligning
headings by their real outlines. The font and its OFL license are local.
Descriptions are escaped, wrapped SVG textures
generated in `scene.ts`, so they follow the board without HTML positioning.

Skill captions use larger two-line wrapping beside the heading. Emoji suffixes
remain in the HTML skill data but are omitted from the scene caption to match
the original reference. Headings and descriptions share a left edge, inset half a key pitch from the
keyboard’s left edge. That inset follows the case dimensions for every layout
and stays fixed across viewport sizes. Text never affects the keyboard center.

## Keycap entrance reveal

The entrance follows the old per-key visibility sequence: wait 900 ms, show
one key every 70 ms in layout order, hold each for 100 ms, then drop it over
500 ms with `bounce.out`. The drop distance is the original 200-to-50 source
units converted to cap-width units. Hide the motion group so the cap and its
logo appear together.

Reveal and Contact offsets are separate host values summed into the existing
motion group. The delayed section settle must not animate the reveal offset;
sharing that value made pending caps descend together. Section changes and
resize preserve the entrance sequence, while disposal cancels its callbacks
and clears visibility overrides. Real-GSAP tests step through all 24 reveals,
including a resize midway through, and verify every cap settles. All 37 tests,
typecheck, and keyboard ESLint pass.

## Automatic quality

Every mount starts at DPR 1 with environment lighting, shadows, soft shadows,
AO, and bloom off. Contact shadows and vignette remain off at every level.
After a five-second warmup, the controller samples two-second windows during
keyboard transforms and key interaction. It sleeps when motion stops and when
the tab is hidden. The sparse cat animation does not count as sustained motion.

Three consecutive windows with a mean interval below 17.5 ms and p95 below
20 ms enable one more effect, in this order: environment lighting, shadows,
soft shadows, AO, bloom. Each change gets three seconds to settle. Two windows
above 22 ms mean or 35 ms p95 drop one level; a mean above 32 ms drops one level
immediately. Below the starting level, DPR falls to 0.75. Automatic DPR never
exceeds the device's ratio or the parent cap; higher resolutions remain manual.

A downgrade caps further upgrades for that mount, preventing repeated attempts
at a level that already struggled. Restart automatic quality clears the cap.
Idle periods, hidden tabs, manual mode, and startup do not count as healthy
samples. Page frame intervals are a proxy for responsiveness, not GPU timings.

Browser verification at 1280×800/device scale 2: without CPU throttling, all
five effects enabled in order and the page held 60 FPS. At 4× CPU slowdown,
the controller removed bloom, then AO, and recovered from roughly 43 FPS to
59.5–60 FPS with shadows and lighting. The runtime load version stayed at 1
through upgrades, rollbacks, manual DPR changes, and a reset. Skills stayed at
the basic level while idle, and key-driven labels remained functional. Checks:
32 Portfolio tests, 252 Chibi tests, both runtime/Portfolio typechecks, and lint
on the changed keyboard/runtime components passed. The source change also lives
in the sibling Chibi checkout; its next package release has not been published.
Chibi's full source typecheck passed; its full-project lint still reports the
existing effect-state error in the untouched `ExportDialog.tsx:71`.

## Performance sampling, October 2026

The following measurements predate automatic quality. They compare fixed
settings and motivated the conservative startup and effect order above. Cat
visibility updates only when its displayed frame changes, rather than on every
GSAP tick.

Measured on the existing development preview with Chrome DevTools, a 1280×800
viewport, device scale factor 2, and 4× CPU slowdown. Samples collect page RAF
intervals for eight seconds after settling. Temporary WebGL draw-method counters
measure draw submissions from the keyboard canvas, not rendered frames or GPU
time. The graphics panel was closed during samples.

| Scenario | Page FPS | Keyboard draw calls/second |
| --- | ---: | ---: |
| Original Hero, DPR 2, AO on | 39–40 | 3,300–3,420 |
| Original Projects, DPR 2, AO on | 40.8 | 3,593 |
| Projects after cat update guard, AO on | 52.9 | 1,471 |
| Hero, DPR 1, AO on | 40.5–40.9 | 3,495–3,518 |
| Hero, DPR 2, AO off | 55.9–58.8 | 3,194–3,354 |
| Projects, DPR 2, AO off, cat guard | 59.5–60.0 | 968–970 |
| Contact after settling, final defaults | 59.9 | 0 |

At 390×844, device scale factor 3, the automatic canvas DPR remains capped at
1.5. With 4× CPU slowdown, final defaults measured 56.4 FPS in Hero and 59.9 FPS
in Projects. The mobile Skills view and keyboard-driven label selection were
checked. Changing resolution preserved both the selected label and runtime load
version. All 26 unit tests, typecheck, and keyboard ESLint passed.

These are development-browser comparisons on one host, not low-end-device or
production benchmarks. CPU throttling does not emulate a weaker GPU. An initial
post-HMR sample was discarded after the scene had not settled; the table uses
settled samples. No application process or build was started for this run.


## External animation scheduling correction

The existing `@chibi3d/runtime@0.4.0` pnpm patch now includes the shared runtime
frame scheduling correction. Host node writes set a dirty flag; SceneHost
consumes it during rendering and requests one follow-up frame. This keeps GSAP
motion rendering on successive display callbacks without forcing idle scenes
to render continuously. The same implementation lives in Chibi runtime source.

On the running desktop preview, Hero changed from about 30 distinct rendered
poses per second to 60.0, with 360 poses over six seconds and a 16.9 ms p95
interval. Settled Skills produced zero render calls over six seconds. Page
callbacks ran at 60 FPS in both cases, which is why the meter now says Page FPS.
Temporary measurement wrappers were restored afterward. No build or server
restart was performed; a reload confirmed the installed patch was active.
