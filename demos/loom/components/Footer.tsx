import Link from 'next/link';
import { SITE } from '@/lib/site';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            Loom &amp; Field
          </Link>
          <p className={styles.tag}>
            Flat-weave rugs, runners and throws, woven by hand in and around Multan.
          </p>
        </div>
        <nav aria-label="Footer" className={styles.cols}>
          <div>
            <h2 className={styles.head}>Shop</h2>
            <ul>
              <li>
                <Link href="/shop?type=rug">Rugs</Link>
              </li>
              <li>
                <Link href="/shop?type=runner">Runners</Link>
              </li>
              <li>
                <Link href="/shop?type=throw">Throws</Link>
              </li>
              <li>
                <Link href="/shop">All pieces</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={styles.head}>Read</h2>
            <ul>
              <li>
                <Link href="/journal/six-weeks-on-one-loom">Six weeks on one loom</Link>
              </li>
              <li>
                <Link href="/bag">Your bag</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className={styles.legal}>
        <p>
          A portfolio demo by <a href={SITE.portfolio}>Ahtshamdev</a>. Products are illustrative and not for sale.
        </p>
      </div>
    </footer>
  );
}
