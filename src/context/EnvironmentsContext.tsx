import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface EnvironmentInfo {
  name: string;
  image: string;
  status: string;
  container_id: string;
}

interface EnvironmentsCtx {
  envs: EnvironmentInfo[];
  loading: boolean;
  lastUpdated: number | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<EnvironmentsCtx | null>(null);

export function EnvironmentsProvider({ children }: { children: ReactNode }) {
  const [envs, setEnvs] = useState<EnvironmentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const list = await invoke<EnvironmentInfo[] | null>("list_environments");
      setEnvs(list ?? []);
      setLastUpdated(Date.now());
    } catch (e) {
      console.error("list_environments failed", e);
      setEnvs([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Preload environments once on app start
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ envs, loading, lastUpdated, refresh }), [envs, loading, lastUpdated, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEnvironments(): EnvironmentsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEnvironments must be used within EnvironmentsProvider");
  return ctx;
}
