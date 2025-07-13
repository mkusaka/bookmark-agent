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
  
  // Handle cache refresh on network reconnection
  if (event.data && event.data.type === "REFRESH_CACHES") {
    event.waitUntil(
      (async () => {
        // Get all cache names
        const cacheNames = await caches.keys();
        
        // Clear runtime caches (not precache)
        const runtimeCaches = ["api-cache", "pages-cache", "static-assets"];
        
        await Promise.all(
          runtimeCaches.map(async (cacheName) => {
            if (cacheNames.includes(cacheName)) {
              const cache = await caches.open(cacheName);
              const requests = await cache.keys();
              
              // Delete all entries in the cache
              await Promise.all(
                requests.map((request) => cache.delete(request))
              );
            }
          })
        );
        
        // Optionally, prefetch critical routes after clearing cache
        const criticalUrls = ["/search", "/"];
        await Promise.all(
          criticalUrls.map((url) => 
            fetch(url).catch(() => {
              // Ignore errors for prefetching
            })
          )
        );
      })()
    );
  }
});

serwist.addEventListeners();