import React, { useRef, useEffect, MutableRefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, Position } from './types';
import { usePerfProfile } from '@/hooks/use-perf-profile';

interface RadialMenuPresentationalProps {
  isOpen: boolean;
  disabled?: boolean;
  position: Position;
  items: MenuItem[];
  activeIndex: number | null;
  intensityRef: MutableRefObject<number>;
  cooldownEndRef: MutableRefObject<number>;
}

/** Map 0→green, 0.5→yellow, 1→red */
function intensityColor(t: number): string {
  if (t < 0.5) {
    const g = Math.round(200 + t * 110);
    const r = Math.round(t * 2 * 255);
    return `rgb(${r}, ${g}, 60)`;
  }
  const r = 255;
  const g = Math.round(255 - (t - 0.5) * 2 * 200);
  return `rgb(${r}, ${g}, 40)`;
}

function intensityLabel(t: number): string {
  if (t < 0.15) return '';
  if (t >= 0.95) return 'MAX!';
  if (t >= 0.7) return `${Math.round(t * 10) / 10}x`;
  return `${Math.round(t * 10) / 10}x`;
}

/** Intensity ring + center dot + label — all via rAF */
function IntensityIndicator({ intensityRef }: { intensityRef: MutableRefObject<number> }) {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const update = () => {
      const t = intensityRef.current;
      const ring = ringRef.current;
      const dot = dotRef.current;
      const label = labelRef.current;
      const color = intensityColor(t);

      if (ring) {
        const size = 48 + t * 120;
        ring.style.width = `${size}px`;
        ring.style.height = `${size}px`;
        ring.style.left = `${-(size / 2)}px`;
        ring.style.top = `${-(size / 2)}px`;
        ring.style.opacity = String(0.15 + t * 0.4);
        ring.style.background = `radial-gradient(circle, ${color}40 0%, transparent 70%)`;
        ring.style.border = `2px solid ${color}60`;
      }
      if (dot) {
        const dotSize = 8 + t * 12;
        dot.style.width = `${dotSize}px`;
        dot.style.height = `${dotSize}px`;
        dot.style.backgroundColor = color;
        dot.style.boxShadow = t > 0.3 ? `0 0 ${t * 12}px ${color}` : 'none';
      }
      if (label) {
        const text = intensityLabel(t);
        label.textContent = text;
        label.style.opacity = text ? '1' : '0';
        label.style.color = color;
        label.style.textShadow = t >= 0.95 ? `0 0 8px ${color}` : 'none';
        label.style.fontSize = t >= 0.95 ? '13px' : '11px';
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [intensityRef]);

  return (
    <>
      <div ref={ringRef} className="absolute rounded-full" />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="absolute rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center shadow-2xl"
        style={{ left: -24, top: -24 }}
      >
        <div ref={dotRef} className="rounded-full" />
      </motion.div>
      {/* Intensity label below center */}
      <div
        ref={labelRef}
        className="absolute font-mono font-bold whitespace-nowrap transition-opacity duration-100"
        style={{
          left: '50%',
          top: 32,
          transform: 'translateX(-50%)',
          opacity: 0,
        }}
      />
    </>
  );
}

/** SVG cooldown ring shown after a high-intensity burst */
function CooldownRing({ cooldownEndRef, position }: {
  cooldownEndRef: MutableRefObject<number>;
  position: Position;
}) {
  const circleRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cooldownStartRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const update = () => {
      const now = Date.now();
      const end = cooldownEndRef.current;
      const circle = circleRef.current;
      const container = containerRef.current;

      if (!circle || !container) {
        raf = requestAnimationFrame(update);
        return;
      }

      if (end <= now) {
        container.style.opacity = '0';
        cooldownStartRef.current = 0;
      } else {
        // Capture start time on first frame of cooldown
        if (!cooldownStartRef.current) {
          cooldownStartRef.current = now;
        }
        const total = end - cooldownStartRef.current;
        const remaining = end - now;
        const progress = 1 - remaining / total; // 0→1 as cooldown completes

        container.style.opacity = '1';
        const circumference = 2 * Math.PI * 20;
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
      }

      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [cooldownEndRef]);

  return (
    <div
      ref={containerRef}
      className="fixed pointer-events-none z-[101]"
      style={{
        left: position.x - 24,
        top: position.y - 24,
        opacity: 0,
        transition: 'opacity 0.3s',
      }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle
          ref={circleRef}
          cx="24" cy="24" r="20"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
          transform="rotate(-90 24 24)"
        />
      </svg>
    </div>
  );
}

export const RadialMenuPresentational = ({
  isOpen,
  disabled,
  position,
  items,
  activeIndex,
  intensityRef,
  cooldownEndRef,
}: RadialMenuPresentationalProps) => {
  const { reducedMotion } = usePerfProfile();
  const radius = 100;

  return (
    <>
      <CooldownRing cooldownEndRef={cooldownEndRef} position={position} />
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed z-[100]"
            style={{
              left: position.x,
              top: position.y,
              pointerEvents: 'none',
            }}
          >
            {!disabled && !reducedMotion && <IntensityIndicator intensityRef={intensityRef} />}

            {disabled && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center shadow-2xl"
                style={{ left: -24, top: -24 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-500">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4.93 4.93l14.14 14.14" />
                </svg>
              </motion.div>
            )}

            {items.map((item, index) => {
              const count = items.length;
              const slice = 360 / count;

              const angleDeg = (index * slice) - 90;
              const angleRad = (angleDeg * Math.PI) / 180;

              const itemSize = 56;
              const x = Math.cos(angleRad) * radius - itemSize / 2;
              const y = Math.sin(angleRad) * radius - itemSize / 2;

              const isActive = !disabled && activeIndex === index;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0, x: -itemSize / 2, y: -itemSize / 2 }}
                  animate={{
                    opacity: disabled ? 0.4 : 1,
                    scale: isActive ? 1.2 : 1,
                    x,
                    y,
                  }}
                  exit={{ opacity: 0, scale: 0, x: -itemSize / 2, y: -itemSize / 2 }}
                  transition={reducedMotion ? { duration: 0 } : {
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className="absolute flex items-center justify-center"
                >
                  <div
                    className={`
                        relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg border transition-colors duration-200
                        ${disabled ? 'bg-neutral-800/60 text-white/40 border-neutral-700/40 grayscale' : isActive ? 'bg-white text-black border-white' : 'bg-neutral-800 text-white border-neutral-700'}
                      `}
                    style={{
                      backgroundColor: isActive ? item.color : undefined,
                      borderColor: isActive ? item.color : undefined,
                      color: isActive ? '#fff' : undefined,
                    }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-16 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-md whitespace-nowrap"
                      >
                        {item.label}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
