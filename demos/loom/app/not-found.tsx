import Link from 'next/link';
import styles from './story.module.css';
export default function NotFound() { return <section className={`container ${styles.page}`}><p className="kicker">404 · Page not found</p><h1 className={styles.title}>A loose thread.</h1><p className={styles.lede}>We couldn’t find that page. There are plenty of pieces still to explore.</p><div className={styles.actions}><Link href="/shop" className="button">Browse the collection</Link><Link href="/" className="text-link">Return home</Link></div></section>; }
