"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function NetworkRefreshManager() {
  const router = useRouter();
  const lastRefreshRef = useRef<number>(Date.now());
  const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown between refreshes

  const performRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    // Prevent refresh if it was done recently
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      return;
    }
    
    lastRefreshRef.current = now;
    
    // Show toast notification with spinning refresh icon
    toast.custom((t) => (
      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    ), {
      duration: 2000,
    });
    
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
    performRefresh();
  }, [performRefresh]);

  const handlePageVisible = useCallback(() => {
    performRefresh();
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