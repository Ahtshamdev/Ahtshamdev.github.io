import type { Motif, Palette } from './kilim';

export type ProductType = 'rug' | 'runner' | 'throw';

export interface Size {
  id: string;
  label: string;
  /** Width over length, used to draw the piece at its true proportions. */
  ratio: number;
  price: number;
}

export interface Weaver {
  id: string;
  name: string;
  place: string;
  story: string;
}

export interface Product {
  slug: string;
  name: string;
  type: ProductType;
  summary: string;
  palette: Palette;
  motif: Motif;
  fringe: boolean;
  seed: number;
  sizes: Size[];
  /** Index into sizes shown first. */
  defaultSize: number;
  materials: string;
  dyes: string;
  weaverId: string;
  weeksOnLoom: number;
  isNew: boolean;
  featured: number;
}

export const TYPE_LABELS: Record<ProductType, { singular: string; plural: string }> = {
  rug: { singular: 'Rug', plural: 'Rugs' },
  runner: { singular: 'Runner', plural: 'Runners' },
  throw: { singular: 'Throw', plural: 'Throws' },
};

export const WEAVERS: Weaver[] = [
  {
    id: 'bhatti',
    name: 'the Bhatti family',
    place: 'Shujabad, south of Multan',
    story:
      'Three generations of the Bhatti family share two upright looms in a courtyard shaded by a neem tree. Nasreen Bhatti sets the warps; her sons Imran and Adeel weave side by side, and her granddaughter keeps the tally of rows in a school exercise book.',
  },
  {
    id: 'kausar',
    name: 'Kausar Bibi and her daughters',
    place: 'Mumtazabad, Multan',
    story:
      'Kausar Bibi learned to weave from her mother at nine and now teaches her own daughters on the same floor loom. She draws every design from memory, counting the steps of each diamond under her breath as she beats the weft down.',
  },
  {
    id: 'rasool',
    name: 'Ghulam Rasool’s workshop',
    place: 'the old city, Multan',
    story:
      'Ghulam Rasool runs a small dye yard and four looms behind the Hussain Agahi bazaar. He still boils madder root and pomegranate rind in copper vats, and keeps a wall of wool skeins so the colours of each rug can be matched years later.',
  },
  {
    id: 'baloch',
    name: 'the Baloch family',
    place: 'Jalalpur Pirwala',
    story:
      'The Baloch family came to weaving from herding, and still spin much of their own yarn from the fleece of Cholistani sheep. Their runners are long and narrow, woven on a loom built to fit the length of the family’s veranda.',
  },
  {
    id: 'naz',
    name: 'Shahnaz and Parveen Naz',
    place: 'Qadirpur Raan',
    story:
      'Sisters Shahnaz and Parveen weave throws and small rugs between the cotton harvests. Their ralli patchwork patterns come from the quilts their grandmother stitched for dowries, translated square by square onto the loom.',
  },
];

const RUG_SIZES = (base: number): Size[] => [
  { id: '4x6', label: '4 × 6 ft', ratio: 4 / 6, price: round(base * 0.42) },
  { id: '5x8', label: '5 × 8 ft', ratio: 5 / 8, price: round(base * 0.64) },
  { id: '8x10', label: '8 × 10 ft', ratio: 8 / 10, price: base },
  { id: '9x12', label: '9 × 12 ft', ratio: 9 / 12, price: round(base * 1.32) },
];

const RUNNER_SIZES = (base: number): Size[] => [
  { id: '2.5x8', label: '2.5 × 8 ft', ratio: 2.5 / 8, price: round(base * 0.82) },
  { id: '2.5x10', label: '2.5 × 10 ft', ratio: 2.5 / 10, price: base },
  { id: '2.5x12', label: '2.5 × 12 ft', ratio: 2.5 / 12, price: round(base * 1.18) },
];

const THROW_SIZES = (base: number): Size[] => [
  { id: '50x70', label: '50 × 70 in', ratio: 50 / 70, price: base },
  { id: '60x80', label: '60 × 80 in', ratio: 60 / 80, price: round(base * 1.25) },
];

function round(n: number): number {
  return Math.round(n / 100) * 100;
}

const WOOL = 'Hand-spun wool weft on a cotton warp';
const THROW_WOOL = 'Soft hand-spun wool, loosely woven';

