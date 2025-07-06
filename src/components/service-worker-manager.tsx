"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ServiceWorkerManager() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      // Add event listeners to handle updates
      const showSkipWaitingPrompt = () => {
        toast.info("新しいバージョンが利用可能です", {
          action: {
            label: "更新",
            onClick: () => {
              wb.messageSkipWaiting();
              wb.addEventListener("controlling", () => {
                window.location.reload();
              });
            },
          },
          duration: Infinity,
        });
      };

      wb.addEventListener("waiting", showSkipWaitingPrompt);

      // Register the service worker
      wb.register();
    }
  }, []);

  return null;
}