"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default function ClubInchargeLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();

  const clubCode = params.clubCode;

  const basePath = `/club-incharge/${clubCode}`;

  const menuItems = [
    {
      name: "Dashboard",
      path: basePath,
    },
    {
      name: "Students",
      path: `${basePath}/students`,
    },
    {
      name: "Attendance",
      path: `${basePath}/attendance`,
    },
    {
      name: "Applications",
      path: `${basePath}/applications`,
    },
    {
      name: "Certificates",
      path: `${basePath}/certificate`,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-gray-900 text-white">

        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <h1 className="text-xl font-bold">
            KPT Clubs
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Club In-Charge
          </p>

          <p className="mt-1 font-semibold uppercase">
            {clubCode}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">

          {menuItems.map((item) => {
            const active =
              pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`mb-2 block rounded-lg px-4 py-3 transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

        </nav>

        {/* User */}
        <div className="border-t border-gray-700 p-4">

          <div className="flex items-center gap-3">

            <UserButton />

            <span className="text-sm">
              Account
            </span>

          </div>

        </div>

      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen flex-1 p-8">
        {children}
      </main>

    </div>
  );
}