export const PRODUCTS: Product[] = [
  {
    slug: 'multan-kilim-rust',
    name: 'Multan kilim, rust',
    type: 'rug',
    summary:
      'Our signature piece: a lattice of stepped indigo diamonds on a madder-rust ground, framed by a sawtooth border.',
    palette: { ground: '#b4552d', motif: '#2f3a57', accent: '#d8a24a', light: '#e8cfa6', border: '#2a211b', fringe: '#eadcc2' },
    motif: 'diamond',
    fringe: true,
    seed: 11,
    sizes: RUG_SIZES(38500),
    defaultSize: 2,
    materials: WOOL,
    dyes: 'Madder root, indigo and pomegranate rind',
    weaverId: 'rasool',
    weeksOnLoom: 6,
    isNew: true,
    featured: 1,
  },
  {
    slug: 'indigo-dhurrie',
    name: 'Indigo dhurrie',
    type: 'rug',
    summary:
      'Deep indigo bands broken by rows of small ivory diamonds. Flat, reversible and happy in a busy room.',
    palette: { ground: '#2f3a57', motif: '#8aa0b8', accent: '#c9a36a', light: '#d9d2c1', border: '#1f2638', fringe: '#e4dccb' },
    motif: 'bands',
    fringe: true,
    seed: 23,
    sizes: RUG_SIZES(24900),
    defaultSize: 2,
    materials: 'Hand-spun cotton weft on a cotton warp',
    dyes: 'Indigo, with undyed cotton',
    weaverId: 'kausar',
    weeksOnLoom: 4,
    isNew: true,
    featured: 3,
  },
  {
    slug: 'madder-lozenge-kilim',
    name: 'Madder lozenge kilim',
    type: 'rug',
    summary:
      'A column of hooked lozenges down a deep madder field, the classic medallion layout of the southern Punjab.',
    palette: { ground: '#8a2e2e', motif: '#e8d4b0', accent: '#2f3a57', light: '#d9a441', border: '#3b1f1c', fringe: '#ecdfc6' },
    motif: 'lozenge',
    fringe: true,
    seed: 37,
    sizes: RUG_SIZES(42000),
    defaultSize: 2,
    materials: WOOL,
    dyes: 'Madder root and indigo',
    weaverId: 'rasool',
    weeksOnLoom: 7,
    isNew: false,
    featured: 2,
  },
  {
    slug: 'pomegranate-chevron',
    name: 'Pomegranate chevron',
    type: 'rug',
    summary:
      'Stepped chevrons in the warm gold that pomegranate rind gives wool, cut with lines of walnut brown.',
    palette: { ground: '#c28a3c', motif: '#4a3326', accent: '#9a4a2a', light: '#efdfbf', border: '#3a2a20', fringe: '#eadcc2' },
    motif: 'chevron',
    fringe: true,
    seed: 41,
    sizes: RUG_SIZES(31500),
    defaultSize: 2,
    materials: WOOL,
    dyes: 'Pomegranate rind, walnut husk and madder',
    weaverId: 'bhatti',
    weeksOnLoom: 5,
    isNew: false,
    featured: 6,
  },
  {
    slug: 'walnut-and-bone-kilim',
    name: 'Walnut & bone kilim',
    type: 'rug',
    summary:
      'Undyed ivory wool and walnut brown in a quiet diamond lattice. The one to choose when the room already has colour.',
    palette: { ground: '#e9dfca', motif: '#5b4636', accent: '#a0784f', light: '#f6efe0', border: '#4a3a2d', fringe: '#efe6d3' },
    motif: 'diamond',
    fringe: true,
    seed: 53,
    sizes: RUG_SIZES(27800),
    defaultSize: 2,
    materials: 'Undyed hand-spun wool on a cotton warp',
    dyes: 'Walnut husk, with natural ivory fleece',
    weaverId: 'bhatti',
    weeksOnLoom: 5,
    isNew: false,
    featured: 7,
  },
  {
    slug: 'cholistan-medallion',
    name: 'Cholistan medallion',
    type: 'rug',
    summary:
      'Saffron-gold lozenges edged in indigo on a charcoal ground, after a desert rug the Baloch family’s grandmother kept.',
    palette: { ground: '#33302c', motif: '#d69e3e', accent: '#b4552d', light: '#ecdcbc', border: '#1f1c19', fringe: '#e6d9bf' },
    motif: 'lozenge',
    fringe: true,
    seed: 67,
    sizes: RUG_SIZES(45500),
    defaultSize: 2,
    materials: WOOL,
    dyes: 'Pomegranate rind, madder and iron-darkened walnut',
    weaverId: 'baloch',
    weeksOnLoom: 8,
    isNew: true,
    featured: 4,
  },
  {
    slug: 'ash-stripe-dhurrie',
    name: 'Ash stripe dhurrie',
    type: 'rug',
    summary:
      'Soft grey and ivory bands with a single thread of rust. Light enough to move from room to room.',
    palette: { ground: '#8a867b', motif: '#2a211b', accent: '#b4552d', light: '#ece5d6', border: '#4b4841', fringe: '#ece5d6' },
    motif: 'bands',
    fringe: true,
    seed: 71,
    sizes: RUG_SIZES(21500),
    defaultSize: 2,
    materials: 'Hand-spun cotton weft on a cotton warp',
    dyes: 'Natural grey fleece, with madder',
    weaverId: 'kausar',
    weeksOnLoom: 4,
    isNew: false,
    featured: 10,
  },
  {
    slug: 'cholistan-runner',
    name: 'Cholistan runner',
    type: 'runner',
    summary:
      'Olive green with rust diamonds, woven long and narrow for hallways, landings and the side of a bed.',
    palette: { ground: '#6f7d4f', motif: '#b4552d', accent: '#2a211b', light: '#efe3c8', border: '#3d4530', fringe: '#efe3c8' },
    motif: 'diamond',
    fringe: true,
    seed: 83,
    sizes: RUNNER_SIZES(19500),
    defaultSize: 1,
    materials: WOOL,
    dyes: 'Pomegranate rind over indigo, with madder',
    weaverId: 'baloch',
    weeksOnLoom: 4,
    isNew: true,
    featured: 5,
  },
  {
    slug: 'indigo-step-runner',
    name: 'Indigo step runner',
    type: 'runner',
    summary: 'Tall indigo chevrons climbing the length of the runner, edged in ivory.',
    palette: { ground: '#2f3a57', motif: '#e3d6bb', accent: '#8aa0b8', light: '#c7b58f', border: '#1c2336', fringe: '#e3d6bb' },
    motif: 'chevron',
    fringe: true,
    seed: 97,
    sizes: RUNNER_SIZES(17800),
    defaultSize: 1,
    materials: WOOL,
    dyes: 'Indigo, with undyed wool',
    weaverId: 'baloch',
    weeksOnLoom: 4,
    isNew: false,
    featured: 9,
  },
  {
    slug: 'rust-band-runner',
    name: 'Rust band runner',
    type: 'runner',
    summary: 'Bands of rust, ivory and indigo, with rows of tiny diamonds. Hardwearing and easy to live with.',
    palette: { ground: '#a24d2a', motif: '#2f3a57', accent: '#d8a24a', light: '#eedcbc', border: '#4a2616', fringe: '#eedcbc' },
    motif: 'bands',
    fringe: true,
    seed: 101,
    sizes: RUNNER_SIZES(16500),
    defaultSize: 1,
    materials: WOOL,
    dyes: 'Madder root and indigo',
    weaverId: 'bhatti',
    weeksOnLoom: 3,
    isNew: false,
    featured: 11,
  },
  {
    slug: 'kiln-lozenge-runner',
    name: 'Kiln lozenge runner',
    type: 'runner',
    summary: 'A chain of terracotta lozenges on a sand ground, like tiles laid down a corridor.',
    palette: { ground: '#d9c3a0', motif: '#9a4a2a', accent: '#2a211b', light: '#f3e8d2', border: '#5a3a26', fringe: '#f3e8d2' },
    motif: 'lozenge',
    fringe: true,
    seed: 113,
    sizes: RUNNER_SIZES(21000),
    defaultSize: 1,
    materials: WOOL,
    dyes: 'Madder root and walnut husk',
    weaverId: 'rasool',
    weeksOnLoom: 5,
    isNew: false,
    featured: 12,
  },
  {
    slug: 'olive-hall-runner',
    name: 'Olive hall runner',
    type: 'runner',
    summary: 'Ivory diamonds on a deep olive ground, with a madder guard stripe inside the border.',
    palette: { ground: '#4f5a37', motif: '#e6d8b8', accent: '#a64a2c', light: '#c9b37f', border: '#2c3220', fringe: '#e6d8b8' },
    motif: 'diamond',
    fringe: true,
    seed: 127,
    sizes: RUNNER_SIZES(18200),
    defaultSize: 1,
    materials: WOOL,
    dyes: 'Indigo over pomegranate rind, with madder',
    weaverId: 'kausar',
    weeksOnLoom: 4,
    isNew: false,
    featured: 14,
  },
  {
    slug: 'sindhi-ralli-throw',
    name: 'Sindhi ralli throw',
    type: 'throw',
    summary:
      'Patchwork squares of madder red, ivory and near-black, woven after the ralli quilts of Sindh and the southern Punjab.',
    palette: { ground: '#8a2e2e', motif: '#1f2a24', accent: '#d8a24a', light: '#f1e4c9', border: '#1f2a24', fringe: '#f1e4c9' },
    motif: 'ralli',
    fringe: true,
    seed: 131,
    sizes: THROW_SIZES(12800),
    defaultSize: 0,
    materials: THROW_WOOL,
    dyes: 'Madder root and iron-darkened walnut',
    weaverId: 'naz',
    weeksOnLoom: 3,
    isNew: true,
    featured: 8,
  },
  {
    slug: 'indigo-ralli-throw',
    name: 'Indigo ralli throw',
    type: 'throw',
    summary: 'The ralli patchwork in indigo, ivory and a little saffron. Made for the end of a bed.',
    palette: { ground: '#2f3a57', motif: '#e9dcc0', accent: '#c98f3a', light: '#8aa0b8', border: '#1c2336', fringe: '#e9dcc0' },
    motif: 'ralli',
    fringe: true,
    seed: 139,
    sizes: THROW_SIZES(11900),
    defaultSize: 0,
    materials: THROW_WOOL,
    dyes: 'Indigo and pomegranate rind',
    weaverId: 'naz',
    weeksOnLoom: 3,
    isNew: false,
    featured: 13,
  },
  {
    slug: 'bone-wool-throw',
    name: 'Bone wool throw',
    type: 'throw',
    summary: 'Undyed ivory wool with fine walnut stripes. Warm, plain and very soft.',
    palette: { ground: '#ebe1cd', motif: '#6b5442', accent: '#a0784f', light: '#f7f1e4', border: '#6b5442', fringe: '#f1e9d8' },
    motif: 'bands',
    fringe: true,
    seed: 149,
    sizes: THROW_SIZES(9800),
    defaultSize: 0,
    materials: THROW_WOOL,
    dyes: 'Walnut husk, with natural ivory fleece',
    weaverId: 'naz',
    weeksOnLoom: 2,
    isNew: false,
    featured: 15,
  },
  {
    slug: 'madder-chevron-throw',
    name: 'Madder chevron throw',
    type: 'throw',
    summary: 'Small madder and ivory chevrons that ripple across a light, drapey throw.',
    palette: { ground: '#b04a36', motif: '#f0e0c4', accent: '#3a2a20', light: '#dc9a5a', border: '#5a2419', fringe: '#f0e0c4' },
    motif: 'chevron',
    fringe: true,
    seed: 157,
    sizes: THROW_SIZES(10500),
    defaultSize: 0,
    materials: THROW_WOOL,
    dyes: 'Madder root and walnut husk',
    weaverId: 'naz',
    weeksOnLoom: 2,
    isNew: false,
    featured: 16,
  },
];

