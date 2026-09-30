"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { usePerfProfile } from "@/hooks/use-perf-profile";

interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const SectionWrapper = ({ id, className, children, ...props }: SectionWrapperProps) => {
  const { reducedMotion } = usePerfProfile();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

  return (
    <section
      id={id}
      ref={containerRef}
      className={cn("relative", className)}
      {...props}
    >
      <motion.div
        style={{ opacity: reducedMotion ? 1 : opacity, scale: reducedMotion ? 1 : scale }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </section>
  );
};

export default SectionWrapper;
