import { FREE_DELIVERY_THRESHOLD, formatPrice } from '@/lib/format';
import styles from './DeliveryProgress.module.css';

export default function DeliveryProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  return (
    <div className={styles.wrap}>
      <p className={styles.text}>
        {remaining === 0 ? (
          <>Your order ships free anywhere in Pakistan.</>
        ) : (
          <>
            Add <span className="num">{formatPrice(remaining)}</span> more for free delivery.
          </>
        )}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Progress towards free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={styles.fill} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
