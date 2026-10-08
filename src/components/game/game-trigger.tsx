"use client";

import { useContext } from "react";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameContext } from "@/contexts/game-context";
import { cn } from "@/lib/utils";

export const GameTrigger = ({ className }: { className?: string }) => {
  const { open, playing } = useContext(GameContext);
  return (
    <Button
      variant="ghost"
      onClick={open}
      aria-label="Play Zombie Survival"
      title={playing > 0 ? `Zombie Survival · ${playing} playing` : "Play Zombie Survival"}
      data-no-custom-cursor="true"
      className={cn(
        "relative h-11 w-12 p-0 shadow-lg transition-all duration-300",
        "bg-background/20 hover:bg-background/80 backdrop-blur-sm border-2 border-white/30 rounded-lg",
        className
      )}
    >
      <Gamepad2 className="w-6 h-6" />
      {playing > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
          {playing}
        </span>
      )}
    </Button>
  );
};
