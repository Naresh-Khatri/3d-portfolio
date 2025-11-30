import { useState, useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  initialCount?: number;
  loadMoreCount?: number;
  threshold?: number;
}

export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
) {
  const {
    initialCount = 20,
    loadMoreCount = 20,
    threshold = 0.1,
  } = options;

  const [displayedCount, setDisplayedCount] = useState(
    Math.min(initialCount, items.length)
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const displayedItems = items.slice(0, displayedCount);
  const hasMore = displayedCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // Use setTimeout to allow the UI to update
    setTimeout(() => {
      setDisplayedCount((prev) =>
        Math.min(prev + loadMoreCount, items.length)
      );
      setIsLoading(false);
    }, 100);
  }, [isLoading, hasMore, loadMoreCount, items.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin: "100px",
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, loadMore, threshold]);

  return {
    displayedItems,
    hasMore,
    loadMoreRef,
    isLoading,
    loadMore,
  };
}

