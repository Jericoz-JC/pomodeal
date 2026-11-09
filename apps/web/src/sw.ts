/// <reference lib="webworker" />
// The service worker (vite-plugin-pwa injectManifest). It keeps the app installable and working offline as the
// generated one did (precache, index.html for navigations, update at once), and shows block-boundary pushes on
// browsers without Declarative Web Push. Safari 18.4+ shows the same payload without running this.
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { notificationFromPush } from "../../../packages/core/src/push";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null } | string> };

// registerType "autoUpdate": a new version takes over open tabs at once.
self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

self.addEventListener("push", (event) => {
  let data: unknown = null;
  try { data = event.data ? event.data.json() : null; } catch { data = event.data ? event.data.text() : null; }
  const n = notificationFromPush(data);
  if (!n) return;
  event.waitUntil(self.registration.showNotification(n.title, n.options));
});

// A tap on the notification opens the app on the running session: an open Pomodeal tab comes forward, or a new one opens.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data as { navigate?: unknown } | null;
  const path = typeof data?.navigate === "string" && data.navigate.startsWith("/") && !data.navigate.startsWith("//") ? data.navigate : "/";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const mine = open.find((c) => new URL(c.url).origin === self.location.origin);
    if (mine) {
      const focused = await mine.focus();
      // the app is one page: a tab already on it only comes forward, so the running screen isn't reloaded
      if (new URL(focused.url).pathname !== new URL(target).pathname) await focused.navigate(target).catch(() => null);
      return;
    }
    await self.clients.openWindow(target);
  })());
});
