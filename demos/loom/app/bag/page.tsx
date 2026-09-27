import type { Metadata } from 'next';
import BagView from '@/components/bag/BagView';
import styles from './bag.module.css';

export const metadata: Metadata = {
  title: 'Your bag',
  description: 'The rugs, runners and throws in your bag.',
  robots: { index: false, follow: true },
};

export default function BagPage() {
  return (
    <div className="container">
      <header className={styles.head}>
        <h1 className={styles.title}>Your bag</h1>
      </header>
      <BagView />
    </div>
  );
}
