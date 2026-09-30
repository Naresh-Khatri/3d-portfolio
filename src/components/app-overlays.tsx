"use client";

import { usePathname } from "next/navigation";
import Particles from "@/components/Particles";
import RemoteCursors from "@/components/realtime/remote-cursors";
import EasterEggs from "@/components/easter-eggs";
import ElasticCursor from "@/components/ui/ElasticCursor";
import RadialMenu from "@/components/radial-menu/index";
import MotionNudge from "@/components/motion-nudge";
import DomainNotice from "@/components/domain-notice";
import Analytics from "@/components/analytics";
import { usePerfProfile } from "@/hooks/use-perf-profile";

export default function AppOverlays() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  // The résumé route disables the elastic cursor (keeps the particle bg).
  const isResume = pathname?.startsWith("/resume") ?? false;

  const { particleCount, maxDpr, disableDecorative } = usePerfProfile();

  return (
    <>
      {particleCount > 0 && (
        <Particles
          className="fixed inset-0 -z-10 animate-fade-in"
          quantity={particleCount}
          maxDpr={maxDpr}
        />
      )}
      {isHome && <RemoteCursors />}
      {!disableDecorative && <EasterEggs />}
      {!isResume && !disableDecorative && <ElasticCursor />}
      {isHome && <RadialMenu />}
      {isHome && <MotionNudge />}
      <DomainNotice />
      <Analytics />
    </>
  );
}
