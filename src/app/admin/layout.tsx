"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Don't show the admin layout wrapper on the login page
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-genesis-border bg-genesis-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/clients"
              className="text-genesis-text font-semibold text-sm tracking-tight"
            >
              Genesis Admin
            </Link>
            <Link
              href="/admin/clients"
              className="text-genesis-muted hover:text-genesis-text text-sm transition-colors"
            >
              Clients
            </Link>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-genesis-muted hover:text-genesis-text transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">{children}</main>
    </div>
  );
}
