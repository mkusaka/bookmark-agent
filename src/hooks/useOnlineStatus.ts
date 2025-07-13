"use client";

import { useEffect, useRef, useState } from "react";

export function useOnlineStatus(options?: { onReconnect?: () => void }) {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const wasOfflineRef = useRef(!isOnline);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // If we were offline and now online, trigger refresh
      if (wasOfflineRef.current && options?.onReconnect) {
        options.onReconnect();
      }
      wasOfflineRef.current = false;
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [options]);

  return isOnline;
}