import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BackgroundFx } from "@/components/layout/background-fx";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundFx />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
