import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { requestDirSize, cancelAllDirSizeJobs } from "../utils/dirSizeQueue";
import { listen } from "@tauri-apps/api/event";

interface SpaceCacheCtx {
  getCachedSize: (path: string) => number | null;
  isScanning: (path: string) => boolean;
  requestSize: (path: string) => Promise<number>;
  setCachedSize: (path: string, size: number) => void;
  cancelAll: () => Promise<void>;
}

const Ctx = createContext<SpaceCacheCtx | null>(null);

export function SpaceCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Record<string, number>>({});
  const inflight = useRef(new Map<string, { promise: Promise<number>; resolvers: Array<(n: number) => void> }>());

  const setCachedSize = useCallback((path: string, size: number) => {
    setCache(prev => (prev[path] === size ? prev : { ...prev, [path]: size }));
  }, []);

  const getCachedSize = useCallback((path: string) => {
    return Object.prototype.hasOwnProperty.call(cache, path) ? cache[path] : null;
  }, [cache]);

  const isScanning = useCallback((path: string) => inflight.current.has(path), []);

  useEffect(() => {
    // Global listener for atomic size updates from Rust
    let unlisten: (() => void) | null = null;
    (async () => {
      unlisten = await listen<{ path: string; size: number }>("size-update", (e) => {
        const { path, size } = e.payload;
        setCachedSize(path, size);
        const infl = inflight.current.get(path);
        if (infl) {
          for (const r of infl.resolvers) {
            try { r(size); } catch {}
          }
          inflight.current.delete(path);
        }
      });
    })();
    return () => { try { unlisten?.(); } catch {} };
  }, [setCachedSize]);

  const requestSize = useCallback(async (path: string) => {
    // Return cached immediately
    if (Object.prototype.hasOwnProperty.call(cache, path)) {
      return cache[path];
    }
    const existing = inflight.current.get(path);
    if (existing) {
      return existing.promise;
    }
    // Create a promise that will resolve when the event arrives
    let resolveFn: (n: number) => void;
    const promise = new Promise<number>((resolve) => { resolveFn = resolve; });
    inflight.current.set(path, { promise, resolvers: [resolveFn!] });
    // Fire-and-forget request to Rust; result will come via event
    requestDirSize(path).catch(() => {
      // On failure, clear lock to allow retry; do not resolve promise here
      inflight.current.delete(path);
    });
    return promise;
  }, [cache]);

  const cancelAll = useCallback(async () => {
    inflight.current.clear();
    await cancelAllDirSizeJobs();
  }, []);

  const value = useMemo(() => ({ getCachedSize, isScanning, requestSize, setCachedSize, cancelAll }), [getCachedSize, isScanning, requestSize, setCachedSize, cancelAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSpaceCache(): SpaceCacheCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSpaceCache must be used within SpaceCacheProvider");
  return ctx;
}
