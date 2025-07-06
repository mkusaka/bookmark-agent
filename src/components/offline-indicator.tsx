"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground shadow-lg">
      <WifiOff className="size-4" />
      <span>オフライン</span>
    </div>
  );
}