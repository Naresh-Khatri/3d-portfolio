# Keyboard migration comparison

Compared `https://nareshkhatri.dev` and `http://localhost:3001` on October 4, 2026.
Both preview tabs used the same desktop viewport. The screenshots are saved
browser artifacts on this machine. Hero rotates continuously, so its captures
show different animation phases. Contact captures also differ in scroll position.

| Section | Old site | Migration before corrections |
| --- | --- | --- |
| Hero | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-nareshkhatri-dev-mutoohg6-759e763f.png) | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mutoosms-315d8f49.png) |
| Skills | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-nareshkhatri-dev-mutopp2a-a1959543.png) | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mutopq1e-9abfb1d2.png) |
| Projects | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-nareshkhatri-dev-mutopaqp-78e70383.png) | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mutopble-1cf3df8e.png) |
| Contact | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-nareshkhatri-dev-mutoq9j5-ab2c9da9.png) | [Screenshot](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mutoqbeu-1dd539a6.png) |

## Corrected projects

![Corrected keyboard angle and original Bongo artwork](/home/naresh/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mutos9wf-2afbbb05.png)

The original section yaw and Spline cat transform restore the composition.
This screenshot checks the resting pose only. The later animation correction
restores the original three-axis Euler flip between sections; it needs a new
browser recording to verify the transition against the old site.
Materials and logo artwork still differ from the deployed site; this correction
does not replace the migration's skill list or rendering setup.

## Remaining visual checks

Browser automation disconnected after the corrected Projects capture.

- Compare Hero at the same elapsed animation time, including its resting pose.
- Confirm Contact's five-second board yoyo and randomized, staggered key
  rise/linear-return cycles. Scroll away during both phases and confirm the
  keys settle over four seconds after the exit delay.
- Check desktop and mobile section transitions, including direct `#contact`
  loading and resize during a transition.

Automated verification: 35 unit tests, typecheck, and keyboard ESLint passed.
The real-GSAP regression checks two complete key cycles and settling on exit.
