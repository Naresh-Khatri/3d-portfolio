"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { usePerfProfile } from "@/hooks/use-perf-profile";

const memes = [
  {
    name: "confused-travolta",
    alt: "John Travolta looking around an empty room, confused about where everyone went.",
    caption: "Even he can't find this page.",
  },
  {
    name: "homer-disappearing",
    alt: "Homer Simpson slowly disappearing into a hedge.",
    caption: "Actual footage of this page disappearing.",
  },
  {
    name: "confused-math",
    alt: "A confused woman trying to make sense of floating math equations.",
    caption: "Doing the math. Still getting 404.",
  },
  {
    name: "napoleon-waiting",
    alt: "Napoleon Dynamite sitting on some steps, waiting impatiently.",
    caption: "Waiting won't make this page exist.",
  },
] as const;

export default function NotFoundMeme() {
  const { reducedMotion, lowEnd } = usePerfProfile();
  const [paused, setPaused] = useState(false);
  const [meme, setMeme] = useState<(typeof memes)[number] | null>(null);
  const allowAnimation = !reducedMotion && !lowEnd;
  const playing = allowAnimation && !paused;

  useEffect(() => {
    // Pick after hydration so server and client markup agree on the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeme(memes[Math.floor(Math.random() * memes.length)]);
  }, []);

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-muted/40">
      <div className="relative aspect-[2/1] w-full bg-black" aria-busy={!meme}>
        {meme && (
          <Image
            src={`/assets/404/${meme.name}${playing ? "" : "-still"}.gif`}
            alt={meme.alt}
            fill
            unoptimized
            className="object-contain"
          />
        )}
      </div>
      <figcaption className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 text-left">
        <span className="text-sm text-muted-foreground">
          {meme?.caption ?? "Looking for this page..."}
        </span>
        {meme && allowAnimation && (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={playing ? "Pause GIF" : "Play GIF"}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {playing
              ? <Pause className="h-4 w-4" aria-hidden="true" />
              : <Play className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
