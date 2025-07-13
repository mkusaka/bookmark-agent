"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      // Show reconnecting status after 3 seconds offline
      const timer = setTimeout(() => setShowReconnecting(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowReconnecting(false);
      // Delay hiding to show reconnection success
      if (isVisible) {
        const timer = setTimeout(() => setIsVisible(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border shadow-lg transition-all duration-300 sm:left-auto sm:right-4 ${
        isOnline
          ? "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
          : "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100"
      }`}
    >
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {!isOnline && (
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-25" />
            )}
            <div
              className={`relative rounded-full p-2 ${
                isOnline
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-orange-100 dark:bg-orange-900"
              }`}
            >
              <WifiOff
                className={`size-4 ${
                  isOnline ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"
                }`}
              />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {isOnline ? "接続が回復しました" : "オフラインモード"}
            </p>
            {!isOnline && (
              <p className="text-xs opacity-75">
                {showReconnecting
                  ? "接続を確認しています..."
                  : "インターネット接続がありません"}
              </p>
            )}
          </div>
        </div>
        {!isOnline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="shrink-0"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        )}
      </div>
      {!isOnline && showReconnecting && (
        <div className="h-1 w-full overflow-hidden rounded-b-lg bg-orange-200 dark:bg-orange-800">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-orange-400 to-transparent dark:via-orange-600" />
        </div>
      )}
    </div>
  );
}