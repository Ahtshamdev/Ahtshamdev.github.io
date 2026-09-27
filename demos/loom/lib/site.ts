function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'https://loom-and-field-demo.vercel.app';
}

export const SITE = {
  name: 'Loom & Field',
  url: resolveSiteUrl(),
  description:
    'Flat-weave kilim rugs, runners and throws, handwoven by families of weavers in Multan, Pakistan.',
  portfolio: 'https://ahtshamdev-github-io.vercel.app',
};
