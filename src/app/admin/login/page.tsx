import type { Metadata } from "next";

import { BRAND } from "@/modules/shared/constants";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="bg-grid flex min-h-screen items-center justify-center bg-brand-navy px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-6 text-center">
          <p className="text-gradient text-sm font-semibold uppercase tracking-wide">{BRAND.name}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Admin Login</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage leads and workflows.</p>
        </div>
        <LoginForm from={from} />
      </div>
    </div>
  );
}
