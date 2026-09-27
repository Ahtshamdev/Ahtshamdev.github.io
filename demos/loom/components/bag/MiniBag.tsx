'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import KilimPattern from '@/components/KilimPattern';
import { formatPrice } from '@/lib/format';
import { useBag, useBagUI } from './BagProvider';
import DeliveryProgress from './DeliveryProgress';
import styles from './MiniBag.module.css';

/** Slide-over bag. A modal dialog: focus moves in, Esc closes, focus returns. */
export default function MiniBag() {
  const { open, closeBag, lastAdded, returnFocus } = useBagUI();
  const { lines, subtotal, count } = useBag();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      const target = returnFocus.current;
      if (target && target.isConnected) target.focus();
    }
  }, [open, returnFocus]);

  const added = lastAdded && lines.find((l) => l.slug === lastAdded.slug && l.sizeId === lastAdded.sizeId);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="minibag-title"
      onCancel={(e) => {
        e.preventDefault();
        closeBag();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBag();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.head}>
          <h2 id="minibag-title" className={styles.title}>
            {added ? 'Added to your bag' : 'Your bag'}
          </h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={closeBag}>
            <span className="visually-hidden">Close bag</span>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        </div>

        {added && (
          <p className={styles.confirm} role="status">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
            {added.product.name}, {added.size.label}
          </p>
        )}

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>Your bag is empty.</p>
            <Link href="/shop" className="button" onClick={closeBag}>
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {lines.map((l) => (
                <li key={`${l.slug}-${l.sizeId}`} className={styles.line}>
                  <div className={styles.thumb}>
                    <KilimPattern
                      palette={l.product.palette}
                      motif={l.product.motif}
                      ratio={l.size.ratio}
                      seed={l.product.seed}
                    />
                  </div>
                  <div>
                    <p className={styles.name}>
                      <Link href={`/products/${l.slug}`} onClick={closeBag}>{l.product.name}</Link>
                    </p>
                    <p className={styles.meta}>
                      {l.size.label} · Qty {l.qty}
                    </p>
                  </div>
                  <p className={`${styles.price} num`}>{formatPrice(l.total)}</p>
                </li>
              ))}
            </ul>
            <div className={styles.foot}>
              <DeliveryProgress subtotal={subtotal} />
              <p className={styles.subtotal}>
                <span>
                  Subtotal ({count} {count === 1 ? 'item' : 'items'})
                </span>
                <span className="num">{formatPrice(subtotal)}</span>
              </p>
              <div className={styles.actions}>
                <Link href="/bag" className="button button--ghost" onClick={closeBag}>
                  View bag
                </Link>
                <Link href="/checkout" className="button" onClick={closeBag}>
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
