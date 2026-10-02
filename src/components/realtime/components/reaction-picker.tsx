import React, { useState } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME } from "../constants";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🔥"];

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ReactionPicker = ({ onReact, open: controlledOpen, onOpenChange }: ReactionPickerProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "p-1.5 rounded transition-colors",
          THEME.bg.hover,
          THEME.text.secondary
        )}
        aria-label="Add reaction"
        aria-expanded={isOpen}
        title="Add reaction"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(!isOpen)}
      >
        <SmilePlus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full right-0 mb-1 flex items-center gap-0.5 px-2 py-1.5 rounded-lg border shadow-lg z-20",
            THEME.bg.secondary,
            THEME.border.primary
          )}
        >
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              className="text-lg hover:scale-125 transition-transform px-0.5 leading-none"
              aria-label={`React with ${emoji}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onReact(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
