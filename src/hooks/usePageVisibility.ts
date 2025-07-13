"use client";

import { useEffect, useRef } from "react";

interface UsePageVisibilityOptions {
  onVisible?: () => void;
  onHidden?: () => void;
  minHiddenTime?: number; // Minimum time hidden before triggering onVisible (ms)
}

export function usePageVisibility(options?: UsePageVisibilityOptions) {
  const hiddenTimeRef = useRef<number | null>(null);
  const minHiddenTime = options?.minHiddenTime ?? 5000; // Default 5 seconds

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is now hidden
        hiddenTimeRef.current = Date.now();
        options?.onHidden?.();
      } else {
        // Page is now visible
        const wasHiddenTime = hiddenTimeRef.current
          ? Date.now() - hiddenTimeRef.current
          : 0;
        
        // Only trigger if page was hidden for minimum time
        if (wasHiddenTime >= minHiddenTime) {
          options?.onVisible?.();
        }
        
        hiddenTimeRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [options, minHiddenTime]);
}