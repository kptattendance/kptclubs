"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function HODDashboard() {
  const { getToken } = useAuth();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [data, setData] =
    useState(null);

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        await getToken();

      const response =
        await axios.get(
          `${API_URL}/api/hod/dashboard`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

   

      setData(
        response.data
      );

    } catch (error) {
      console.error(
        "HOD dashboard error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load HOD dashboard"
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">

          <div
            className="
              mx-auto mb-3
              h-8 w-8
              animate-spin
              rounded-full
              border-4
              border-gray-200
              border-t-blue-600
            "
          />

          <p className="text-sm text-gray-500">
            Loading dashboard...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">

        <h2 className="font-semibold text-red-700">
          Unable to load dashboard
        </h2>

        <p className="mt-2 break-words text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={loadDashboard}
          className="
            mt-4
            rounded-lg
            bg-red-600
            px-4 py-2
            text-sm font-medium
            text-white
            hover:bg-red-700
          "
        >
          Try Again
        </button>

      </div>
    );
  }

  const hod =
    data?.hod || {};

  const stats =
    data?.stats || {};

  const clubs =
    data?.clubs || [];

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="w-full space-y-5 sm:space-y-7 lg:space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
          HOD Dashboard
        </h1>

        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          Department overview and club participation
        </p>
      </div>


      {/* =================================================
          HOD PROFILE
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          bg-white
          shadow-sm
          sm:rounded-2xl
        "
      >

        {/* PROFILE HEADER */}

        <div
          className="
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            px-4 py-4
            sm:p-6
          "
        >
          <h2 className="text-base font-semibold text-white sm:text-lg">
            HOD Details
          </h2>

          <p className="mt-1 text-xs text-blue-100 sm:text-sm">
            Head of Department
          </p>
        </div>


        {/* PROFILE CONTENT */}

        <div className="p-4 sm:p-6">

          <div
            className="
              flex
              flex-col
              items-center
              gap-5
              sm:flex-row
              sm:items-center
              sm:gap-6
            "
          >

            {/* PHOTO */}

            <div className="flex-shrink-0">

              {hod.profilePhoto ? (

                <img
                  src={hod.profilePhoto}
                  alt={hod.name}
                  className="
                    h-24 w-24
                    rounded-full
                    border-4
                    border-blue-100
                    object-cover
                    sm:h-28 sm:w-28
                  "
                />

              ) : (

                <div
                  className="
                    flex
                    h-24 w-24
                    items-center
                    justify-center
                    rounded-full
                    bg-blue-100
                    text-3xl
                    sm:h-28 sm:w-28
                    sm:text-4xl
                  "
                >
                  👤
                </div>

              )}

            </div>


            {/* DETAILS */}

            <div className="min-w-0 w-full flex-1 text-center sm:text-left">

              <h3
                className="
                  break-words
                  text-xl
                  font-bold
                  text-gray-800
                  sm:text-2xl
                "
              >
                {hod.name}
              </h3>


              <div
                className="
                  mt-4
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                "
              >

                {/* EMAIL */}

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Email
                  </p>

                  <p
                    className="
                      mt-0.5
                      break-all
                      text-sm
                      font-medium
                      text-gray-700
                    "
                  >
                    {hod.email || "—"}
                  </p>
                </div>


                {/* PHONE */}

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Phone
                  </p>

                  <p className="mt-0.5 break-words text-sm font-medium text-gray-700">
                    {hod.phone || "—"}
                  </p>
                </div>


                {/* DEPARTMENT */}

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Department
                  </p>

                  <p className="mt-0.5 break-words text-sm font-medium text-gray-700">
                    {hod.department?.name || "—"}
                  </p>
                </div>


                {/* DEPARTMENT CODE */}

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Department Code
                  </p>

                  <p className="mt-0.5 break-words text-sm font-medium text-gray-700">
                    {hod.department?.code || "—"}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          sm:gap-5
          lg:grid-cols-3
        "
      >

        {/* STUDENTS */}

        <div className="rounded-xl border bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">

          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <p className="text-xs text-gray-500 sm:text-sm">
                Department Students
              </p>

              <p className="mt-1 text-3xl font-bold text-blue-600 sm:mt-2 sm:text-4xl">
                {stats.totalStudents ?? 0}
              </p>

            </div>

            <div className="flex-shrink-0 text-3xl sm:text-4xl">
              👥
            </div>

          </div>

        </div>


        {/* CLUBS */}

        <div className="rounded-xl border bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">

          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <p className="text-xs text-gray-500 sm:text-sm">
                Active Clubs
              </p>

              <p className="mt-1 text-3xl font-bold text-green-600 sm:mt-2 sm:text-4xl">
                {stats.totalClubs ?? 0}
              </p>

            </div>

            <div className="flex-shrink-0 text-3xl sm:text-4xl">
              🏛️
            </div>

          </div>

        </div>


        {/* MEMBERS */}

        <div className="rounded-xl border bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">

          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <p className="text-xs text-gray-500 sm:text-sm">
                Confirmed Club Members
              </p>

              <p className="mt-1 text-3xl font-bold text-purple-600 sm:mt-2 sm:text-4xl">
                {stats.confirmedMembers ?? 0}
              </p>

            </div>

            <div className="flex-shrink-0 text-3xl sm:text-4xl">
              ✅
            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          CLUB PARTICIPATION
      ================================================= */}

      <div>

        <div className="mb-4 sm:mb-5">

          <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
            Club Participation
          </h2>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Students from your department enrolled in each club
          </p>

        </div>


        {clubs.length === 0 ? (

          <div className="rounded-xl border bg-white p-6 text-center sm:rounded-2xl sm:p-8">

            <p className="text-sm text-gray-500">
              No active clubs available.
            </p>

          </div>

        ) : (

          <div
            className="
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
              sm:gap-5
              lg:grid-cols-3
            "
          >

            {clubs.map((club) => (

              <div
                key={club.id}
                className="
                  rounded-xl
                  border
                  bg-white
                  p-4
                  shadow-sm
                  transition
                  hover:shadow-md
                  sm:rounded-2xl
                  sm:p-6
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {club.code}
                    </p>

                    <h3
                      className="
                        mt-1
                        break-words
                        text-base
                        font-bold
                        text-gray-800
                        sm:text-lg
                      "
                    >
                      {club.name}
                    </h3>

                  </div>


                  <div
                    className="
                      flex
                      h-10 w-10
                      flex-shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-blue-50
                      text-xl
                      sm:h-12 sm:w-12
                      sm:rounded-xl
                      sm:text-2xl
                    "
                  >
                    🏛️
                  </div>

                </div>


                <p className="mt-3 break-words text-xs text-gray-500 sm:mt-4 sm:text-sm">
                  {club.type}
                </p>


                <div className="mt-4 flex items-end justify-between gap-3 sm:mt-5">

                  <div>

                    <p className="text-xs text-gray-400">
                      Department Students
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-600 sm:text-3xl">
                      {club.studentCount}
                    </p>

                  </div>

                  <span className="text-xs text-gray-500 sm:text-sm">
                    students
                  </span>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* =================================================
          DEPARTMENT SUMMARY
      ================================================= */}

      <div className="rounded-xl border bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">

        <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
          Department Summary
        </h2>

        <p className="mt-1 break-words text-xs text-gray-500 sm:text-sm">
          {hod.department?.name}
        </p>


        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-2
            sm:mt-6
            sm:grid-cols-4
            sm:gap-4
          "
        >

          {/* STUDENTS */}

          <div className="rounded-lg bg-blue-50 p-3 sm:rounded-xl sm:p-4">

            <p className="text-[11px] text-gray-500 sm:text-xs">
              Students
            </p>

            <p className="mt-1 text-xl font-bold text-blue-600 sm:text-2xl">
              {stats.totalStudents ?? 0}
            </p>

          </div>


          {/* CLUBS */}

          <div className="rounded-lg bg-green-50 p-3 sm:rounded-xl sm:p-4">

            <p className="text-[11px] text-gray-500 sm:text-xs">
              Clubs
            </p>

            <p className="mt-1 text-xl font-bold text-green-600 sm:text-2xl">
              {stats.totalClubs ?? 0}
            </p>

          </div>


          {/* CLUB MEMBERS */}

          <div className="rounded-lg bg-purple-50 p-3 sm:rounded-xl sm:p-4">

            <p className="text-[11px] text-gray-500 sm:text-xs">
              Club Members
            </p>

            <p className="mt-1 text-xl font-bold text-purple-600 sm:text-2xl">
              {stats.confirmedMembers ?? 0}
            </p>

          </div>


          {/* CLUBS WITH STUDENTS */}

          <div className="rounded-lg bg-orange-50 p-3 sm:rounded-xl sm:p-4">

            <p className="text-[11px] text-gray-500 sm:text-xs">
              Clubs with Students
            </p>

            <p className="mt-1 text-xl font-bold text-orange-600 sm:text-2xl">
              {
                clubs.filter(
                  (club) =>
                    club.studentCount > 0
                ).length
              }
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}