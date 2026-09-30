"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { usePerfProfile } from "@/hooks/use-perf-profile";

export default function MotionPreferences({ children }: { children: React.ReactNode }) {
  const { reducedMotion, ready } = usePerfProfile();

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.motion = reducedMotion ? "off" : "on";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [ready, reducedMotion]);

  return (
    <MotionConfig reducedMotion={ready ? (reducedMotion ? "always" : "never") : "user"}>
      {children}
    </MotionConfig>
  );
}
