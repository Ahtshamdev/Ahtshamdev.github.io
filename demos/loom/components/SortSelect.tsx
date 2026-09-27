'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SORTS, type SortId } from '@/lib/sort';
import styles from './SortSelect.module.css';

export default function SortSelect({ sort, type }: { sort: SortId; type: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form action="/shop" method="get" className={styles.form} data-pending={pending || undefined}>
      {type && <input type="hidden" name="type" value={type} />}
      <label htmlFor="sort" className={styles.label}>
        Sort
      </label>
      <select
        id="sort"
        name="sort"
        className={styles.select}
        value={sort}
        onChange={(e) => {
          const params = new URLSearchParams();
          if (type) params.set('type', type);
          if (e.target.value !== 'featured') params.set('sort', e.target.value);
          const qs = params.toString();
          startTransition(() => router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false }));
        }}
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={styles.apply}>
          Apply
        </button>
      </noscript>
    </form>
  );
}
