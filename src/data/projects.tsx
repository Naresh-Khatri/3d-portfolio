import AceTernityLogo from "@/components/logos/aceternity";
import SlideShow from "@/components/slide-show";
import { Button } from "@/components/ui/button";
import { TypographyH3, TypographyP } from "@/components/ui/typography";
import { ArrowUpRight, ExternalLink, Link2, MoveUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
// Spline has no thesvg entry — keep the Three.js mark as its stand-in.
import { SiThreedotjs } from "react-icons/si";
const BASE_PATH = "/assets/projects-screenshots";

// Renders a brand SVG from /public as a monochrome glyph that inherits the
// surrounding text color (the skill dock styles every icon via currentColor),
// so full-color marks like Mistral flatten to match the rest of the set.
const MaskIcon = ({ src, title }: { src: string; title?: string }) => (
  <span
    role="img"
    aria-label={title}
    className="block bg-current"
    style={{
      width: "1em",
      height: "1em",
      WebkitMaskImage: `url(${src})`,
      maskImage: `url(${src})`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    }}
  />
);

const ProjectsLinks = ({ live, repo }: { live?: string; repo?: string }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-start gap-3 my-3 mb-8">
      {live && live !== "#" && (
        <Link
          className="font-mono underline flex gap-2"
          rel="noopener"
          target="_new"
          href={live}
        >
          <Button variant={"default"} size={"sm"}>
            Visit Website
            <ArrowUpRight className="ml-3 w-5 h-5" />
          </Button>
        </Link>
      )}
      {repo && repo !== "#" && (
        <Link
          className="font-mono underline flex gap-2"
          rel="noopener"
          target="_new"
          href={repo}
        >
          <Button variant={"default"} size={"sm"}>
            Github
            <ArrowUpRight className="ml-3 w-5 h-5" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export type Skill = {
  title: string;
  bg: string;
  fg: string;
  icon: ReactNode;
};
// Brand chips sourced from thesvg CLI mono SVGs in /public/assets/logos,
// rendered via MaskIcon so each one inherits the dock's currentColor.
const brand = (title: string, file: string): Skill => ({
  title,
  bg: "black",
  fg: "white",
  icon: <MaskIcon src={`/assets/logos/${file}`} title={title} />,
});
const PROJECT_SKILLS = {
  next: brand("Next.js", "nextdotjs-mono.svg"),
  chakra: brand("Chakra UI", "chakra-ui-mono.svg"),
  node: brand("Node.js", "nodedotjs-mono.svg"),
  python: brand("Python", "python-mono.svg"),
  prisma: brand("Prisma", "prisma-mono.svg"),
  postgres: brand("PostgreSQL", "postgresql-mono.svg"),
  mongo: brand("MongoDB", "mongodb-mono.svg"),
  express: brand("Express", "express-mono.svg"),
  reactQuery: brand("React Query", "react-query-mono.svg"),
  shadcn: brand("shadcn/ui", "shadcn-ui-mono.svg"),
  // Not in the thesvg registry — keep the existing custom logo.
  aceternity: {
    title: "Aceternity",
    bg: "black",
    fg: "white",
    icon: <AceTernityLogo />,
  },
  tailwind: brand("Tailwind", "tailwind-css-mono.svg"),
  docker: brand("Docker", "docker-mono.svg"),
  // Not in the thesvg registry — keep the text mark.
  yjs: {
    title: "Y.js",
    bg: "black",
    fg: "white",
    icon: (
      <span>
        <strong>Y</strong>js
      </span>
    ),
  },
  firebase: brand("Firebase", "firebase-mono.svg"),
  sockerio: brand("Socket.io", "socketdotio-mono.svg"),
  js: brand("JavaScript", "javascript-mono.svg"),
  ts: brand("TypeScript", "typescript-mono.svg"),
  vue: brand("Vue.js", "vuedotjs-mono.svg"),
  react: brand("React.js", "react-mono.svg"),
  sanity: brand("Sanity", "sanity-mono.svg"),
  // Not in the thesvg registry — keep the Three.js stand-in.
  spline: {
    title: "Spline",
    bg: "black",
    fg: "white",
    icon: <SiThreedotjs />,
  },
  gsap: brand("GSAP", "gsap-mono.svg"),
  motion: brand("Motion", "motion.svg"),
  supabase: brand("Supabase", "supabase-mono.svg"),
  trpc: brand("tRPC", "trpc-mono.svg"),
  drizzle: brand("Drizzle ORM", "drizzle-mono.svg"),
  hono: brand("Hono", "hono-mono.svg"),
  redis: brand("Redis / BullMQ", "redis-mono.svg"),
  cloudflare: brand("Cloudflare", "cloudflare-mono.svg"),
  // React Native reuses the React mark.
  reactNative: brand("React Native", "react-mono.svg"),
  betterAuth: brand("Better Auth", "better-auth-mono.svg"),
  // Not in the thesvg registry — keep the text marks.
  zustand: {
    title: "Zustand",
    bg: "black",
    fg: "white",
    icon: <span className="text-xs font-bold">Zu</span>,
  },
  partykit: {
    title: "PartyKit",
    bg: "black",
    fg: "white",
    icon: <span className="text-base">🎈</span>,
  },
  hocuspocus: {
    title: "Hocuspocus",
    bg: "black",
    fg: "white",
    icon: <span className="text-xs font-bold">Hp</span>,
  },
  // React Flow ships under the xyflow brand.
  reactFlow: brand("React Flow", "xyflow-mono.svg"),
  codemirror: brand("CodeMirror", "codemirror-mono.svg"),
  // "Satori / sharp" — uses the sharp mark.
  satori: brand("Satori / sharp", "sharp-mono.svg"),
  turborepo: brand("Turborepo", "turborepo-mono.svg"),
  // Vercel AI SDK uses the Vercel mark.
  aiSDK: brand("Vercel AI SDK", "vercel-mono.svg"),
  anthropic: brand("Anthropic Claude", "anthropic-mono.svg"),
  mistral: brand("Mistral AI", "mistral-ai-mono.svg"),
  // Not in the thesvg registry — keep the text mark.
  nextIntl: {
    title: "next-intl",
    bg: "black",
    fg: "white",
    icon: <span className="text-xs font-bold">i18n</span>,
  },
  // Not in the thesvg registry — keep the text marks.
  expo: {
    title: "Expo",
    bg: "black",
    fg: "white",
    icon: <span className="text-xs font-bold">Expo</span>,
  },
  mcp: {
    title: "MCP",
    bg: "black",
    fg: "white",
    icon: <span className="text-xs font-bold">MCP</span>,
  },
};
export type Project = {
  id: string;
  category: string;
  title: string;
  src: string;
  screenshots: string[];
  skills: { frontend: Skill[]; backend: Skill[] };
  content: React.ReactNode | any;
  github?: string;
  live: string;
};
const projects: Project[] = [
  {
    id: "storekit",
    category: "Commerce platform",
    title: "StoreKit",
    src: "/assets/projects-screenshots/storekit/landing.png",
    screenshots: ["landing.png"],
    skills: {
      frontend: [
        PROJECT_SKILLS.ts,
        PROJECT_SKILLS.next,
        PROJECT_SKILLS.react,
        PROJECT_SKILLS.reactNative,
        PROJECT_SKILLS.tailwind,
      ],
      backend: [
        PROJECT_SKILLS.hono,
        PROJECT_SKILLS.trpc,
        PROJECT_SKILLS.drizzle,
        PROJECT_SKILLS.postgres,
        PROJECT_SKILLS.redis,
        PROJECT_SKILLS.betterAuth,
        PROJECT_SKILLS.cloudflare,
        PROJECT_SKILLS.docker,
      ],
    },
    live: "https://storekit.app/",
    // Private repo (commercial product) — intentionally no public source link
    get content() {
      return (
        <div>
          <TypographyP className="font-mono text-2xl text-center">
            A production-grade, multi-tenant commerce platform — Shopify-class,
            built solo.
          </TypographyP>
          <TypographyP className="font-mono ">
            Architected and built end-to-end as a single engineer: a
            pnpm/Turborepo monorepo spanning 6 applications and 11 shared
            packages — merchant dashboard, customer storefront, headless REST
            API, and two React Native apps (customer + POS) — with a shared
            type-safe core (54-table Drizzle/Postgres schema, 33 tRPC v11
            routers, end-to-end inference). ~238K lines of TypeScript powering 4
            storefront verticals: e-commerce, food delivery, quick-commerce, and
            digital goods.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />

          <TypographyH3 className="my-4 mt-8">Payments &amp; reliability</TypographyH3>
          <p className="font-mono mb-2">
            A PhonePe payment integration with OAuth2 token exchange, Redis-cached
            per-store tokens, and idempotency keys on orders/transactions/refunds
            so checkout survives refreshes and duplicate webhooks without
            double-charging. Payment credentials are encrypted at rest and webhook
            signatures verified to prevent tampering, with a BullMQ/Redis async
            layer (5 retries, exponential backoff) driving notifications and order
            jobs — every webhook event logged for replay.
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/storekit/orders.png`,
              `${BASE_PATH}/storekit/login.png`,
            ]}
          />

          <TypographyH3 className="my-4 mt-8">AI storefront generation</TypographyH3>
          <p className="font-mono mb-2">
            <em>In progress.</em> An agentic generator where an LLM writes real
            storefront code inside isolated container sandboxes, gated by a
            type-check + lint pass so broken code never lands — then deploys each
            store programmatically as its own Cloudflare Worker through a
            queue-driven pipeline, with a fleet health monitor that auto-rolls-back
            failing deployments within minutes.
          </p>

          <TypographyH3 className="my-4 mt-8">Domain modeling &amp; breadth</TypographyH3>
          <p className="font-mono mb-2">
            An explicit order state-machine spans the 4 verticals with
            illegal-transition guards, fronted by a typed event bus and a
            per-store plugin registry for pluggable lifecycle behavior without
            touching core code. The merchant dashboard ships a visual theme
            builder, analytics, inventory, coupons, abandoned-cart recovery, and
            Pixie — an in-product AI agent that manages the store via tool-calling
            over live data. The POS app does Bluetooth ESC/POS thermal printing,
            mDNS/TCP printer discovery, and barcode scanning.
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/storekit/storefront.png`,
              `${BASE_PATH}/storekit/themes.png`,
            ]}
          />
        </div>
      );
    },
  },
  {
    id: "codingducks",
    category: "Real-time coding platform",
    title: "Coding Ducks",
    src: "/assets/projects-screenshots/codingducks/landing.png",
    screenshots: ["landing.png"],
    skills: {
      frontend: [
        PROJECT_SKILLS.ts,
        PROJECT_SKILLS.next,
        PROJECT_SKILLS.react,
        PROJECT_SKILLS.tailwind,
        PROJECT_SKILLS.codemirror,
        PROJECT_SKILLS.reactFlow,
      ],
      backend: [
        PROJECT_SKILLS.node,
        PROJECT_SKILLS.trpc,
        PROJECT_SKILLS.drizzle,
        PROJECT_SKILLS.postgres,
        PROJECT_SKILLS.yjs,
        PROJECT_SKILLS.hocuspocus,
        PROJECT_SKILLS.betterAuth,
        PROJECT_SKILLS.docker,
      ],
    },
    live: "https://www.codingducks.xyz/",
    github: "https://github.com/Naresh-Khatri/Coding-Ducks",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono text-2xl text-center">
            A multi-language judge, a CRDT collaborative editor, and a
            system-design simulation game — in one platform.
          </TypographyP>
          <TypographyP className="font-mono ">
            Coding Ducks is a full-stack, real-time coding platform built as a
            production-grade Turborepo monorepo (2 apps, 7 shared packages) in
            strict TypeScript — Next.js 16 / React 19, a tRPC v11 type-safe API,
            PostgreSQL + Drizzle ORM (18 tables), and a standalone real-time
            Node service, with enforced one-way apps → packages dependency
            boundaries.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />

          <TypographyH3 className="my-4 mt-8">
            Ducklets — real-time collaborative editor
          </TypographyH3>
          <p className="font-mono mb-2">
            A multiplayer code editor built on Y.js CRDTs and a standalone
            Hocuspocus WebSocket server — concurrent editing, live cursor
            presence, and conflict-free merging persisted to Postgres as
            versioned binary state. Secured by a custom HMAC-SHA256 signed-token
            scheme (constant-time verification, 1-hour TTL) with owner / editor
            / viewer RBAC re-verified live against the DB so permission
            revocation takes effect mid-session. Includes room forking,
            point-in-time snapshots, idempotent chat, and throttled live
            previews (Puppeteer + Cloudflare R2, coalesced to ≤1 render/60s).
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/codingducks/ducklets-editor.png`,
              `${BASE_PATH}/codingducks/ducklets.png`,
            ]}
          />

          <TypographyH3 className="my-4 mt-8">
            CD Judge — in-house code execution engine
          </TypographyH3>
          <p className="font-mono mb-2">
            A free, self-hostable, Judge0-class execution engine supporting 10
            languages (Python, JS, TS, Java, C, C++, Rust, Go, Ruby, PHP) with per-language
            driver/harness generation that injects test cases, parses typed
            arguments, and redacts hidden-test output. An asynchronous submit →
            poll → verdict pipeline uses an optimistic-locking finalizer
            (UPDATE … WHERE status=&apos;running&apos;) to guarantee exactly-once
            streak/scoring under concurrent polling, plus &quot;beats X%&quot;
            runtime-percentile ranking via SQL window aggregates.
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/codingducks/problems.png`,
              `${BASE_PATH}/codingducks/problem.png`,
              `${BASE_PATH}/codingducks/machine-coding.png`,
            ]}
          />

          <TypographyH3 className="my-4 mt-8">
            System Design — simulation game
          </TypographyH3>
          <p className="font-mono mb-2">
            An interactive puzzle game where users assemble architectures from
            16 typed building blocks on a React Flow canvas, then run them
            through a pure-TypeScript, client-side traffic-simulation engine —
            topological propagation, capacity/latency modeling, cache-warmth
            EMA, SPOF detection, and DDoS &amp; chaos-fault injection. A 3-star
            scoring model across reliability / performance / efficiency spans 10
            progressively harder levels, guarded by a calibration suite
            (node&nbsp;--test) that runs reference designs 15× through the real
            engine to assert each level stays beatable-but-hard (optimal ⇒ 3★,
            naive ⇒ ≤2★, broken ⇒ fail).
          </p>
          <SlideShow images={[`${BASE_PATH}/codingducks/sysdesign.png`]} />
        </div>
      );
    },
  },
  {
    id: "gumbalup",
    category: "Real-time quiz platform",
    title: "Gumbalup",
    src: "/assets/projects-screenshots/gumbalup/landing.png",
    screenshots: ["landing.png"],
    skills: {
      frontend: [
        PROJECT_SKILLS.ts,
        PROJECT_SKILLS.next,
        PROJECT_SKILLS.react,
        PROJECT_SKILLS.tailwind,
        PROJECT_SKILLS.motion,
      ],
      backend: [
        PROJECT_SKILLS.trpc,
        PROJECT_SKILLS.partykit,
        PROJECT_SKILLS.drizzle,
        PROJECT_SKILLS.postgres,
        PROJECT_SKILLS.betterAuth,
        PROJECT_SKILLS.cloudflare,
        PROJECT_SKILLS.docker,
      ],
    },
    live: "https://gumbalup.com/",
    // Private repo (commercial product) — intentionally no public source link
    get content() {
      return (
        <div>
          <TypographyP className="font-mono text-2xl text-center">
            A live, interactive quiz &amp; audience-engagement platform — built
            solo, end-to-end.
          </TypographyP>
          <TypographyP className="font-mono ">
            A production-grade, multi-tenant SaaS where organizations build
            quizzes (manually or with AI) and run live, host-driven games —
            players join from any device via room code / QR and compete on a
            real-time, server-authoritative leaderboard. Also supports async
            self-paced quizzes, team mode, anti-cheat monitoring, analytics,
            billing, and white-labeling. ~43.5K lines of TypeScript across 257
            files.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />

          <TypographyH3 className="my-4 mt-8">
            Server-authoritative game engine
          </TypographyH3>
          <p className="font-mono mb-2">
            A real-time game engine on PartyKit (Cloudflare Durable Objects +
            WebSockets): a per-room in-memory state machine with an authoritative
            1-second timer, speed-rank + streak scoring, deterministic
            tie-broken leaderboards, team mode, and graceful reconnect/replay —
            ~2,800 lines of game logic behind a typed message protocol (42
            discriminated-union variants). Correctness is never sent to clients
            during an active question, so players can&apos;t sniff answers or
            game the clock.
          </p>
          <SlideShow images={[`${BASE_PATH}/gumbalup/dashboard.png`]} />

          <TypographyH3 className="my-4 mt-8">
            Edge-to-DB security boundary &amp; AI authoring
          </TypographyH3>
          <p className="font-mono mb-2">
            The edge worker never connects to Postgres directly — it proxies all
            persistence through a shared-secret internal HTTPS API on Next.js,
            keeping the database unreachable from the public internet while the
            worker stays stateless and edge-deployed. A fully type-safe layer (17
            tRPC routers, 5 authorization tiers, Zod) backs it, with LLM-powered
            quiz authoring (Groq / Llama) from topics or uploaded PDFs, quota-
            metered per org, plus analytics with CSV/Excel/PDF export.
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/gumbalup/editor.png`,
              `${BASE_PATH}/gumbalup/library.png`,
            ]}
          />
        </div>
      );
    },
  },
  {
    id: "waku",
    category: "Image rendering platform",
    title: "Waku",
    src: "/assets/projects-screenshots/waku/landing.png",
    screenshots: ["landing.png"],
    skills: {
      frontend: [
        PROJECT_SKILLS.ts,
        PROJECT_SKILLS.next,
        PROJECT_SKILLS.react,
        PROJECT_SKILLS.tailwind,
      ],
      backend: [
        PROJECT_SKILLS.trpc,
        PROJECT_SKILLS.drizzle,
        PROJECT_SKILLS.postgres,
        PROJECT_SKILLS.satori,
        PROJECT_SKILLS.betterAuth,
        PROJECT_SKILLS.cloudflare,
        PROJECT_SKILLS.turborepo,
        PROJECT_SKILLS.docker,
      ],
    },
    live: "https://waku.nareshkhatri.dev",
    github: "https://github.com/Naresh-Khatri/waku",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono text-2xl text-center">
            An on-demand dynamic image-generation service — &quot;design once,
            ship a typed URL endpoint.&quot;
          </TypographyP>
          <TypographyP className="font-mono ">
            Design a template once in a Canva-like editor, then get a typed URL
            that renders images with live, dynamic data on demand (currently
            focused on OG images). Built as a 7-package Turborepo monorepo
            (Next.js 15 / React 19 / TypeScript) — a visual editor, an edge render
            service, a 3-stage rendering engine, typed SDKs, and shared DB/font
            packages. 25K+ LOC, MIT-licensed and self-hostable via
            docker-compose.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />

          <TypographyH3 className="my-4 mt-8">
            Deterministic render pipeline &amp; URL contract
          </TypographyH3>
          <p className="font-mono mb-2">
            A deterministic pipeline (TemplateDocument → Satori → Resvg → sharp)
            compiles a flat node IR to SVG and rasterizes to PNG/WebP/JPEG with
            HTTP Accept-based format negotiation, dynamic font subsetting from a
            CDN (25 families, Latin unicode-range parsing), and retina-aware
            transcoding — served behind an immutable Cache-Control: max-age=1y URL
            contract. Query params are sorted before encoding so any input order
            maps to one cache key; versioned URLs are immutable while published
            URLs 302-redirect to a numbered version, so edits never break
            previously-shared links.
          </p>
          <SlideShow images={[`${BASE_PATH}/waku/preview.png`]} />

          <TypographyH3 className="my-4 mt-8">
            Canva-like editor &amp; AI template generation
          </TypographyH3>
          <p className="font-mono mb-2">
            A visual editor built from scratch (no Figma/tldraw/Fabric) on raw
            pointer events + a Zustand store: edge/center snap guides,
            scroll-anchored + pinch zoom (5%–800%), a 100-entry coalesced
            undo/redo stack, and a parameter-binding system that turns any field
            into a typed URL param. An AI agent generates full templates from a
            prompt, validated against a Zod document schema. The public image
            proxy is also SSRF-hardened (private-IP/CIDR blocking, redirect
            re-validation, streaming size caps, and per-user/IP rate limiting).
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/waku/editor.png`,
              `${BASE_PATH}/waku/ai.png`,
            ]}
          />
        </div>
      );
    },
  },
  {
    id: "peakposts",
    category: "AI social SaaS",
    title: "PeakPosts",
    src: "/assets/projects-screenshots/peakposts/landing.png",
    screenshots: ["landing.png"],
    skills: {
      frontend: [
        PROJECT_SKILLS.ts,
        PROJECT_SKILLS.next,
        PROJECT_SKILLS.react,
        PROJECT_SKILLS.tailwind,
        PROJECT_SKILLS.motion,
        PROJECT_SKILLS.nextIntl,
      ],
      backend: [
        PROJECT_SKILLS.trpc,
        PROJECT_SKILLS.drizzle,
        PROJECT_SKILLS.postgres,
        PROJECT_SKILLS.betterAuth,
        PROJECT_SKILLS.aiSDK,
        PROJECT_SKILLS.anthropic,
        PROJECT_SKILLS.mistral,
        PROJECT_SKILLS.cloudflare,
      ],
    },
    // Private repo (commercial product) — intentionally no public source link
    live: "https://peakposts.ai/",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono text-2xl text-center">
            A multi-tenant SaaS that turns QR-scanned diner reviews into
            AI-generated, multi-language social posts — built solo, end-to-end.
          </TypographyP>
          <TypographyP className="font-mono ">
            A production-grade, multi-tenant SaaS (~50K lines of TypeScript) on
            the Next.js 15 App Router with end-to-end type safety from PostgreSQL
            → Drizzle ORM → tRPC v11 → React, serving five distinct audiences —
            diners, brand owners, counter staff, platform admins, and public
            marketing — from a single application. 208 React components, 14 tRPC
            routers, a normalized 19-table schema, and 5 AI subsystems across 5
            languages.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />

          <TypographyH3 className="my-4 mt-8">
            Peakie — agentic AI analytics assistant
          </TypographyH3>
          <p className="font-mono mb-2">
            A hand-rolled tool-calling loop on the Vercel AI SDK (Mistral) over 10
            brand-scoped tools — no agent framework — hardened against
            small-model failure modes: spin-detection, hallucinated-tool-name
            repair, per-tool and total over-fetch caps, exact-call de-duplication,
            a token-budget history trimmer, and forced tool-choice on the final
            step to guarantee termination within 6 steps. A terminal{" "}
            <code>present_actions</code> tool forces structured, deep-linkable
            answers, and every AI-produced link is re-validated against the
            user&apos;s accessible scope so a hallucinated or out-of-scope
            resource ID can never leak across tenant boundaries.
          </p>
          <SlideShow images={[`${BASE_PATH}/peakposts/dashboard.png`]} />

          <TypographyH3 className="my-4 mt-8">
            AI content-generation pipeline
          </TypographyH3>
          <p className="font-mono mb-2">
            An Anthropic Claude pipeline converts a star rating + photo + note
            into platform-tailored social captions across 6 platforms and 5
            languages using Zod-schema-enforced structured output, brand-voice
            configuration, content moderation, and deterministic fallbacks so
            generation never hard-fails. The diner&apos;s locale does double duty
            — selecting both the UI catalog and the language the AI writes in
            (e.g. picking Chinese yields a Xiaohongshu-style caption). A
            retrieval-augmented help center pairs Mistral embeddings + cosine
            similarity with a weighted-TF lexical fallback for API outages.
          </p>
          <SlideShow images={[`${BASE_PATH}/peakposts/posts.png`]} />

          <TypographyH3 className="my-4 mt-8">
            In-browser video editor &amp; multi-tenant security
          </TypographyH3>
          <p className="font-mono mb-2">
            Diners generate H.264 MP4 video and images entirely client-side via
            the WebCodecs <code>VideoEncoder</code> + mp4-muxer and Canvas 2D,
            inside a direct-manipulation post editor (pinch/rotate/drag gestures,
            caption presets, CJK font subsetting) — zero server-side render cost.
            The multi-step diner flow persists to IndexedDB via a custom Zustand
            adapter, with client-side image compression and presigned
            direct-to-R2 uploads. Underneath sits a five-tier tRPC authorization
            layer with brand- vs. outlet-scoped grants, existence-masking
            (<code>NOT_FOUND</code> over <code>FORBIDDEN</code>), and two-factor
            counter auth — a hashed device token plus per-staff PIN with
            brute-force lockout.
          </p>
        </div>
      );
    },
  },
  {
    id: "kanbi",
    category: "Realtime project tracker",
    title: "Kanbi",
    src: "/assets/projects-screenshots/kanbi/landing.png",
    screenshots: ["landing.png"],
    skills: {
      frontend: [
        PROJECT_SKILLS.ts,
        PROJECT_SKILLS.next,
        PROJECT_SKILLS.react,
        PROJECT_SKILLS.reactNative,
        PROJECT_SKILLS.expo,
        PROJECT_SKILLS.tailwind,
      ],
      backend: [
        PROJECT_SKILLS.trpc,
        PROJECT_SKILLS.drizzle,
        PROJECT_SKILLS.postgres,
        PROJECT_SKILLS.betterAuth,
        PROJECT_SKILLS.mcp,
        PROJECT_SKILLS.cloudflare,
        PROJECT_SKILLS.turborepo,
        PROJECT_SKILLS.docker,
      ],
    },
    live: "https://kanbi.nareshkhatri.dev",
    github: "https://github.com/naresh-Khatri/kanbi",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono text-2xl text-center">
            A keyboard-first, realtime Kanban tracker — &quot;Linear, but small
            enough to own.&quot;
          </TypographyP>
          <TypographyP className="font-mono ">
            A full-stack TypeScript monorepo (pnpm + Turborepo) spanning three
            deployable surfaces — a Next.js 15 web app, an OAuth-secured MCP
            server for AI agents, and an Expo mobile companion — with end-to-end
            type safety from Postgres → Drizzle → tRPC v11 → React, so a schema
            change ripples to compile errors in the UI with zero codegen. ~21K
            lines of TypeScript, 16 domain tRPC routers, a 25-table schema, and 8
            scoped MCP agent tools.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />

          <TypographyH3 className="my-4 mt-8">
            Realtime collaboration &amp; fractional ordering
          </TypographyH3>
          <p className="font-mono mb-2">
            Drag-and-drop boards with optimistic UI and live multi-user updates,
            powered by tRPC subscriptions over Server-Sent Events. An in-process
            event bus broadcasts <code>boardId</code>-scoped invalidation signals
            that carry <em>no payload</em> — clients simply refetch through React
            Query, keeping the realtime layer cheap and consistent. Mutations
            snapshot-and-rollback (<code>onMutate</code>/<code>onError</code>/
            <code>onSettled</code>) and deletes are undoable (6-second deferred
            server call + toast). Columns and cards order via fractional indexing
            — new items insert at the midpoint between neighbors, so a reorder
            touches one row instead of re-sequencing the whole list, with collapse
            detection and rebalancing.
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/kanbi/board.png`,
              `${BASE_PATH}/kanbi/dashboard.png`,
            ]}
          />

          <TypographyH3 className="my-4 mt-8">
            One auth model, three clients &amp; an MCP server for AI agents
          </TypographyH3>
          <p className="font-mono mb-2">
            A layered, type-safe authorization model encodes access control at the
            procedure level — <code>protectedProcedure</code> →{" "}
            <code>projectProcedure</code> → <code>boardProcedure</code> →{" "}
            <code>publicBoardProcedure</code> (share token, no auth) — with role
            checks gating every mutation. The same model is reused across three
            entry points so ACLs can&apos;t drift: browser cookies, hashed
            per-device bearer tokens for mobile (SHA-256 at rest), and OAuth-2.1
            JWTs for AI agents. The spec-compliant MCP server (Streamable HTTP)
            exposes 8 read/write tools through a full OAuth 2.1 flow — dynamic
            client registration, a consent screen, JWKS-verified JWTs — each tool a
            thin wrapper over the existing tRPC procedures via a JWT→session
            bridge, so permissions, validation, ordering, and the realtime bus are
            all reused; agent-authored HTML is server-side sanitized.
          </p>
          <SlideShow images={[`${BASE_PATH}/kanbi/profile.png`]} />

          <TypographyH3 className="my-4 mt-8">
            Native Android dock dashboard &amp; AI task drafting
          </TypographyH3>
          <p className="font-mono mb-2">
            A custom native Android Expo module written in Kotlin implements
            Android&apos;s <code>DreamService</code> (the system daydream): dock
            the phone and the OS launches a React Native root view rendering the
            active task and a Pomodoro timer — a genuine focus dashboard, with{" "}
            <code>showWhenLocked</code>, screen-on, and keyguard dismissal handled
            natively. Devices pair by QR with secure token storage
            (<code>expo-secure-store</code>). On the web, paste a raw client
            message and a Groq-backed LLM extracts structured, actionable issues
            (title, description, label, priority); rich-text descriptions use Tiptap
            with <code>@mention</code> and <code>#ticket</code> cross-reference
            extensions.
          </p>
          <SlideShow images={[`${BASE_PATH}/kanbi/ai-draft.png`]} />
        </div>
      );
    },
  },
  {
    id: "portfolio",
    category: "Portfolio",
    title: "My Portfolio",
    src: "/assets/projects-screenshots/portfolio/landing.png",
    screenshots: ["1.png"],
    live: "https://nareshkhatri.dev",
    github: "https://github.com/Naresh-Khatri/Portfolio",
    skills: {
      frontend: [
        PROJECT_SKILLS.ts,
        PROJECT_SKILLS.next,
        PROJECT_SKILLS.tailwind,
        PROJECT_SKILLS.motion,
        PROJECT_SKILLS.spline,
      ],
      backend: [],
    },
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            Welcome to my digital playground, where creativity meets code in the
            dopest way possible.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <TypographyH3 className="my-4 mt-8">
            Beautiful 3D Objects{" "}
          </TypographyH3>
          <p className="font-mono mb-2">
            Did you see that 3D keyboard modal? Yeah! I made that. That
            interactive keyboard is being rendered in 3D on a webpage 🤯, and
            pressing each keycap reveals a skill in a goofy way. It&apos;s like
            typing, but make it art.
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/portfolio/landing.png`,
              `${BASE_PATH}/portfolio/skills.png`,
            ]}
          />
          <TypographyH3 className="my-4 ">Space Theme</TypographyH3>
          <p className="font-mono mb-2">
            Dark background + floating particles = out-of-this-world cool.
          </p>
          <SlideShow images={[`${BASE_PATH}/portfolio/navbar.png`]} />
          <TypographyH3 className="my-4 mt-8">Projects</TypographyH3>

          <p className="font-mono mb-2">
            My top personal and freelance projects — no filler, all killer.
          </p>
          <SlideShow
            images={[
              `${BASE_PATH}/portfolio/projects.png`,
              `${BASE_PATH}/portfolio/project.png`,
            ]}
          />
          <p className="font-mono mb-2 mt-8 text-center">
            This site&apos;s not just a portfolio — it&apos;s a whole vibe.
          </p>
        </div>
      );
    },
  },
];
export default projects;
