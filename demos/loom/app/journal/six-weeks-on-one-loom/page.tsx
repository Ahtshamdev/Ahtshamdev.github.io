import type { Metadata } from 'next';
import Link from 'next/link';
import LoomArt from '@/components/LoomArt';
import { getProduct } from '@/lib/products';
import styles from '../../story.module.css';
export const metadata: Metadata = { title: 'Six weeks on one loom', description: 'An illustrated journey from wool to a finished flat-weave kilim.', alternates: { canonical: '/journal/six-weeks-on-one-loom' } };
export default function JournalPage() {
 const piece = getProduct('pomegranate-chevron')!;
 return <article className={`container ${styles.page}`}><p className="kicker">From the journal · An illustrative story</p><h1 className={styles.title}>Six weeks on one loom</h1><p className={styles.lede}>A single 8 by 10 kilim begins with wool, a pattern held in memory, and the patient work of one row after another.</p><div className={styles.art}><LoomArt palette={piece.palette} motif={piece.motif} seed={piece.seed} /></div><div className={styles.article}>
 <h2>First, the wool and colour</h2><p>In this imagined workshop, the first week belongs to sorting, washing and spinning the wool. Skeins are prepared in small batches, ready for the dye vats. Madder brings warm rust; indigo brings blue; pomegranate rind lends a softer yellow.</p><p>No two batches take colour in precisely the same way. Those small shifts become part of the finished surface, visible where one skein ends and another begins.</p>
 <h2>The rhythm of the loom</h2><p>Once the warp is stretched, weaving moves steadily from one end of the rug to the other. The weft passes over and under the warp, building a flat fabric without a pile. A stepped motif grows by counting threads rather than printing an image onto the cloth.</p><p>For several weeks, the pattern is a daily rhythm: pass the yarn, beat the row, check the edge. A large piece asks for time, and the hands making it leave subtle differences in every repeat.</p>
 <h2>A piece ready for everyday life</h2><p>The last week is for finishing the ends, checking the weave and letting the cloth settle. A kilim is light enough to move between rooms and sturdy enough for daily use. Its character comes from the work that remains visible.</p><p>The products, workshops and stories in this portfolio demo are fictional. The illustrations explore the texture and geometry of flat-weave textiles.</p></div><div className={styles.actions}><Link href={`/products/${piece.slug}`} className="button">Explore the Pomegranate Chevron</Link><Link href="/shop" className="text-link">All pieces</Link></div></article>;
}
