import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API routes - Network First
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 3,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              // Only cache successful responses
              if (response && response.status === 200) {
                return response;
              }
              return null;
            },
          },
        ],
      }),
    },
    // Static assets (images, fonts) - Cache First
    {
      matcher: ({ request }) =>
        request.destination === "image" ||
        request.destination === "font",
      handler: new CacheFirst({
        cacheName: "static-assets",
        plugins: [
          {
            handlerDidError: async () => {
              // Return a fallback image if offline
              return new Response("", { status: 200 });
            },
          },
        ],
      }),
    },
    // HTML pages - Stale While Revalidate with offline fallback
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin && request.mode === "navigate",
      handler: new StaleWhileRevalidate({
        cacheName: "pages-cache",
        plugins: [
          {
            handlerDidError: async () => {
              // Return offline page when navigation fails
              const cache = await caches.open("pages-cache");
              const offlineResponse = await cache.match("/offline");
              return offlineResponse || new Response("Offline", { status: 503 });
            },
          },
        ],
      }),
    },
    // Default handler from @serwist/next
    ...defaultCache,
  ],
  fallbacks: {
    // Define offline fallback page
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

serwist.addEventListeners();