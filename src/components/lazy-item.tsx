"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LazyItemProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export default function LazyItem({ 
  children, 
  className,
  delay = 0,
  threshold = 0.1 
}: LazyItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold, rootMargin: "50px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, hasAnimated]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

