import React, { useContext } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME } from "../constants";
import { SocketContext } from "@/contexts/socketio";
import type { Reaction } from "@/contexts/socketio";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageReactionsProps {
  reactions: Reaction[];
  currentSessionId: string | undefined;
  onToggle: (emoji: string) => void;
  onPickerOpen: () => void;
}

export const MessageReactions = ({ reactions, currentSessionId, onToggle, onPickerOpen }: MessageReactionsProps) => {
  const { profileMap } = useContext(SocketContext);

  if (reactions.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {reactions.map(r => {
          const isMine = currentSessionId ? r.sessionIds.includes(currentSessionId) : false;
          const names = r.sessionIds.map(id =>
            id === currentSessionId ? "You" : (profileMap.get(id)?.name ?? "Unknown")
          );
          const tooltipText = names.join(", ");

          return (
            <Tooltip key={r.emoji}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition-colors",
                    isMine
                      ? "border-[#5865f2]/60 bg-[#5865f2]/15"
                      : cn("border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5", THEME.bg.itemHover),
                  )}
                  aria-label={`${r.emoji} ${r.sessionIds.length}: ${tooltipText}`}
                  aria-pressed={isMine}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onToggle(r.emoji)}
                >
                  <span className="text-sm leading-none">{r.emoji}</span>
                  <span className={cn("text-[11px] font-medium leading-none", isMine ? "text-[#5865f2]" : THEME.text.secondary)}>
                    {r.sessionIds.length}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          );
        })}
      {/* <button */}
      {/*   type="button" */}
      {/*   className={cn( */}
      {/*     "flex items-center justify-center w-7 h-6 rounded-md border transition-colors", */}
      {/*     "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5", */}
      {/*     THEME.bg.itemHover, THEME.text.secondary */}
      {/*   )} */}
      {/*   onMouseDown={(e) => { */}
      {/*     e.preventDefault(); */}
      {/*     onPickerOpen(); */}
      {/*   }} */}
      {/* > */}
      {/*   <SmilePlus className="w-3.5 h-3.5" /> */}
      {/* </button> */}
      </div>
    </TooltipProvider>
  );
};
