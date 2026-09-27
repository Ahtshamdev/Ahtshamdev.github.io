'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { bagActions, getServerSnapshot, getSnapshot, resolveLines, subscribe } from './store';
import MiniBag from './MiniBag';

interface BagUI {
  open: boolean;
  /** Increments on every add, so the header count can play its confirmation. */
  bumps: number;
  lastAdded: { slug: string; sizeId: string } | null;
  addToBag: (slug: string, sizeId: string) => void;
  openBag: () => void;
  closeBag: () => void;
  returnFocus: React.RefObject<HTMLElement | null>;
}

const BagUIContext = createContext<BagUI | null>(null);

export function useBag() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lines = useMemo(() => resolveLines(state.lines), [state.lines]);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  return { ready: state.ready, lines, count, subtotal, ...bagActions };
}

export function useBagUI(): BagUI {
  const ui = useContext(BagUIContext);
  if (!ui) throw new Error('useBagUI must be used inside BagProvider');
  return ui;
}

export default function BagProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [bumps, setBumps] = useState(0);
  const [lastAdded, setLastAdded] = useState<BagUI['lastAdded']>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const remember = () => {
    const active = document.activeElement;
    returnFocus.current = active instanceof HTMLElement ? active : null;
  };

  const addToBag = useCallback((slug: string, sizeId: string) => {
    bagActions.add(slug, sizeId, 1);
    remember();
    setLastAdded({ slug, sizeId });
    setBumps((b) => b + 1);
    setOpen(true);
  }, []);

  const openBag = useCallback(() => {
    remember();
    setLastAdded(null);
    setOpen(true);
  }, []);

  const closeBag = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, bumps, lastAdded, addToBag, openBag, closeBag, returnFocus }),
    [open, bumps, lastAdded, addToBag, openBag, closeBag],
  );

  return (
    <BagUIContext.Provider value={value}>
      {children}
      <MiniBag />
    </BagUIContext.Provider>
  );
}
