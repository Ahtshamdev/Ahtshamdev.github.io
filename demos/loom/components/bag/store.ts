import { getProduct, getSize, type Product, type Size } from '@/lib/products';

export interface BagLine {
  slug: string;
  sizeId: string;
  qty: number;
}

export interface BagState {
  lines: BagLine[];
  /** False until the saved bag has been read in the browser. */
  ready: boolean;
}

export interface ResolvedLine extends BagLine {
  product: Product;
  size: Size;
  total: number;
}

export const MAX_QTY = 10;
const KEY = 'loom-field-bag-v1';
const SERVER_STATE: BagState = { lines: [], ready: false };

let state: BagState = SERVER_STATE;
const listeners = new Set<() => void>();

function isValid(line: unknown): line is BagLine {
  if (!line || typeof line !== 'object') return false;
  const l = line as Record<string, unknown>;
  if (typeof l.slug !== 'string' || typeof l.sizeId !== 'string' || typeof l.qty !== 'number') return false;
  const product = getProduct(l.slug);
  return Boolean(product && getSize(product, l.sizeId)) && Number.isInteger(l.qty) && l.qty > 0;
}

function read(): BagLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid).map((l) => ({ ...l, qty: Math.min(l.qty, MAX_QTY) }));
  } catch {
    return [];
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(lines: BagLine[]) {
  state = { lines, ready: true };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage can be full or blocked; the bag still works for this visit.
  }
  emit();
}

export function getSnapshot(): BagState {
  if (!state.ready) state = { lines: read(), ready: true };
  return state;
}

export function getServerSnapshot(): BagState {
  return SERVER_STATE;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    state = { lines: read(), ready: true };
    emit();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const same = (l: BagLine, slug: string, sizeId: string) => l.slug === slug && l.sizeId === sizeId;

export const bagActions = {
  add(slug: string, sizeId: string, qty = 1) {
    const lines = getSnapshot().lines;
    const existing = lines.find((l) => same(l, slug, sizeId));
    if (existing) {
      commit(
        lines.map((l) => (same(l, slug, sizeId) ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)),
      );
    } else {
      commit([...lines, { slug, sizeId, qty: Math.min(MAX_QTY, qty) }]);
    }
  },
  setQty(slug: string, sizeId: string, qty: number) {
    const lines = getSnapshot().lines;
    if (qty < 1) {
      commit(lines.filter((l) => !same(l, slug, sizeId)));
      return;
    }
    commit(lines.map((l) => (same(l, slug, sizeId) ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)));
  },
  remove(slug: string, sizeId: string) {
    commit(getSnapshot().lines.filter((l) => !same(l, slug, sizeId)));
  },
};

export function resolveLines(lines: BagLine[]): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const line of lines) {
    const product = getProduct(line.slug);
    const size = product && getSize(product, line.sizeId);
    if (product && size) out.push({ ...line, product, size, total: size.price * line.qty });
  }
  return out;
}
