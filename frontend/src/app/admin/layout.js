"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";

import { getCurrentUser } from "@/lib/getCurrentUser";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const checkAdmin = async () => {
      try {
        if (!isSignedIn) {
          router.replace("/sign-in");
          return;
        }

        const data = await getCurrentUser(getToken);

        if (data.user.role !== "ADMIN") {
          router.replace("/student");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error(error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [isLoaded, isSignedIn, getToken, router]);

  const handleLogout = async () => {
    try {
      await signOut({
        redirectUrl: "/sign-in",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  const isActive = (path) => pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-gray-900 text-white">

        {/* Logo / Title */}
        <div className="border-b border-gray-700 p-6">
          <h1 className="text-xl font-bold">
            KPT Club Management
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Admin Panel
          </p>
        </div>

        {/* Admin Details */}
        <div className="border-b border-gray-700 p-5">
          <p className="font-medium">
            {user?.name}
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
            onClick={() => router.push("/admin")}
          />

          <SidebarItem
            title="Users"
            icon="👥"
            active={pathname.startsWith("/admin/users")}
            onClick={() => router.push("/admin/users")}
          />

          <SidebarItem
            title="Clubs & Activities"
            icon="🏆"
            active={pathname.startsWith("/admin/clubs")}
            onClick={() => router.push("/admin/clubs")}
          />

          <SidebarItem
            title="Attendance"
            icon="✓"
            active={pathname.startsWith("/admin/attendance")}
            onClick={() => router.push("/admin/attendance")}
          />

          <SidebarItem
            title="Reports"
            icon="▤"
            active={pathname.startsWith("/admin/reports")}
            onClick={() => router.push("/admin/reports")}
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
      <div className="ml-64 flex min-h-screen flex-1 flex-col">

        {/* TOP BAR */}
        <header className="relative z-10 flex h-16 items-center justify-between border-b bg-white px-8">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Panel
            </h2>
          </div>

          <div className="flex items-center gap-3">

            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {user?.name}
              </p>

              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "A"}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="relative z-0 flex-1 p-8">
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