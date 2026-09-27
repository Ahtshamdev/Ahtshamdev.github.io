import type { Metadata, Viewport } from "next";
import "./globals.css";

const description =
  "A real-time dispatch console for a same-day grocery courier fleet in Lahore: live courier map, order queue, late-delivery prediction and one-key reassignment.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kilo-dispatch-demo.vercel.app"),
  alternates: { canonical: "/" },
  title: "Kilo Dispatch, live demo",
  description,
  applicationName: "Kilo Dispatch",
  openGraph: {
    title: "Kilo Dispatch, live demo",
    description,
    type: "website",
    siteName: "Kilo Dispatch",
  },
  twitter: {
    card: "summary",
    title: "Kilo Dispatch, live demo",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#181b20",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
