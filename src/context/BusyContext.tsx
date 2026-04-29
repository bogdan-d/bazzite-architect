import { createContext, useContext, useMemo, useState, useCallback, ReactNode } from "react";

type BusyCtx = {
  isBusy: boolean;
  startBusy: () => void;
  endBusy: () => void;
};

const Ctx = createContext<BusyCtx | null>(null);

export function BusyProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  // Stabile Callback-Identitäten verhindern Effect-Loops in Abhängigkeiten
  const startBusy = useCallback(() => setCount((c) => c + 1), []);
  const endBusy = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const value = useMemo(
    () => ({
      isBusy: count > 0,
      startBusy,
      endBusy,
    }),
    [count, startBusy, endBusy]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBusy(): BusyCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBusy must be used within BusyProvider");
  return ctx;
}
