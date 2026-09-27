/** Small seeded PRNG (mulberry32) so the city and the shift replay identically. */
export type Rng = {
  next: () => number;
  range: (min: number, max: number) => number;
  int: (min: number, maxExclusive: number) => number;
  pick: <T>(items: readonly T[]) => T;
  chance: (p: number) => boolean;
};

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, maxExclusive) => min + Math.floor(next() * (maxExclusive - min)),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
  };
}
