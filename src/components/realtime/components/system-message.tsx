import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";
import { THEME } from "../constants";

interface SystemMessageProps {
  users: { username: string; flag: string }[];
  content?: string;
}

const FLAG_CAP = 5;

export const SystemMessageRow = ({ users, content }: SystemMessageProps) => {
  const [expanded, setExpanded] = useState(false);

  const flagGroups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) counts.set(u.flag, (counts.get(u.flag) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([flag, count]) => ({ flag, count }));
  }, [users]);

  const hiddenCount = Math.max(0, flagGroups.length - FLAG_CAP);
  const visibleGroups = expanded ? flagGroups : flagGroups.slice(0, FLAG_CAP);

  if (content || users.length <= 3) {
    return (
      <div className={cn("flex items-center gap-3 py-2 select-none", THEME.text.secondary)}>
        <div className={cn("flex-1 h-px", "bg-black/10 dark:bg-white/10")} />
        <span className={cn("text-xs", content ? "min-w-0 text-center [overflow-wrap:anywhere]" : "shrink-0")}>
          {content ?? `${users.map(u => `${u.username} ${u.flag}`).join(", ")} joined`}
        </span>
        <div className={cn("flex-1 h-px", "bg-black/10 dark:bg-white/10")} />
      </div>
    );
  }

  return (
    <LayoutGroup>
      <motion.button
        layout
        type="button"
        onClick={() => hiddenCount > 0 && setExpanded(e => !e)}
        aria-expanded={expanded}
        className={cn(
          "group flex w-full items-center gap-3 py-2 select-none transition-colors",
          hiddenCount > 0 && "cursor-pointer hover:text-[#060607] dark:hover:text-white",
          THEME.text.secondary
        )}
      >
        <div className={cn("flex-1 h-px transition-colors", "bg-black/10 dark:bg-white/10", hiddenCount > 0 && "group-hover:bg-black/20 dark:group-hover:bg-white/20")} />
        <motion.div layout className="text-xs flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 max-w-[90%]">
          <motion.span layout="position">{users.length} people visited from</motion.span>

          <AnimatePresence initial={false}>
            {visibleGroups.map(({ flag, count }) => (
              <motion.span
                key={flag}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-flex items-center gap-0.5 whitespace-nowrap"
              >
                <span>{flag}</span>
                <AnimatePresence initial={false}>
                  {expanded && count > 1 && (
                    <motion.span
                      key="count"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn("text-[10px] tabular-nums overflow-hidden whitespace-nowrap", THEME.text.secondary)}
                    >
                      ×{count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
            ))}
          </AnimatePresence>

          {hiddenCount > 0 && (
            <motion.span
              layout
              className="text-[10px] font-semibold tabular-nums opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              {expanded ? "show less" : `+${hiddenCount}`}
            </motion.span>
          )}
        </motion.div>
        <div className={cn("flex-1 h-px transition-colors", "bg-black/10 dark:bg-white/10", hiddenCount > 0 && "group-hover:bg-black/20 dark:group-hover:bg-white/20")} />
      </motion.button>
    </LayoutGroup>
  );
};
