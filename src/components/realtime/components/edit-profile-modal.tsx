import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/contexts/socketio";
import { THEME } from "../constants";
import { getAvatarUrl } from "@/lib/avatar";

const COLORS = [
  "#60a5fa",
  "#f87171",
  "#4ade80",
  "#facc15",
  "#c084fc",
  "#fb923c",
  "#f43f5e",
  "#818cf8",
  "#22d3ee",
  "#a3e635",
];

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  updateProfile: (data: { name: string; avatar: string; color: string }) => void;
}

export const EditProfileModal = ({
  user,
  isOpen,
  onClose,
  updateProfile,
}: EditProfileModalProps) => {
  const [name, setName] = useState(user.name);
  const [avatarSeed, setAvatarSeed] = useState(user.avatar);
  const [color, setColor] = useState(user.color || COLORS[0]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setAvatarSeed(user.avatar);
      setColor(user.color || COLORS[0]);
    }
  }, [isOpen, user]);

  const handleSave = () => {
    if (name.trim()) {
      updateProfile({ name, avatar: avatarSeed, color });
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
        className={cn(
          "w-[400px] h-[600px] max-h-[85vh] p-4 rounded-xl shadow-2xl flex flex-col",
          "bg-white dark:bg-[#2b2d31] border border-white/10",
          "ring-1 ring-black/5 dark:ring-white/10"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with preview */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="relative">
            <img
              src={getAvatarUrl(avatarSeed)}
              alt="Preview"
              className="w-12 h-12 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#2b2d31]"
              style={{ backgroundColor: color, "--tw-ring-color": color } as React.CSSProperties}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("text-xs font-medium uppercase tracking-wide mb-1", THEME.text.secondary)}>
              Edit Profile
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={cn(
                "w-full text-base font-semibold px-2 py-1 rounded-md border-none outline-none",
                "bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10",
                "transition-colors",
                THEME.text.header
              )}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          </div>
        </div>

        {/* Avatar selection */}
        <div className="mb-4 flex-1 flex flex-col min-h-0">
          <div className={cn("text-xs font-medium uppercase tracking-wide mb-2", THEME.text.secondary)}>
            Avatar
          </div>
          <ScrollArea className="flex-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20" data-lenis-prevent>
            <div className="grid grid-cols-5 gap-1.5 p-2" data-lenis-prevent>
              {Array.from({ length: 100 }, (_, i) => (i + 1).toString()).map((seed) => (
                <button
                  key={seed}
                  className={cn(
                    "rounded-full p-0.5 transition-all hover:scale-105 aspect-square",
                    avatarSeed === seed
                      ? "bg-[#5865f2] ring-2 ring-[#5865f2] scale-105"
                      : "hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                  onClick={() => setAvatarSeed(seed)}
                >
                  <img
                    src={getAvatarUrl(seed)}
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: color }}
                    loading="lazy"
                    alt={`Avatar ${seed}`}
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Color selection */}
        <div className="mb-5 shrink-0">
          <div className={cn("text-xs font-medium uppercase tracking-wide mb-2", THEME.text.secondary)}>
            Accent Color
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {COLORS.map((c) => (
              <button
                key={c}
                className={cn(
                  "w-7 h-7 rounded-full transition-all hover:scale-110",
                  color === c && "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#2b2d31] scale-110 shadow-lg"
                )}
                style={{ backgroundColor: c, "--tw-ring-color": c } as React.CSSProperties}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-black/10 dark:border-white/10 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 px-4 text-sm"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-4 text-sm bg-[#5865f2] hover:bg-[#4752c4] text-white"
          >
            Save Changes
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
