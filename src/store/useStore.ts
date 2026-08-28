"use client";
import { create } from "zustand";
import { AppState, defaultState } from "@/lib/types";
import { loadLocal, saveLocal, setMeta, getMeta } from "@/lib/db";
import { api } from "@/lib/api";

interface StoreShape {
  state: AppState;
  ready: boolean;
  online: boolean;
  syncing: boolean;
  pendingPush: boolean;
  entitled: boolean;   // set from /api/auth/me; server is the source of truth
  blocked: boolean;    // true when a write was refused (trial ended) -> show paywall
  init: () => Promise<void>;
  mutate: (fn: (s: AppState) => void, opts?: { bypassGate?: boolean }) => void;
  push: () => Promise<void>;
  setTheme: (t: "light" | "dark") => void;
  setEntitled: (v: boolean) => void;
  clearBlocked: () => void;
}

let pushTimer: any = null;

export const useStore = create<StoreShape>((set, get) => ({
  state: defaultState(),
  ready: false,
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  syncing: false,
  pendingPush: false,
  entitled: true,
  blocked: false,

  init: async () => {
    try {
      // 1) Instant paint from IndexedDB (works offline).
      const local = await loadLocal();
      if (local) set({ state: local });
    } catch {
      // IndexedDB unavailable (private mode, etc.) — start with default state.
    }

    // 2) Reconcile with the server (last-write-wins by updatedAt).
    // Use a timeout so a hanging MongoDB connection doesn't freeze the UI forever.
    try {
      const { state: server } = await api("/api/state", {
        signal: AbortSignal.timeout(10_000),
      });
      const cur = get().state;
      const merged = (server?.updatedAt || 0) >= (cur.updatedAt || 0) && server ? server : cur;
      set({ state: merged });
      await saveLocal(merged);
      // If local was newer, push it up.
      if ((cur.updatedAt || 0) > (server?.updatedAt || 0)) get().push();
    } catch {
      // Offline, not authed, or server timeout — keep local copy.
    }

    set({ ready: true });
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => { set({ online: true }); if (get().pendingPush) get().push(); });
      window.addEventListener("offline", () => set({ online: false }));
    }
  },

  mutate: (fn, opts) => {
    // Client-side entitlement gate for clean UX. The SERVER is authoritative;
    // this just avoids letting an expired user pile up local edits that will
    // be rejected on sync. Theme/preference writes may bypass.
    if (!opts?.bypassGate && !get().entitled) { set({ blocked: true }); return; }
    const next = structuredClone(get().state);
    fn(next);
    next.updatedAt = Date.now();
    set({ state: next });
    saveLocal(next);
    // Debounced background push.
    clearTimeout(pushTimer);
    set({ pendingPush: true });
    pushTimer = setTimeout(() => get().push(), 800);
  },

  push: async () => {
    if (!get().online) { set({ pendingPush: true }); return; }
    set({ syncing: true });
    try {
      const res = await api("/api/state", { method: "PUT", body: JSON.stringify({ state: get().state }) });
      if (res?.conflict && res.state) { set({ state: res.state }); await saveLocal(res.state); }
      set({ pendingPush: false });
      await setMeta("lastSync", Date.now());
    } catch (e: any) {
      if (e?.status === 402) { set({ entitled: false, blocked: true, pendingPush: false }); }
      else { set({ pendingPush: true }); } // retry when back online
    } finally {
      set({ syncing: false });
    }
  },

  setTheme: (t) => {
    get().mutate((s) => { s.theme = t; }, { bypassGate: true });
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", t);
  },

  setEntitled: (v) => set({ entitled: v, blocked: v ? false : get().blocked }),
  clearBlocked: () => set({ blocked: false }),
}));
