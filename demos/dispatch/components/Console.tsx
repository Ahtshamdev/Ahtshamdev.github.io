"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createSim, type OrderView, type Snapshot } from "@/lib/sim";
import MapCanvas from "./MapCanvas";
import Queue, { type QueueTab, visibleOrders } from "./Queue";
import DetailCard from "./DetailCard";
import ShortcutsDialog from "./ShortcutsDialog";
import styles from "./Console.module.css";

type Toast = { id: number; text: string };

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(motionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export default function Console() {
  const [sim] = useState(() => createSim());
  const [snap, setSnap] = useState<Snapshot>(() => sim.snapshot());
  const [tab, setTab] = useState<QueueTab>("risk");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sheetFull, setSheetFull] = useState(false);
  const [flash, setFlash] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const toastSeq = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );

  const list = useMemo(() => visibleOrders(snap.orders, tab, query), [snap.orders, tab, query]);
  const selected: OrderView | null = useMemo(
    () => (selectedId === null ? null : (snap.orders.find((o) => o.id === selectedId) ?? null)),
    [snap.orders, selectedId],
  );

  const toast = useCallback((text: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // Throttled bridge from the simulation to React: one snapshot per second.
  const tick = useEffectEvent(() => {
    const next = sim.snapshot();
    if (selectedId !== null && !next.orders.some((o) => o.id === selectedId)) {
      const gone = snap.orders.find((o) => o.id === selectedId);
      if (gone) toast(`Order #${gone.num} delivered to ${gone.area}`);
      setSelectedId(null);
    }
    setSnap(next);
  });
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    sim.select(selectedId);
    if (selectedId !== null) {
      document.getElementById(`order-${selectedId}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [sim, selectedId]);

  const select = useCallback((id: number | null) => {
    setSelectedId(id);
    setSheetFull(false);
  }, []);

  const reassign = useCallback(
    (id: number) => {
      const before = sim.orders.get(id);
      const res = sim.reassign(id, performance.now());
      if (!res.ok) {
        toast(res.reason);
        return;
      }
      const num = before ? before.num : id;
      toast(`Order #${num} ${res.assigned ? "assigned" : "reassigned"} to ${res.name}`);
      setFlash((f) => f + 1);
      setSnap(sim.snapshot());
    },
    [sim, toast],
  );

  const call = useCallback(() => toast("Calling is disabled in this demo."), [toast]);

  const onPickCourier = useCallback(
    (idx: number) => {
      if (idx < 0) return;
      const orderId = sim.courierOrder(idx);
      if (orderId >= 0) select(orderId);
      else toast(`${sim.couriers[idx].name} is free and waiting for an order`);
    },
    [sim, select, toast],
  );

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (helpOpen || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    const typing = !!target?.closest("input, textarea, select, [contenteditable='true']");
    if (e.key === "Escape") {
      if (typing && target instanceof HTMLInputElement) {
        if (query) setQuery("");
        else target.blur();
        e.preventDefault();
        return;
      }
      if (selectedId !== null) {
        setSelectedId(null);
        e.preventDefault();
      }
      return;
    }
    if (typing) return;
    const move = (d: number) => {
      if (!list.length) return;
      const i = list.findIndex((o) => o.id === selectedId);
      const next = list[i < 0 ? (d > 0 ? 0 : list.length - 1) : Math.max(0, Math.min(list.length - 1, i + d))];
      setSelectedId(next.id);
      // Keep keyboard focus with the selection when it is already in the queue.
      if (target?.closest("[data-queue]")) {
        requestAnimationFrame(() => document.getElementById(`order-${next.id}`)?.focus());
      }
    };
    switch (e.key) {
      case "j":
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "k":
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "r":
        if (selectedId !== null) {
          e.preventDefault();
          reassign(selectedId);
        } else {
          toast("Select an order first, then press r to reassign it");
        }
        break;
      case "/":
        e.preventDefault();
        searchRef.current?.focus();
        break;
      case "?":
        e.preventDefault();
        setHelpOpen(true);
        break;
    }
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { kpis } = snap;

  return (
    <div className={styles.app}>
      <header className={styles.top}>
        <h1 className={styles.logo}>
          <span className={styles.mark} aria-hidden="true" />
          Kilo Dispatch
        </h1>
        <p className={styles.city}>
          Lahore, lunch shift <span className="num">{snap.clock}</span>
        </p>
        <ul className={styles.kpis} aria-label="Shift numbers">
          <li>
            <b className="num">{kpis.onShift}</b> on shift
          </li>
          <li>
            <b className="num">{kpis.open}</b> open orders
          </li>
          <li className={styles.warn}>
            <b className="num">{kpis.atRisk}</b> at risk
          </li>
          <li>
            <b className="num">{kpis.avgEta} min</b> average ETA
          </li>
        </ul>
        <span className={`${styles.live} ${paused ? styles.paused : ""}`}>
          <span className={styles.dot} aria-hidden="true" />
          {paused ? "Paused" : "Live"}
        </span>
        <button type="button" className={styles.iconBtn} onClick={() => setHelpOpen(true)} aria-label="Keyboard shortcuts" aria-keyshortcuts="?">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="2.5" y="5" width="15" height="10" rx="2" />
            <path d="M5.5 8h1M9.5 8h1M13.5 8h1M6.5 12h7" />
          </svg>
        </button>
      </header>

      <main className={`${styles.body} ${sheetFull ? styles.sheetFull : ""}`}>
        <aside className={styles.queue} aria-labelledby="queue-title" data-queue data-obstruct>
          <Queue
            orders={snap.orders}
            list={list}
            tab={tab}
            onTab={setTab}
            query={query}
            onQuery={setQuery}
            selectedId={selectedId}
            onSelect={select}
            searchRef={searchRef}
            sheetFull={sheetFull}
            onToggleSheet={() => setSheetFull((s) => !s)}
            atRisk={kpis.atRisk}
          />
        </aside>

        <section className={styles.mapArea} aria-label="City map">
          <MapCanvas sim={sim} reducedMotion={reducedMotion} selectedId={selectedId} onPickCourier={onPickCourier} paused={paused} speed={speed} />
          <div className={styles.simControls} role="group" aria-label="Simulation controls">
            <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? "Resume simulation" : "Pause simulation"}
            </button>
            <label>Speed
              <select aria-label="Simulation speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={4}>4×</option>
              </select>
            </label>
          </div>
          {selected && (
            <DetailCard
              order={selected}
              flashKey={flash}
              onReassign={() => reassign(selected.id)}
              onCall={call}
              onClose={() => setSelectedId(null)}
            />
          )}
          <div className={styles.legend} aria-hidden="true">
            <span>
              <i className={styles.lgOk} />
              On time
            </span>
            <span>
              <i className={styles.lgLate} />
              Running late
            </span>
            <span>
              <i className={styles.lgIdle} />
              Free
            </span>
            <span>
              <i className={styles.lgHub} />
              Dark store
            </span>
          </div>
          <div className={styles.toasts} role="status" aria-live="polite">
            {toasts.map((t) => (
              <p key={t.id} className={styles.toast}>
                {t.text}
              </p>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.foot}>
        <p>
          A portfolio demo by{" "}
          <a href="https://ahtshamdev-github-io.vercel.app" target="_blank" rel="noopener">
            Ahtshamdev
          </a>
          . Couriers and orders are simulated.
        </p>
        <p className={styles.footKeys}>
          Press <kbd>?</kbd> for keyboard shortcuts
        </p>
      </footer>

      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
