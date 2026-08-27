import { LogOut } from "lucide-react";
import { logout } from "@/app/management/actions";
import { ManagementTabs } from "@/components/management/management-tabs";
import { ManagementPageTransition } from "@/components/management/page-transition";

/**
 * Shared chrome for the three management tabs (Overview / Stock /
 * Anthony's Checklist) — header + sign-out once, not duplicated per
 * page. Lives in a (dashboard) route group specifically so it does
 * NOT wrap /management/login, which sits outside this group and has
 * no session yet to show a "Sign out" button for.
 */
export default function ManagementDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Management</h1>
          <p className="mt-1 text-sm text-black/60">
            v1 — shared-password gate, straight reads. Not indexed, not
            linked from anywhere public.
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 transition hover:border-black/30 hover:text-black"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>

      <ManagementTabs />

      <div className="mt-8">
        <ManagementPageTransition>{children}</ManagementPageTransition>
      </div>
    </div>
  );
}
