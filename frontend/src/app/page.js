"use client";

import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Temporary club data
  // Later this will come from your backend API
  const clubs = [
    {
      name: "NSS",
      type: "Institutional Activity",
      incharge: "Club Incharge",
      photo: "",
      students: 42,
    },
    {
      name: "NCC",
      type: "Institutional Activity",
      incharge: "Club Incharge",
      photo: "",
      students: 35,
    },
    {
      name: "Coding Club",
      type: "Club",
      incharge: "Club Incharge",
      photo: "",
      students: 28,
    },
    {
      name: "Cultural Club",
      type: "Club",
      incharge: "Club Incharge",
      photo: "",
      students: 31,
    },
    {
      name: "Sports Club",
      type: "Club",
      incharge: "Club Incharge",
      photo: "",
      students: 46,
    },
    {
      name: "Literary Club",
      type: "Club",
      incharge: "Club Incharge",
      photo: "",
      students: 19,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

          {/* Logo */}
          <div>
            <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
              KPT Club Management
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              Student Activities & Clubs
            </p>
          </div>


          {/* Login / User */}
          {!isSignedIn ? (
            <Link
              href="/sign-in"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Sign In
            </Link>
          ) : (
            <div className="flex items-center gap-3">

              <p className="hidden text-sm text-slate-600 sm:block">
                {user?.firstName ||
                  user?.emailAddresses?.[0]?.emailAddress}
              </p>

              <UserButton />

            </div>
          )}

        </div>
      </nav>


      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">

          <div className="max-w-3xl">

            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-100">
              KPT Student Activities
            </p>

            <h2 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
              Discover. Participate. Grow.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
              Explore the clubs and activities available at KPT,
              find your interests and become a part of the student
              community.
            </p>


            {/* Simple Registration Button */}

            <Link
              href="/register"
              className="mt-8 inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              Student Registration
            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          CLUB SECTION
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6">

        <div className="mb-8">

          <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Our Clubs
          </h2>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Explore clubs and see how many students are currently
            participating.
          </p>

        </div>


        {/* Club Cards */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {clubs.map((club) => (

            <div
              key={club.name}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
            >

              {/* Colored Top Section */}

              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-6">

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-xl font-bold text-white">
                      {club.name}
                    </h3>

                    <p className="mt-1 text-sm text-indigo-100">
                      {club.type}
                    </p>

                  </div>


                  {/* Student Count */}

                  <div className="rounded-xl bg-white/20 px-4 py-3 text-center backdrop-blur">

                    <p className="text-2xl font-bold text-white">
                      {club.students}
                    </p>

                    <p className="text-xs text-indigo-100">
                      Students
                    </p>

                  </div>

                </div>

              </div>


              {/* Card Body */}

              <div className="p-5">

                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Club Incharge
                </p>


                <div className="flex items-center gap-4">

                  {/* Incharge Photo */}

                  {club.photo ? (

                    <img
                      src={club.photo}
                      alt={club.incharge}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-indigo-100"
                    />

                  ) : (

                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl">
                      👤
                    </div>

                  )}


                  {/* Incharge Name */}

                  <div>

                    <p className="font-semibold text-slate-800">
                      {club.incharge}
                    </p>

                    <p className="text-sm text-slate-500">
                      Club Incharge
                    </p>

                  </div>

                </div>


                {/* Footer */}

                <div className="mt-5 border-t pt-4">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-slate-500">
                      Active Members
                    </span>

                    <span className="font-bold text-indigo-600">
                      {club.students}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t bg-white">

        <div className="mx-auto max-w-7xl px-5 py-6 text-center text-sm text-slate-500 sm:px-6">

          KPT Club Management System

        </div>

      </footer>

    </main>
  );
}