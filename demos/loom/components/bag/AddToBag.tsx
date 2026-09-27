'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { Size } from '@/lib/products';
import { useBagUI } from './BagProvider';
import styles from './AddToBag.module.css';

interface Props {
  slug: string;
  name: string;
  sizes: Size[];
  defaultSize: number;
}

export default function AddToBag({ slug, name, sizes, defaultSize }: Props) {
  const [sizeId, setSizeId] = useState(sizes[defaultSize]?.id ?? sizes[0].id);
  const { addToBag } = useBagUI();
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        addToBag(slug, size.id);
      }}
    >
      <p className={`${styles.price} num`} aria-live="polite">
        {formatPrice(size.price)}
      </p>
      <fieldset className={styles.sizes}>
        <legend className={styles.legend}>Size</legend>
        <div className={styles.options}>
          {sizes.map((s) => (
            <label key={s.id} className={styles.option}>
              <input
                type="radio"
                name="size"
                value={s.id}
                checked={s.id === sizeId}
                onChange={() => setSizeId(s.id)}
                className={styles.radio}
              />
              <span className={styles.box}>
                <span className={styles.sizeLabel}>{s.label}</span>
                <span className={`${styles.sizePrice} num`}>{formatPrice(s.price)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" className={`button ${styles.add}`}>
        Add to bag<span className="visually-hidden">: {name}, {size.label}</span>
      </button>
      <p className={styles.note}>Made to order in Multan. Allow 2 to 8 weeks for weaving, depending on the piece, plus delivery.</p>
    </form>
  );
}
