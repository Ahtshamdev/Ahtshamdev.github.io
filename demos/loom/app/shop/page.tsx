import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';
import { fromPrice, PRODUCTS, TYPE_LABELS, type ProductType } from '@/lib/products';
import { isSort, type SortId } from '@/lib/sort';
import styles from './shop.module.css';

const TYPES: ProductType[] = ['rug', 'runner', 'throw'];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parse(params: Record<string, string | string[] | undefined>) {
  const rawType = first(params.type);
  const rawSort = first(params.sort);
  const type = TYPES.find((t) => t === rawType) ?? null;
  const sort: SortId = isSort(rawSort) ? rawSort : 'featured';
  return { type, sort };
}

export async function generateMetadata(props: PageProps<'/shop'>): Promise<Metadata> {
  const { type } = parse(await props.searchParams);
  const title = type ? `${TYPE_LABELS[type].plural}` : 'Shop all';
  const description = type
    ? `Handwoven flat-weave ${TYPE_LABELS[type].plural.toLowerCase()} from Multan, dyed with madder, indigo and pomegranate.`
    : 'Every rug, runner and throw in the collection, handwoven in and around Multan.';
  return {
    title,
    description,
    alternates: { canonical: type ? `/shop?type=${type}` : '/shop' },
    openGraph: { title: `${title} · Loom & Field`, description },
  };
}

function href(type: ProductType | null, sort: SortId) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (sort !== 'featured') params.set('sort', sort);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : '/shop';
}

export default async function ShopPage(props: PageProps<'/shop'>) {
  const { type, sort } = parse(await props.searchParams);

  const items = PRODUCTS.filter((p) => !type || p.type === type).sort((a, b) => {
    if (sort === 'price-asc') return fromPrice(a) - fromPrice(b) || a.featured - b.featured;
    if (sort === 'price-desc') return fromPrice(b) - fromPrice(a) || a.featured - b.featured;
    return a.featured - b.featured;
  });

  const heading = type ? TYPE_LABELS[type].plural : 'All pieces';
  const filters: { type: ProductType | null; label: string; count: number }[] = [
    { type: null, label: 'All', count: PRODUCTS.length },
    ...TYPES.map((t) => ({
      type: t,
      label: TYPE_LABELS[t].plural,
      count: PRODUCTS.filter((p) => p.type === t).length,
    })),
  ];

  return (
    <div className="container">
      <header className={styles.head}>
        <p className="kicker">The collection</p>
        <h1 className={styles.title}>{heading}</h1>
        <p className={styles.lede}>
          Every piece is woven to order by one of five families in and around Multan. Prices start at the smallest
          size; each page lists every size and its price.
        </p>
      </header>

      <div className={styles.bar}>
        <nav aria-label="Filter by type">
          <ul className={styles.filters}>
            {filters.map((f) => {
              const active = f.type === type;
              return (
                <li key={f.label}>
                  <Link
                    href={href(f.type, sort)}
                    className={styles.chip}
                    aria-current={active ? 'page' : undefined}
                    scroll={false}
                  >
                    {f.label} <span className={`${styles.chipCount} num`}>{f.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <SortSelect sort={sort} type={type} />
      </div>

      <p className={styles.status} role="status">
        {items.length} {items.length === 1 ? 'piece' : 'pieces'}
      </p>

      <div className={styles.grid}>
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} headingLevel={2} />
        ))}
      </div>
    </div>
  );
}
