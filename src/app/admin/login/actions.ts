"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createSessionToken,
  verifyAdminCredentials,
} from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  if (!verifyAdminCredentials(email, password)) {
    return { error: "Invalid email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  redirect(from.startsWith("/admin") ? from : "/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
