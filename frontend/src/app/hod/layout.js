"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function HODLayout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/hod",
      icon: "🏠",
    },
    {
      name: "Department Students",
      href: "/hod/students",
      icon: "👥",
    },
    {
      name: "Student Applications",
      href: "/hod/applications",
      icon: "✅",
    },
    {
      name: "Clubs",
      href: "/hod/clubs",
      icon: "🏛️",
    },
    {
      name: "Attendance",
      href: "/hod/attendance",
      icon: "📊",
    },
  ];

  const handleMenuClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r bg-white transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* LOGO */}
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/"
            className="block"
            onClick={handleMenuClick}
          >
            <h1 className="text-xl font-bold text-gray-800">
              KPT Club
            </h1>

            <p className="text-xs text-gray-500">
              HOD Portal
            </p>
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="p-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            HOD Menu
          </p>

          <div className="space-y-1">

            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleMenuClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-xl">
                    {item.icon}
                  </span>

                  <span>
                    {item.name}
                  </span>
                </Link>
              );
            })}

          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-h-screen md:ml-64">

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6 md:px-8">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <span className="text-xl">✕</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>

            <div>
              <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                HOD Portal
              </h2>

              <p className="hidden text-xs text-gray-500 sm:block">
                Department Management
              </p>
            </div>

          </div>

          {/* USER */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 sm:w-10 sm:h-10",
              },
            }}
          />

        </header>

        {/* PAGE */}
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>

      </main>
    </div>
  );
}