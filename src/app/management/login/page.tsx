import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { login } from "@/app/management/actions";

export const metadata: Metadata = {
  title: "Management Login | Phone Geeks",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  "wrong-password": "That password isn't right. Try again.",
  "not-configured":
    "MANAGEMENT_PASSWORD isn't set in this deployment's environment variables yet, so no password will work.",
};

export default async function ManagementLoginPage({
  searchParams,
}: PageProps<"/management/login">) {
  const params = await searchParams;
  const errorParam = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" ? params.next : "/management";
  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-white">
          <Lock className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-brand-navy">
          Management
        </h1>
        <p className="mt-1 text-sm text-black/60">
          Owner-only. Enter the shared password to continue.
        </p>

        {errorMessage ? (
          <p className="mt-4 rounded-lg bg-brand-red/10 px-3 py-2 text-sm text-brand-red-dark">
            {errorMessage}
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              placeholder="Password"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy-dark"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
