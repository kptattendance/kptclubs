"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminClubsPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // =====================================================
  // SEARCH / FILTER / SORT
  // =====================================================

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // =====================================================
  // LOAD CLUBS
  // =====================================================

  const loadClubs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get("/api/clubs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClubs(response.data.clubs || []);
    } catch (error) {
      console.error(
        "Failed to fetch clubs:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to fetch clubs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken) {
      loadClubs();
    }
  }, [getToken]);

  // =====================================================
  // DELETE CLUB
  // =====================================================

  const handleDelete = async (clubId, clubName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${clubName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(clubId);
      setError("");

      const token = await getToken();

      await api.delete(`/api/clubs/${clubId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClubs((previousClubs) =>
        previousClubs.filter(
          (club) => club._id !== clubId
        )
      );
    } catch (error) {
      console.error(
        "Delete club error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete club"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const clubTypes = useMemo(() => {
    return [
      ...new Set(
        clubs
          .map((club) => club.type)
          .filter(Boolean)
      ),
    ].sort();
  }, [clubs]);

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredClubs = useMemo(() => {
    let result = [...clubs];

    const searchText =
      search.trim().toLowerCase();

    // SEARCH
    if (searchText) {
      result = result.filter((club) => {
        const searchableText = [
          club.code,
          club.name,
          club.type,
          club.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          searchText
        );
      });
    }

    // TYPE
    if (typeFilter !== "ALL") {
      result = result.filter(
        (club) => club.type === typeFilter
      );
    }

    // STATUS
    if (statusFilter !== "ALL") {
      result = result.filter((club) => {
        if (statusFilter === "ACTIVE") {
          return club.isActive === true;
        }

        if (statusFilter === "INACTIVE") {
          return club.isActive === false;
        }

        return true;
      });
    }

    // SORT
    result.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortBy) {
        case "code":
          valueA = a.code || "";
          valueB = b.code || "";
          break;

        case "name":
          valueA = a.name || "";
          valueB = b.name || "";
          break;

        case "type":
          valueA = a.type || "";
          valueB = b.type || "";
          break;

        case "status":
          valueA = a.isActive
            ? "Active"
            : "Inactive";

          valueB = b.isActive
            ? "Active"
            : "Inactive";
          break;

        default:
          valueA = a.name || "";
          valueB = b.name || "";
      }

      const comparison = String(valueA)
        .toLowerCase()
        .localeCompare(
          String(valueB).toLowerCase(),
          undefined,
          {
            numeric: true,
          }
        );

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    clubs,
    search,
    typeFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setSortBy("name");
    setSortOrder("asc");
  };

  const hasFilters =
    search ||
    typeFilter !== "ALL" ||
    statusFilter !== "ALL";

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-[1500px]">

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">
                🏛️
              </div>

              <div>
                <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />

                <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="text-sm font-medium text-slate-600">
                  Loading clubs...
                </p>

              </div>

            </div>

          </div>

        </div>

      </main>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1500px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-sm">
                🏛️
              </div>

              <div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Clubs & Activities
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage college clubs and institutional activities.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/clubs/new")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
            >
              <span className="text-lg leading-none">
                +
              </span>

              Add Club
            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 font-bold text-red-600">
                !
              </div>

              <div>
                <p className="font-semibold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-0.5 text-sm text-red-700">
                  {error}
                </p>
              </div>

            </div>

          </div>
        )}

     

        {/* ================================================= */}
        {/* SEARCH + FILTERS */}
        {/* ================================================= */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          {/* SEARCH */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search Clubs
            </label>

            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by club name, code, type or description..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  ✕
                </button>
              )}

            </div>

          </div>

          {/* FILTERS */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {/* TYPE */}

            <FilterSelect
              label="Club Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={clubTypes}
            />

            {/* STATUS */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

              </select>

            </div>

            {/* SORT */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="name">
                  Club Name
                </option>

                <option value="code">
                  Club Code
                </option>

                <option value="type">
                  Type
                </option>

                <option value="status">
                  Status
                </option>

              </select>

            </div>

          </div>

          {/* FILTER FOOTER */}

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-slate-500">

              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredClubs.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {clubs.length}
              </span>{" "}
              clubs

            </p>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  setSortOrder(
                    sortOrder === "asc"
                      ? "desc"
                      : "asc"
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {sortOrder === "asc"
                  ? "↑ Ascending"
                  : "↓ Descending"}
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  Clear Filters
                </button>
              )}

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* TABLE CARD */}
        {/* ================================================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-semibold text-slate-900">
                Club Directory
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                View and manage all college clubs and activities.
              </p>

            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
              {filteredClubs.length} records
            </div>

          </div>

          {/* TABLE */}

          {filteredClubs.length === 0 ? (

            <div className="flex min-h-[320px] items-center justify-center px-6">

              <div className="text-center">

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  🏛️
                </div>

                <h3 className="font-semibold text-slate-800">
                  No clubs found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-400">
                  {hasFilters
                    ? "Try changing the search or filters."
                    : "No clubs or activities have been added yet."}
                </p>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                )}

              </div>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                {/* ================================================= */}
                {/* HEAD */}
                {/* ================================================= */}

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Club
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                {/* ================================================= */}
                {/* BODY */}
                {/* ================================================= */}

                <tbody>

                  {filteredClubs.map(
                    (club, index) => (

                      <tr
                        key={club._id}
                        className="group border-b border-slate-100 transition hover:bg-blue-50/40"
                      >

                        {/* NUMBER */}

                        <td className="px-5 py-4">

                          <span className="text-sm font-medium text-slate-400">
                            {index + 1}
                          </span>

                        </td>

                        {/* CLUB */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-700">
                              {club.code
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "C"}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-800">
                                {club.name}
                              </p>

                              <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                                {club.code}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* TYPE */}

                        <td className="px-5 py-4">

                          {club.type ? (
                            <span className="inline-flex rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                              {club.type}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              -
                            </span>
                          )}

                        </td>

                        {/* DESCRIPTION */}

                        <td className="max-w-md px-5 py-4">

                          <p
                            className="line-clamp-2 text-sm leading-6 text-slate-500"
                            title={
                              club.description ||
                              ""
                            }
                          >
                            {club.description ||
                              "No description provided."}
                          </p>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          {club.isActive ? (

                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">

                              <span className="h-2 w-2 rounded-full bg-emerald-500" />

                              Active

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">

                              <span className="h-2 w-2 rounded-full bg-red-500" />

                              Inactive

                            </span>

                          )}

                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                club._id,
                                club.name
                              )
                            }
                            disabled={
                              deletingId ===
                              club._id
                            }
                            className="inline-flex min-w-[82px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            {deletingId ===
                            club._id ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />

                                Deleting
                              </>
                            ) : (
                              <>
                                🗑️ Delete
                              </>
                            )}

                          </button>

                        </td>

                      </tr>

                    )
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

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  label,
  value,
  icon,
  color,
}) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
      value: "text-blue-700",
    },

    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      value: "text-emerald-700",
    },

    red: {
      bg: "bg-red-50",
      icon: "bg-red-100 text-red-600",
      value: "text-red-700",
    },

    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-100 text-purple-600",
      value: "text-purple-700",
    },
  };

  const theme =
    colors[color] || colors.blue;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md`}
    >

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p
            className={`mt-1 text-2xl font-bold ${theme.value}`}
          >
            {value}
          </p>

        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.icon}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

// =====================================================
// FILTER SELECT
// =====================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      >

        <option value="ALL">
          All {label}s
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </div>
  );
}