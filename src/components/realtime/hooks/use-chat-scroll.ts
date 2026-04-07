import { useEffect, useRef, useState } from 'react';

export const useChatScroll = (isOpen: boolean, msgsLength: number, currentUserId?: string, lastMsgSessionId?: string, firstMsgId?: string) => {
  const chatContainer = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreads, setUnreads] = useState(0);

  // Use ref to track isAtBottom for the effect without adding it to deps
  const isAtBottomRef = useRef(isAtBottom);
  useEffect(() => { isAtBottomRef.current = isAtBottom; }, [isAtBottom]);

  // Preserve scroll position when older messages are prepended
  const prevFirstMsgId = useRef(firstMsgId);
  useEffect(() => {
    if (prevFirstMsgId.current && firstMsgId !== prevFirstMsgId.current) {
      // The first message changed — messages were prepended
      const container = chatContainer.current;
      if (!container) { prevFirstMsgId.current = firstMsgId; return; }
      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!viewport) { prevFirstMsgId.current = firstMsgId; return; }

      const prevEl = document.getElementById(`msg-${prevFirstMsgId.current}`);
      if (prevEl) {
        // Use requestAnimationFrame to wait for DOM to update
        requestAnimationFrame(() => {
          prevEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
      }
    }
    prevFirstMsgId.current = firstMsgId;
  }, [firstMsgId]);

  const scrollToBottom = (smooth = true) => {
    if (!chatContainer.current) return;
    const viewport = chatContainer.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
      setUnreads(0);
      setShowScrollButton(false);
    }
  };

  // Initial scroll to bottom
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => scrollToBottom(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle scroll events
  useEffect(() => {
    const container = chatContainer.current;
    if (!container) return;

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceToBottom < 20; // 20px threshold

      setIsAtBottom(atBottom);

      if (atBottom) {
        setUnreads(0);
        setShowScrollButton(false);
      } else {
        setShowScrollButton(true);
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Handle new messages
  useEffect(() => {
    if (msgsLength === 0) return;

    const isMe = lastMsgSessionId === currentUserId;

    if (isAtBottomRef.current || isMe) {
      scrollToBottom(true);
    } else {
      setUnreads(prev => prev + 1);
    }
  }, [msgsLength, currentUserId, lastMsgSessionId]);

  return {
    chatContainer,
    showScrollButton,
    unreads,
    scrollToBottom,
    isAtBottomRef
  };
};
