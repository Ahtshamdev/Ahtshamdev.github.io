'use client';

import Link from 'next/link';
import KilimPattern from '@/components/KilimPattern';
import { FREE_DELIVERY_THRESHOLD, formatPrice } from '@/lib/format';
import { TYPE_LABELS } from '@/lib/products';
import { useBag } from './BagProvider';
import { MAX_QTY } from './store';
import DeliveryProgress from './DeliveryProgress';
import styles from './BagView.module.css';

export default function BagView() {
  const { ready, lines, count, subtotal, setQty, remove } = useBag();

  if (!ready) return <div className={styles.placeholder} aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your bag is empty.</p>
        <Link href="/shop" className="button">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <ul className={styles.list} aria-label="Items in your bag">
        {lines.map((l) => {
          const label = `${l.product.name}, ${l.size.label}`;
          return (
            <li key={`${l.slug}-${l.sizeId}`} className={styles.line}>
              <Link href={`/products/${l.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden="true">
                <KilimPattern
                  palette={l.product.palette}
                  motif={l.product.motif}
                  ratio={l.size.ratio}
                  seed={l.product.seed}
                />
              </Link>
              <div className={styles.info}>
                <p className={styles.type}>{TYPE_LABELS[l.product.type].singular}</p>
                <h2 className={styles.name}>
                  <Link href={`/products/${l.slug}`}>{l.product.name}</Link>
                </h2>
                <p className={styles.meta}>
                  {l.size.label} · <span className="num">{formatPrice(l.size.price)}</span> each
                </p>
                <div className={styles.controls}>
                  <div className={styles.stepper} role="group" aria-label={`Quantity for ${label}`}>
                    <button
                      type="button"
                      onClick={() => setQty(l.slug, l.sizeId, l.qty - 1)}
                      aria-label={l.qty === 1 ? `Remove ${label}` : `Decrease quantity of ${label}`}
                    >
                      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                        <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                    <output className="num" aria-live="polite" aria-label={`Quantity ${l.qty}`}>
                      {l.qty}
                    </output>
                    <button
                      type="button"
                      onClick={() => setQty(l.slug, l.sizeId, l.qty + 1)}
                      disabled={l.qty >= MAX_QTY}
                      aria-label={`Increase quantity of ${label}`}
                    >
                      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                        <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </div>
                  <button type="button" className={styles.remove} onClick={() => remove(l.slug, l.sizeId)}>
                    Remove<span className="visually-hidden"> {label}</span>
                  </button>
                </div>
              </div>
              <p className={`${styles.total} num`}>{formatPrice(l.total)}</p>
            </li>
          );
        })}
      </ul>

      <aside className={styles.summary} aria-labelledby="summary-title">
        <h2 id="summary-title" className={styles.summaryTitle}>
          Order summary
        </h2>
        <DeliveryProgress subtotal={subtotal} />
        <dl className={styles.rows}>
          <div>
            <dt>
              Subtotal ({count} {count === 1 ? 'item' : 'items'})
            </dt>
            <dd className="num">{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{subtotal >= FREE_DELIVERY_THRESHOLD ? 'Free' : 'Calculated at checkout'}</dd>
          </div>
        </dl>
        <Link href="/checkout" className={`button ${styles.checkout}`}>
          Checkout
        </Link>
        <p className={styles.small}>Every piece is woven to order. Allow 2 to 8 weeks for weaving, depending on the piece, plus delivery.</p>
      </aside>
    </div>
  );
}
