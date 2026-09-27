import Link from 'next/link';
import KilimPattern from '@/components/KilimPattern';
import LoomArt from '@/components/LoomArt';
import ProductCard from '@/components/ProductCard';
import { getProduct, PRODUCTS, TYPE_LABELS, type ProductType } from '@/lib/products';
import styles from './page.module.css';

export const metadata = { alternates: { canonical: '/' } };

const COLLECTIONS: { type: ProductType; slug: string; blurb: string }[] = [
  { type: 'rug', slug: 'madder-lozenge-kilim', blurb: 'Room-sized kilims and dhurries, from 4 × 6 to 9 × 12 ft.' },
  { type: 'runner', slug: 'indigo-step-runner', blurb: 'Long and narrow, for hallways, stairs and bedsides.' },
  { type: 'throw', slug: 'sindhi-ralli-throw', blurb: 'Soft wool throws for the sofa or the end of a bed.' },
];

export default function Home() {
  const hero = getProduct('multan-kilim-rust')!;
  const heroSize = hero.sizes[hero.defaultSize];
  const fresh = PRODUCTS.filter((p) => p.isNew)
    .sort((a, b) => a.featured - b.featured)
    .slice(0, 4);
  const journal = getProduct('pomegranate-chevron')!;

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className="kicker">Autumn collection</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            Handwoven in Multan. Made to be walked on.
          </h1>
          <p className={styles.heroSub}>
            Flat-weave rugs and throws made by families of weavers in the southern Punjab, dyed with madder, indigo
            and pomegranate.
          </p>
          <div className={styles.heroActions}>
            <Link href="/shop" className="button">
              Shop the collection
            </Link>
            <Link href={`/products/${hero.slug}`} className="text-link">
              {hero.name}
            </Link>
          </div>
        </div>
        <div className={styles.heroArt}>
          <Link href={`/products/${hero.slug}`} className={styles.heroRugLink} aria-label={`View ${hero.name}`}>
            <KilimPattern
              className={styles.heroRug}
              palette={hero.palette}
              motif={hero.motif}
              ratio={heroSize.ratio}
              seed={hero.seed}
            />
          </Link>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="new-title">
        <div className={styles.rowHead}>
          <h2 id="new-title" className={styles.h2}>
            New this week
          </h2>
          <Link href="/shop" className="text-link">
            View all {PRODUCTS.length}
          </Link>
        </div>
        <div className={styles.grid}>
          {fresh.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="collections-title">
        <div className={styles.rowHead}>
          <h2 id="collections-title" className={styles.h2}>
            Shop by collection
          </h2>
        </div>
        <ul className={styles.collections}>
          {COLLECTIONS.map((c) => {
            const p = getProduct(c.slug)!;
            const count = PRODUCTS.filter((x) => x.type === c.type).length;
            return (
              <li key={c.type}>
                <Link href={`/shop?type=${c.type}`} className={styles.collection}>
                  <div className={`${styles.collectionArt} ${c.type === 'runner' ? styles.collectionRunner : ''}`}>
                    <KilimPattern
                      className={styles.collectionRug}
                      palette={p.palette}
                      motif={p.motif}
                      ratio={p.sizes[p.defaultSize].ratio}
                      seed={p.seed}
                    />
                  </div>
                  <div className={styles.collectionText}>
                    <h3 className={styles.collectionTitle}>
                      {TYPE_LABELS[c.type].plural} <span className={`${styles.count} num`}>{count}</span>
                    </h3>
                    <p>{c.blurb}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.story} aria-labelledby="story-title">
        <div className={`container ${styles.storyInner}`}>
          <div className={styles.storyArt}>
            <LoomArt palette={journal.palette} motif={journal.motif} seed={journal.seed} />
          </div>
          <div>
            <p className="kicker">From the journal</p>
            <h2 id="story-title" className={styles.h2}>
              Six weeks on one loom
            </h2>
            <p className={styles.storySub}>
              How a single 8 by 10 kilim goes from raw wool in Cholistan to a finished rug, and why each one comes out
              a little different.
            </p>
            <Link href="/journal/six-weeks-on-one-loom" className="text-link">
              Read the story
            </Link>
          </div>
        </div>
      </section>

      <section className={`container ${styles.values}`} aria-label="How we work">
        <div>
          <h2 className={styles.valueTitle}>Dyed by hand</h2>
          <p>Madder root, indigo, pomegranate rind and walnut husk, boiled in copper vats in the old city.</p>
        </div>
        <div>
          <h2 className={styles.valueTitle}>Woven to order</h2>
          <p>Each piece is started when you order it and takes two to eight weeks on the loom, plus delivery.</p>
        </div>
        <div>
          <h2 className={styles.valueTitle}>Paid fairly, paid first</h2>
          <p>Weavers are paid for the wool and half the work before the first row is woven.</p>
        </div>
      </section>
    </>
  );
}
