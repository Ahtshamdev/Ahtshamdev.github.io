export const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price, low to high' },
  { id: 'price-desc', label: 'Price, high to low' },
] as const;

export type SortId = (typeof SORTS)[number]['id'];

export function isSort(value: unknown): value is SortId {
  return SORTS.some((s) => s.id === value);
}
