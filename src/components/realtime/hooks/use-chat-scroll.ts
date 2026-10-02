import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD = 40;

const getViewport = (root: HTMLElement | null) =>
  root?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]') ?? null;

const pinToBottom = (vp: HTMLElement) => {
  vp.scrollTop = vp.scrollHeight;
};

const scrollByPx = (vp: HTMLElement, dy: number) => {
  vp.scrollTop += dy;
};

const isNearBottom = (vp: HTMLElement) =>
  vp.scrollHeight - vp.scrollTop - vp.clientHeight < BOTTOM_THRESHOLD;

export const UNREAD_DIVIDER_ATTR = "data-unread-divider";

export const useChatScroll = (
  firstMsgId?: string,
  lastMsgId?: string,
  lastMsgIsMine?: boolean,
) => {
  // state (not just ref): popover content mounts a render after isOpen flips (radix portal)
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreads, setUnreads] = useState(0);
  // last msg the user actually saw; divider goes after it on reopen
  const lastSeenId = useRef<string | undefined>(undefined);
  const lastMsgIdRef = useRef(lastMsgId);
  const [unreadAfterId, setUnreadAfterId] = useState<string | null>(null);
  const chatContainer = useCallback((node: HTMLDivElement | null) => {
    const vp = getViewport(node);
    viewportRef.current = vp;
    setViewport(vp);
    if (vp) {
      const seen = lastSeenId.current;
      const hasUnread = !!seen && seen !== lastMsgIdRef.current;
      setUnreadAfterId(hasUnread ? seen! : null);
      // no unread -> lands at bottom; else count stays for the jump button
      if (!hasUnread) setUnreads(0);
      setShowScrollButton(false);
    }
  }, []);

  // pinned = follow content growth; only a user scroll-up unpins
  const isAtBottomRef = useRef(true);
  // last known geometry, used to restore position after a prepend
  const snapshot = useRef({ scrollTop: 0, scrollHeight: 0 });

  const takeSnapshot = (vp: HTMLElement) => {
    snapshot.current = { scrollTop: vp.scrollTop, scrollHeight: vp.scrollHeight };
  };

  const scrollToBottom = useCallback((smooth = true) => {
    const vp = viewportRef.current;
    isAtBottomRef.current = true;
    lastSeenId.current = lastMsgIdRef.current;
    setUnreads(0);
    setShowScrollButton(false);
    if (!vp) return;
    vp.scrollTo({ top: vp.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // before paint -> no flash of the top of the list on open
  useLayoutEffect(() => {
    if (!viewport) return;
    const divider = viewport.querySelector<HTMLElement>(`[${UNREAD_DIVIDER_ATTR}]`);
    if (divider) {
      // open at first unread, a bit of context above it
      const top = divider.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
      scrollByPx(viewport, top - 48);
      isAtBottomRef.current = isNearBottom(viewport);
    } else {
      isAtBottomRef.current = true;
      pinToBottom(viewport);
    }
    if (isAtBottomRef.current) {
      lastSeenId.current = lastMsgIdRef.current;
      setUnreads(0);
    }
    setShowScrollButton(!isAtBottomRef.current);
    takeSnapshot(viewport);
    // unreadAfterId: divider renders in the same commit as the viewport
  }, [viewport, unreadAfterId]);

  useEffect(() => {
    if (!viewport) return;

    const handleScroll = () => {
      const atBottom = isNearBottom(viewport);
      if (atBottom) {
        isAtBottomRef.current = true;
        lastSeenId.current = lastMsgIdRef.current;
      }
      // direction check: smooth scroll-to-bottom passes through "not at bottom" frames
      else if (viewport.scrollTop < snapshot.current.scrollTop) isAtBottomRef.current = false;
      takeSnapshot(viewport);

      setShowScrollButton(!isAtBottomRef.current);
      if (atBottom) setUnreads(0);
    };

    // late height changes (history arriving, reactions, edits, fonts) -> stay glued to bottom
    const resizeObserver = new ResizeObserver(() => {
      if (isAtBottomRef.current) pinToBottom(viewport);
      takeSnapshot(viewport);
    });
    if (viewport.firstElementChild) resizeObserver.observe(viewport.firstElementChild);

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [viewport]);

  // prepend (older history): restore position before paint so nothing jumps
  const prevFirstMsgId = useRef(firstMsgId);
  useLayoutEffect(() => {
    const prev = prevFirstMsgId.current;
    prevFirstMsgId.current = firstMsgId;
    const vp = viewportRef.current;
    if (!vp || !prev || !firstMsgId || prev === firstMsgId || isAtBottomRef.current) return;
    // absolute, not +=: idempotent if native scroll anchoring already adjusted
    vp.scrollTop = snapshot.current.scrollTop + (vp.scrollHeight - snapshot.current.scrollHeight);
    takeSnapshot(vp);
  }, [firstMsgId]);

  // keyed on last id, not length: prepends/deletes aren't new messages
  const prevLastMsgId = useRef(lastMsgId);
  useEffect(() => {
    const prev = prevLastMsgId.current;
    prevLastMsgId.current = lastMsgId;
    lastMsgIdRef.current = lastMsgId;
    if (!lastMsgId || prev === lastMsgId) return;
    // closed popover counts as not reading
    const reading = !!viewportRef.current && isAtBottomRef.current;
    if (!prev || lastMsgIsMine || reading) lastSeenId.current = lastMsgId;
    if (!prev) return;

    if (lastMsgIsMine) scrollToBottom(true);
    else if (!reading) setUnreads(n => n + 1);
  }, [lastMsgId, lastMsgIsMine, scrollToBottom]);

  return {
    chatContainer,
    showScrollButton,
    unreads,
    unreadAfterId,
    scrollToBottom,
  };
};
