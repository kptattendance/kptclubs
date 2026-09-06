"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function HODApplicationsPage() {

  const { getToken } = useAuth();

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =================================================
  // LOAD APPLICATIONS
  // =================================================

  const loadApplications = async () => {

    try {

      setLoading(true);
      setError("");

      const token =
        await getToken();

      const response =
        await axios.get(
          `${API_URL}/api/hod/applications`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "HOD applications:",
        response.data
      );

      if (response.data?.success) {

        setApplications(
          response.data.applications || []
        );

      } else {

        setError(
          response.data?.message ||
          "Failed to load applications"
        );
      }

    } catch (error) {

      console.error(
        "Load HOD applications error:",
        error.response?.data ||
        error.message
      );

      setError(
        error.response?.data?.message ||
        "Failed to load applications"
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadApplications();
  }, []);


  // =================================================
  // APPROVE
  // =================================================

  const approveApplication =
    async (membershipId) => {

      if (!membershipId) {
        alert(
          "Membership ID is missing."
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Approve this student's club membership?"
        );

      if (!confirmed) return;

      try {

        const token =
          await getToken();

        const response =
          await axios.put(
            `${API_URL}/api/hod/applications/${membershipId}/approve`,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (response.data?.success) {

          alert(
            "Student approved successfully."
          );

          loadApplications();
        }

      } catch (error) {

        console.error(
          "Approve HOD application error:",
          error.response?.data ||
          error.message
        );

        alert(
          error.response?.data?.message ||
          "Failed to approve application"
        );
      }
    };


  // =================================================
  // REJECT
  // =================================================

  const rejectApplication =
    async (membershipId) => {

      if (!membershipId) {
        alert(
          "Membership ID is missing."
        );
        return;
      }

      const reason =
        window.prompt(
          "Enter rejection reason:"
        );

      if (!reason?.trim()) {
        return;
      }

      try {

        const token =
          await getToken();

        const response =
          await axios.put(
            `${API_URL}/api/hod/applications/${membershipId}/reject`,
            {
              reason:
                reason.trim(),
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (response.data?.success) {

          alert(
            "Student application rejected."
          );

          loadApplications();
        }

      } catch (error) {

        console.error(
          "Reject HOD application error:",
          error.response?.data ||
          error.message
        );

        alert(
          error.response?.data?.message ||
          "Failed to reject application"
        );
      }
    };


  // =================================================
  // LOADING
  // =================================================

  if (loading) {

    return (
      <main className="min-h-screen bg-gray-50 p-6">

        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

          <p className="text-gray-500">
            Loading student applications...
          </p>

        </div>

      </main>
    );
  }


  // =================================================
  // PAGE
  // =================================================

  return (

    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6">

          <p className="text-sm font-medium text-blue-600">
            HOD Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-800">
            Student Applications
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review club applications forwarded by Club In-charges.
          </p>

        </div>


        {/* ERROR */}

        {error && (

          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>

        )}


        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Pending Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {applications.length}
            </p>

          </div>


          <div className="rounded-xl bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Waiting for HOD Approval
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {
                applications.filter(
                  (item) =>
                    item.status ===
                    "PENDING_HOD_APPROVAL"
                ).length
              }
            </p>

          </div>

        </div>


        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b px-5 py-4">

            <div className="flex items-center justify-between">

              <h2 className="font-semibold text-gray-800">
                Applications Awaiting Approval
              </h2>

              <button
                onClick={loadApplications}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Refresh
              </button>

            </div>

          </div>


          {applications.length === 0 ? (

            <div className="px-6 py-12 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                ✅
              </div>

              <h3 className="font-semibold text-gray-800">
                No pending applications
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                There are no student applications waiting for HOD approval.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Student
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Register No.
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Semester
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Club
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100">

                  {applications.map(
                    (application) => {

                      const student =
                        application.student;

                      const club =
                        application.club;

                      return (

                        <tr
                          key={
                            application.membershipId
                          }
                          className="hover:bg-gray-50"
                        >

                          {/* STUDENT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              {student?.photoUrl ? (

                                <img
                                  src={
                                    student.photoUrl
                                  }
                                  alt={
                                    student.name
                                  }
                                  className="h-11 w-11 rounded-full object-cover"
                                />

                              ) : (

                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                                  {student?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "S"}
                                </div>

                              )}

                              <div>

                                <p className="font-medium text-gray-800">
                                  {student?.name}
                                </p>

                                <p className="text-xs text-gray-500">
                                  {student?.email}
                                </p>

                              </div>

                            </div>

                          </td>


                          {/* REGISTER NUMBER */}

                          <td className="px-5 py-4 text-sm font-medium text-gray-700">

                            {student?.registerNumber}

                          </td>


                          {/* SEMESTER */}

                          <td className="px-5 py-4 text-sm text-gray-600">

                            {student?.semester || "-"}

                          </td>


                          {/* CLUB */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-medium text-gray-800">
                              {club?.name || "-"}
                            </p>

                            <p className="text-xs text-gray-500">
                              {club?.code || ""}
                            </p>

                          </td>


                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">

                              PENDING HOD APPROVAL

                            </span>

                          </td>


                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex gap-2">

                              <button
                                onClick={() =>
                                  approveApplication(
                                    application.membershipId
                                  )
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  rejectApplication(
                                    application.membershipId
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Reject
                              </button>

                            </div>

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}