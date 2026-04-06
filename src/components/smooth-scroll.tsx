"use client";

import React, { useEffect } from "react";
import { ReactLenis, useLenis } from "@/lib/lenis";

interface LenisProps {
  children: React.ReactNode;
  isInsideModal?: boolean;
}

function SmoothScroll({ children, isInsideModal = false }: LenisProps) {
  const lenis = useLenis(({ scroll }) => {
    // called every scroll
  });

  useEffect(() => {
    const handleReady = () => {
      lenis?.stop();
      lenis?.start();
    };
    document.addEventListener("DOMContentLoaded", handleReady);
    return () => document.removeEventListener("DOMContentLoaded", handleReady);
  }, [lenis]);

  return (
    <ReactLenis
      root
      options={{
        duration: 2,
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
