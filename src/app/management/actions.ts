"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  MANAGEMENT_COOKIE_NAME,
  checkPassword,
  createSessionToken,
  isManagementConfigured,
} from "@/lib/management-auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/management");
  const safeNext = next.startsWith("/management") ? next : "/management";

  if (!isManagementConfigured()) {
    redirect(
      `/management/login?error=not-configured&next=${encodeURIComponent(safeNext)}`
    );
  }

  if (!checkPassword(password)) {
    redirect(
      `/management/login?error=wrong-password&next=${encodeURIComponent(safeNext)}`
    );
  }

  const token = await createSessionToken();
  if (!token) {
    redirect(
      `/management/login?error=not-configured&next=${encodeURIComponent(safeNext)}`
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(MANAGEMENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days, matches management-auth's SESSION_TTL_MS
  });

  redirect(safeNext);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(MANAGEMENT_COOKIE_NAME);
  redirect("/management/login");
}
