import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WLABS — Website Laboratory | Modern websites, engineered to perform.",
    template: "%s | WLABS",
  },
  description:
    "WLABS analyzes outdated small-business websites, redesigns them into modern high-converting MVP pages, and gets them launch-ready in 48 hours. Fixed price: €999.",
  keywords: [
    "website redesign",
    "small business website",
    "MVP website",
    "website audit",
    "conversion optimization",
    "WLABS",
  ],
  openGraph: {
    title: "WLABS — Website Laboratory",
    description: "We analyze. We design. We elevate. Modern websites, engineered to perform.",
    url: siteUrl,
    siteName: "WLABS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WLABS — Website Laboratory",
    description: "Old website → modern MVP website in 48 hours.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="bg-brand-navy text-foreground font-sans antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
