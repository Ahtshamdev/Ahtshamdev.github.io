"use client";

import type { KeyboardEvent, RefObject } from "react";
import type { OrderView } from "@/lib/sim";
import styles from "./Console.module.css";

export type QueueTab = "risk" | "newest" | "zone";

const TABS: { id: QueueTab; label: string }[] = [
  { id: "risk", label: "At risk first" },
  { id: "newest", label: "Newest" },
  { id: "zone", label: "By zone" },
];

const rank = (o: OrderView) => (o.late ? 0 : o.stage === "new" ? 1 : 2);

/** The orders the queue shows, in display order (keyboard navigation follows this). */
export function visibleOrders(orders: OrderView[], tab: QueueTab, query: string): OrderView[] {
  const q = query.trim().toLowerCase().replace(/^#/, "");
  const filtered = q
    ? orders.filter((o) => String(o.num).includes(q) || o.area.toLowerCase().includes(q))
    : orders.slice();
  if (tab === "newest") return filtered.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
  const byRisk = (a: OrderView, b: OrderView) => rank(a) - rank(b) || a.etaMin - b.etaMin || a.id - b.id;
  if (tab === "zone") return filtered.sort((a, b) => a.area.localeCompare(b.area) || byRisk(a, b));
  return filtered.sort(byRisk);
}

type Props = {
  orders: OrderView[];
  list: OrderView[];
  tab: QueueTab;
  onTab: (t: QueueTab) => void;
  query: string;
  onQuery: (q: string) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  sheetFull: boolean;
  onToggleSheet: () => void;
  atRisk: number;
};

function OrderRow({ o, selected, onSelect }: { o: OrderView; selected: boolean; onSelect: (id: number) => void }) {
  const state = o.late ? styles.risk : o.stage === "new" ? styles.new : "";
  return (
    <li>
      <button
        type="button"
        id={`order-${o.id}`}
        className={`${styles.order} ${state} ${selected ? styles.pick : ""}`}
        aria-pressed={selected}
        onClick={() => onSelect(o.id)}
      >
        <span className={styles.oTop}>
          <span className={`${styles.oid} num`}>#{o.num}</span>
          <span className={`${styles.eta} num`}>{o.etaMin} min</span>
        </span>
        <span className={styles.place}>{o.area}</span>
        <span className={styles.courier}>{o.courier ?? "Unassigned"}</span>
        {o.late && <span className={styles.flag}>Likely late</span>}
      </button>
    </li>
  );
}

export default function Queue(props: Props) {
  const { orders, list, tab, onTab, query, onQuery, selectedId, onSelect, searchRef, sheetFull, onToggleSheet, atRisk } = props;

  const groups: { area: string; items: OrderView[] }[] = [];
  if (tab === "zone") {
    for (const o of list) {
      const g = groups[groups.length - 1];
      if (g && g.area === o.area) g.items.push(o);
      else groups.push({ area: o.area, items: [o] });
    }
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    const next = TABS[(i + d + TABS.length) % TABS.length];
    onTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <>
      <div className={styles.qHead}>
        <h2 id="queue-title" className={styles.qTitle}>
          Orders{" "}
          <span className={`${styles.qCount} num`}>
            {orders.length} open, <span className={styles.qRisk}>{atRisk} at risk</span>
          </span>
        </h2>
        <button type="button" className={styles.sheetToggle} onClick={onToggleSheet} aria-expanded={sheetFull} aria-controls="queue-list">
          {sheetFull ? "Show map" : "Expand"}
        </button>
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Sort orders">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="queue-list"
            tabIndex={tab === t.id ? 0 : -1}
            className={tab === t.id ? styles.tabOn : undefined}
            onClick={() => onTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.search}>
        <label htmlFor="order-search" className="sr-only">
          Search by order number or area
        </label>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
        </svg>
        <input
          ref={searchRef}
          id="order-search"
          type="search"
          placeholder="Order # or area"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          aria-keyshortcuts="/"
        />
        <kbd aria-hidden="true">/</kbd>
      </div>
      <div id="queue-list" className={styles.list} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {list.length === 0 ? (
          <p className={styles.empty}>No open orders match &ldquo;{query}&rdquo;.</p>
        ) : tab === "zone" ? (
          groups.map((g) => (
            <div key={g.area} role="group" aria-label={g.area} className={styles.group}>
              <h3 className={styles.groupHead}>
                {g.area} <span className="num">{g.items.length}</span>
              </h3>
              <ul role="list">
                {g.items.map((o) => (
                  <OrderRow key={o.id} o={o} selected={o.id === selectedId} onSelect={onSelect} />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <ul role="list">
            {list.map((o) => (
              <OrderRow key={o.id} o={o} selected={o.id === selectedId} onSelect={onSelect} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
