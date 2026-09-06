"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import Link from "next/link";

export default function StudentDashboard() {
  const { getToken, isLoaded } = useAuth();

  const [student, setStudent] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");

  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =====================================================
     LOAD STUDENT
  ===================================================== */

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [profileResponse, clubsResponse] =
        await Promise.all([
          api.get("/api/student/profile", {
            headers,
          }),

          api.get("/api/student/clubs", {
            headers,
          }),
        ]);

      setStudent(
        profileResponse.data.student
      );

      setClubs(
        clubsResponse.data.clubs || []
      );

    } catch (error) {
      console.error(
        "Student dashboard error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load student dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    if (!isLoaded) return;

    loadStudent();
  }, [isLoaded]);

  /* =====================================================
     REGISTER CLUB
  ===================================================== */

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedClub) {
      setError("Please select a club");
      return;
    }

    try {
      setRegistering(true);

      const token = await getToken();

      const response = await api.post(
        "/api/student/club-registration",
        {
          clubId: selectedClub,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message ||
          "Club registration submitted successfully"
      );

      setSelectedClub("");

      await loadStudent();

    } catch (error) {
      console.error(
        "Club registration error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to register for club"
      );
    } finally {
      setRegistering(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">

        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error && !student) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">

        <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            !
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>

          <button
            onClick={loadStudent}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  const membership =
    student?.membership;

  return (
    <div className="mx-auto w-full max-w-7xl">

      {/* =================================================
          WELCOME
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="text-sm font-medium text-blue-600">
            Student Dashboard
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Welcome, {student?.name}
          </h1>

        </div>


        {student?.registerNumber && (
          <div className="self-start rounded-xl bg-white px-4 py-2.5 shadow-sm sm:self-auto">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Register No.
            </p>

            <p className="mt-0.5 text-sm font-semibold text-slate-700">
              {student.registerNumber}
            </p>

          </div>
        )}

      </div>


      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}


      {/* =================================================
          STUDENT INFORMATION
      ================================================= */}

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.06)] sm:p-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

          {/* PHOTO */}

          <div className="flex items-center gap-3">

            {student?.photoUrl ? (

              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-14 w-14 rounded-2xl object-cover"
              />

            ) : (

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
                {student?.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

            )}

            <div className="min-w-0 sm:hidden">

              <p className="truncate text-sm font-semibold text-slate-800">
                {student?.name}
              </p>

              <p className="truncate text-xs text-slate-400">
                {student?.email}
              </p>

            </div>

          </div>


          {/* DESKTOP NAME */}

          <div className="hidden min-w-[190px] sm:block">

            <p className="truncate text-sm font-semibold text-slate-800">
              {student?.name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {student?.email}
            </p>

          </div>


          {/* INFORMATION */}

          <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">

            <Info
              label="Department"
              value={
                student?.department?.code ||
                student?.department?.name ||
                "-"
              }
            />

            <Info
              label="Semester"
              value={student?.semester || "-"}
            />

            <Info
              label="Phone"
              value={student?.phone || "-"}
            />

            <Info
              label="Admission Year"
              value={
                student?.admissionYear || "-"
              }
            />

          </div>

        </div>

      </div>


      {/* =================================================
          MAIN DASHBOARD CARDS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* CLUB */}

        <DashboardCard
          href="/student/status"
          title="My Club"
          value={
            membership?.club?.name ||
            "Not Joined"
          }
          subtitle={
            membership?.club?.code ||
            "View club status"
          }
          type="club"
        />


        {/* STATUS */}

        <DashboardCard
          href="/student/status"
          title="Application Status"
          value={
            membership
              ? getStatusLabel(
                  membership.status
                )
              : "Not Applied"
          }
          subtitle={
            membership
              ? "View approval status"
              : "Register for a club"
          }
          type="status"
        />


        {/* ATTENDANCE */}

        <DashboardCard
          href="/student/attendance"
          title="Attendance"
          value="View Attendance"
          subtitle="Check your club attendance"
          type="attendance"
        />

      </div>



      {/* =================================================
          REGISTER FOR CLUB
      ================================================= */}

      {!membership && clubs.length > 0 && (

        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg shadow-blue-100 sm:p-6">

          <div className="mb-4">

            <h2 className="text-lg font-bold">
              Join a Club
            </h2>

            <p className="mt-1 text-sm text-blue-100">
              Select a club to submit your registration.
            </p>

          </div>


          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-3 sm:flex-row"
          >

            <select
              value={selectedClub}
              onChange={(e) =>
                setSelectedClub(e.target.value)
              }
              className="h-11 flex-1 rounded-lg border-0 bg-white px-3 text-sm text-slate-700 outline-none ring-0"
            >

              <option value="">
                Select a club
              </option>

              {clubs.map((club) => (
                <option
                  key={club._id}
                  value={club._id}
                >
                  {club.name}
                  {club.code
                    ? ` (${club.code})`
                    : ""}
                </option>
              ))}

            </select>


            <button
              type="submit"
              disabled={registering}
              className="h-11 rounded-lg bg-white px-5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registering
                ? "Submitting..."
                : "Register"}
            </button>

          </form>

        </div>

      )}



    </div>
  );
}


