import type { MetadataRoute } from 'next';
import { PRODUCTS } from '@/lib/products';
import { SITE } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap { return ['/', '/shop', '/journal/six-weeks-on-one-loom', ...PRODUCTS.map(p => `/products/${p.slug}`)].map(path => ({ url: `${SITE.url}${path}` })); }
