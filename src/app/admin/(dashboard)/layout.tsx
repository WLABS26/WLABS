import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-navy lg:flex-row">
      <AdminSidebar adminEmail={session.email} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