/* =========================================================
   INFORMATION
========================================================= */

function Info({ label, value }) {
  return (
    <div className="min-w-0">

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  href,
  title,
  value,
  subtitle,
  type,
}) {
  const styles = {
    club: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
    },

    status: {
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
    },

    attendance: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
    },
  };

  const style = styles[type];

  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >

      <div className="flex items-start justify-between">

        <div className="min-w-0">

          <p className="text-xs font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-2 truncate text-lg font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {subtitle}
          </p>

        </div>


        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >

          {type === "club" && (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10 12 4l9 6"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 10v8h14v-8"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 18v-5h6v5"
              />
            </svg>
          )}


          {type === "status" && (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect
                x="5"
                y="3"
                width="14"
                height="18"
                rx="2"
              />

              <path
                strokeLinecap="round"
                d="M8 8h8"
              />

              <path
                strokeLinecap="round"
                d="M8 12h8"
              />

              <path
                strokeLinecap="round"
                d="M8 16h4"
              />
            </svg>
          )}


          {type === "attendance" && (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                d="M4 19V5"
              />

              <path
                strokeLinecap="round"
                d="M4 19h16"
              />

              <path
                strokeLinecap="round"
                d="M8 15v-4"
              />

              <path
                strokeLinecap="round"
                d="M12 15V7"
              />

              <path
                strokeLinecap="round"
                d="M16 15v-6"
              />

            </svg>
          )}

        </div>

      </div>

    </Link>
  );
}


/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  title,
  description,
  type,
}) {
  const icons = {
    status: "text-blue-600 bg-blue-50",
    attendance: "text-emerald-600 bg-emerald-50",
    certificate: "text-purple-600 bg-purple-50",
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl bg-white px-4 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-md"
    >

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${icons[type]}`}
      >

        {type === "status" && (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect
              x="5"
              y="3"
              width="14"
              height="18"
              rx="2"
            />

            <path
              strokeLinecap="round"
              d="M8 8h8"
            />

            <path
              strokeLinecap="round"
              d="M8 12h8"
            />

          </svg>
        )}

        {type === "attendance" && (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              d="M4 19V5"
            />

            <path
              strokeLinecap="round"
              d="M4 19h16"
            />

            <path
              strokeLinecap="round"
              d="M8 15v-4"
            />

            <path
              strokeLinecap="round"
              d="M12 15V7"
            />

            <path
              strokeLinecap="round"
              d="M16 15v-6"
            />

          </svg>
        )}

        {type === "certificate" && (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m12 3 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2-3.8-3.7 5.3-.8L12 3Z"
            />
          </svg>
        )}

      </div>


      <div className="min-w-0">

        <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {description}
        </p>

      </div>

    </Link>
  );
}


/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {
  const labels = {
    PENDING_CLUB_APPROVAL:
      "Pending Club Approval",

    PENDING_HOD_APPROVAL:
      "Pending HOD Approval",

    CONFIRMED:
      "Confirmed",

    REJECTED_BY_CLUB:
      "Rejected by Club",

    REJECTED_BY_HOD:
      "Rejected by HOD",

    CANCELLED:
      "Cancelled",
  };

  return labels[status] || status;
}


/* =========================================================
   MEMBERSHIP STATUS
========================================================= */

function MembershipStatus({ status }) {
  const styles = {
    PENDING_CLUB_APPROVAL:
      "text-amber-600",

    PENDING_HOD_APPROVAL:
      "text-orange-600",

    CONFIRMED:
      "text-emerald-600",

    REJECTED_BY_CLUB:
      "text-red-600",

    REJECTED_BY_HOD:
      "text-red-600",

    CANCELLED:
      "text-slate-500",
  };

  return (
    <div
      className={`flex items-center gap-2 text-sm font-semibold ${
        styles[status] ||
        "text-slate-500"
      }`}
    >

      <span className="h-2 w-2 rounded-full bg-current" />

      {getStatusLabel(status)}

    </div>
  );
}