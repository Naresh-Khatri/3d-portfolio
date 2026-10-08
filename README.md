# 🚀 3D Portfolio

A jaw-dropping developer portfolio packed with interactive 3D animations, buttery smooth transitions, and a space-themed aesthetic. Not your average portfolio template! This one has a fully interactive 3D keyboard where each keycap is a skill.

> **Free to use!** This portfolio is open source. If you use it, a credit/link back would be really appreciated 🙏

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Naresh-Khatri/3d-portfolio)

![Portfolio Preview](https://github.com/Naresh-Khatri/Portfolio/blob/main/public/assets/projects-screenshots/portfolio/landing.png?raw=true)

## ✨ Features

- **Interactive 3D Keyboard** — Programmatically generated Chibi keyboard where each keycap represents a skill, revealing titles and descriptions on hover/press
- **Buttery Animations** — GSAP + Framer Motion powered scroll, hover, and reveal animations
- **Space Theme** — Floating particles on a dark canvas for a cosmic vibe
- **Light & Dark Mode** — Full theme support with cheeky disclaimer toasts
- **Responsive** — Works across all screen sizes
- **Contact Form** — Email delivery via Resend
- **Analytics** _(optional)_ — Umami analytics integration

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16.2.2, React 19.2.4, TypeScript |
| **Styling** | Tailwind CSS, Shadcn UI, Aceternity UI |
| **Animation** | GSAP, Framer Motion |
| **3D** | @chibi3d/runtime, Three.js, React Three Fiber |
| **Email** | Resend |
| **Misc** | Lenis (smooth scroll), Zod, next-themes |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9+ for Next.js 16; use a current LTS release with pnpm 11
- pnpm 11.20.0

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/Naresh-Khatri/3d-portfolio.git
    cd 3d-portfolio
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Set up environment variables:**

    Copy `.env.example` to `.env.local` and fill in the values:

    ```bash
    cp .env.example .env.local
    ```

    | Variable | Required | Description |
    |---|---|---|
    | `RESEND_API_KEY` | Yes | API key from [Resend](https://resend.com) for the contact form |
    | `NEXT_PUBLIC_WS_URL` | No | WebSocket server URL for realtime features (cursors, chat, presence) |
    | `UMAMI_DOMAIN` | No | Umami analytics script URL |
    | `UMAMI_SITE_ID` | No | Umami website ID |

4. **Run the development server:**

    ```bash
    pnpm dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) and see the magic ✨

---

## Code checks

Run these before opening a pull request:

```bash
pnpm lint
pnpm typecheck
```

Next.js 16 no longer runs lint during builds. The ESLint CLI uses `eslint.config.mjs`. New React Compiler diagnostics for refs, immutability, effect state updates, and manual memoization report warnings while existing animation and realtime components are migrated. Hook ordering violations remain errors.

Blog frontmatter requires a title, summary, and `publishedAt` date in `YYYY-MM-DD` format. Optional fields are `image`, `author`, and a list of `tags`. Invalid frontmatter raises a content error; unknown blog slugs return a 404.

Files under `public/assets` can be replaced at the same URL and cache for one hour before revalidation. Next.js content-hashed static assets retain immutable caching.

---

## 🎨 Make It Your Own

All personal info is centralized in [`src/data/config.ts`](src/data/config.ts). Edit this single file to rebrand the portfolio:

```ts
const config = {
  title: "Your Name | Your Title",
  description: {
    long: "Your long description for SEO...",
    short: "Your short description...",
  },
  keywords: ["your", "keywords"],
  author: "Your Name",
  email: "you@example.com",
  site: "https://yoursite.com",

  // GitHub stars button in the header
  githubUsername: "your-github-username",
  githubRepo: "your-repo-name",

  social: {
    twitter: "https://x.com/you",
    linkedin: "https://linkedin.com/in/you",
    instagram: "https://instagram.com/you",
    facebook: "https://facebook.com/you",
    github: "https://github.com/you",
  },
};
```

Other files you'll want to customize:

| File | What to change |
|---|---|
| `src/data/projects.tsx` | Your projects, screenshots, descriptions, and tech stacks |
| `src/data/constants.ts` | Skills list (name, description, icon) and work experience |
| `public/assets/` | Your images, OG image, and project screenshots |

---

## ⌨️ Updating the 3D Keyboard Skills

The keyboard is generated in `src/components/keyboard/scene.ts` from `SKILLS`
in `src/data/constants.ts`. Adding, removing, or reordering skills updates the
layout. The default is six columns, with one key per skill and no filler keys.
No scene editor or hosted scene is needed.

Each skill supplies `name`, `label`, `shortDescription`, `color`, and `icon`.
Optional `keyboardColor` sets the keycap plastic independently of the HTML
accent. Optional `keyboardIcon` selects local monochrome artwork for the keycap, while
`icon` remains the normal HTML image. Optional `shortcut` uses a browser
`KeyboardEvent.code`, such as `KeyR` or `Digit1`. Defaults follow QWERTY order;
skills beyond the 26 letter shortcuts remain available by pointer/touch.
Names and explicit shortcuts must be unique. Keep the `SkillNames` enum and
`SKILLS` record consistent, as other sections also reference these skills.

Place artwork under `public/assets/keyboard/logos/`. The reusable keycap and
case mesh lives at `public/assets/keyboard/keycaps.glb`; scene generation sizes
the case and lays out keys. Projects uses the original two Spline cat frames on
scene planes at the back rim. The 404 route is plain HTML.

Portfolio owns scene generation, GSAP section/reveal animations, mesh-based skill
labels, input, and browser audio. Chibi receives standard JSON plus an asset
resolver. Sound files stay in `public/assets/keycap-sounds/` and play through
AudioContext after a browser gesture. No audio engine belongs to Chibi.

Portfolio pins `@chibi3d/runtime@0.4.0` from npm. A normal `pnpm install` is
sufficient; there is no local-source alias, sibling checkout, or vendored runtime.
A checked-in pnpm patch adds the `orthographic` and live `environment` host props. It applies on install;
restart the dev server afterward. Update the pinned version deliberately and
remove the patch once the runtime release includes both APIs. Keyboard effects
start disabled and enable gradually from sustained frame-time samples during
motion. Quality changes preserve the scene and key selection; struggling levels
are disabled for the rest of the visit. The graphics panel offers manual controls.

The runtime chunk loads only when motion settings allow 3D. Reduced motion,
Data Saver, missing WebGL, failed assets, and context loss retain the HTML skill
grid. DPR is capped by `usePerfProfile`; GSAP and engine animation pause when
the tab is hidden. These policies do not establish a low-end-device FPS claim.

Run `pnpm test`, `pnpm typecheck`, and `pnpm lint` after changing the keyboard.
Browser acceptance: desktop hover/chords, touch drag/cancel, fast section
changes during reveal, mobile framing, light/dark backgrounds, tab resume,
reduced-motion toggling, and failed-asset fallback. See
`src/components/keyboard/README.md` for ownership and release status.

---

## 🔌 Realtime Features (Optional)

The portfolio supports optional realtime features powered by a **separate backend API**:

- 🖱️ **Live cursors** — See other visitors' cursors in realtime
- 👥 **Online presence** — Shows who's currently on the site
- 💬 **Chat** — Live chat between visitors

These features activate automatically when the `NEXT_PUBLIC_WS_URL` environment variable is set. Without it, the portfolio works perfectly fine as a static site — no realtime features, no backend dependency.

> [!NOTE]
> The backend API is **not open source**. This is intentional! Too many people have cloned the portfolio and claimed they built it from scratch. The realtime server stays private to keep the live experience unique make make it standout.


---

## 🚀 Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Naresh-Khatri/3d-portfolio)

This site is deployed on **Vercel**. To deploy your own:

1. Push your code to a GitHub repository
2. Connect the repository to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Vercel handles the rest — automatic deployments on every push

---

## 🤝 Contributing

If you'd like to contribute or suggest improvements, feel free to open an issue or submit a pull request. All contributions are welcome!

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

If you use this portfolio, a credit or link back to the [original repo](https://github.com/Naresh-Khatri/3d-portfolio) would be much appreciated ❤️

Note on analytics: a deployed copy reports its own hostname once per browser (nothing else — no visitor, page, or referrer data) so I can see where the template gets used.
