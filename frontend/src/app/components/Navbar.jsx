"use client";

import Link from "next/link";

const LOGO_LEFT = "/logo.jpg";
const LOGO_CENTER = "/logo3.png";
const LOGO_RIGHT = "/logo2.png";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="relative flex min-h-[88px] items-center justify-between gap-3">
          
          {/* LEFT LOGO */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
            <img
              src={LOGO_LEFT}
              alt="Karnataka Government Polytechnic Mangaluru"
              className="h-full w-full object-contain"
            />
          </div>

          {/* CENTER BRANDING */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 sm:gap-3">
            
            <div className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
              <img
                src={LOGO_CENTER}
                alt="KPT Mangaluru"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="hidden text-center sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Karnataka (Govt.) Polytechnic, Mangaluru
              </p>

              <h1 className="mt-0.5 text-lg font-black tracking-tight text-slate-800">
                KPT Mangalore Clubs
              </h1>

              <p className="text-[11px] font-medium text-indigo-600">
                Student Clubs & Activities
              </p>
            </div>
          </div>

          {/* MOBILE TITLE */}
          <div className="absolute left-1/2 top-1/2 w-[145px] -translate-x-1/2 -translate-y-1/2 text-center sm:hidden">
            <h1 className="text-sm font-black leading-tight text-slate-800">
              KPT Mangalore
              <span className="block text-indigo-600">
                Clubs
              </span>
            </h1>

            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-400">
              Student Activities
            </p>
          </div>

          {/* RIGHT */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            
            <img
              src={LOGO_RIGHT}
              alt="KPT Mangaluru"
              className="hidden h-14 w-14 object-contain sm:block"
            />

            <Link
              href="/sign-in"
              className="rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:px-5 sm:text-sm"
            >
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}