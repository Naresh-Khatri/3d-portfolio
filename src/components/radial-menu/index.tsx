'use client';

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import confetti from 'canvas-confetti';
import { RadialMenuPresentational } from './radial-menu-presentational';
import { Shockwave, ShockwaveData } from './shockwave';
import { MenuItem, Position } from './types';
import { SocketContext } from '@/contexts/socketio';
import { useSounds } from '@/components/realtime/hooks/use-sounds';
import { RightClickHint } from './right-click-hint';
import { usePerfProfile } from '@/hooks/use-perf-profile';

// Define our menu items
const MENU_ITEMS: MenuItem[] = [
  { id: 'love', emoji: '❤️', label: 'Love', color: '#ef4444' },
  { id: 'laugh', emoji: '😂', label: 'Haha', color: '#fbbf24' },
  { id: 'wow', emoji: '😮', label: 'Wow', color: '#3b82f6' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#60a5fa' },
  { id: 'angry', emoji: '😡', label: 'Angry', color: '#f97316' },
  { id: 'fire', emoji: '🔥', label: 'Lit', color: '#f59e0b' },
];

const DEAD_ZONE = 20;
const MAX_INTENSITY_DIST = 500;
const HOLD_DELAY = 0;
const COOLDOWN_MS = 2000; // 2s cooldown after high-intensity burst
const COOLDOWN_THRESHOLD = 0.7; // only trigger cooldown above this intensity
const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [contenteditable], img, video, audio, [data-radix-popper-content-wrapper], [data-radix-popper-content-wrapper] *';

export default function RadialMenu() {
  const { reducedMotion } = usePerfProfile();
  const { socket } = useContext(SocketContext);
  const { playConfettiSound, startChargeTone, updateChargeTone, stopChargeTone } = useSounds();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<Position>({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [shockwaves, setShockwaves] = useState<ShockwaveData[]>([]);

  // Refs
  const isOpenRef = useRef(false);
  const isDisabledRef = useRef(false);
  const menuPosRef = useRef<Position>({ x: 0, y: 0 });
  const activeIndexRef = useRef<number | null>(null);
  const intensityRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const suppressMenuRef = useRef(false);

  // Cooldown
  const cooldownUntilRef = useRef(0);
  const cooldownEndRef = useRef(0); // timestamp when cooldown ends (for ring animation)

  // Track our own triggers to ignore echos
  const myTriggersRef = useRef<Set<string>>(new Set());

  // Sync refs
  useEffect(() => {
    isOpenRef.current = isOpen;
    isDisabledRef.current = isDisabled;
    menuPosRef.current = menuPos;
    activeIndexRef.current = activeIndex;
  }, [isOpen, isDisabled, menuPos, activeIndex]);

  const isOnCooldown = () => Date.now() < cooldownUntilRef.current;

  // Handle Confetti — intensity scales everything
  const fireConfetti = useCallback((pageX: number, pageY: number, emoji: string, int: number) => {
    if (reducedMotion) return;
    const normalizedX = (pageX - window.scrollX) / window.innerWidth;
    const normalizedY = (pageY - window.scrollY) / window.innerHeight;

    const burstCount = Math.round(2 + int * 8);
    const particlesPerBurst = Math.round(5 + int * 25);

    for (let i = 0; i < burstCount; i++) {
      const scalar = 1.5 + Math.random() * (3 + int * 4);
      const emojiShape = confetti.shapeFromText({ text: emoji, scalar });

      confetti({
        particleCount: particlesPerBurst,
        spread: 40 + int * 80 + Math.random() * 20,
        origin: { x: normalizedX, y: normalizedY },
        shapes: [emojiShape],
        scalar,
        disableForReducedMotion: false,
        zIndex: 9999,
        startVelocity: 15 + int * 30 + Math.random() * 10,
        gravity: 0.6 + Math.random() * 0.4,
        drift: (Math.random() - 0.5) * (0.3 + int * 0.7),
      });
    }
  }, [reducedMotion]);

  const spawnShockwave = useCallback((clientX: number, clientY: number, color: string, emoji: string, int: number) => {
    if (reducedMotion) return;
    const id = `${Date.now()}-${Math.random()}`;
    setShockwaves(prev => [...prev, { id, x: clientX, y: clientY, color, emoji, intensity: int }]);
    setTimeout(() => {
      setShockwaves(prev => prev.filter(s => s.id !== id));
    }, 1600);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) confetti.reset();
  }, [reducedMotion]);

  const triggerConfetti = (x: number, y: number, item: MenuItem, int: number) => {
    playConfettiSound(int);
    fireConfetti(x, y, item.emoji, int);
    const cx = x - window.scrollX;
    const cy = y - window.scrollY;
    spawnShockwave(cx, cy, item.color, item.emoji, int);

    // Start cooldown if intensity was high enough
    if (int >= COOLDOWN_THRESHOLD) {
      const cooldownDuration = Math.round(COOLDOWN_MS * int);
      cooldownUntilRef.current = Date.now() + cooldownDuration;
      cooldownEndRef.current = Date.now() + cooldownDuration;
    }
  };

  // Listen for remote confetti
  useEffect(() => {
    if (!socket) return;

    const handleConfettiReceive = (data: { id: string; emoji: string; x: number; y: number; intensity: number }) => {
      if (myTriggersRef.current.has(data.id)) {
        myTriggersRef.current.delete(data.id);
        return;
      }

      const int = data.intensity ?? 0.5;
      fireConfetti(data.x, data.y, data.emoji, int);
      playConfettiSound(int);
      const cx = data.x - window.scrollX;
      const cy = data.y - window.scrollY;
      const item = MENU_ITEMS.find(m => m.emoji === data.emoji);
      spawnShockwave(cx, cy, item?.color ?? '#fff', data.emoji, int);
    };

    socket.on("confetti-receive", handleConfettiReceive);

    return () => {
      socket.off("confetti-receive", handleConfettiReceive);
    };
  }, [socket, fireConfetti, spawnShockwave]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      const target = e.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTOR)) return;

      suppressMenuRef.current = true;
      const pos = { x: e.clientX, y: e.clientY };

      // Show disabled menu during cooldown
      if (isOnCooldown()) {
        setMenuPos(pos);
        setIsOpen(true);
        setIsDisabled(true);
        setActiveIndex(null);
        return;
      }

      timerRef.current = setTimeout(() => {
        setMenuPos(pos);
        setIsOpen(true);
        setIsDisabled(false);
        setActiveIndex(null);
        intensityRef.current = 0;
        startChargeTone();
      }, HOLD_DELAY);
    }
  }, [startChargeTone]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isOpenRef.current || isDisabledRef.current) return;

    const currentPos = { x: e.clientX, y: e.clientY };
    const origin = menuPosRef.current;

    const dist = getDistance(origin, currentPos);

    if (dist < DEAD_ZONE) {
      if (activeIndexRef.current !== null) setActiveIndex(null);
      intensityRef.current = 0;
      updateChargeTone(0);
      return;
    }

    const rawIntensity = Math.min(1, (dist - DEAD_ZONE) / (MAX_INTENSITY_DIST - DEAD_ZONE));
    intensityRef.current = rawIntensity;
    updateChargeTone(rawIntensity);

    const angle = getAngle(origin, currentPos);
    const count = MENU_ITEMS.length;

    const normalizedAngle = (angle + 90) % 360;
    const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 360 : normalizedAngle;
    const index = Math.floor(positiveAngle / (360 / count));

    if (activeIndexRef.current !== index) {
      setActiveIndex(index);
    }
  }, [updateChargeTone]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    stopChargeTone();

    if (isOpenRef.current) {
      if (activeIndexRef.current !== null && !isDisabledRef.current) {
        const item = MENU_ITEMS[activeIndexRef.current];
        const int = intensityRef.current;
        triggerConfetti(e.pageX, e.pageY, item, int);

        if (socket) {
          const burstId = `${socket.id}-${Date.now()}-${Math.random()}`;
          myTriggersRef.current.add(burstId);

          if (myTriggersRef.current.size > 100) {
            myTriggersRef.current.clear();
          }

          socket.emit("confetti-send", {
            id: burstId,
            emoji: item.emoji,
            x: e.pageX,
            y: e.pageY,
            intensity: int,
          });
        }
      }

      setIsOpen(false);
      setIsDisabled(false);
      setActiveIndex(null);
      intensityRef.current = 0;
    } else {
    }
  }, [triggerConfetti, stopChargeTone]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (suppressMenuRef.current) {
      e.preventDefault();
      suppressMenuRef.current = false;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleContextMenu]);

  return (
    <>
      <RadialMenuPresentational
        isOpen={isOpen}
        disabled={isDisabled}
        position={menuPos}
        items={MENU_ITEMS}
        activeIndex={activeIndex}
        intensityRef={intensityRef}
        cooldownEndRef={cooldownEndRef}
      />
      {!reducedMotion && shockwaves.map(sw => (
        <Shockwave key={sw.id} data={sw} />
      ))}
      <RightClickHint dismissed={isOpen} />
    </>
  );
}

const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getAngle = (origin: { x: number; y: number }, target: { x: number; y: number }) => {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  let theta = Math.atan2(dy, dx);
  theta *= 180 / Math.PI;
  return theta;
};
