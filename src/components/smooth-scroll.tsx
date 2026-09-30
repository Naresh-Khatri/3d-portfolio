"use client";

import React, { useEffect } from "react";
import { ReactLenis, useLenis } from "@/lib/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePerfProfile } from "@/hooks/use-perf-profile";

gsap.registerPlugin(ScrollTrigger);

interface LenisProps {
  children: React.ReactNode;
  isInsideModal?: boolean;
}

function SmoothScroll({ children, isInsideModal = false }: LenisProps) {
  // Re-evaluate every ScrollTrigger on each Lenis scroll frame. Otherwise Lenis
  // smooths scrolling on its own loop while ScrollTrigger samples independently,
  // so a fast flick jumps past a trigger's start line unevaluated and its
  // onEnter/onLeaveBack (which drive the keyboard's active-section state) never
  // fire — leaving section animations like the contact keycap "float" stuck.
  const { reducedMotion } = usePerfProfile();
  const lenis = useLenis(() => ScrollTrigger.update());

  useEffect(() => {
    if (!lenis) return;
    // Drive Lenis from GSAP's ticker (its own RAF is off via autoRaf below) so
    // scroll and ScrollTrigger share one clock; kill lag smoothing so a dropped
    // frame can't skip a large scroll delta.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(raf);
  }, [lenis]);

  return (
    <ReactLenis
      root
      autoRaf={false}
      options={{
        duration: reducedMotion ? 0 : 2,
        smoothWheel: !reducedMotion,
        prevent: (node) => {
          if (isInsideModal) return true;
          const modalOpen = node.classList.contains("modall");
          return modalOpen;
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;
