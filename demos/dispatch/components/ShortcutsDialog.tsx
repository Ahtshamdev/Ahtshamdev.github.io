"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import styles from "./Console.module.css";

const SHORTCUTS: [string[], string][] = [
  [["j", "↓"], "Next order"],
  [["k", "↑"], "Previous order"],
  [["r"], "Reassign the selected order"],
  [["/"], "Search orders"],
  [["Esc"], "Clear selection"],
  [["?"], "Show this list"],
];

export default function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      d.showModal();
      d.querySelector<HTMLElement>("button")?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Keep Tab inside the dialog.
  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const items = ref.current?.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])");
    if (!items || !items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="shortcuts-title"
      onClose={() => {
        onClose();
        const back = returnTo.current;
        if (back && back.isConnected) back.focus();
      }}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className={styles.dialogHead}>
        <h2 id="shortcuts-title">Keyboard shortcuts</h2>
        <button type="button" className={styles.cardClose} onClick={() => ref.current?.close()} aria-label="Close shortcuts">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <dl className={styles.keys}>
        {SHORTCUTS.map(([keys, label]) => (
          <div key={label}>
            <dt>
              {keys.map((k, i) => (
                <span key={k}>
                  {i > 0 && <span className={styles.or}> or </span>}
                  <kbd>{k}</kbd>
                </span>
              ))}
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className={styles.dialogDone} onClick={() => ref.current?.close()}>
        Done
      </button>
    </dialog>
  );
}
