"use client";

import type { OrderView } from "@/lib/sim";
import styles from "./Console.module.css";

type Props = {
  order: OrderView;
  flashKey: number;
  onReassign: () => void;
  onCall: () => void;
  onClose: () => void;
};

function statusLine(o: OrderView) {
  if (o.stage === "new") return `Waiting for a courier at the ${o.hub} store`;
  if (o.stage === "pickup") return o.handover ? "Meeting the previous courier for hand-over" : `Collecting from the ${o.hub} store`;
  return "On the way to the customer";
}

export default function DetailCard({ order: o, flashKey, onReassign, onCall, onClose }: Props) {
  const pct = Math.round(o.progress * 100);
  return (
    <section className={styles.card} aria-labelledby="card-title" data-obstruct>
      <div className={styles.cardHead}>
        <h2 id="card-title" className={styles.cardName}>
          <span key={`${o.courier}-${flashKey}`} className={flashKey ? styles.flashName : undefined}>
            {o.courier ?? "Unassigned"}
          </span>
          <span className="num">, {o.distKm.toFixed(1)} km away</span>
        </h2>
        <button type="button" className={styles.cardClose} onClick={onClose} aria-label="Close order details" aria-keyshortcuts="Escape">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <p className={styles.cardSub}>
        Order <span className="num">#{o.num}</span> to {o.area}
      </p>
      <p className={styles.cardStatus}>
        {statusLine(o)}
        <span className={`${styles.cardEta} ${o.late ? styles.cardLate : ""} num`}>
          ETA {o.etaMin} min{o.late ? ", likely late" : ""}
        </span>
      </p>
      <div
        className={styles.cardBar}
        role="progressbar"
        aria-label="Delivery progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.cardActions}>
        <button type="button" className={styles.primary} onClick={onReassign} aria-keyshortcuts="r">
          {o.courier ? "Reassign" : "Assign"}
        </button>
        <button type="button" onClick={onCall} disabled={!o.courier}>
          Call
        </button>
      </div>
    </section>
  );
}
