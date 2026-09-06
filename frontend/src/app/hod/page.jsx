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


      console.log(
        "HOD dashboard:",
        response.data
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
      <div className="flex min-h-[60vh] items-center justify-center">

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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

        <h2 className="font-semibold text-red-700">
          Unable to load dashboard
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={loadDashboard}
          className="
            mt-4 rounded-lg
            bg-red-600 px-4 py-2
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

    <div className="space-y-8">


      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <h1 className="text-2xl font-bold text-gray-800">
          HOD Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Department overview and club participation
        </p>

      </div>


      {/* =================================================
          HOD PROFILE
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-sm
          border
        "
      >

        <div
          className="
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            p-6
            text-white
          "
        >

          <h2 className="text-lg font-semibold">
            HOD Details
          </h2>

          <p className="mt-1 text-sm text-blue-100">
            Head of Department
          </p>

        </div>


        <div className="p-6">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">


            {/* PHOTO */}

            <div className="flex-shrink-0">

              {hod.profilePhoto ? (

                <img
                  src={hod.profilePhoto}
                  alt={hod.name}
                  className="
                    h-28 w-28
                    rounded-full
                    object-cover
                    border-4
                    border-blue-100
                  "
                />

              ) : (

                <div
                  className="
                    flex h-28 w-28
                    items-center justify-center
                    rounded-full
                    bg-blue-100
                    text-4xl
                  "
                >
                  👤
                </div>

              )}

            </div>


            {/* DETAILS */}

            <div className="flex-1">

              <h3 className="text-2xl font-bold text-gray-800">
                {hod.name}
              </h3>


              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">


                <div>

                  <p className="text-xs text-gray-400">
                    Email
                  </p>

                  <p className="text-sm font-medium text-gray-700">
                    {hod.email || "—"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-400">
                    Phone
                  </p>

                  <p className="text-sm font-medium text-gray-700">
                    {hod.phone || "—"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-400">
                    Department
                  </p>

                  <p className="text-sm font-medium text-gray-700">
                    {hod.department?.name || "—"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-400">
                    Department Code
                  </p>

                  <p className="text-sm font-medium text-gray-700">
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">


        {/* STUDENTS */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Department Students
              </p>

              <p className="mt-2 text-4xl font-bold text-blue-600">
                {stats.totalStudents ?? 0}
              </p>

            </div>

            <div className="text-4xl">
              👥
            </div>

          </div>

        </div>


        {/* CLUBS */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Active Clubs
              </p>

              <p className="mt-2 text-4xl font-bold text-green-600">
                {stats.totalClubs ?? 0}
              </p>

            </div>

            <div className="text-4xl">
              🏛️
            </div>

          </div>

        </div>


        {/* MEMBERS */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Confirmed Club Members
              </p>

              <p className="mt-2 text-4xl font-bold text-purple-600">
                {stats.confirmedMembers ?? 0}
              </p>

            </div>

            <div className="text-4xl">
              ✅
            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          CLUB PARTICIPATION
      ================================================= */}

      <div>

        <div className="mb-5">

          <h2 className="text-xl font-bold text-gray-800">
            Club Participation
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Students from your department enrolled in each club
          </p>

        </div>


        {clubs.length === 0 ? (

          <div className="rounded-2xl border bg-white p-8 text-center">

            <p className="text-gray-500">
              No active clubs available.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {clubs.map((club) => (

              <div
                key={club.id}
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-6
                  shadow-sm
                  transition
                  hover:-translate-y-1
                  hover:shadow-md
                "
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {club.code}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-gray-800">
                      {club.name}
                    </h3>

                  </div>


                  <div
                    className="
                      flex h-12 w-12
                      items-center justify-center
                      rounded-xl
                      bg-blue-50
                      text-2xl
                    "
                  >
                    🏛️
                  </div>

                </div>


                <p className="mt-4 text-sm text-gray-500">
                  {club.type}
                </p>


                <div className="mt-5 flex items-end justify-between">

                  <div>

                    <p className="text-xs text-gray-400">
                      Department Students
                    </p>

                    <p className="mt-1 text-3xl font-bold text-blue-600">
                      {club.studentCount}
                    </p>

                  </div>


                  <span className="text-sm text-gray-500">
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

      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-800">
          Department Summary
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {hod.department?.name}
        </p>


        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">

          <div className="rounded-xl bg-blue-50 p-4">

            <p className="text-xs text-gray-500">
              Students
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-600">
              {stats.totalStudents ?? 0}
            </p>

          </div>


          <div className="rounded-xl bg-green-50 p-4">

            <p className="text-xs text-gray-500">
              Clubs
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {stats.totalClubs ?? 0}
            </p>

          </div>


          <div className="rounded-xl bg-purple-50 p-4">

            <p className="text-xs text-gray-500">
              Club Members
            </p>

            <p className="mt-1 text-2xl font-bold text-purple-600">
              {stats.confirmedMembers ?? 0}
            </p>

          </div>


          <div className="rounded-xl bg-orange-50 p-4">

            <p className="text-xs text-gray-500">
              Clubs with Students
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-600">
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