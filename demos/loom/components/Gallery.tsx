'use client';

import { useState, type ReactNode } from 'react';
import styles from './Gallery.module.css';

export interface GalleryView {
  id: string;
  label: string;
  main: ReactNode;
  thumb: ReactNode;
  /** Crops fill the frame; whole pieces sit on the panel with space around them. */
  fill?: boolean;
}

export default function Gallery({ views, name }: { views: GalleryView[]; name: string }) {
  const [active, setActive] = useState(views[0].id);
  const current = views.find((v) => v.id === active) ?? views[0];

  return (
    <div className={styles.gallery}>
      <div className={styles.stage} role="group" aria-roledescription="gallery" aria-label={`${name}: ${current.label}`}>
        {views.map((v) => (
          <div key={v.id} className={`${styles.view} ${v.fill ? styles.fill : ''}`} hidden={v.id !== active}>
            {v.main}
          </div>
        ))}
      </div>
      <ul className={styles.thumbs} aria-label="Views">
        {views.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              className={styles.thumb}
              aria-pressed={v.id === active}
              onClick={() => setActive(v.id)}
            >
              <span className={`${styles.thumbArt} ${v.fill ? styles.fill : ''}`}>{v.thumb}</span>
              <span className="visually-hidden">Show {v.label.toLowerCase()}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.caption} aria-live="polite">
        {current.label}
      </p>
    </div>
  );
}
