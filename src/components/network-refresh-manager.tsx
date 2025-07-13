"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

export function NetworkRefreshManager() {
  const router = useRouter();
  const lastRefreshRef = useRef<number>(Date.now());
  const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown between refreshes

  const performRefresh = useCallback((message: string) => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    // Prevent refresh if it was done recently
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      return;
    }
    
    lastRefreshRef.current = now;
    
    // Show toast notification
    toast.success(message);
    
    // Refresh the current route data
    router.refresh();
    
    // If service worker is available, also update caches
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Send message to service worker to update caches
      navigator.serviceWorker.controller.postMessage({
        type: "REFRESH_CACHES",
      });
    }
  }, [router]);

  const handleReconnect = useCallback(() => {
    performRefresh("ネットワークに再接続しました。ページを更新します...");
  }, [performRefresh]);

  const handlePageVisible = useCallback(() => {
    performRefresh("ページを更新しています...");
  }, [performRefresh]);

  // Handle network reconnection
  useOnlineStatus({ onReconnect: handleReconnect });
  
  // Handle page visibility (returning to app)
  usePageVisibility({ 
    onVisible: handlePageVisible,
    minHiddenTime: 5000 // Only refresh if hidden for at least 5 seconds
  });

  return null;
}