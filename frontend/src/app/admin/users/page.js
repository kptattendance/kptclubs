"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FILTER / SEARCH / SORT STATES
  // =====================================================

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [clubFilter, setClubFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
        currentUsers.filter((user) => user._id !== userId)
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
  // UNIQUE FILTER OPTIONS
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

  const userTypes = useMemo(() => {
    return [
      ...new Set(
        users
          .map((user) => user.userType)
          .filter(Boolean)
      ),
    ].sort();
  }, [users]);

  const departments = useMemo(() => {
    return [
      ...new Map(
        users
          .filter((user) => user.departmentId)
          .map((user) => [
            user.departmentId._id || user.departmentId.code,
            user.departmentId,
          ])
      ).values(),
    ].sort((a, b) =>
      `${a.code || ""}`.localeCompare(`${b.code || ""}`)
    );
  }, [users]);

  const clubs = useMemo(() => {
    return [
      ...new Map(
        users
          .filter((user) => user.clubId)
          .map((user) => [
            user.clubId._id || user.clubId.code,
            user.clubId,
          ])
      ).values(),
    ].sort((a, b) =>
      `${a.code || ""}`.localeCompare(`${b.code || ""}`)
    );
  }, [users]);

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredUsers = useMemo(() => {
    let result = [...users];

    const searchText = search.trim().toLowerCase();

    // SEARCH
    if (searchText) {
      result = result.filter((user) => {
        const rollNumber =
          user.rollNumber ||
          user.registerNumber ||
          user.regNo ||
          "";

        const department = user.departmentId
          ? `${user.departmentId.code || ""} ${
              user.departmentId.name || ""
            }`
          : "";

        const club = user.clubId
          ? `${user.clubId.code || ""} ${
              user.clubId.name || ""
            }`
          : "";

        const searchableText = [
          user.name,
          user.email,
          user.phone,
          rollNumber,
          user.role,
          user.userType,
          department,
          club,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchText);
      });
    }

    // ROLE
    if (roleFilter !== "ALL") {
      result = result.filter(
        (user) => user.role === roleFilter
      );
    }

    // USER TYPE
    if (typeFilter !== "ALL") {
      result = result.filter(
        (user) => user.userType === typeFilter
      );
    }

    // DEPARTMENT
    if (departmentFilter !== "ALL") {
      result = result.filter((user) => {
        return (
          user.departmentId?._id === departmentFilter ||
          user.departmentId?.code === departmentFilter
        );
      });
    }

    // CLUB
    if (clubFilter !== "ALL") {
      result = result.filter((user) => {
        return (
          user.clubId?._id === clubFilter ||
          user.clubId?.code === clubFilter
        );
      });
    }

    // STATUS
    if (statusFilter !== "ALL") {
      result = result.filter((user) => {
        if (statusFilter === "ACTIVE") {
          return user.isActive === true;
        }

        if (statusFilter === "INACTIVE") {
          return user.isActive === false;
        }

        return true;
      });
    }

    // SORT
    result.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortBy) {
        case "name":
          valueA = a.name || "";
          valueB = b.name || "";
          break;

        case "rollNumber":
          valueA =
            a.rollNumber ||
            a.registerNumber ||
            a.regNo ||
            "";
          valueB =
            b.rollNumber ||
            b.registerNumber ||
            b.regNo ||
            "";
          break;

        case "email":
          valueA = a.email || "";
          valueB = b.email || "";
          break;

        case "role":
          valueA = a.role || "";
          valueB = b.role || "";
          break;

        case "department":
          valueA = a.departmentId?.code || "";
          valueB = b.departmentId?.code || "";
          break;

        case "club":
          valueA = a.clubId?.code || "";
          valueB = b.clubId?.code || "";
          break;

        case "status":
          valueA = a.isActive ? "Active" : "Inactive";
          valueB = b.isActive ? "Active" : "Inactive";
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
    users,
    search,
    roleFilter,
    typeFilter,
    departmentFilter,
    clubFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setTypeFilter("ALL");
    setDepartmentFilter("ALL");
    setClubFilter("ALL");
    setStatusFilter("ALL");
    setSortBy("name");
    setSortOrder("asc");
  };

  const hasFilters =
    search ||
    roleFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    departmentFilter !== "ALL" ||
    clubFilter !== "ALL" ||
    statusFilter !== "ALL";

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

  const getRollNumber = (user) => {
    return (
      user.rollNumber ||
      user.registerNumber ||
      user.regNo ||
      "-"
    );
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
              router.push("/admin/users/new")
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <span className="text-lg leading-none">
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
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
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
                  setSearch(e.target.value)
                }
                placeholder="Search by name, register number, email, phone, role, department or club..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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

          {/* FILTER GRID */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {/* ROLE */}

            <FilterSelect
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={roles}
            />

            {/* TYPE */}

            <FilterSelect
              label="User Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={userTypes}
            />

            {/* DEPARTMENT */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Department
              </label>

              <select
                value={departmentFilter}
                onChange={(e) =>
                  setDepartmentFilter(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Departments
                </option>

                {departments.map((department) => (
                  <option
                    key={
                      department._id ||
                      department.code
                    }
                    value={
                      department._id ||
                      department.code
                    }
                  >
                    {department.code}
                    {department.name
                      ? ` - ${department.name}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* CLUB */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Club
              </label>

              <select
                value={clubFilter}
                onChange={(e) =>
                  setClubFilter(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Clubs
                </option>

                {clubs.map((club) => (
                  <option
                    key={
                      club._id ||
                      club.code
                    }
                    value={
                      club._id ||
                      club.code
                    }
                  >
                    {club.code}
                    {club.name
                      ? ` - ${club.name}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="name">
                  Name
                </option>

                <option value="rollNumber">
                  Register / Roll No.
                </option>

                <option value="email">
                  Email
                </option>

                <option value="role">
                  Role
                </option>

                <option value="department">
                  Department
                </option>

                <option value="club">
                  Club
                </option>

                <option value="status">
                  Status
                </option>
              </select>
            </div>

          </div>

          {/* FILTER FOOTER */}

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="text-sm text-slate-500">

              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {users.length}
              </span>{" "}
              users

            </div>

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
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                User Directory
              </h2>

              <p className="text-xs text-slate-400">
                Manage registered users and their access
              </p>
            </div>

            <div className="text-xs text-slate-400">
              {filteredUsers.length} records
            </div>

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
            filteredUsers.length === 0 && (
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
                      onClick={clearFilters}
                      className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  )}

                </div>

              </div>
            )}

          {/* TABLE */}

          {!loading &&
            !error &&
            filteredUsers.length > 0 && (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1500px] border-collapse">

                  <thead className="sticky top-0 z-10">

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
                        Register / Roll No.
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Role
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Department
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Club
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
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
                          className="group border-b border-slate-100 transition hover:bg-blue-50/40"
                        >

                          {/* NUMBER */}

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
                                className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 ring-2 ring-white shadow-sm">
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

                            {user.email && (
                              <div className="mt-0.5 text-xs text-slate-400">
                                {user.email}
                              </div>
                            )}

                          </td>

                          {/* ROLL NUMBER */}

                          <td className="px-4 py-4">

                            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                              {getRollNumber(
                                user
                              )}
                            </span>

                          </td>

                          {/* EMAIL */}

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {user.email || "-"}
                          </td>

                          {/* PHONE */}

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {user.phone || "-"}
                          </td>

                          {/* TYPE */}

                          <td className="px-4 py-4">

                            {user.userType ? (
                              <span className="inline-flex rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                                {user.userType}
                              </span>
                            ) : (
                              "-"
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

                          {/* DEPARTMENT */}

                          <td className="px-4 py-4 text-sm">
                            {getDepartment(
                              user
                            )}
                          </td>

                          {/* CLUB */}

                          <td className="px-4 py-4 text-sm">
                            {getClub(user)}
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">

                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                Active

                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">

                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                                Inactive

                              </span>
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="px-4 py-4 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  user._id,
                                  user.name
                                )
                              }
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
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
// FILTER SELECT COMPONENT
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