"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
export default function HODStudentsPage() {
  const { getToken, isLoaded } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [clubFilter, setClubFilter] = useState("ALL");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // INLINE EDIT
  const [editingId, setEditingId] = useState(null);const [editName, setEditName] = useState("");
  const [editRegisterNumber, setEditRegisterNumber] =
    useState("");
  const [editSemester, setEditSemester] =
    useState("");
  const [savingId, setSavingId] = useState(null);

  // DELETE
  const [deletingId, setDeletingId] = useState(null);

  // =====================================================
  // LOAD DEPARTMENT STUDENTS
  // =====================================================

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/hod/department/students",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load students"
        );
      }

      setStudents(response.data.students || []);
    } catch (error) {
      console.error(
        "Load HOD students error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load students"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    loadStudents();
  }, [isLoaded]);

  // =====================================================
  // SEMESTERS
  // =====================================================

  const semesters = [1, 2, 3, 4, 5, 6];

  // =====================================================
  // CLUB LIST
  // =====================================================

  const clubs = useMemo(() => {
    const clubMap = new Map();

    students.forEach((student) => {
      if (student.club?._id) {
        clubMap.set(
          String(student.club._id),
          student.club
        );
      }
    });

    return Array.from(clubMap.values()).sort(
      (a, b) =>
        (a.name || "").localeCompare(
          b.name || ""
        )
    );
  }, [students]);

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (semesterFilter !== "ALL") {
      result = result.filter(
        (student) =>
          String(student.semester) ===
          String(semesterFilter)
      );
    }

    if (clubFilter !== "ALL") {
      if (clubFilter === "NO_CLUB") {
        result = result.filter(
          (student) => !student.club
        );
      } else {
        result = result.filter(
          (student) =>
            String(student.club?._id) ===
            String(clubFilter)
        );
      }
    }

    if (search.trim()) {
      const value =
        search.trim().toLowerCase();

      result = result.filter((student) => {
        return (
          student.name
            ?.toLowerCase()
            .includes(value) ||
          student.registerNumber
            ?.toLowerCase()
            .includes(value) ||
          student.club?.name
            ?.toLowerCase()
            .includes(value) ||
          student.club?.code
            ?.toLowerCase()
            .includes(value)
        );
      });
    }

    result.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortBy) {
        case "name":
          valueA = a.name || "";
          valueB = b.name || "";
          break;

        case "registerNumber":
          valueA = a.registerNumber || "";
          valueB = b.registerNumber || "";
          break;

        case "semester":
          valueA = Number(a.semester || 0);
          valueB = Number(b.semester || 0);
          break;

        case "club":
          valueA = a.club?.name || "";
          valueB = b.club?.name || "";
          break;

        default:
          break;
      }

      if (
        typeof valueA === "number" &&
        typeof valueB === "number"
      ) {
        return sortOrder === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      return sortOrder === "asc"
        ? String(valueA).localeCompare(
            String(valueB)
          )
        : String(valueB).localeCompare(
            String(valueA)
          );
    });

    return result;
  }, [
    students,
    search,
    semesterFilter,
    clubFilter,
    sortBy,
    sortOrder,
  ]);

  // =====================================================
  // START EDIT
  // =====================================================

 const startEdit = (student) => {
  if (!student.club?.code) {
    setError(
      "This student is not assigned to a club."
    );
    return;
  }

  setError("");
  setSuccess("");

  setEditingId(student._id);

  setEditName(student.name || "");

  setEditRegisterNumber(
    student.registerNumber || ""
  );

  setEditSemester(
    student.semester || ""
  );
};

  // =====================================================
  // CANCEL EDIT
  // =====================================================
const cancelEdit = () => {
  setEditingId(null);
  setEditName("");
  setEditRegisterNumber("");
  setEditSemester("");
};

  // =====================================================
  // SAVE INLINE EDIT
  // =====================================================

  const saveEdit = async (student) => {
  if (!student.club?.code) {
    setError(
      "This student is not assigned to a club."
    );
    return;
  }

  const name = editName.trim();

  const registerNumber =
    editRegisterNumber.trim().toUpperCase();

  const semesterNumber =
    Number(editSemester);

  if (!name) {
    setError("Student name is required.");
    return;
  }

  if (!registerNumber) {
    setError("Register number is required.");
    return;
  }

  if (
    !semesterNumber ||
    semesterNumber < 1 ||
    semesterNumber > 6
  ) {
    setError("Please select a valid semester.");
    return;
  }

  try {
    setSavingId(student._id);
    setError("");
    setSuccess("");

    const token = await getToken();

    const response = await api.put(
  `/api/hod/students/${student._id}`,
      {
        name,
        registerNumber,
        semester: semesterNumber,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Failed to update student"
      );
    }

    setStudents((prev) =>
      prev.map((item) =>
        String(item._id) ===
        String(student._id)
          ? {
              ...item,
              name,
              registerNumber,
              semester: semesterNumber,
            }
          : item
      )
    );

    setSuccess(
      `${name} updated successfully.`
    );

    cancelEdit();
  } catch (error) {
    console.error(
      "Update HOD student error:",
      error.response?.data ||
        error.message
    );

    setError(
      error.response?.data?.message ||
        error.message ||
        "Failed to update student"
    );
  } finally {
    setSavingId(null);
  }
};

 // =====================================================
