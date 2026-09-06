"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function StudentAttendancePage() {
  const { getToken } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD ATTENDANCE
  ===================================================== */

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/attendance/student",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to load attendance"
        );
      }

      setAttendance(
        response.data.attendance || []
      );
    } catch (err) {
      console.error(
        "Load student attendance error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadAttendance();
  }, []);

  /* =====================================================
     OVERALL
  ===================================================== */

  const totalClasses = attendance.reduce(
    (sum, club) =>
      sum + (club.totalClasses || 0),
    0
  );

  const attendedClasses = attendance.reduce(
    (sum, club) =>
      sum + (club.attendedClasses || 0),
    0
  );

  const overallPercentage =
    totalClasses > 0
      ? Math.round(
          (attendedClasses / totalClasses) * 100
        )
      : 0;

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* =================================================
          TITLE
      ================================================= */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Attendance
        </h1>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {attendance.length === 0 ? (

        <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-[0_2px_12px_rgba(15,23,42,0.06)]">

          <p className="text-sm font-semibold text-slate-700">
            No attendance records found
          </p>

        </div>

      ) : (

        <>
          {/* =================================================
              OVERALL SUMMARY
          ================================================= */}

          <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] sm:px-6">

            <SummaryItem
              label="Classes"
              value={totalClasses}
            />

            <SummaryItem
              label="Attended"
              value={attendedClasses}
            />

            <SummaryItem
              label="Overall"
              value={`${overallPercentage}%`}
              percentage
              percentageValue={overallPercentage}
            />

          </div>


          {/* =================================================
              ATTENDANCE TABLE
          ================================================= */}

          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)]">

            {/* DESKTOP */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full">

                <thead>

                  <tr className="bg-slate-50/80">

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      #
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Club
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Attended
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Total
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Attendance
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {attendance.map(
                    (club, index) => (
                      <tr
                        key={club.clubId}
                        className="transition hover:bg-slate-50/60"
                      >

                        {/* NUMBER */}

                        <td className="px-6 py-5 text-sm text-slate-400">
                          {index + 1}
                        </td>


                        {/* CLUB */}

                        <td className="px-6 py-5">

                          <p className="text-sm font-semibold text-slate-800">
                            {club.clubName}
                          </p>

                          {club.clubCode && (
                            <p className="mt-1 text-xs text-slate-400">
                              {club.clubCode}
                            </p>
                          )}

                        </td>


                        {/* ATTENDED */}

                        <td className="px-6 py-5 text-center text-sm font-semibold text-slate-700">
                          {club.attendedClasses}
                        </td>


                        {/* TOTAL */}

                        <td className="px-6 py-5 text-center text-sm text-slate-500">
                          {club.totalClasses}
                        </td>


                        {/* PERCENTAGE */}

                        <td className="px-6 py-5 text-center">

                          <AttendancePercentage
                            percentage={
                              club.percentage
                            }
                          />

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>


            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="md:hidden">

              {attendance.map(
                (club, index) => (

                  <div
                    key={club.clubId}
                    className={`px-5 py-5 ${
                      index !==
                      attendance.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >

                    {/* CLUB */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-slate-800">

                          <span className="mr-2 text-slate-400">
                            {index + 1}.
                          </span>

                          {club.clubName}

                        </p>

                        {club.clubCode && (
                          <p className="mt-1 ml-5 text-xs text-slate-400">
                            {club.clubCode}
                          </p>
                        )}

                      </div>


                      <AttendancePercentage
                        percentage={
                          club.percentage
                        }
                      />

                    </div>


                    {/* NUMBERS */}

                    <div className="mt-4 flex gap-8 ml-5">

                      <div>

                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Attended
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-slate-700">
                          {club.attendedClasses}
                        </p>

                      </div>


                      <div>

                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Total
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-slate-700">
                          {club.totalClasses}
                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>
        </>

      )}

    </div>
  );
}


/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
  label,
  value,
  percentage = false,
  percentageValue = 0,
}) {
  let valueClass = "text-slate-800";

  if (percentage) {
    valueClass =
      percentageValue >= 75
        ? "text-emerald-600"
        : "text-red-500";
  }

  return (
    <div className="flex items-center gap-2">

      <span className="text-xs font-medium text-slate-400">
        {label}
      </span>

      <span
        className={`text-base font-bold ${valueClass}`}
      >
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   ATTENDANCE %
========================================================= */

function AttendancePercentage({
  percentage,
}) {
  const value = Number(percentage) || 0;

  const textColor =
    value >= 75
      ? "text-emerald-600"
      : "text-red-500";

  return (
    <span
      className={`text-sm font-bold ${textColor}`}
    >
      {value}%
    </span>
  );
}