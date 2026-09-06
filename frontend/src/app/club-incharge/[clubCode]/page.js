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
console.log(response.data)
      setDashboard(response.data);
    } catch (error) {
      console.error(
        "Failed to load club dashboard:",
        error.response?.data || error.message
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

  if (loading) {
    return (
      <main className="p-8">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
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
    <main className="min-h-screen bg-gray-100 p-8">

     


      {/* Club Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-8 shadow">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div>

            <span className="rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold text-white">
              {club.type}
            </span>

            <h2 className="mt-4 text-3xl font-bold text-blue-900">
              {club.name}
            </h2>

            <p className="mt-3 max-w-2xl text-gray-700">
              {club.description ||
                "Manage your club activities, students and attendance."}
            </p>

          </div>


          {/* Club Code */}
          <div className="rounded-xl bg-white/80 px-8 py-5 text-center shadow">

            <p className="text-sm text-gray-500">
              Club Code
            </p>

            <p className="text-3xl font-bold text-purple-700">
              {club.code}
            </p>

          </div>

        </div>

      </div>




      {/* In-Charge Details */}
      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl bg-white p-7 shadow">

          <h2 className="mb-6 text-xl font-bold">
            Club In-Charge Details
          </h2>

          {incharge ? (

            <div className="flex flex-col gap-6 md:flex-row md:items-center">

              {/* Profile Image */}
              <div className="shrink-0">

                {profileImage ? (
                  <img
                    src={incharge.image}
                    alt={incharge.name}
                    className="h-32 w-32 rounded-full object-cover ring-4 ring-purple-200"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-purple-100 text-5xl font-bold text-purple-600 ring-4 ring-purple-200">
                    {incharge.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>
                )}

              </div>


              {/* Details */}
              <div className="space-y-3">

                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {incharge.name}
                  </h3>

                  <span className="mt-1 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                    Club In-Charge
                  </span>
                </div>


                <div>
                  <p className="text-sm text-gray-500">
                    Email
                  </p>

                  <p className="font-medium">
                    {incharge.email}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-gray-500">
                    Phone
                  </p>

                  <p className="font-medium">
                    {incharge.phone}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-gray-500">
                    Department
                  </p>

                  <p className="font-medium">
                    {incharge.department ||
                      "Not assigned"}
                  </p>
                </div>

              </div>

            </div>

          ) : (

            <p className="text-gray-500">
              Club in-charge details not available.
            </p>

          )}

        </div>


        {/* Quick Overview */}
        <div className="rounded-2xl bg-white p-7 shadow">

          <h2 className="mb-6 text-xl font-bold">
            Quick Overview
          </h2>

         <div className="grid gap-4 sm:grid-cols-2">

  {/* MEMBERS */}
  <div className="rounded-xl bg-blue-50 p-5">
    <div className="flex items-start justify-between">

      <div>
        <p className="text-sm text-gray-500">
          Members
        </p>

        <p className="mt-2 text-3xl font-bold text-blue-600">
          {dashboard.studentCount}
        </p>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-3xl">
        👥
      </div>

    </div>
  </div>


  {/* ACTIVITIES */}
  <div className="rounded-xl bg-green-50 p-5">
    <div className="flex items-start justify-between">

      <div>
        <p className="text-sm text-gray-500">
          Activities
        </p>

        <p className="mt-2 text-3xl font-bold text-green-600">
          0
        </p>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">
        🏃
      </div>

    </div>
  </div>


  {/* UPCOMING EVENTS */}
  <div className="rounded-xl bg-yellow-50 p-5">
    <div className="flex items-start justify-between">

      <div>
        <p className="text-sm text-gray-500">
          Upcoming Events
        </p>

        <p className="mt-2 text-3xl font-bold text-yellow-600">
          0
        </p>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-3xl">
        📅
      </div>

    </div>
  </div>


  {/* ATTENDANCE */}
  <div className="rounded-xl bg-pink-50 p-5">
    <div className="flex items-start justify-between">

      <div>
        <p className="text-sm text-gray-500">
          Attendance
        </p>

        <p className="mt-2 text-3xl font-bold text-pink-600">
          0%
        </p>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-3xl">
        📊
      </div>

    </div>
  </div>

</div>

        </div>

      </div>


   

    </main>
  );
}