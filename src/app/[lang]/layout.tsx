import { notFound } from "next/navigation";

import { hasLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "de" }];
}

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <>{children}</>;
}