export const CARE: Record<ProductType, string> = {
  rug: 'Vacuum without the beater bar, and turn it every few months so it wears evenly. Blot spills at once with a damp cloth; for anything deeper, a specialist rug wash. A thin underlay stops it creeping on hard floors.',
  runner:
    'Vacuum without the beater bar and turn end to end every few months. Blot spills with a damp cloth. On stairs or polished floors, use a thin non-slip underlay.',
  throw:
    'Shake out and air in the shade. Hand wash cold with a wool detergent, press out the water in a towel and dry flat. Never tumble dry.',
};

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getWeaver(id: string): Weaver {
  const weaver = WEAVERS.find((w) => w.id === id);
  if (!weaver) throw new Error(`Unknown weaver ${id}`);
  return weaver;
}

export function fromPrice(p: Product): number {
  return Math.min(...p.sizes.map((s) => s.price));
}

export function getSize(p: Product, sizeId: string): Size | undefined {
  return p.sizes.find((s) => s.id === sizeId);
}

export function relatedProducts(p: Product, count = 4): Product[] {
  const sameType = PRODUCTS.filter((o) => o.slug !== p.slug && o.type === p.type);
  const others = PRODUCTS.filter((o) => o.slug !== p.slug && o.type !== p.type);
  return [...sameType, ...others]
    .sort((a, b) => (a.type === p.type ? 0 : 1) - (b.type === p.type ? 0 : 1) || a.featured - b.featured)
    .slice(0, count);
}
