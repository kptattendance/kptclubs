"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function AttendanceCheckPage() {
  const { getToken } = useAuth();

  const [clubs, setClubs] = useState([]);

  const [summary, setSummary] = useState({
    totalClubs: 0,
    markedClubs: 0,
    notMarkedClubs: 0,
    totalSessions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");

  // Selected club for attendance dates popup
  const [selectedClubDates, setSelectedClubDates] = useState(null);

  // =====================================================
  // LOAD ATTENDANCE STATUS
  // =====================================================

  const loadAttendanceStatus = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/attendance/attendance-status",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: selectedDate
            ? {
                date: selectedDate,
              }
            : {},
        }
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load attendance status"
        );
      }

      setClubs(data.clubs || []);

      setSummary(
        data.summary || {
          totalClubs: 0,
          markedClubs: 0,
          notMarkedClubs: 0,
          totalSessions: 0,
        }
      );
    } catch (err) {
      console.error("Attendance status error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load attendance status"
      );

      setClubs([]);

      setSummary({
        totalClubs: 0,
        markedClubs: 0,
        notMarkedClubs: 0,
        totalSessions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadAttendanceStatus();
  }, [selectedDate]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredClubs = useMemo(() => {
    let result = [...clubs];

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((club) => {
        const name = club.name?.toLowerCase() || "";
        const code = club.code?.toLowerCase() || "";

        return (
          name.includes(query) ||
          code.includes(query)
        );
      });
    }

    if (statusFilter === "MARKED") {
      result = result.filter((club) => club.marked);
    }

    if (statusFilter === "NOT_MARKED") {
      result = result.filter((club) => !club.marked);
    }

    return result;
  }, [clubs, search, statusFilter]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    if (isNaN(value.getTime())) {
      return "—";
    }

    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setSelectedDate("");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-7">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                  Attendance Submission
                </h1>

                <p className="text-xs text-slate-500 sm:text-sm">
                  Check whether clubs have submitted attendance
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAttendanceStatus}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 11a8.1 8.1 0 00-15.5-2M4 5v4h4" />
              <path d="M4 13a8.1 8.1 0 0015.5 2M20 19v-4h-4" />
            </svg>

            Refresh
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            title="Total Clubs"
            value={summary.totalClubs}
            icon="clubs"
            bg="bg-blue-50"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />

          <SummaryCard
            title="Attendance Marked"
            value={summary.markedClubs}
            icon="check"
            bg="bg-emerald-50"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />

          <SummaryCard
            title="Not Marked"
            value={summary.notMarkedClubs}
            icon="clock"
            bg="bg-red-50"
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />

          <SummaryCard
            title="Total Sessions"
            value={summary.totalSessions}
            icon="calendar"
            bg="bg-amber-50"
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* =================================================
            FILTER PANEL
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* SEARCH */}

            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                />
                <path d="m21 21-4.3-4.3" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search club name or code..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* DATE */}

            <div className="flex-1 lg:max-w-[210px]">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(e.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* STATUS */}

            <div className="flex-1 lg:max-w-[190px]">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Clubs
                </option>

                <option value="MARKED">
                  Attendance Marked
                </option>

                <option value="NOT_MARKED">
                  Not Marked
                </option>
              </select>
            </div>

            {/* CLEAR */}

            {(search ||
              selectedDate ||
              statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* SELECTED DATE INFO */}

          {selectedDate && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                />

                <line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                />

                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                />

                <line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                />
              </svg>

              Showing attendance status for{" "}
              <strong>
                {formatDate(selectedDate)}
              </strong>
            </div>
          )}
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 sm:text-base">
                Club Attendance Status
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {filteredClubs.length} club
                {filteredClubs.length !== 1
                  ? "s"
                  : ""}{" "}
                shown
              </p>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="text-sm text-slate-400">
                  Loading attendance status...
                </p>
              </div>
            </div>
          ) : filteredClubs.length === 0 ? (
            /* EMPTY */

            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-6 w-6 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />

                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>

              <p className="text-sm font-semibold text-slate-700">
                No clubs found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try changing the search or filters.
              </p>
            </div>
          ) : (
            /* DATA */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">

                    <th className="w-14 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      #
                    </th>

                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Club
                    </th>

                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Members
                    </th>

                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Sessions
                    </th>

                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Last Marked
                    </th>

                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredClubs.map(
                    (club, index) => (
                      <tr
                        key={club.clubId}
                        className="group transition hover:bg-slate-50/70"
                      >

                        {/* NUMBER */}

                        <td className="px-4 py-3 text-center text-xs font-medium text-slate-400">
                          {index + 1}
                        </td>

                        {/* CLUB */}

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                              {club.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "C"}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {club.name ||
                                  "Unnamed Club"}
                              </p>

                              {club.code && (
                                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                  {club.code}
                                </p>
                              )}
                            </div>

                          </div>
                        </td>

                        {/* MEMBERS */}

                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-slate-700">
                            {club.totalMembers}
                          </span>
                        </td>

                        {/* SESSIONS */}

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedClubDates({
                                name:
                                  club.name ||
                                  "Unnamed Club",
                                dates:
                                  club.attendanceDates ||
                                  [],
                              })
                            }
                            className="inline-flex min-w-[34px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 transition hover:bg-yellow-100 hover:text-yellow-700 active:scale-95"
                            title="View attendance dates"
                          >
                            {club.attendanceDates?.length ||
                              0}
                          </button>
                        </td>

                        {/* LAST MARKED */}

                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-medium text-slate-600">
                            {formatDate(
                              club.lastMarkedDate
                            )}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-3 text-center">
                          {club.marked ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">

                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <svg
                                  className="h-2.5 w-2.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path d="M5 12l4 4L19 6" />
                                </svg>
                              </span>

                              Marked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">

                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                                <svg
                                  className="h-2.5 w-2.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path d="M12 7v5" />
                                  <path d="M12 16h.01" />
                                </svg>
                              </span>

                              Not Marked
                            </span>
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =================================================
            FOOTNOTE
        ================================================= */}

        {!loading &&
          filteredClubs.length > 0 && (
            <div className="mt-3 flex flex-col gap-1 px-1 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Attendance is considered marked when a
                submission exists for the club.
              </span>

              <span>
                {filteredClubs.length} of{" "}
                {clubs.length} clubs
              </span>
            </div>
          )}

      </div>

      {/* =================================================
          ATTENDANCE DATES POPUP
          IMPORTANT: This is INSIDE AttendanceCheckPage
      ================================================= */}

      {selectedClubDates && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedClubDates(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* POPUP HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  Attendance Dates
                </h3>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {selectedClubDates.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedClubDates(null)
                }
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* POPUP DATES */}

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {selectedClubDates.dates.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                  {selectedClubDates.dates.map(
                    (date, index) => (
                      <div
                        key={date}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                      >

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-xs font-bold text-yellow-700">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700">
                            {new Date(
                              `${date}T00:00:00`
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>

                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            Attendance Marked
                          </p>
                        </div>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="py-8 text-center">

                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                    📅
                  </div>

                  <p className="text-sm font-semibold text-slate-600">
                    No attendance dates
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Attendance has not been marked yet.
                  </p>

                </div>
              )}
            </div>

            {/* POPUP FOOTER */}

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex items-center justify-between">

                <span className="text-xs font-medium text-slate-500">
                  Total Sessions
                </span>

                <span className="rounded-lg bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                  {selectedClubDates.dates.length}
                </span>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  title,
  value,
  icon,
  bg,
  iconBg,
  iconColor,
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 ${bg} p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3">

        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >

          {/* CLUBS */}

          {icon === "clubs" && (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle
                cx="9"
                cy="7"
                r="4"
              />
              <path d="M22 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          )}

          {/* CHECK */}

          {icon === "check" && (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12l4 4L19 6" />
            </svg>
          )}

          {/* CLOCK */}

          {icon === "clock" && (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <path d="M12 7v5l3 2" />
            </svg>
          )}

          {/* CALENDAR */}

          {icon === "calendar" && (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
              />

              <line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
              />

              <line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
              />

              <line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
              />
            </svg>
          )}

        </div>
      </div>
    </div>
  );
}