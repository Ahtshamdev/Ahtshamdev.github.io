import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../story.module.css';
export const metadata: Metadata = { title: 'Checkout demo', robots: { index: false, follow: true } };
export default function CheckoutPage() {
 return <section className={`container ${styles.page}`}><p className="kicker">A portfolio demonstration</p><h1 className={styles.title}>Thank you for exploring.</h1><p className={styles.lede}>Loom &amp; Field is an illustrative shop. The pieces are not for sale, and no order or payment has been taken.</p><p className={styles.copy}>Your bag stays saved on this device, so you can return to it and try different pieces and sizes. A real shop would continue here with delivery details and a secure payment service.</p><div className={styles.actions}><Link href="/bag" className="button">Return to your bag</Link><Link href="/shop" className="text-link">Keep exploring</Link></div></section>;
}
