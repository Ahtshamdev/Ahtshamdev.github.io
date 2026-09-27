import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToBag from '@/components/bag/AddToBag';
import FoldedKilim from '@/components/FoldedKilim';
import Gallery, { type GalleryView } from '@/components/Gallery';
import KilimPattern from '@/components/KilimPattern';
import ProductCard from '@/components/ProductCard';
import { formatPrice } from '@/lib/format';
import { CARE, getProduct, getWeaver, PRODUCTS, relatedProducts, TYPE_LABELS } from '@/lib/products';
import styles from './product.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) return {};
  const description = `${product.summary} Handwoven in Multan, from ${formatPrice(
    Math.min(...product.sizes.map((s) => s.price)),
  )}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: `${product.name} · Loom & Field`, description, type: 'website' },
  };
}

export default async function ProductPage(props: PageProps<'/products/[slug]'>) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const weaver = getWeaver(product.weaverId);
  const size = product.sizes[product.defaultSize];
  const art = { palette: product.palette, motif: product.motif, ratio: size.ratio, seed: product.seed };
  const typeLabel = TYPE_LABELS[product.type];

  const views: GalleryView[] = [
    {
      id: 'full',
      label: `The whole ${typeLabel.singular.toLowerCase()}, ${size.label}`,
      main: <KilimPattern {...art} label={`${product.name}, shown whole`} />,
      thumb: <KilimPattern {...art} />,
    },
    {
      id: 'weave',
      label: 'Close-up of the weave',
      main: <KilimPattern {...art} view="weave" label={`Close-up of the weave of the ${product.name}`} />,
      thumb: <KilimPattern {...art} view="weave" />,
      fill: true,
    },
    {
      id: 'corner',
      label: 'Border, corner and fringe',
      main: <KilimPattern {...art} view="corner" label={`The border and knotted fringe of the ${product.name}`} />,
      thumb: <KilimPattern {...art} view="corner" />,
      fill: true,
    },
    {
      id: 'folded',
      label: 'Folded, as it arrives',
      main: <FoldedKilim {...art} label={`The ${product.name}, folded`} />,
      thumb: <FoldedKilim {...art} />,
      fill: true,
    },
  ];

  const related = relatedProducts(product, 4);

  return (
    <div className="container">
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <ol>
          <li>
            <Link href="/shop">Shop</Link>
          </li>
          <li>
            <Link href={`/shop?type=${product.type}`}>{typeLabel.plural}</Link>
          </li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className={styles.layout}>
        <div className={styles.media}>
          <Gallery views={views} name={product.name} />
        </div>

        <div className={styles.info}>
          <p className="kicker">{typeLabel.singular} · Woven in Multan</p>
          <h1 className={styles.title}>{product.name}</h1>
          <p className={styles.summary}>{product.summary}</p>

          <div className={styles.buy}>
            <AddToBag
              slug={product.slug}
              name={product.name}
              sizes={product.sizes}
              defaultSize={product.defaultSize}
            />
          </div>

          <section className={styles.weaver} aria-labelledby="weaver-title">
            <h2 id="weaver-title" className={styles.weaverTitle}>
              Woven by {weaver.name}
            </h2>
            <p className={styles.weaverPlace}>{weaver.place}</p>
            <p>{weaver.story}</p>
            <p className={styles.weaverFoot}>
              About {product.weeksOnLoom} weeks on the loom for the {size.label} size.
            </p>
          </section>

          <div className={styles.details}>
            <details open>
              <summary>Materials and dyes</summary>
              <dl className={styles.dl}>
                <div>
                  <dt>Materials</dt>
                  <dd>{product.materials}</dd>
                </div>
                <div>
                  <dt>Dyes</dt>
                  <dd>{product.dyes}</dd>
                </div>
                <div>
                  <dt>Construction</dt>
                  <dd>Flat-woven by hand, slit and dovetail tapestry. Reversible.</dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>Dimensions</summary>
              <table className={styles.sizes}>
                <caption className="visually-hidden">Sizes and prices</caption>
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {product.sizes.map((s) => (
                    <tr key={s.id}>
                      <th scope="row">{s.label}</th>
                      <td className="num">{formatPrice(s.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.note}>Handwoven sizes can vary by up to 3 cm either way. Fringe not included.</p>
            </details>
            <details>
              <summary>Care</summary>
              <p className={styles.detailText}>{CARE[product.type]}</p>
            </details>
          </div>
        </div>
      </div>

      <section className={styles.related} aria-labelledby="related-title">
        <h2 id="related-title" className={styles.relatedTitle}>
          You may also like
        </h2>
        <div className={styles.relatedGrid}>
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
