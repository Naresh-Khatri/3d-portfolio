"use client";

import { motion, useAnimation, useInView } from "motion/react";

import { cn } from "@/lib/utils";
import { usePerfProfile } from "@/hooks/use-perf-profile";
import { ReactNode, useEffect, useRef } from "react";

interface BlurIntProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: {
    hidden: { filter: string; opacity: number };
    visible: { filter: string; opacity: number };
  };
  duration?: number;
}
export const BlurIn = ({
  children,
  className,
  variant,
  delay = 0,
  duration = 1,
}: BlurIntProps) => {
  const { reducedMotion } = usePerfProfile();
  const defaultVariants = {
    hidden: { filter: "blur(10px)", opacity: 0 },
    visible: { filter: "blur(0px)", opacity: 1 },
  };
  const combinedVariants = reducedMotion
    ? { hidden: { filter: "none", opacity: 1 }, visible: { filter: "none", opacity: 1 } }
    : variant || defaultVariants;

  return (
    <motion.div
      initial="hidden"
      animate={reducedMotion ? { filter: "none", opacity: 1 } : "visible"}
      transition={{ duration: reducedMotion ? 0 : duration, delay: reducedMotion ? 0 : delay }}
      variants={combinedVariants}
      className={cn(
        className
        // "font-display text-center text-4xl font-bold tracking-[-0.02em] drop-shadow-sm md:text-7xl md:leading-[5rem]"
      )}
    >
      {children}
    </motion.div>
  );
};

interface BoxRevealProps {
  children: React.JSX.Element;
  width?: "fit-content" | "100%";
  boxColor?: string;
  duration?: number;
  delay?: number;
  once?: boolean;
}
export const BoxReveal = ({
  children,
  width = "fit-content",
  boxColor,
  duration,
  delay,
  once = true,
}: BoxRevealProps) => {
  const { reducedMotion } = usePerfProfile();
  const mainControls = useAnimation();
  const slideControls = useAnimation();

  const ref = useRef(null);
  const isInView = useInView(ref, { once });

  useEffect(() => {
    if (reducedMotion) {
      slideControls.stop();
      mainControls.stop();
      slideControls.set("visible");
      mainControls.set("visible");
    } else if (isInView) {
      slideControls.start("visible");
      mainControls.start("visible");
    } else {
      slideControls.start("hidden");
      mainControls.start("hidden");
    }
  }, [isInView, mainControls, slideControls, reducedMotion]);

  return (
    <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        variants={{
          hidden: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial={reducedMotion ? "visible" : "hidden"}
        animate={mainControls}
        transition={{ duration: reducedMotion ? 0 : duration ?? 0.5, delay }}
      >
        {children}
      </motion.div>

      <motion.div
        variants={{
          hidden: { left: 0 },
          visible: { left: "100%" },
        }}
        initial={reducedMotion ? "visible" : "hidden"}
        animate={slideControls}
        transition={{
          duration: reducedMotion ? 0 : duration ?? 0.5,
          ease: "easeIn",
          delay,
        }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ? boxColor : "#ffffff00",
        }}
      />
    </div>
  );
};

interface RevealAnimationProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function RevealAnimation({
  children,
  delay = 0,
  duration = 0.5,
  className,
}: RevealAnimationProps) {
  const { reducedMotion } = usePerfProfile();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={reducedMotion ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reducedMotion ? 0 : duration, delay: reducedMotion ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
