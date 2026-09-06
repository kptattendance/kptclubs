"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default function StudentLayout({ children }) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/student",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 21v-6h6v6"
          />
        </svg>
      ),
    },

    {
      name: "Club Status",
      href: "/student/status",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="2"
          />

          <path
            strokeLinecap="round"
            d="M8.5 8h7"
          />

          <path
            strokeLinecap="round"
            d="M8.5 12h7"
          />

          <path
            strokeLinecap="round"
            d="M8.5 16h4"
          />
        </svg>
      ),
    },

    {
      name: "Attendance",
      href: "/student/attendance",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 19V5"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 19h16"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 15v-3"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 15V8"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 15v-5"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 15V6"
          />
        </svg>
      ),
    },

    {
      name: "Certificate",
      href: "/student/certificate",
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m12 3 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2-3.8-3.7 5.3-.8L12 3Z"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19.5 10.5 18 12 19.5l1.5-1.5 1.5 1.5"
          />
        </svg>
      ),
    },
  ];

  const isActive = (href) => {
    if (href === "/student") {
      return pathname === "/student";
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">

        {/* BRAND */}

        <div className="flex h-[76px] items-center border-b border-slate-100 px-6">

          <Link
            href="/student"
            className="flex items-center gap-3"
          >

            {/* KPT ICON */}

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">

              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3 3 7.5 12 12l9-4.5L12 3Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"
                />

              </svg>

            </div>

            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-slate-800">
                KPT Club
              </h1>

              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                Student Portal
              </p>
            </div>

          </Link>

        </div>


        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-4 py-7">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Student Menu
          </p>

          <nav className="space-y-1.5">

            {menuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >

                  {/* ACTIVE INDICATOR */}

                  {active && (
                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                  )}

                  {/* ICON */}

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* NAME */}

                  <span className="flex-1 text-sm font-semibold">
                    {item.name}
                  </span>

                  {/* ACTIVE DOT */}

                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  )}

                </Link>
              );
            })}

          </nav>



        </div>


      
      </aside>


      {/* =========================================================
          MOBILE HEADER
      ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white md:hidden">

        {/* TOP MOBILE BAR */}

        <div className="flex h-[64px] items-center justify-between px-4">

          <Link
            href="/student"
            className="flex items-center gap-2.5"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">

              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3 3 7.5 12 12l9-4.5L12 3Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"
                />
              </svg>

            </div>

            <div>

              <p className="text-[16px] font-bold leading-none text-slate-800">
                KPT Club
              </p>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Student Portal
              </p>

            </div>

          </Link>


          <UserButton
            afterSignOutUrl="/"
          />

        </div>


        {/* MOBILE MENU */}

        <div className="border-t border-slate-100">

          <nav className="flex gap-2 overflow-x-auto px-3 py-2.5">

            {menuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >

                  <span className="h-4 w-4">
                    {item.icon}
                  </span>

                  {item.name}

                </Link>
              );
            })}

          </nav>

        </div>

      </header>


      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

      <main className="min-h-screen md:ml-64">

        {/* DESKTOP HEADER */}

        <header className="sticky top-0 z-40 hidden h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-8 backdrop-blur md:flex">

          <div>

            <h2 className="text-[18px] font-bold text-slate-800">
              Student Portal
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              KPT Club Management System
            </p>

          </div>


          <div className="flex items-center gap-4">

            <div className="text-right">

              <p className="text-sm font-semibold text-slate-700">
                Student
              </p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Club Member
              </p>

            </div>

            <div className="border-l border-slate-200 pl-4">

              <UserButton
                afterSignOutUrl="/"
              />

            </div>

          </div>

        </header>


        {/* PAGE CONTENT */}

        <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

          <div className="mx-auto w-full max-w-7xl">

            {children}

          </div>

        </div>

      </main>

    </div>
  );
}