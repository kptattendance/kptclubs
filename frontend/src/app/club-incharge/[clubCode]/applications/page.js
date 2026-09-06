"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function ClubApplicationsPage() {
  const { getToken } = useAuth();
  const params = useParams();

  const clubCode = params.clubCode;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD APPLICATIONS
  // ==========================================

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await axios.get(
        `${API_URL}/api/club-incharge/applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Club applications:",
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
        "Load applications error:",
        error.response?.data || error.message
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
    if (clubCode) {
      loadApplications();
    }
  }, [clubCode]);

  // ==========================================
  // APPROVE APPLICATION
  // ==========================================

  const approveApplication = async (membershipId) => {
    const confirmApproval = window.confirm(
      "Are you sure you want to approve this student?"
    );

    if (!confirmApproval) return;

    try {
      const token = await getToken();

      const response = await axios.put(
        `${API_URL}/api/club-incharge/applications/${membershipId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        alert(
          "Application approved. It has been forwarded to the HOD."
        );

        loadApplications();
      }
    } catch (error) {
      console.error(
        "Approve application error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to approve application"
      );
    }
  };

  // ==========================================
  // REJECT APPLICATION
  // ==========================================

  const rejectApplication = async (membershipId) => {
    const reason = window.prompt(
      "Enter rejection reason:"
    );

    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const token = await getToken();

      const response = await axios.put(
        `${API_URL}/api/club-incharge/applications/${membershipId}/reject`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        alert("Application rejected.");

        loadApplications();
      }
    } catch (error) {
      console.error(
        "Reject application error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to reject application"
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              Loading applications...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">

      <div className="mx-auto max-w-7xl">

        {/* ================= HEADER ================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-medium text-blue-600">
              Club In-charge
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-800 sm:text-3xl">
              Club Applications
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review students who have applied to join your club.
            </p>
          </div>

          <button
            onClick={loadApplications}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>

        </div>


        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}


        {/* ================= SUMMARY ================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

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
              Waiting for Approval
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {
                applications.filter(
                  (item) =>
                    item.status ===
                    "PENDING_CLUB_APPROVAL"
                ).length
              }
            </p>
          </div>


          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Club
            </p>

            <p className="mt-2 text-xl font-bold text-gray-800">
              {clubCode?.toUpperCase()}
            </p>
          </div>

        </div>


        {/* ================= APPLICATION TABLE ================= */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-gray-800">
              Student Applications
            </h2>
          </div>


          {applications.length === 0 ? (

            <div className="px-6 py-12 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                👥
              </div>

              <h3 className="font-semibold text-gray-800">
                No applications
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                There are currently no students waiting for approval.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Register Number
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Department
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Semester
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Email
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Phone
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100">

                  {applications.map(
                    (application) => {

                      const student =
                        application.student;

                      const isPending =
                        application.status ===
                        "PENDING_CLUB_APPROVAL";

                      return (
                        <tr
                          key={application.membershipId}
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
                                  Student
                                </p>
                              </div>

                            </div>

                          </td>


                          {/* REGISTER NUMBER */}

                          <td className="px-5 py-4 text-sm font-medium text-gray-700">
                            {student?.registerNumber}
                          </td>


                          {/* DEPARTMENT */}

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {student?.department?.code ||
                              student?.department?.name ||
                              "-"}
                          </td>


                          {/* SEMESTER */}

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {student?.semester ||
                              "-"}
                          </td>


                          {/* EMAIL */}

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {student?.email ||
                              "-"}
                          </td>


                          {/* PHONE */}

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {student?.phone ||
                              "-"}
                          </td>


                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                application.status ===
                                "PENDING_CLUB_APPROVAL"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : application.status ===
                                    "PENDING_HOD_APPROVAL"
                                  ? "bg-blue-100 text-blue-700"
                                  : application.status ===
                                    "CONFIRMED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {application.status
                                ?.replaceAll(
                                  "_",
                                  " "
                                )}
                            </span>

                          </td>


                          {/* ACTION */}

                         {/* ACTION */}

<td className="px-5 py-4">

  {isPending ? (

    <div className="flex gap-2">

     <button
  onClick={() => {
    console.log(
      "APPROVE CLICKED - APPLICATION:",
      application
    );

    console.log(
      "APPROVE MEMBERSHIP ID:",
      application.membershipId
    );

    approveApplication(
      application.membershipId
    );
  }}
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

  ) : (

    <span className="text-xs text-gray-400">
      No action
    </span>

  )}

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