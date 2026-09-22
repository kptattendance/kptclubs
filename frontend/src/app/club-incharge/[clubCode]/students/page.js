"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import * as XLSX from "xlsx";

export default function ClubStudentsPage() {
  const { clubCode } = useParams();
  const { getToken, isLoaded } = useAuth();

  const [students, setStudents] = useState([]);
  const [club, setClub] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");

  // ==================================================
  // DELETE / SELECTION STATES
  // ==================================================

  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ==================================================
  // LOAD STUDENTS
  // ==================================================

  useEffect(() => {
    if (!isLoaded || !clubCode) return;

    loadStudents();
  }, [isLoaded, clubCode]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        `/api/club-incharge/${clubCode}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents(response.data.students || []);
      setClub(response.data.club || null);
      setSelectedStudents([]);
    } catch (error) {
      console.error(
        "Club students error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load students"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // SEARCH + FILTER + SORT
  // ==================================================

  const departmentOptions = useMemo(() => {
    return [
      ...new Set(
        students
          .map(
            (student) =>
              student.department?.name
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  const semesterOptions = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.semester)
          .filter(
            (semester) =>
              semester !== undefined &&
              semester !== null &&
              semester !== ""
          )
      ),
    ].sort(
      (a, b) => Number(a) - Number(b)
    );
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = [...students];

    const searchText =
      search.trim().toLowerCase();

    // SEARCH
    if (searchText) {
      result = result.filter((student) => {
        const name =
          student.name?.toLowerCase() || "";

        const registerNumber =
          student.registerNumber?.toLowerCase() ||
          "";

        const department =
          student.department?.name?.toLowerCase() ||
          "";

        const departmentCode =
          student.department?.code?.toLowerCase() ||
          "";

        const email =
          student.email?.toLowerCase() || "";

        return (
          name.includes(searchText) ||
          registerNumber.includes(searchText) ||
          department.includes(searchText) ||
          departmentCode.includes(searchText) ||
          email.includes(searchText)
        );
      });
    }

    // DEPARTMENT FILTER
    if (departmentFilter !== "ALL") {
      result = result.filter(
        (student) =>
          student.department?.name ===
          departmentFilter
      );
    }

    // SEMESTER FILTER
    if (semesterFilter !== "ALL") {
      result = result.filter(
        (student) =>
          String(student.semester) ===
          String(semesterFilter)
      );
    }

    // SORT
    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(
          b.name || ""
        );
      }

      if (sortBy === "registerNumber") {
        return (
          a.registerNumber || ""
        ).localeCompare(
          b.registerNumber || ""
        );
      }

      if (sortBy === "department") {
        return (
          a.department?.name || ""
        ).localeCompare(
          b.department?.name || ""
        );
      }

      if (sortBy === "semester") {
        return (
          Number(a.semester || 0) -
          Number(b.semester || 0)
        );
      }

      return 0;
    });

    return result;
  }, [
    students,
    search,
    sortBy,
    departmentFilter,
    semesterFilter,
  ]);

  // ==================================================
  // EXCEL DOWNLOAD
  // ==================================================

  const downloadExcel = () => {
    if (filteredStudents.length === 0) {
      setError("No students available to export.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const excelData = filteredStudents.map(
        (student, index) => ({
          "Sl No": index + 1,
          "Student Name": student.name?.toUpperCase() || "",
          "Register Number":
            student.registerNumber || "",
          Email: student.email || "",
          Department:
            student.department?.name || "",
          "Department Code":
            student.department?.code || "",
          Semester: student.semester || "",
        })
      );

      const worksheet =
        XLSX.utils.json_to_sheet(excelData);

      // Column widths
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 28 },
        { wch: 20 },
        { wch: 32 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Students"
      );

      const clubName =
        club?.name ||
        clubCode?.toUpperCase() ||
        "Club";

      const safeClubName = clubName
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const date = new Date()
        .toISOString()
        .split("T")[0];

      XLSX.writeFile(
        workbook,
        `${safeClubName}_Students_${date}.xlsx`
      );

      setSuccess(
        `${filteredStudents.length} student${
          filteredStudents.length > 1 ? "s" : ""
        } exported to Excel successfully.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
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

  // ==================================================
  // SELECTION HELPERS
  // ==================================================

  const filteredStudentIds = filteredStudents.map(
    (student) => student.id
  );

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedStudents.includes(student.id)
    );

  const someSelected =
    selectedStudents.length > 0;

  // ==================================================
  // TOGGLE SINGLE STUDENT
  // ==================================================

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((current) => {
      if (current.includes(studentId)) {
        return current.filter(
          (id) => id !== studentId
        );
      }

      return [...current, studentId];
    });
  };

  // ==================================================
  // SELECT / DESELECT ALL FILTERED
  // ==================================================

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedStudents((current) =>
        current.filter(
          (id) =>
            !filteredStudentIds.includes(id)
        )
      );
    } else {
      setSelectedStudents((current) => [
        ...new Set([
          ...current,
          ...filteredStudentIds,
        ]),
      ]);
    }
  };

  // ==================================================
  // SINGLE DELETE
  // ==================================================

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setDeletingId(studentToDelete.id);
      setError("");
      setSuccess("");

      const token = await getToken();

      const response = await api.delete(
        `/api/club-incharge/${clubCode}/students/${studentToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setStudents((current) =>
          current.filter(
            (student) =>
              student.id !==
              studentToDelete.id
          )
        );

        setSelectedStudents((current) =>
          current.filter(
            (id) =>
              id !== studentToDelete.id
          )
        );

        setSuccess(
          response.data.message ||
            "Student deleted successfully"
        );

        setStudentToDelete(null);

        setTimeout(() => {
          setSuccess("");
        }, 4000);
      }
    } catch (error) {
      console.error(
        "Delete student error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete student"
      );

      setStudentToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  // ==================================================
  // MULTIPLE DELETE
  // ==================================================

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      return;
    }

    const selectedCount =
      selectedStudents.length;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCount} selected student${
        selectedCount > 1 ? "s" : ""
      }?\n\nThis action will permanently remove the selected student data.`
    );

    if (!confirmed) return;

    try {
      setBulkDeleting(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      let successCount = 0;
      let failedCount = 0;

      for (const studentId of selectedStudents) {
        try {
          const response = await api.delete(
            `/api/club-incharge/${clubCode}/students/${studentId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data?.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(
            `Failed to delete student ${studentId}:`,
            error.response?.data ||
              error.message
          );

          failedCount++;
        }
      }

      if (successCount > 0) {
        setStudents((current) =>
          current.filter(
            (student) =>
              !selectedStudents.includes(
                student.id
              )
          )
        );
      }

      setSelectedStudents([]);

      if (failedCount === 0) {
        setSuccess(
          `${successCount} student${
            successCount > 1 ? "s" : ""
          } deleted successfully.`
        );
      } else {
        setSuccess(
          `${successCount} student${
            successCount > 1 ? "s" : ""
          } deleted successfully. ${failedCount} failed.`
        );
      }

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error) {
      console.error(
        "Bulk delete error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete selected students"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  // ==================================================
  // CLEAR FILTERS
  // ==================================================

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("ALL");
    setSemesterFilter("ALL");
    setSortBy("name");
    setSelectedStudents([]);
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-gray-500">

          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

          Loading students...

        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error && students.length === 0) {
    return (
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100 sm:p-8">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">

          <svg
            className="h-6 w-6 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.84 21h16.32a2 2 0 001.73-3.14l-8.18-14a2 2 0 00-3.42 0z"
            />
          </svg>

        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Unable to load students
        </h2>

        <p className="mt-2 break-words text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={loadStudents}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>

      </div>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <>
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden">

        {/* ==============================================
            HEADER
        ============================================== */}

        <div className="mb-5 sm:mb-7">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">

              <div className="mb-2 flex items-center gap-2">

                <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />

                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Club Members
                </span>

              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Students
              </h1>

              <p className="mt-1 break-words text-sm text-gray-500">
                {club?.name ||
                  `${clubCode?.toUpperCase()} Club`}{" "}
                members
              </p>

            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              {/* SELECTED COUNT / DELETE */}

              {someSelected && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 sm:min-w-[220px]">

                  <div>

                    <p className="text-xs font-medium text-red-500">
                      Selected
                    </p>

                    <p className="text-lg font-bold text-red-700">
                      {selectedStudents.length}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {bulkDeleting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <TrashIcon />
                        Delete Selected
                      </>
                    )}

                  </button>

                </div>
              )}

              {/* EXCEL DOWNLOAD */}

              <button
                type="button"
                onClick={downloadExcel}
                disabled={filteredStudents.length === 0}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <ExcelIcon />

                <span>
                  Download Excel
                </span>

              </button>

              {/* TOTAL */}

              <div className="w-full rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100 sm:w-auto">

                <p className="text-xs font-medium text-gray-400">
                  Total Students
                </p>

                <p className="mt-0.5 text-xl font-bold text-gray-900">
                  {students.length}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ==============================================
            SUCCESS MESSAGE
        ============================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">

              <svg
                className="h-4 w-4 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>

            </div>

            <p className="break-words text-sm font-medium text-emerald-700">
              {success}
            </p>

          </div>
        )}

        {/* ==============================================
            ERROR MESSAGE
        ============================================== */}

        {error && students.length > 0 && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">

            <div className="flex min-w-0 items-start gap-3">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">

                <svg
                  className="h-4 w-4 text-red-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

              </div>

              <p className="break-words text-sm font-medium text-red-700">
                {error}
              </p>

            </div>

            <button
              onClick={() => setError("")}
              className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>

          </div>
        )}

        {/* ==============================================
            SEARCH + FILTER + SORT
        ============================================== */}

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80 sm:p-5">

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

            {/* SEARCH */}

            <div className="relative sm:col-span-2 lg:col-span-2">

              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Search
              </label>

              <div className="relative">

                <svg
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path
                    strokeLinecap="round"
                    d="m20 20-4-4"
                  />
                </svg>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Name, register number or department"
                  className="w-full rounded-xl bg-white py-3 pl-10 pr-4 text-sm text-gray-800 outline-none ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* DEPARTMENT */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Department
              </label>

              <select
                value={departmentFilter}
                onChange={(e) =>
                  setDepartmentFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-white px-3 py-3 text-sm text-gray-700 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
              >

                <option value="ALL">
                  All Departments
                </option>

                {departmentOptions.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* SEMESTER */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Semester
              </label>

              <select
                value={semesterFilter}
                onChange={(e) =>
                  setSemesterFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-white px-3 py-3 text-sm text-gray-700 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
              >

                <option value="ALL">
                  All Semesters
                </option>

                {semesterOptions.map(
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

            {/* SORT */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="w-full rounded-xl bg-white px-3 py-3 text-sm text-gray-700 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
              >

                <option value="name">
                  Name
                </option>

                <option value="registerNumber">
                  Register Number
                </option>

                <option value="department">
                  Department
                </option>

                <option value="semester">
                  Semester
                </option>

              </select>

            </div>

          </div>

          {/* FILTER FOOTER */}

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-800">
                {filteredStudents.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-800">
                {students.length}
              </span>{" "}
              students
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">

              {/* SELECT ALL */}

              {filteredStudents.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  disabled={bulkDeleting}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  {allFilteredSelected
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}

              {/* DELETE SELECTED */}

              {someSelected && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >

                  <TrashIcon />

                  {bulkDeleting
                    ? "Deleting..."
                    : `Delete Selected (${selectedStudents.length})`}

                </button>
              )}

              {/* EXCEL */}

              <button
                type="button"
                onClick={downloadExcel}
                disabled={
                  filteredStudents.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ExcelIcon />
                Download Excel
              </button>

              {/* CLEAR FILTERS */}

              {(search ||
                departmentFilter !== "ALL" ||
                semesterFilter !== "ALL" ||
                sortBy !== "name") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}

            </div>

          </div>

        </div>

        {/* ==============================================
            STUDENT TABLE / MOBILE LIST
        ============================================== */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80">

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[1000px]">

              <thead>

                <tr className="border-b border-gray-100 bg-gray-50/80 text-left">

                  {/* SELECT ALL */}

                  <th className="w-14 px-3 py-4 text-center">

                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      disabled={
                        filteredStudents.length === 0 ||
                        bulkDeleting
                      }
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    />

                  </th>

                  <th className="w-16 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    #
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Student
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Register Number
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Semester
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredStudents.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="px-6 py-14 text-center"
                    >

                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">

                        <svg
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <circle
                            cx="11"
                            cy="11"
                            r="7"
                          />

                          <path
                            strokeLinecap="round"
                            d="m20 20-4-4"
                          />
                        </svg>

                      </div>

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No students found
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Try changing your search or filters.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredStudents.map(
                    (student, index) => {

                      const isSelected =
                        selectedStudents.includes(
                          student.id
                        );

                      return (
                        <tr
                          key={student.id}
                          className={`transition ${
                            isSelected
                              ? "bg-red-50/60"
                              : "hover:bg-gray-50/70"
                          }`}
                        >

                          {/* CHECKBOX */}

                          <td className="px-3 py-4 text-center">

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleStudentSelection(
                                  student.id
                                )
                              }
                              disabled={
                                deletingId ===
                                  student.id ||
                                bulkDeleting
                              }
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            />

                          </td>

                          {/* S.NO */}

                          <td className="px-4 py-4 text-center">

                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                              {index + 1}
                            </span>

                          </td>

                          {/* STUDENT */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <StudentPhoto
                                student={student}
                              />

                              <div className="min-w-0">

                                <p className="break-words font-semibold text-gray-900">
                                  {student.name?.toUpperCase()}
                                </p>

                                <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                                  {student.email}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* REGISTER NUMBER */}

                          <td className="px-6 py-4">

                            <span className="rounded-md bg-gray-50 px-2.5 py-1 text-sm font-medium text-gray-700">
                              {student.registerNumber}
                            </span>

                          </td>

                          {/* DEPARTMENT */}

                          <td className="px-6 py-4">

                            <div className="min-w-0">

                              <p className="break-words text-sm font-medium text-gray-800">
                                {student.department?.name ||
                                  "—"}
                              </p>

                              {student.department?.code && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {student.department.code}
                                </p>
                              )}

                            </div>

                          </td>

                          {/* SEMESTER */}

                          <td className="px-6 py-4">

                            <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-semibold text-blue-700">
                              Sem {student.semester || "—"}
                            </span>

                          </td>

                          {/* DELETE */}

                          <td className="px-6 py-4 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                setStudentToDelete(
                                  student
                                )
                              }
                              disabled={
                                deletingId ===
                                  student.id ||
                                bulkDeleting
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <TrashIcon />
                              Delete
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              MOBILE
          ================================================= */}

          <div className="divide-y divide-gray-100 md:hidden">

            {/* MOBILE SELECT ALL */}

            {filteredStudents.length > 0 && (
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">

                <label className="flex cursor-pointer items-center gap-2">

                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    disabled={bulkDeleting}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />

                  <span className="text-sm font-semibold text-gray-700">
                    {allFilteredSelected
                      ? "Deselect All"
                      : "Select All"}
                  </span>

                </label>

                {someSelected && (
                  <span className="text-xs font-bold text-red-600">
                    {selectedStudents.length} selected
                  </span>
                )}

              </div>
            )}

            {filteredStudents.length === 0 ? (

              <div className="px-5 py-14 text-center sm:px-6">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">

                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />

                    <path
                      strokeLinecap="round"
                      d="m20 20-4-4"
                    />
                  </svg>

                </div>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No students found
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Try changing your search or filters.
                </p>

              </div>

            ) : (

              filteredStudents.map(
                (student, index) => {

                  const isSelected =
                    selectedStudents.includes(
                      student.id
                    );

                  return (
                    <div
                      key={student.id}
                      className={`p-4 sm:p-5 ${
                        isSelected
                          ? "bg-red-50/60"
                          : ""
                      }`}
                    >

                      {/* STUDENT HEADER */}

                      <div className="flex items-start gap-3">

                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleStudentSelection(
                              student.id
                            )
                          }
                          disabled={bulkDeleting}
                          className="mt-2 h-4 w-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                          #{index + 1}
                        </span>

                        <StudentPhoto
                          student={student}
                        />

                        <div className="min-w-0 flex-1">

                          <p className="break-words font-semibold text-gray-900">
                            {student.name?.toUpperCase()}
                          </p>

                          <p className="mt-0.5 break-all text-xs text-gray-500">
                            {student.email}
                          </p>

                          <p className="mt-1 break-words text-sm font-medium text-gray-700">
                            {student.registerNumber}
                          </p>

                        </div>

                        {/* DELETE ICON */}

                        <button
                          type="button"
                          onClick={() =>
                            setStudentToDelete(
                              student
                            )
                          }
                          disabled={
                            deletingId ===
                              student.id ||
                            bulkDeleting
                          }
                          aria-label={`Delete ${student.name}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <TrashIcon />
                        </button>

                      </div>

                      {/* DETAILS */}

                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 sm:gap-4">

                        <div className="min-w-0">

                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            Department
                          </p>

                          <p className="mt-1 break-words text-sm font-medium text-gray-700">
                            {student.department?.code ||
                              student.department?.name ||
                              "—"}
                          </p>

                        </div>

                        <div className="min-w-0">

                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            Semester
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-700">
                            {student.semester || "—"}
                          </p>

                        </div>

                      </div>

                      {/* DELETE BUTTON */}

                      <button
                        type="button"
                        onClick={() =>
                          setStudentToDelete(
                            student
                          )
                        }
                        disabled={
                          deletingId ===
                            student.id ||
                          bulkDeleting
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <TrashIcon />
                        Delete Student
                      </button>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

      </div>

      {/* ==================================================
          MOBILE BULK DELETE BAR
      ================================================== */}

      {selectedStudents.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">

          <div className="mx-auto flex max-w-7xl items-center gap-3">

            <div className="min-w-0 flex-1">

              <p className="text-sm font-bold text-gray-900">
                {selectedStudents.length} selected
              </p>

              <p className="truncate text-xs text-gray-500">
                Ready to delete
              </p>

            </div>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >

              {bulkDeleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Deleting
                </>
              ) : (
                <>
                  <TrashIcon />
                  Delete
                </>
              )}

            </button>

          </div>

        </div>
      )}

      {/* ==================================================
          SINGLE DELETE CONFIRMATION MODAL
      ================================================== */}

      {studentToDelete && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/40 px-3 py-4 backdrop-blur-sm sm:px-4"
          onClick={() => {
            if (deletingId === null) {
              setStudentToDelete(null);
            }
          }}
        >

          <div
            className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">

              <div className="flex items-start gap-3 sm:gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 sm:h-11 sm:w-11">
                  <TrashIcon large />
                </div>

                <div className="min-w-0">

                  <h2 className="text-lg font-semibold text-gray-900">
                    Delete Student?
                  </h2>

                  <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                    This action permanently removes the
                    student account and all related data.
                  </p>

                </div>

              </div>

            </div>

            {/* STUDENT */}

            <div className="px-4 py-4 sm:px-6 sm:py-5">

              <div className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 p-3">

                <StudentPhoto
                  student={studentToDelete}
                />

                <div className="min-w-0">

                  <p className="break-words text-sm font-semibold text-gray-900">
                    {studentToDelete.name}
                  </p>

                  <p className="mt-0.5 break-words text-xs text-gray-500">
                    {studentToDelete.registerNumber}
                  </p>

                </div>

              </div>

              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 sm:p-4">

                <p className="text-xs font-semibold text-red-700">
                  The following will be deleted:
                </p>

                <p className="mt-2 break-words text-xs leading-5 text-red-600">
                  Student profile, club memberships,
                  attendance records, certificates,
                  MongoDB account, Clerk account and
                  profile photo.
                </p>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-4 py-4 sm:flex-row sm:gap-3 sm:px-6">

              <button
                type="button"
                onClick={() =>
                  setStudentToDelete(null)
                }
                disabled={deletingId !== null}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={deletingId !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {deletingId !== null ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon />
                    Delete Student
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

// =====================================================
// TRASH ICON
// =====================================================

function TrashIcon({ large = false }) {
  return (
    <svg
      className={
        large
          ? "h-5 w-5"
          : "h-4 w-4"
      }
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

// =====================================================
// EXCEL ICON
// =====================================================

function ExcelIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="m8 13 2 3-2 3" />
      <path d="m12 13 2 3-2 3" />
    </svg>
  );
}

// =====================================================
// STUDENT PHOTO
// =====================================================

function StudentPhoto({ student }) {
  if (student.photoUrl) {
    return (
      <img
        src={student.photoUrl}
        alt={student.name || "Student"}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
      {student.name
        ?.charAt(0)
        ?.toUpperCase() || "S"}
    </div>
  );
}