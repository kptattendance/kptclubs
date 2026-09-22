"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] = useState("");

  // =====================================================
  // FILTERS
  // =====================================================

  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  const [semesterFilter, setSemesterFilter] =
    useState("ALL");

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [clubFilter, setClubFilter] =
    useState("ALL");

  // =====================================================
  // SORT
  // =====================================================

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // =====================================================
  // DELETE USER
  // =====================================================

  const handleDelete = async (userId, userName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${userName}?`
    );

    if (!confirmed) return;

    try {
      const token = await getToken();

      await api.delete(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user._id !== userId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete user:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete user"
      );
    }
  };

  // =====================================================
  // LOAD USERS
  // =====================================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data.users || []);
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken) {
      loadUsers();
    }
  }, [getToken]);

  // =====================================================
  // UNIQUE ROLES
  // =====================================================

  const roles = useMemo(() => {
    return [
      ...new Set(
        users
          .map((user) => user.role)
          .filter(Boolean)
      ),
    ].sort();
  }, [users]);

  // =====================================================
  // UNIQUE DEPARTMENTS
  // =====================================================

  const departments = useMemo(() => {
    return [
      ...new Map(
        users
          .filter((user) => user.departmentId)
          .map((user) => [
            user.departmentId._id ||
              user.departmentId.code,
            user.departmentId,
          ])
      ).values(),
    ].sort((a, b) =>
      `${a.code || ""}`.localeCompare(
        `${b.code || ""}`
      )
    );
  }, [users]);

  // =====================================================
  // UNIQUE CLUBS
  // =====================================================

  const clubs = useMemo(() => {
    return [
      ...new Map(
        users
          .filter((user) => user.clubId)
          .map((user) => [
            user.clubId._id ||
              user.clubId.code,
            user.clubId,
          ])
      ).values(),
    ].sort((a, b) =>
      `${a.code || ""}`.localeCompare(
        `${b.code || ""}`
      )
    );
  }, [users]);

  // =====================================================
  // SEMESTER
  // =====================================================

  const getSemester = (user) => {
    const semester =
      user.semester ??
      user.sem ??
      user.currentSemester ??
      user.studentProfile?.semester ??
      user.student?.semester;

    return semester === undefined ||
      semester === null ||
      semester === ""
      ? "-"
      : String(semester);
  };

  const getSemesterValue = (user) => {
    const semester =
      user.semester ??
      user.sem ??
      user.currentSemester ??
      user.studentProfile?.semester ??
      user.student?.semester;

    return semester === undefined ||
      semester === null ||
      semester === ""
      ? ""
      : String(semester);
  };

  // =====================================================
  // REGISTER NUMBER
  // =====================================================

  const getRegisterNumber = (user) => {
    return (
      user.registerNumber ||
      user.rollNumber ||
      user.regNo ||
      "-"
    );
  };

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredUsers = useMemo(() => {
    let result = [...users];

    const searchText =
      search.trim().toLowerCase();

    // ---------------------------------------------------
    // SEARCH
    // Name / Register No / Phone / Email
    // ---------------------------------------------------

    if (searchText) {
      result = result.filter((user) => {
        const registerNumber =
          user.registerNumber ||
          user.rollNumber ||
          user.regNo ||
          "";

        const searchableText = [
          user.name,
          registerNumber,
          user.phone,
          user.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          searchText
        );
      });
    }

    // ---------------------------------------------------
    // DEPARTMENT
    // ---------------------------------------------------

    if (departmentFilter !== "ALL") {
      result = result.filter((user) => {
        return (
          user.departmentId?._id ===
            departmentFilter ||
          user.departmentId?.code ===
            departmentFilter
        );
      });
    }

    // ---------------------------------------------------
    // SEMESTER
    // ---------------------------------------------------

    if (semesterFilter !== "ALL") {
      result = result.filter((user) => {
        return (
          getSemesterValue(user) ===
          String(semesterFilter)
        );
      });
    }

    // ---------------------------------------------------
    // ROLE
    // ---------------------------------------------------

    if (roleFilter !== "ALL") {
      result = result.filter(
        (user) =>
          user.role === roleFilter
      );
    }

    // ---------------------------------------------------
    // CLUB
    // ---------------------------------------------------

    if (clubFilter !== "ALL") {
      result = result.filter((user) => {
        return (
          user.clubId?._id === clubFilter ||
          user.clubId?.code === clubFilter
        );
      });
    }

    // ---------------------------------------------------
    // SORT
    // ---------------------------------------------------

    result.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortBy) {
        case "name":
          valueA = a.name || "";
          valueB = b.name || "";
          break;

        case "register":
          valueA = getRegisterNumber(a);
          valueB = getRegisterNumber(b);
          break;

        case "semester":
          valueA = getSemesterValue(a);
          valueB = getSemesterValue(b);
          break;

        case "department":
          valueA =
            a.departmentId?.code || "";
          valueB =
            b.departmentId?.code || "";
          break;

        case "role":
          valueA = a.role || "";
          valueB = b.role || "";
          break;

        case "club":
          valueA =
            a.clubId?.code || "";
          valueB =
            b.clubId?.code || "";
          break;

        default:
          valueA = a.name || "";
          valueB = b.name || "";
      }

      const comparison =
        String(valueA)
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
    users,
    search,
    departmentFilter,
    semesterFilter,
    roleFilter,
    clubFilter,
    sortBy,
    sortOrder,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("ALL");
    setSemesterFilter("ALL");
    setRoleFilter("ALL");
    setClubFilter("ALL");
    setSortBy("name");
    setSortOrder("asc");
  };

  const hasFilters =
    search ||
    departmentFilter !== "ALL" ||
    semesterFilter !== "ALL" ||
    roleFilter !== "ALL" ||
    clubFilter !== "ALL";

  // =====================================================
  // HELPERS
  // =====================================================

  const getInitials = (name) => {
    if (!name) return "?";

    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getDepartment = (user) => {
    if (!user.departmentId) return "-";

    return (
      <div>
        <div className="font-medium text-slate-700">
          {user.departmentId.code || "-"}
        </div>

        {user.departmentId.name && (
          <div className="text-xs text-slate-400">
            {user.departmentId.name}
          </div>
        )}
      </div>
    );
  };

  const getClub = (user) => {
    if (!user.clubId) return "-";

    return (
      <div>
        <div className="font-medium text-slate-700">
          {user.clubId.code || "-"}
        </div>

        {user.clubId.name && (
          <div className="text-xs text-slate-400">
            {user.clubId.name}
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // EXCEL EXPORT
  // =====================================================

  const downloadExcel = () => {
    const excelData =
      filteredUsers.map((user, index) => ({
        "Sl No": index + 1,
        Name: user.name || "",
        "Register No.": getRegisterNumber(user),
        Phone: user.phone || "",
        Email: user.email || "",
        Department: user.departmentId
          ? `${user.departmentId.code || ""}${
              user.departmentId.name
                ? ` - ${user.departmentId.name}`
                : ""
            }`
          : "",
        Semester:
          getSemester(user) === "-"
            ? ""
            : getSemester(user),
        Role: user.role || "",
        Club: user.clubId
          ? `${user.clubId.code || ""}${
              user.clubId.name
                ? ` - ${user.clubId.name}`
                : ""
            }`
          : "",
      }));

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 20 },
      { wch: 16 },
      { wch: 32 },
      { wch: 30 },
      { wch: 12 },
      { wch: 22 },
      { wch: 30 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Users"
    );

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `KPT_Users_${date}.xlsx`
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1800px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-sm">
                👥
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Users
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage students, staff and administrators
                </p>
              </div>

            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/users/new"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span className="text-lg">
              +
            </span>

            Add User
          </button>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* ================================================= */}
        {/* SEARCH + FILTERS */}
        {/* ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          {/* SEARCH */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search Users
            </label>

            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, register number, phone or email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-200"
                >
                  ✕
                </button>
              )}

            </div>

          </div>

          {/* FILTER GRID */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* DEPARTMENT */}

            <FilterSelect
              label="Department"
              value={departmentFilter}
              onChange={
                setDepartmentFilter
              }
              options={departments.map(
                (department) => ({
                  value:
                    department._id ||
                    department.code,
                  label: `${department.code}${
                    department.name
                      ? ` - ${department.name}`
                      : ""
                  }`,
                })
              )}
            />

            {/* SEMESTER */}

            <FilterSelect
              label="Semester"
              value={semesterFilter}
              onChange={
                setSemesterFilter
              }
              options={[
                1, 2, 3, 4, 5, 6,
              ].map((semester) => ({
                value: String(semester),
                label: `Semester ${semester}`,
              }))}
            />

            {/* ROLE */}

            <FilterSelect
              label="Role"
              value={roleFilter}
              onChange={
                setRoleFilter
              }
              options={roles.map(
                (role) => ({
                  value: role,
                  label: role,
                })
              )}
            />

            {/* CLUB */}

            <FilterSelect
              label="Club"
              value={clubFilter}
              onChange={
                setClubFilter
              }
              options={clubs.map(
                (club) => ({
                  value:
                    club._id ||
                    club.code,
                  label: `${club.code}${
                    club.name
                      ? ` - ${club.name}`
                      : ""
                  }`,
                })
              )}
            />

          </div>

          {/* FILTER FOOTER */}

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="text-sm text-slate-500">

              Showing{" "}

              <span className="font-semibold text-slate-800">
                {filteredUsers.length}
              </span>

              {" "}of{" "}

              <span className="font-semibold text-slate-800">
                {users.length}
              </span>

              {" "}users

            </div>

            <div className="flex flex-wrap gap-2">

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
              >
                <option value="name">
                  Sort: Name
                </option>

                <option value="register">
                  Sort: Register No.
                </option>

                <option value="semester">
                  Sort: Semester
                </option>

                <option value="department">
                  Sort: Department
                </option>

                <option value="role">
                  Sort: Role
                </option>

                <option value="club">
                  Sort: Club
                </option>
              </select>

              <button
                type="button"
                onClick={() =>
                  setSortOrder(
                    sortOrder === "asc"
                      ? "desc"
                      : "asc"
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {sortOrder === "asc"
                  ? "↑ Asc"
                  : "↓ Desc"}
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Clear Filters
                </button>
              )}

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                User Directory
              </h2>

              <p className="text-xs text-slate-400">
                {filteredUsers.length} records
              </p>
            </div>

            <button
              type="button"
              onClick={
                downloadExcel
              }
              disabled={
                filteredUsers.length ===
                0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              📊 Export Excel
            </button>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="text-sm text-slate-500">
                  Loading users...
                </p>

              </div>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            filteredUsers.length ===
              0 && (
              <div className="flex min-h-[300px] items-center justify-center px-6">

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                    👥
                  </div>

                  <h3 className="font-semibold text-slate-800">
                    No users found
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Try changing the search or filters.
                  </p>

                  {hasFilters && (
                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  )}

                </div>

              </div>
            )}

          {/* DESKTOP TABLE */}

          {!loading &&
            !error &&
            filteredUsers.length >
              0 && (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1250px] border-collapse">

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        #
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Photo
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Register No.
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Department
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Semester
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Role
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Club
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredUsers.map(
                      (user, index) => (
                        <tr
                          key={user._id}
                          className="border-b border-slate-100 transition hover:bg-blue-50/40"
                        >

                          {/* SL NO */}

                          <td className="px-4 py-4 text-sm text-slate-400">
                            {index + 1}
                          </td>

                          {/* PHOTO */}

                          <td className="px-4 py-4">

                            {user.profilePhoto ? (
                              <img
                                src={
                                  user.profilePhoto
                                }
                                alt={
                                  user.name ||
                                  "User"
                                }
                                className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-white"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                {getInitials(
                                  user.name
                                )}
                              </div>
                            )}

                          </td>

                          {/* NAME */}

                          <td className="px-4 py-4">

                            <div className="font-semibold text-slate-800">
                              {user.name ||
                                "-"}
                            </div>

                          </td>

                          {/* REGISTER */}

                          <td className="px-4 py-4">

                            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                              {getRegisterNumber(
                                user
                              )}
                            </span>

                          </td>

                          {/* PHONE */}

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {user.phone ||
                              "-"}
                          </td>

                          {/* EMAIL */}

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {user.email ||
                              "-"}
                          </td>

                          {/* DEPARTMENT */}

                          <td className="px-4 py-4 text-sm">
                            {getDepartment(
                              user
                            )}
                          </td>

                          {/* SEMESTER */}

                          <td className="px-4 py-4">

                            {getSemester(user) !==
                            "-" ? (
                              <span className="inline-flex rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Sem{" "}
                                {getSemester(
                                  user
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                -
                              </span>
                            )}

                          </td>

                          {/* ROLE */}

                          <td className="px-4 py-4">

                            {user.role ? (
                              <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {user.role}
                              </span>
                            ) : (
                              "-"
                            )}

                          </td>

                          {/* CLUB */}

                          <td className="px-4 py-4 text-sm">
                            {getClub(user)}
                          </td>

                          {/* ACTION */}

                          <td className="px-4 py-4 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  user._id,
                                  user.name
                                )
                              }
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete
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
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      >

        <option value="ALL">
          All {label}s
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}

      </select>

    </div>
  );
}