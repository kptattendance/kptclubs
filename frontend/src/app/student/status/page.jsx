"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function StudentStatusPage() {
  const { getToken, isLoaded } = useAuth();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    loadStudent();
  }, [isLoaded]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get("/api/student/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStudent(response.data.student);
    } catch (error) {
      console.error(
        "Status loading error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load application status"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        retry={loadStudent}
      />
    );
  }

  const membership = student?.membership;

  return (
    <div className="w-full">

      {/* PAGE TITLE */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          Club Status
        </h1>

      </div>


      {/* NO APPLICATION */}

      {!membership ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">

            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5h6"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3h6v4H9z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8 13 2 2 5-5"
              />
            </svg>

          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            No club application found
          </p>

        </div>
      ) : (
        <StatusTable membership={membership} />
      )}

    </div>
  );
}


/* =========================================================
   STATUS TABLE
========================================================= */

function StatusTable({ membership }) {
  const club = membership.club;

  const appliedDate = membership.appliedAt
    ? formatDate(membership.appliedAt)
    : "—";

  const clubApproved =
    membership.status !== "PENDING_CLUB_APPROVAL";

  const hodApproved =
    membership.status === "CONFIRMED";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      <div className="hidden overflow-x-auto md:block">

        <table className="w-full border-collapse">

          <thead>

            <tr className="border-b border-slate-200 bg-slate-50">

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Club
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Applied On
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Club Approval
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                HOD Approval
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

            </tr>

          </thead>


          <tbody>

            <tr className="divide-x divide-slate-100">

              {/* CLUB */}

              <td className="px-6 py-5">

                <p className="font-semibold text-slate-800">
                  {club?.name || "—"}
                </p>

                {club?.code && (
                  <p className="mt-1 text-xs text-slate-400">
                    {club.code}
                  </p>
                )}

              </td>


              {/* DATE */}

              <td className="px-6 py-5 text-sm text-slate-600">
                {appliedDate}
              </td>


              {/* CLUB APPROVAL */}

              <td className="px-6 py-5">

                <ApprovalBadge
                  approved={clubApproved}
                  pending={
                    membership.status ===
                    "PENDING_CLUB_APPROVAL"
                  }
                  rejected={
                    membership.status ===
                    "REJECTED_BY_CLUB"
                  }
                />

              </td>


              {/* HOD APPROVAL */}

              <td className="px-6 py-5">

                <ApprovalBadge
                  approved={hodApproved}
                  pending={
                    membership.status ===
                    "PENDING_HOD_APPROVAL"
                  }
                  rejected={
                    membership.status ===
                    "REJECTED_BY_HOD"
                  }
                />

              </td>


              {/* STATUS */}

              <td className="px-6 py-5">

                <StatusBadge
                  status={membership.status}
                />

              </td>

            </tr>

          </tbody>

        </table>

      </div>


      {/* =====================================================
          MOBILE VIEW
      ===================================================== */}

      <div className="divide-y divide-slate-100 md:hidden">

        <MobileRow
          label="Club"
          value={
            <div>

              <p className="font-semibold text-slate-800">
                {club?.name || "—"}
              </p>

              {club?.code && (
                <p className="mt-1 text-xs text-slate-400">
                  {club.code}
                </p>
              )}

            </div>
          }
        />


        <MobileRow
          label="Applied On"
          value={appliedDate}
        />


        <MobileRow
          label="Club Approval"
          value={
            <ApprovalBadge
              approved={clubApproved}
              pending={
                membership.status ===
                "PENDING_CLUB_APPROVAL"
              }
              rejected={
                membership.status ===
                "REJECTED_BY_CLUB"
              }
            />
          }
        />


        <MobileRow
          label="HOD Approval"
          value={
            <ApprovalBadge
              approved={hodApproved}
              pending={
                membership.status ===
                "PENDING_HOD_APPROVAL"
              }
              rejected={
                membership.status ===
                "REJECTED_BY_HOD"
              }
            />
          }
        />


        <MobileRow
          label="Status"
          value={
            <StatusBadge
              status={membership.status}
            />
          }
        />

      </div>

    </div>
  );
}


/* =========================================================
   MOBILE ROW
========================================================= */

function MobileRow({ label, value }) {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 py-3 sm:px-5">

      <span className="shrink-0 text-sm font-medium text-slate-500">
        {label}
      </span>

      <div className="text-right text-sm">
        {value}
      </div>

    </div>
  );
}


/* =========================================================
   APPROVAL BADGE
========================================================= */

function ApprovalBadge({
  approved,
  pending,
  rejected,
}) {
  if (rejected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600">

        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100">
          ×
        </span>

        Rejected

      </span>
    );
  }

  if (approved) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600">

        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
          ✓
        </span>

        Approved

      </span>
    );
  }

  if (pending) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-600">

        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

        Pending

      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
      Waiting
    </span>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const data = {
    PENDING_CLUB_APPROVAL: [
      "Pending Club Approval",
      "bg-amber-50 text-amber-700",
    ],

    PENDING_HOD_APPROVAL: [
      "Pending HOD Approval",
      "bg-orange-50 text-orange-700",
    ],

    CONFIRMED: [
      "Confirmed",
      "bg-emerald-50 text-emerald-700",
    ],

    REJECTED_BY_CLUB: [
      "Rejected by Club",
      "bg-red-50 text-red-700",
    ],

    REJECTED_BY_HOD: [
      "Rejected by HOD",
      "bg-red-50 text-red-700",
    ],

    CANCELLED: [
      "Cancelled",
      "bg-slate-100 text-slate-600",
    ],
  };

  const [label, classes] =
    data[status] || [
      status || "Unknown",
      "bg-slate-100 text-slate-600",
    ];

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "—";
  }
}


/* =========================================================
   LOADING
========================================================= */

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">

      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

    </div>
  );
}


/* =========================================================
   ERROR
========================================================= */

function ErrorMessage({
  message,
  retry,
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">

      <p className="text-sm font-medium text-red-600">
        {message}
      </p>

      <button
        onClick={retry}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Try Again
      </button>

    </div>
  );
}