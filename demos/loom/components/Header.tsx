import Link from 'next/link';
import BagButton from './bag/BagButton';
import styles from './Header.module.css';

const NAV = [
  { href: '/shop?type=rug', label: 'Rugs' },
  { href: '/shop?type=runner', label: 'Runners' },
  { href: '/shop?type=throw', label: 'Throws' },
  { href: '/journal/six-weeks-on-one-loom', label: 'Journal' },
];

export default function Header() {
  return (
    <>
      <p className={styles.note}>Free delivery across Pakistan on orders over Rs&nbsp;15,000</p>
      <header className={styles.header}>
        <div className={styles.inner}>
          <nav className={styles.nav} aria-label="Main">
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/" className={styles.logo}>
            Loom &amp; Field
          </Link>
          <div className={styles.right}>
            <Link href="/shop" className={styles.shopAll}>
              Shop all
            </Link>
            <BagButton />
          </div>
        </div>
      </header>
    </>
  );
}
