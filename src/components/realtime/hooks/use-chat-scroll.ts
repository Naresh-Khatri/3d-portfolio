import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD = 40;

const getViewport = (root: HTMLElement | null) =>
  root?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]') ?? null;

const pinToBottom = (vp: HTMLElement) => {
  vp.scrollTop = vp.scrollHeight;
};

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
  const chatContainer = useCallback((node: HTMLDivElement | null) => {
    const vp = getViewport(node);
    viewportRef.current = vp;
    setViewport(vp);
    // (re)open lands at bottom -> nothing unread
    if (vp) {
      setUnreads(0);
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
    setUnreads(0);
    setShowScrollButton(false);
    if (!vp) return;
    vp.scrollTo({ top: vp.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // before paint -> no flash of the top of the list on open
  useLayoutEffect(() => {
    if (!viewport) return;
    isAtBottomRef.current = true;
    pinToBottom(viewport);
    takeSnapshot(viewport);
  }, [viewport]);

  useEffect(() => {
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop - clientHeight < BOTTOM_THRESHOLD;
      if (atBottom) isAtBottomRef.current = true;
      // direction check: smooth scroll-to-bottom passes through "not at bottom" frames
      else if (scrollTop < snapshot.current.scrollTop) isAtBottomRef.current = false;
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
    if (!prev || !lastMsgId || prev === lastMsgId) return;

    if (lastMsgIsMine) scrollToBottom(true);
    // closed popover counts as not reading
    else if (!viewportRef.current || !isAtBottomRef.current) setUnreads(n => n + 1);
  }, [lastMsgId, lastMsgIsMine, scrollToBottom]);

  return {
    chatContainer,
    showScrollButton,
    unreads,
    scrollToBottom,
  };
};
