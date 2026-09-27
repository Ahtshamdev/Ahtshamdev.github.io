'use client';

import { useBag, useBagUI } from './BagProvider';
import styles from './BagButton.module.css';

export default function BagButton() {
  const { count, ready } = useBag();
  const { openBag, bumps } = useBagUI();
  const shown = ready ? count : 0;
  return (
    <button
      type="button"
      className={styles.button}
      onClick={openBag}
      aria-haspopup="dialog"
      aria-label={`Bag, ${shown} ${shown === 1 ? 'item' : 'items'}`}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className={styles.icon}>
        <path d="M4 7h12l-1 10H5L4 7z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className={styles.label}>Bag</span>
      <span key={bumps} className={`${styles.count} num ${bumps > 0 ? styles.bump : ''}`}>
        {shown}
      </span>
    </button>
  );
}
