"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
export default function HODLayout({ children }) {
  const pathname = usePathname();

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

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">

        {/* LOGO */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="block">
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
      <main className="ml-64 min-h-screen flex-1">

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-8">

          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              HOD Portal
            </h2>

            <p className="text-xs text-gray-500">
              Department Management
            </p>
          </div>

         <UserButton
  appearance={{
    elements: {
      avatarBox: "w-10 h-10",
    },
  }}
/>

        </header>

        {/* PAGE */}
        <div className="p-8">
          {children}
        </div>

      </main>

    </div>
  );
}