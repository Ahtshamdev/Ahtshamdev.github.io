import Link from 'next/link';
import KilimPattern from './KilimPattern';
import { formatPrice } from '@/lib/format';
import { fromPrice, TYPE_LABELS, type Product } from '@/lib/products';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, headingLevel = 3 }: { product: Product; headingLevel?: 2 | 3 }) {
  const size = product.sizes[product.defaultSize];
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const multiple = product.sizes.length > 1;
  return (
    <article className={styles.card}>
      <Link href={`/products/${product.slug}`} className={styles.link}>
        <div className={`${styles.art} ${styles[product.type]}`}>
          <KilimPattern
            className={styles.rug}
            palette={product.palette}
            motif={product.motif}
            ratio={size.ratio}
            seed={product.seed}
          />
          {product.isNew && <span className={styles.badge}>New</span>}
        </div>
        <Heading className={styles.name}>{product.name}</Heading>
      </Link>
      <p className={styles.meta}>
        <span className="num">
          {multiple ? 'From ' : ''}
          {formatPrice(fromPrice(product))}
        </span>
        <span className={styles.type}>
          {TYPE_LABELS[product.type].singular} · {product.sizes.length} {multiple ? 'sizes' : 'size'}
        </span>
      </p>
    </article>
  );
}
