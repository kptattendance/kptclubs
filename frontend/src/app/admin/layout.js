"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { getCurrentUser } from "@/lib/getCurrentUser";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { isLoaded, isSignedIn, getToken } = useAuth();

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

   

  if (!isLoaded || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  const isActive = (path) => pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white">

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

          <p className="mt-1 text-xs text-gray-400">
            {user?.email}
          </p>

          <span className="mt-2 inline-block rounded bg-blue-600 px-2 py-1 text-xs">
            ADMIN
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase text-gray-500">
            Main
          </p>

          <SidebarItem
            title="Dashboard"
            active={isActive("/admin")}
            onClick={() => router.push("/admin")}
          />

          <SidebarItem
            title="Users"
            active={pathname.startsWith("/admin/users")}
            onClick={() => router.push("/admin/users")}
          />

          <SidebarItem
            title="Clubs & Activities"
            active={pathname.startsWith("/admin/clubs")}
            onClick={() => router.push("/admin/clubs")}
          />
    <SidebarItem
            title="Attendance"
            active={pathname.startsWith("/admin/attendance")}
            onClick={() => router.push("/admin/attendance")}
          />
          <SidebarItem
            title="Reports"
            active={pathname.startsWith("/admin/reports")}
            onClick={() => router.push("/admin/reports")}
          />

        </nav>

      </aside>

      {/* MAIN CONTENT */}
      <div className="ml-64 flex min-h-screen flex-1 flex-col">

        {/* TOP BAR */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">

          <div>
            <h2 className="text-lg font-semibold">
              Admin Panel
            </h2>
          </div>

          <div className="text-sm text-gray-600">
            {user?.name}
          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-8">
          {children}
        </main>

      </div>

    </div>
  );
}


function SidebarItem({
  title,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 w-full rounded-lg px-4 py-3 text-left transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      {title}
    </button>
  );
}