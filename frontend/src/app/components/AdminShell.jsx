"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";

import { getCurrentUser } from "@/lib/getCurrentUser";

/* =========================================================
   ADMIN SHELL
   Rendered only after RoleProtected has verified the admin.
   ========================================================= */

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Same (cached) request that RoleProtected already made
  useEffect(() => {
    let cancelled = false;

    getCurrentUser(getToken)
      .then((data) => {
        if (!cancelled) {
          setUser(data?.user || null);
        }
      })
      .catch((error) => {
        console.error(
          "Load admin details error:",
          error?.message
        );
      });

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const handleLogout = async () => {
    try {
      await signOut({
        redirectUrl: "/sign-in",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const goTo = (path) => {
    setMobileMenuOpen(false);
    router.push(path);
  };

  const isActive = (path) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-64 max-w-[85vw] flex-col bg-gray-900 text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Logo / Title */}
        <div className="flex items-start justify-between border-b border-gray-700 p-6">
          <div>
            <h1 className="text-xl font-bold">
              KPT Club Management
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Admin Panel
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="-mr-2 -mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <span className="text-lg">✕</span>
          </button>
        </div>

        {/* Admin Details */}
        <div className="border-b border-gray-700 p-5">
          <p className="truncate font-medium">
            {user?.name || "Administrator"}
          </p>

          <p className="mt-1 truncate text-xs text-gray-400">
            {user?.email}
          </p>

          <span className="mt-2 inline-block rounded bg-blue-600 px-2 py-1 text-xs font-medium">
            ADMIN
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase text-gray-500">
            Main
          </p>

          <SidebarItem
            title="Dashboard"
            icon="▦"
            active={isActive("/admin")}
            onClick={() => goTo("/admin")}
          />

          <SidebarItem
            title="Users"
            icon="👥"
            active={pathname.startsWith("/admin/users")}
            onClick={() => goTo("/admin/users")}
          />

          <SidebarItem
            title="Clubs & Activities"
            icon="🏆"
            active={pathname.startsWith("/admin/clubs")}
            onClick={() => goTo("/admin/clubs")}
          />

          <SidebarItem
            title="Check Weekly Attendance"
            icon="📋"
            active={pathname.startsWith("/admin/attendance-check")}
            onClick={() => goTo("/admin/attendance-check")}
          />
        </nav>

        {/* =====================================================
            LOGOUT
            ===================================================== */}

        <div className="border-t border-gray-700 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-300 transition hover:bg-red-600 hover:text-white"
          >
            <span className="text-lg">
              ↪
            </span>

            <span className="font-medium">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 lg:hidden"
              aria-label="Open menu"
            >
              <span className="text-xl">☰</span>
            </button>

            <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
              Admin Panel
            </h2>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium text-gray-800">
                {user?.name}
              </p>

              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "A"}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="relative z-0 min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR ITEM
   ========================================================= */

function SidebarItem({
  title,
  icon,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <span className="flex w-5 items-center justify-center text-sm">
        {icon}
      </span>

      <span className="font-medium">
        {title}
      </span>
    </button>
  );
}
