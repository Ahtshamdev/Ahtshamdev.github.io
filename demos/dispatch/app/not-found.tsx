import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <span className={styles.mark} aria-hidden="true" />
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>This route is off the map</h1>
      <p className={styles.text}>No courier could find the page you asked for.</p>
      <Link href="/" className={styles.link}>
        Back to the dispatch console
      </Link>
    </main>
  );
}