// DELETE STUDENT
// =====================================================

const deleteStudent = async (student) => {
  const result = await Swal.fire({
    title: "Delete Student?",
    html: `
      <div style="font-size:14px;color:#6b7280;">
        Are you sure you want to delete
        <strong style="color:#111827;">
          ${student.name || "this student"}
        </strong>?
        <br />
        <span style="font-size:13px;">
          All related attendance, certificates,
          memberships and account data will also be deleted.
        </span>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    setDeletingId(student._id);
    setError("");
    setSuccess("");

    const token = await getToken();

    const response = await api.delete(
      `/api/hod/students/${student._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Failed to delete student"
      );
    }

    setStudents((prev) =>
      prev.filter(
        (item) =>
          String(item._id) !==
          String(student._id)
      )
    );

    if (
      String(editingId) ===
      String(student._id)
    ) {
      cancelEdit();
    }

    await Swal.fire({
      title: "Deleted!",
      text:
        response.data?.message ||
        "Student deleted successfully.",
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#2563eb",
    });

  } catch (error) {
    console.error(
      "Delete HOD student error:",
      error.response?.data ||
        error.message
    );

    await Swal.fire({
      title: "Delete Failed",
      text:
        error.response?.data?.message ||
        error.message ||
        "Failed to delete student.",
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#dc2626",
    });

  } finally {
    setDeletingId(null);
  }
};
  // =====================================================
  // EXCEL DOWNLOAD
  // =====================================================

  const downloadExcel = () => {
    if (filteredStudents.length === 0) {
      setError(
        "No students available to export."
      );
      return;
    }

    try {
      setError("");

      const excelData =
        filteredStudents.map(
          (student, index) => ({
            "Sl No": index + 1,

            "Student Name":
              student.name?.toUpperCase() || "",

            "Register Number":
              student.registerNumber || "",

            Semester:
              student.semester || "",

            "Club Name":
              student.club?.name || "No Club",

            "Club Code":
              student.club?.code || "",
          })
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          excelData
        );

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 30 },
        { wch: 20 },
        { wch: 12 },
        { wch: 30 },
        { wch: 15 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "HOD Students"
      );

      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      XLSX.writeFile(
        workbook,
        `HOD_Students_${today}.xlsx`
      );
    } catch (error) {
      console.error(
        "Excel download error:",
        error
      );

      setError(
        "Failed to download Excel file."
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-3 text-sm font-medium text-gray-600">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-full bg-gray-50 p-3 sm:p-5">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  🎓
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    Department Students
                  </h1>

                  <p className="mt-0.5 text-sm text-gray-500">
                    Manage students from your department
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={downloadExcel}
                disabled={
                  filteredStudents.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>📊</span>
                Excel
              </button>

              <button
                type="button"
                onClick={loadStudents}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <span>↻</span>
                Refresh
              </button>

            </div>
          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-bold text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* FILTER BAR */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Student List
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Search, filter and manage students
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {filteredStudents.length} Students
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">

            {/* SEARCH */}
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Search
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Name, register number or club"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* SEMESTER */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Semester
              </label>

              <select
                value={semesterFilter}
                onChange={(e) =>
                  setSemesterFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Semesters
                </option>

                {semesters.map(
                  (semester) => (
                    <option
                      key={semester}
                      value={semester}
                    >
                      Semester {semester}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* CLUB */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Club
              </label>

              <select
                value={clubFilter}
                onChange={(e) =>
                  setClubFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Clubs
                </option>

                <option value="NO_CLUB">
                  No Club
                </option>

                {clubs.map((club) => (
                  <option
                    key={club._id}
                    value={club._id}
                  >
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SORT */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Sort By
              </label>

              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="name">
                    Name
                  </option>

                  <option value="registerNumber">
                    Register No.
                  </option>

                  <option value="semester">
                    Semester
                  </option>

                  <option value="club">
                    Club
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    setSortOrder(
                      (prev) =>
                        prev === "asc"
                          ? "desc"
                          : "asc"
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 text-lg text-gray-700 transition hover:bg-gray-50"
                  title="Change sort order"
                >
                  {sortOrder === "asc"
                    ? "↑"
                    : "↓"}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* TABLE HEADER INFO */}
          <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {filteredStudents.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-900">
                {students.length}
              </span>{" "}
              students
            </p>

            <button
              type="button"
              onClick={downloadExcel}
              disabled={
                filteredStudents.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
            >
              📊 Download Excel
            </button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                👨‍🎓
              </div>

              <p className="mt-4 text-sm font-bold text-gray-700">
                No students found
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Try changing the search or filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-sm">

                {/* HEADER */}
                <thead className="border-b border-gray-200 bg-gray-50">

                  <tr>

                    <th className="w-16 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                      S.No.
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Register No.
                    </th>

                    <th className="w-28 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                      Semester
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Club
                    </th>

                    <th className="w-44 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                {/* BODY */}
                <tbody className="divide-y divide-gray-100">

                  {filteredStudents.map(
                    (student, index) => {
                      const isEditing =
                        String(editingId) ===
                        String(student._id);

                      const isSaving =
                        String(savingId) ===
                        String(student._id);

                      const isDeleting =
                        String(deletingId) ===
                        String(student._id);

                      return (
                        <tr
                          key={student._id}
                          className={`transition ${
                            isEditing
                              ? "bg-blue-50/60"
                              : "hover:bg-gray-50"
                          }`}
                        >

                          {/* S.NO */}
                          <td className="px-4 py-4 text-center font-medium text-gray-500">
                            {index + 1}
                          </td>

                     {/* STUDENT */}
<td className="px-4 py-4">
  <div className="flex items-center gap-3">

    {student.profilePhoto ? (
      <img
        src={student.profilePhoto}
        alt={student.name || "Student"}
        className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover"
      />
    ) : (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
        {student.name
          ?.charAt(0)
          ?.toUpperCase() || "S"}
      </div>
    )}

    <div className="min-w-0">
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) =>
            setEditName(e.target.value)
          }
          className="w-full min-w-[220px] rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none ring-2 ring-blue-100 focus:border-blue-500 focus:ring-blue-200"
          placeholder="Student name"
        />
      ) : (
        <>
          <p className="font-bold text-gray-900">
            {student.name?.toUpperCase() || "-"}
          </p>

          {student.email && (
            <p className="mt-0.5 max-w-[230px] truncate text-xs text-gray-500">
              {student.email}
            </p>
          )}
        </>
      )}
    </div>

  </div>
</td>

                          {/* REGISTER NUMBER */}
                          <td className="px-4 py-4">

                            {isEditing ? (
                              <input
                                type="text"
                                value={
                                  editRegisterNumber
                                }
                                onChange={(e) =>
                                  setEditRegisterNumber(
                                    e.target.value
                                  )
                                }
                                autoFocus
                                className="w-full max-w-[180px] rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold uppercase text-gray-800 outline-none ring-2 ring-blue-100 focus:border-blue-500 focus:ring-blue-200"
                              />
                            ) : (
                              <span className="font-semibold text-gray-700">
                                {student.registerNumber ||
                                  "-"}
                              </span>
                            )}

                          </td>

                          {/* SEMESTER */}
                          <td className="px-4 py-4 text-center">

                            {isEditing ? (
                              <select
                                value={
                                  editSemester
                                }
                                onChange={(e) =>
                                  setEditSemester(
                                    e.target.value
                                  )
                                }
                                className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none ring-2 ring-blue-100 focus:border-blue-500"
                              >
                                {semesters.map(
                                  (semester) => (
                                    <option
                                      key={
                                        semester
                                      }
                                      value={
                                        semester
                                      }
                                    >
                                      {semester}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : (
                              <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                {student.semester ||
                                  "-"}
                              </span>
                            )}

                          </td>

                          {/* CLUB */}
                          <td className="px-4 py-4">

                            {student.club ? (
                              <div>
                                <p className="font-semibold text-gray-700">
                                  {
                                    student.club
                                      .name
                                  }
                                </p>

                                {student.club
                                  .code && (
                                  <p className="mt-0.5 text-xs font-medium uppercase text-gray-400">
                                    {
                                      student.club
                                        .code
                                    }
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                No Club
                              </span>
                            )}

                          </td>

                          {/* ACTIONS */}
                          <td className="px-4 py-4">

                            {isEditing ? (
                              <div className="flex items-center justify-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    saveEdit(
                                      student
                                    )
                                  }
                                  disabled={isSaving}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isSaving
                                    ? "Saving..."
                                    : "Save"}
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    cancelEdit
                                  }
                                  disabled={isSaving}
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                                >
                                  Cancel
                                </button>

                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    startEdit(
                                      student
                                    )
                                  }
                                  disabled={
                                    !student.club ||
                                    isDeleting
                                  }
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteStudent(
                                      student
                                    )
                                  }
                                  disabled={
                                    !student.club ||
                                    isDeleting
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isDeleting
                                    ? "Deleting..."
                                    : "🗑 Delete"}
                                </button>

                              </div>
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
    </div>
  );
}