"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

import api from "@/lib/api";

export default function ClubInchargeDashboard() {
  const { clubCode } = useParams();

  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/clubs/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);

      setDashboard(response.data);
    } catch (error) {
      console.error(
        "Failed to load club dashboard:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load club dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken) {
      loadDashboard();
    }
  }, [getToken]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-6 sm:p-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-gray-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-6 sm:p-8">
        <div
          className="
            mx-auto
            max-w-7xl
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
            text-sm
            text-red-700
            sm:p-6
          "
        >
          {error}
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  const club = dashboard.club;
  const incharge = dashboard.clubIncharge;

  const profileImage =
    clerkUser?.imageUrl || null;

  const phone =
    clerkUser?.primaryPhoneNumber?.phoneNumber ||
    "Not provided";

  return (
    <main
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-gray-100
        px-3
        py-4
        sm:px-5
        sm:py-6
        lg:p-8
      "
    >

      <div className="mx-auto w-full max-w-7xl">

        {/* =================================================
            CLUB BANNER
        ================================================= */}

        <div
          className="
            mb-5
            overflow-hidden
            rounded-xl
            bg-gradient-to-r
            from-blue-100
            via-purple-100
            to-pink-100
            p-4
            shadow-sm
            sm:mb-6
            sm:rounded-2xl
            sm:p-6
            lg:mb-8
            lg:p-8
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5
              sm:gap-6
              md:flex-row
              md:items-center
              md:justify-between
            "
          >

            {/* CLUB INFORMATION */}

            <div className="min-w-0 flex-1">

              <span
                className="
                  inline-block
                  max-w-full
                  rounded-full
                  bg-purple-600
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-white
                  sm:px-4
                  sm:text-sm
                "
              >
                {club.type}
              </span>

              <h2
                className="
                  mt-3
                  break-words
                  text-2xl
                  font-bold
                  leading-tight
                  text-blue-900
                  sm:mt-4
                  sm:text-3xl
                "
              >
                {club.name}
              </h2>

              <p
                className="
                  mt-2
                  max-w-2xl
                  break-words
                  text-sm
                  leading-6
                  text-gray-700
                  sm:mt-3
                  sm:text-base
                "
              >
                {club.description ||
                  "Manage your club activities, students and attendance."}
              </p>

            </div>


            {/* CLUB CODE */}

            <div
              className="
                w-full
                rounded-xl
                bg-white/80
                px-5
                py-4
                text-center
                shadow
                sm:px-8
                sm:py-5
                md:w-auto
                md:min-w-[150px]
              "
            >

              <p className="text-xs text-gray-500 sm:text-sm">
                Club Code
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-bold
                  text-purple-700
                  sm:text-3xl
                "
              >
                {club.code}
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            IN-CHARGE + QUICK OVERVIEW
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-2
            lg:gap-6
          "
        >

          {/* =================================================
              IN-CHARGE DETAILS
          ================================================= */}

          <div
            className="
              min-w-0
              rounded-xl
              bg-white
              p-4
              shadow-sm
              sm:rounded-2xl
              sm:p-6
              lg:p-7
            "
          >

            <h2
              className="
                mb-5
                text-lg
                font-bold
                text-gray-900
                sm:mb-6
                sm:text-xl
              "
            >
              Club In-Charge Details
            </h2>

            {incharge ? (

              <div
                className="
                  flex
                  flex-col
                  items-center
                  gap-5
                  sm:flex-row
                  sm:items-start
                  sm:gap-6
                "
              >

                {/* PROFILE IMAGE */}

                <div className="shrink-0">

                  {profileImage ? (

                    <img
                      src={incharge.image}
                      alt={incharge.name}
                      className="
                        h-24
                        w-24
                        rounded-full
                        object-cover
                        ring-4
                        ring-purple-200
                        sm:h-28
                        sm:w-28
                        lg:h-32
                        lg:w-32
                      "
                    />

                  ) : (

                    <div
                      className="
                        flex
                        h-24
                        w-24
                        items-center
                        justify-center
                        rounded-full
                        bg-purple-100
                        text-4xl
                        font-bold
                        text-purple-600
                        ring-4
                        ring-purple-200
                        sm:h-28
                        sm:w-28
                        sm:text-5xl
                        lg:h-32
                        lg:w-32
                      "
                    >
                      {incharge.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                  )}

                </div>


                {/* DETAILS */}

                <div
                  className="
                    min-w-0
                    w-full
                    space-y-3
                    text-center
                    sm:text-left
                  "
                >

                  <div>

                    <h3
                      className="
                        break-words
                        text-xl
                        font-bold
                        text-gray-900
                        sm:text-2xl
                      "
                    >
                      {incharge.name}
                    </h3>

                    <span
                      className="
                        mt-1
                        inline-block
                        rounded-full
                        bg-purple-100
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-purple-700
                        sm:text-sm
                      "
                    >
                      Club In-Charge
                    </span>

                  </div>


                  {/* EMAIL */}

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 sm:text-sm">
                      Email
                    </p>

                    <p
                      className="
                        mt-0.5
                        break-all
                        text-sm
                        font-medium
                        text-gray-800
                      "
                    >
                      {incharge.email}
                    </p>

                  </div>


                  {/* PHONE */}

                  <div>

                    <p className="text-xs text-gray-500 sm:text-sm">
                      Phone
                    </p>

                    <p
                      className="
                        mt-0.5
                        break-words
                        text-sm
                        font-medium
                        text-gray-800
                      "
                    >
                      {incharge.phone}
                    </p>

                  </div>


                  {/* DEPARTMENT */}

                  <div>

                    <p className="text-xs text-gray-500 sm:text-sm">
                      Department
                    </p>

                    <p
                      className="
                        mt-0.5
                        break-words
                        text-sm
                        font-medium
                        text-gray-800
                      "
                    >
                      {incharge.department ||
                        "Not assigned"}
                    </p>

                  </div>

                </div>

              </div>

            ) : (

              <p className="text-sm text-gray-500">
                Club in-charge details not available.
              </p>

            )}

          </div>


          {/* =================================================
              QUICK OVERVIEW
          ================================================= */}

          <div
            className="
              min-w-0
              rounded-xl
              bg-white
              p-4
              shadow-sm
              sm:rounded-2xl
              sm:p-6
              lg:p-7
            "
          >

            <h2
              className="
                mb-5
                text-lg
                font-bold
                text-gray-900
                sm:mb-6
                sm:text-xl
              "
            >
              Quick Overview
            </h2>


            <div
              className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
                sm:gap-4
              "
            >

              {/* MEMBERS */}

              <div
                className="
                  rounded-xl
                  bg-blue-50
                  p-4
                  sm:p-5
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 sm:text-sm">
                      Members
                    </p>

                    <p
                      className="
                        mt-1
                        text-2xl
                        font-bold
                        text-blue-600
                        sm:mt-2
                        sm:text-3xl
                      "
                    >
                      {dashboard.studentCount}
                    </p>

                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-blue-100
                      text-2xl
                      sm:h-14
                      sm:w-14
                      sm:text-3xl
                    "
                  >
                    👥
                  </div>

                </div>

              </div>


              {/* ACTIVITIES */}

              <div
                className="
                  rounded-xl
                  bg-green-50
                  p-4
                  sm:p-5
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 sm:text-sm">
                      Activities
                    </p>

                    <p
                      className="
                        mt-1
                        text-2xl
                        font-bold
                        text-green-600
                        sm:mt-2
                        sm:text-3xl
                      "
                    >
                      0
                    </p>

                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-green-100
                      text-2xl
                      sm:h-14
                      sm:w-14
                      sm:text-3xl
                    "
                  >
                    🏃
                  </div>

                </div>

              </div>


              {/* UPCOMING EVENTS */}

              <div
                className="
                  rounded-xl
                  bg-yellow-50
                  p-4
                  sm:p-5
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 sm:text-sm">
                      Upcoming Events
                    </p>

                    <p
                      className="
                        mt-1
                        text-2xl
                        font-bold
                        text-yellow-600
                        sm:mt-2
                        sm:text-3xl
                      "
                    >
                      0
                    </p>

                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-yellow-100
                      text-2xl
                      sm:h-14
                      sm:w-14
                      sm:text-3xl
                    "
                  >
                    📅
                  </div>

                </div>

              </div>


              {/* ATTENDANCE */}

              <div
                className="
                  rounded-xl
                  bg-pink-50
                  p-4
                  sm:p-5
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 sm:text-sm">
                      Attendance
                    </p>

                    <p
                      className="
                        mt-1
                        text-2xl
                        font-bold
                        text-pink-600
                        sm:mt-2
                        sm:text-3xl
                      "
                    >
                      0%
                    </p>

                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-pink-100
                      text-2xl
                      sm:h-14
                      sm:w-14
                      sm:text-3xl
                    "
                  >
                    📊
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}