"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function StudentAttendancePage() {
  const { getToken } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedClub, setSelectedClub] =
    useState("ALL");

  const [selectedStatus, setSelectedStatus] =
    useState("ALL");

  const [expandedClub, setExpandedClub] =
    useState(null);

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
     OVERALL TOTALS
  ===================================================== */

  const totalClasses = attendance.reduce(
    (sum, club) =>
      sum + Number(club.totalClasses || 0),
    0
  );

  const attendedClasses = attendance.reduce(
    (sum, club) =>
      sum + Number(club.attendedClasses || 0),
    0
  );

  const absentClasses = attendance.reduce(
    (sum, club) =>
      sum + Number(club.absentClasses || 0),
    0
  );

  const overallPercentage =
    totalClasses > 0
      ? Number(
          (
            (attendedClasses /
              totalClasses) *
            100
          ).toFixed(2)
        )
      : 0;

  /* =====================================================
     FILTER CLUBS
  ===================================================== */

  const filteredAttendance = useMemo(() => {
    if (selectedClub === "ALL") {
      return attendance;
    }

    return attendance.filter(
      (club) =>
        String(club.clubId) ===
        String(selectedClub)
    );
  }, [attendance, selectedClub]);

  /* =====================================================
     FILTER HISTORY
  ===================================================== */

  const getFilteredHistory = (club) => {
    if (!club?.attendanceHistory) {
      return [];
    }

    if (selectedStatus === "ALL") {
      return club.attendanceHistory;
    }

    return club.attendanceHistory.filter(
      (record) =>
        record.status === selectedStatus
    );
  };

  /* =====================================================
     TOGGLE CLUB
  ===================================================== */

  const toggleClub = (clubId) => {
    setExpandedClub((current) =>
      String(current) === String(clubId)
        ? null
        : clubId
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="w-full">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Attendance
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View attendance details and
          date-wise attendance history.
        </p>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =================================================
          EMPTY
      ================================================= */}

      {attendance.length === 0 ? (
        <div className="rounded-2xl bg-white px-5 py-12 text-center shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
            📅
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            No attendance records found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Attendance will appear here after
            classes are marked.
          </p>
        </div>
      ) : (
        <>
          {/* =================================================
              OVERALL SUMMARY
          ================================================= */}

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              label="Total Classes"
              value={totalClasses}
              icon="📚"
            />

            <SummaryCard
              label="Attended"
              value={attendedClasses}
              icon="✓"
            />

            <SummaryCard
              label="Absent"
              value={absentClasses}
              icon="✕"
            />

            <SummaryCard
              label="Overall"
              value={`${overallPercentage}%`}
              icon="📊"
              percentage
              percentageValue={
                overallPercentage
              }
            />
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="mb-6 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* CLUB FILTER */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Club
                </label>

                <select
                  value={selectedClub}
                  onChange={(e) =>
                    setSelectedClub(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">
                    All Clubs
                  </option>

                  {attendance.map((club) => (
                    <option
                      key={club.clubId}
                      value={club.clubId}
                    >
                      {club.clubName}
                      {club.clubCode
                        ? ` (${club.clubCode})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* STATUS FILTER */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Attendance Status
                </label>

                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">
                    All Status
                  </option>

                  <option value="PRESENT">
                    Present
                  </option>

                  <option value="ABSENT">
                    Absent
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* =================================================
              CLUB ATTENDANCE
          ================================================= */}

          <div className="space-y-4">
            {filteredAttendance.map(
              (club, index) => {
                const isExpanded =
                  String(expandedClub) ===
                  String(club.clubId);

                const history =
                  getFilteredHistory(club);

                return (
                  <div
                    key={club.clubId}
                    className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
                  >
                    {/* =================================================
                        CLUB HEADER
                    ================================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleClub(
                          club.clubId
                        )
                      }
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex min-w-0 items-center gap-3">
                          {/* NUMBER */}

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                            {index + 1}
                          </div>

                          {/* CLUB NAME */}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800 sm:text-base">
                              {club.clubName}
                            </p>

                            {club.clubCode && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {club.clubCode}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* RIGHT */}

                        <div className="flex shrink-0 items-center gap-3">
                          <AttendancePercentage
                            percentage={
                              club.percentage
                            }
                          />

                          <div className="hidden text-right sm:block">
                            <p className="text-xs text-slate-400">
                              Attendance
                            </p>

                            <p className="text-xs font-semibold text-slate-600">
                              {
                                club.attendedClasses
                              }{" "}
                              /{" "}
                              {
                                club.totalClasses
                              }
                            </p>
                          </div>

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            {isExpanded
                              ? "−"
                              : "+"}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* =================================================
                        CLUB SUMMARY
                    ================================================= */}

                    <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <SmallStat
                          label="Attended"
                          value={
                            club.attendedClasses
                          }
                        />

                        <SmallStat
                          label="Absent"
                          value={
                            club.absentClasses
                          }
                        />

                        <SmallStat
                          label="Total"
                          value={
                            club.totalClasses
                          }
                        />

                        <SmallStat
                          label="Percentage"
                          value={`${club.percentage}%`}
                        />
                      </div>
                    </div>

                    {/* =================================================
                        DATE-WISE ATTENDANCE
                    ================================================= */}

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        {/* HISTORY HEADER */}

                        <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div>
                            <h3 className="text-sm font-bold text-slate-700">
                              Attendance History
                            </h3>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Date-wise attendance
                              for this club
                            </p>
                          </div>

                          <div className="text-xs text-slate-400">
                            {history.length}{" "}
                            record
                            {history.length !==
                            1
                              ? "s"
                              : ""}
                          </div>
                        </div>

                        {/* NO FILTERED RECORDS */}

                        {history.length ===
                        0 ? (
                          <div className="px-4 pb-5 text-center sm:px-6">
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8">
                              <p className="text-sm font-semibold text-slate-600">
                                No records found
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                No attendance
                                matches the
                                selected filter.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* =================================================
                                DESKTOP TABLE
                            ================================================= */}

                            <div className="hidden overflow-x-auto px-4 pb-5 sm:block sm:px-6">
                              <table className="w-full overflow-hidden rounded-xl bg-white">
                                <thead>
                                  <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      #
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      Date
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      Day
                                    </th>

                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      Status
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {history.map(
                                    (
                                      record,
                                      recordIndex
                                    ) => (
                                      <tr
                                        key={`${club.clubId}-${record.date}-${recordIndex}`}
                                        className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/70"
                                      >
                                        <td className="px-4 py-3 text-sm text-slate-400">
                                          {recordIndex +
                                            1}
                                        </td>

                                        <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                          {formatDate(
                                            record.date
                                          )}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-500">
                                          {
                                            record.day
                                          }
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                          <StatusBadge
                                            status={
                                              record.status
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
                                MOBILE CARDS
                            ================================================= */}

                            <div className="space-y-2 px-4 pb-5 sm:hidden">
                              {history.map(
                                (
                                  record,
                                  recordIndex
                                ) => (
                                  <div
                                    key={`${club.clubId}-${record.date}-${recordIndex}`}
                                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-400">
                                        {recordIndex +
                                          1}
                                      </div>

                                      <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                          {formatDate(
                                            record.date
                                          )}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-400">
                                          {
                                            record.day
                                          }
                                        </p>
                                      </div>
                                    </div>

                                    <StatusBadge
                                      status={
                                        record.status
                                      }
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
  percentage = false,
  percentageValue = 0,
}) {
  let valueClass =
    "text-slate-800";

  if (percentage) {
    valueClass =
      percentageValue >= 75
        ? "text-emerald-600"
        : "text-red-500";
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <span className="text-base">
          {icon}
        </span>
      </div>

      <p
        className={`mt-2 text-xl font-bold ${valueClass} sm:text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SMALL STAT
========================================================= */

function SmallStat({
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   ATTENDANCE PERCENTAGE
========================================================= */

function AttendancePercentage({
  percentage,
}) {
  const value =
    Number(percentage) || 0;

  const textColor =
    value >= 75
      ? "text-emerald-600"
      : "text-red-500";

  return (
    <span
      className={`text-sm font-bold ${textColor} sm:text-base`}
    >
      {value}%
    </span>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const isPresent =
    status === "PRESENT";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        isPresent
          ? "bg-emerald-50 text-emerald-600"
          : "bg-red-50 text-red-500"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
          isPresent
            ? "bg-emerald-100"
            : "bg-red-100"
        }`}
      >
        {isPresent ? "✓" : "✕"}
      </span>

      {isPresent
        ? "Present"
        : "Absent"}
    </span>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}