"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function ClubInchargeLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {mobileMenuOpen && (
        <div
          className="
            fixed
            inset-0
            z-40
            bg-black/50
            md:hidden
          "
          onClick={closeMobileMenu}
        />
      )}


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-64
          flex-col
          bg-gray-900
          text-white
          transition-transform
          duration-300
          ease-in-out
          md:translate-x-0
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="border-b border-gray-700 p-5 sm:p-6">

          <div className="flex items-start justify-between">

            <div>
              <h1 className="text-xl font-bold">
                KPT Clubs
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Club In-Charge
              </p>

              <p className="mt-1 break-words font-semibold uppercase">
                {clubCode}
              </p>
            </div>


            {/* MOBILE CLOSE BUTTON */}

            <button
              type="button"
              onClick={closeMobileMenu}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                text-xl
                text-gray-400
                hover:bg-gray-800
                hover:text-white
                md:hidden
              "
              aria-label="Close menu"
            >
              ✕
            </button>

          </div>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 overflow-y-auto p-4">

          {menuItems.map((item) => {

            const active =
              pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMobileMenu}
                className={`
                  mb-2
                  block
                  rounded-lg
                  px-4
                  py-3
                  text-sm
                  font-medium
                  transition
                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                {item.name}
              </Link>
            );

          })}

        </nav>


        {/* =================================================
            USER
        ================================================= */}

        <div className="border-t border-gray-700 p-4">

          <div className="flex items-center gap-3">

            <UserButton />

            <span className="text-sm text-gray-300">
              Account
            </span>

          </div>

        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="min-h-screen md:ml-64">

        {/* =================================================
            MOBILE TOP BAR
        ================================================= */}

        <header
          className="
            sticky
            top-0
            z-30
            flex
            h-16
            items-center
            justify-between
            border-b
            border-gray-200
            bg-white
            px-4
            shadow-sm
            md:hidden
          "
        >

          <div className="flex items-center gap-3">

            {/* HAMBURGER */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                border
                border-gray-200
                text-xl
                text-gray-700
                hover:bg-gray-50
              "
              aria-label="Open menu"
            >
              ☰
            </button>


            {/* TITLE */}

            <div className="min-w-0">

              <p className="text-sm font-semibold text-gray-800">
                KPT Clubs
              </p>

              <p className="truncate text-xs text-gray-500">
                {clubCode}
              </p>

            </div>

          </div>


          {/* MOBILE USER */}

          <UserButton />

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <div
          className="
            w-full
            px-3
            py-4
            sm:px-5
            sm:py-6
            md:p-8
          "
        >
          {children}
        </div>

      </main>

    </div>
  );
}