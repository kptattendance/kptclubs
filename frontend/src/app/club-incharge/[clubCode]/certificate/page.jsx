"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import * as XLSX from "xlsx";

export default function ClubInchargeCertificatePage() {
  const { getToken, isLoaded } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [approving, setApproving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // FILTER STATES
  // =====================================================

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  useEffect(() => {
    if (!isLoaded) return;

    loadStudents();
  }, [isLoaded]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/certificates/club/students",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents(response.data.students || []);
      setSelectedStudents([]);
    } catch (error) {
      console.error("Load certificate students error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load certificate students"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DEPARTMENT OPTIONS
  // =====================================================

  const departmentOptions = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.department)
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  // =====================================================
  // SEMESTER OPTIONS
  // =====================================================

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
    ].sort((a, b) => Number(a) - Number(b));
  }, [students]);

  // =====================================================
  // FILTER STUDENTS
  // =====================================================

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.registerNumber
          ?.toLowerCase()
          .includes(query) ||
        student.email?.toLowerCase().includes(query);

      const matchesDepartment =
        departmentFilter === "ALL" ||
        student.department === departmentFilter;

      const matchesSemester =
        semesterFilter === "ALL" ||
        String(student.semester) === String(semesterFilter);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSemester
      );
    });
  }, [
    students,
    search,
    departmentFilter,
    semesterFilter,
  ]);

  // =====================================================
  // SELECTABLE STUDENTS
  // =====================================================

  const selectableStudents = useMemo(() => {
    return filteredStudents.filter(
      (student) =>
        student.certificateId &&
        student.certificateStatus !== "APPROVED" &&
        student.certificateStatus !== "ISSUED"
    );
  }, [filteredStudents]);

  // =====================================================
  // SELECT ALL CHECKBOX STATE
  // =====================================================

  const allSelectableSelected =
    selectableStudents.length > 0 &&
    selectableStudents.every((student) =>
      selectedStudents.includes(student.certificateId)
    );

  const someSelected = selectedStudents.length > 0;

  // =====================================================
  // TOGGLE SINGLE STUDENT
  // =====================================================

  const toggleStudent = (certificateId) => {
    if (!certificateId) return;

    setSelectedStudents((current) => {
      if (current.includes(certificateId)) {
        return current.filter((id) => id !== certificateId);
      }

      return [...current, certificateId];
    });
  };

  // =====================================================
  // SELECT / DESELECT ALL
  // =====================================================

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedStudents((current) =>
        current.filter(
          (id) =>
            !selectableStudents.some(
              (student) => student.certificateId === id
            )
        )
      );

      return;
    }

    const idsToAdd = selectableStudents.map(
      (student) => student.certificateId
    );

    setSelectedStudents((current) => [
      ...new Set([...current, ...idsToAdd]),
    ]);
  };

  // =====================================================
  // SINGLE ALLOW CERTIFICATE
  // =====================================================

  const approveCertificate = async (certificateId) => {
    if (!certificateId) return;

    const confirmed = window.confirm(
      "Are you sure you want to allow this student to generate the certificate?"
    );

    if (!confirmed) return;

    try {
      setApprovingId(certificateId);
      setError("");
      setMessage("");

      const token = await getToken();

      await api.put(
        `/api/certificates/${certificateId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.certificateId === certificateId
            ? {
                ...student,
                certificateStatus: "APPROVED",
                approvedAt: new Date().toISOString(),
              }
            : student
        )
      );

      setSelectedStudents((current) =>
        current.filter((id) => id !== certificateId)
      );

      setMessage(
        "Certificate permission granted successfully."
      );
    } catch (error) {
      console.error("Approve certificate error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to allow certificate"
      );
    } finally {
      setApprovingId(null);
    }
  };

  // =====================================================
  // BULK ALLOW CERTIFICATE
  // =====================================================

  const approveSelectedCertificates = async () => {
    if (selectedStudents.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to allow certificate generation for ${selectedStudents.length} selected student${
        selectedStudents.length > 1 ? "s" : ""
      }?`
    );

    if (!confirmed) return;

    try {
      setApproving(true);
      setError("");
      setMessage("");

      const token = await getToken();

      let successCount = 0;
      let failedCount = 0;

      // Process one by one using the existing API
      for (const certificateId of selectedStudents) {
        try {
          await api.put(
            `/api/certificates/${certificateId}/approve`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          successCount++;
        } catch (error) {
          console.error(
            `Failed to approve certificate ${certificateId}:`,
            error
          );

          failedCount++;
        }
      }

      // Update UI
      const approvedIds = selectedStudents.filter(
        (certificateId) => {
          // We determine successful IDs below from the updated response
          return true;
        }
      );

      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          selectedStudents.includes(student.certificateId)
            ? {
                ...student,
                certificateStatus: "APPROVED",
                approvedAt: new Date().toISOString(),
              }
            : student
        )
      );

      setSelectedStudents([]);

      if (failedCount === 0) {
        setMessage(
          `${successCount} certificate${
            successCount > 1 ? "s" : ""
          } approved successfully.`
        );
      } else {
        setMessage(
          `${successCount} certificate${
            successCount > 1 ? "s" : ""
          } approved. ${failedCount} failed.`
        );
      }
    } catch (error) {
      console.error(
        "Bulk certificate approval error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to approve selected certificates"
      );
    } finally {
      setApproving(false);
    }
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("ALL");
    setSemesterFilter("ALL");
    setSelectedStudents([]);
  };

  // =====================================================
// EXCEL DOWNLOAD
// =====================================================

const downloadExcel = () => {
  try {
    if (filteredStudents.length === 0) {
      setError("No students available to export.");
      return;
    }

    setError("");
    setMessage("");

    const excelData = filteredStudents.map(
      (student, index) => ({
        "Sl No": index + 1,
        "Student Name": student.name?.toUpperCase() || "",
        "Register Number":
          student.registerNumber || "",
        Email: student.email || "",
        Department:
          student.department || "",
        Semester:
          student.semester || "",
        "Attendance Classes":
          `${student.attendedClasses || 0} / ${
            student.totalClasses || 0
          }`,
        "Attendance Percentage":
          `${Number(
            student.attendancePercentage || 0
          )}%`,
        "Certificate Status":
          student.certificateStatus === "APPROVED" ||
          student.certificateStatus === "ISSUED"
            ? "Approved"
            : student.certificateId
            ? "Pending"
            : "Not Available",
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 20 },
      { wch: 32 },
      { wch: 25 },
      { wch: 12 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Certificate Students"
    );

    const date = new Date()
      .toISOString()
      .split("T")[0];

    XLSX.writeFile(
      workbook,
      `Certificate_Students_${date}.xlsx`
    );

    setMessage(
      `${filteredStudents.length} student${
        filteredStudents.length > 1 ? "s" : ""
      } exported to Excel successfully.`
    );

    setTimeout(() => {
      setMessage("");
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
  // =====================================================
  // COUNTS
  // =====================================================

  const approvedCount = students.filter(
    (student) =>
      student.certificateStatus === "APPROVED" ||
      student.certificateStatus === "ISSUED"
  ).length;

  const pendingCount = students.filter(
    (student) =>
      student.certificateId &&
      student.certificateStatus !== "APPROVED" &&
      student.certificateStatus !== "ISSUED"
  ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-sm font-medium text-gray-500">
            Loading certificate details...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="px-4 py-5 sm:px-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl sm:h-12 sm:w-12 sm:text-2xl">
                  📜
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Certificate Management
                  </h1>

                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Review club members and allow certificate generation.
                  </p>
                </div>

              </div>

              {/* COUNTS */}

              <div className="flex flex-wrap gap-2">

                <div className="rounded-xl bg-gray-50 px-4 py-2.5 ring-1 ring-gray-200">
                  <p className="text-[10px] font-medium text-gray-500">
                    Members
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {students.length}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 px-4 py-2.5 ring-1 ring-amber-100">
                  <p className="text-[10px] font-medium text-amber-600">
                    Pending
                  </p>
                  <p className="text-lg font-bold text-amber-700">
                    {pendingCount}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 px-4 py-2.5 ring-1 ring-green-100">
                  <p className="text-[10px] font-medium text-green-600">
                    Approved
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    {approvedCount}
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>⚠️</span>

            <p>{error}</p>
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {message && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>✓</span>

            <p>{message}</p>
          </div>
        )}

        {/* =================================================
            NO STUDENTS
        ================================================= */}

        {students.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
              👥
            </div>

            <p className="mt-4 font-semibold text-gray-800">
              No confirmed club members found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Students will appear here once they are confirmed.
            </p>

          </div>

        ) : (

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* =================================================
                SECTION HEADER
            ================================================= */}

            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                    Club Members
                  </h2>

                  <p className="text-xs text-gray-500">
                    Select multiple students to allow certificate generation.
                  </p>
                </div>

                {/* BULK ACTION */}

               {/* ACTION BUTTONS */}

<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

  {/* EXCEL DOWNLOAD */}

  <button
    type="button"
    onClick={downloadExcel}
    disabled={filteredStudents.length === 0}
    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
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
      <path d="M8 13l2 3-2 3" />
      <path d="M12 13l2 3-2 3" />
    </svg>

    Download Excel
  </button>

  {/* ALLOW CERTIFICATE */}

  <button
    type="button"
    onClick={approveSelectedCertificates}
    disabled={
      selectedStudents.length === 0 ||
      approving
    }
    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
  >
    {approving ? (
      <>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        Approving...
      </>
    ) : (
      <>
        ✓ Allow Certificate
        {selectedStudents.length > 0 &&
          ` (${selectedStudents.length})`}
      </>
    )}
  </button>

</div>

              </div>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {/* SEARCH */}

                <div className="sm:col-span-2 lg:col-span-2">

                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Search Student
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      🔍
                    </span>

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      placeholder="Name, register number or email"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                </div>

                {/* DEPARTMENT */}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Department
                  </label>

                  <select
                    value={departmentFilter}
                    onChange={(e) =>
                      setDepartmentFilter(e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Semester
                  </label>

                  <select
                    value={semesterFilter}
                    onChange={(e) =>
                      setSemesterFilter(e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              </div>

              {/* RESULT COUNT + CLEAR */}

              <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">

                <p>
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

                {(search ||
                  departmentFilter !== "ALL" ||
                  semesterFilter !== "ALL") && (

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-fit font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear Filters
                  </button>

                )}

              </div>

            </div>

            {/* =================================================
                NO FILTER RESULTS
            ================================================= */}

            {filteredStudents.length === 0 ? (

              <div className="px-5 py-12 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  🔍
                </div>

                <p className="mt-4 font-semibold text-gray-800">
                  No students found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  No students match the selected filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Clear Filters
                </button>

              </div>

            ) : (

              <>

                {/* =================================================
                    DESKTOP TABLE
                ================================================= */}

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full min-w-[1100px] text-sm">

                    <thead className="bg-gray-50">

                      <tr className="border-b border-gray-200">

                        {/* SELECT ALL */}

                        <th className="w-14 px-3 py-4 text-center">

                          <input
                            type="checkbox"
                            checked={allSelectableSelected}
                            onChange={toggleSelectAll}
                            disabled={
                              selectableStudents.length === 0
                            }
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                          />

                        </th>

                        <th className="w-16 px-3 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          #
                        </th>

                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Student
                        </th>

                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Register No.
                        </th>

                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Department
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          Sem
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          Attendance
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                          Certificate
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {filteredStudents.map(
                        (student, index) => {

                          const isApproved =
                            student.certificateStatus ===
                              "APPROVED" ||
                            student.certificateStatus ===
                              "ISSUED";

                          const canSelect =
                            Boolean(
                              student.certificateId
                            ) && !isApproved;

                          const isSelected =
                            selectedStudents.includes(
                              student.certificateId
                            );

                          const attendancePercentage =
                            Number(
                              student.attendancePercentage ||
                                0
                            );

                          return (
                            <tr
                              key={student.studentId}
                              className={`group transition ${
                                isSelected
                                  ? "bg-blue-50"
                                  : "hover:bg-blue-50/40"
                              }`}
                            >

                              {/* CHECKBOX */}

                              <td className="px-3 py-4 text-center">

                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={!canSelect || approving}
                                  onChange={() =>
                                    toggleStudent(
                                      student.certificateId
                                    )
                                  }
                                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                                />

                              </td>

                              {/* S.NO */}

                              <td className="px-3 py-4 text-center">

                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                                  {index + 1}
                                </span>

                              </td>

                              {/* STUDENT */}

                              <td className="px-4 py-4">

                                <div className="flex items-center gap-3">

                                  {student.profilePhoto ? (

                                    <img
                                      src={student.profilePhoto}
                                      alt=""
                                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                                    />

                                  ) : (

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 ring-1 ring-blue-100">
                                      {student.name
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                        "S"}
                                    </div>

                                  )}

                                  <div className="min-w-0">

                                    <p className="font-semibold text-gray-900">
                                      {student.name?.toUpperCase() || "-"}
                                    </p>

                                    <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500">
                                      {student.email || "-"}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              {/* REGISTER NUMBER */}

                              <td className="px-4 py-4">

                                <span className="rounded-md bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                                  {student.registerNumber ||
                                    "-"}
                                </span>

                              </td>

                              {/* DEPARTMENT */}

                              <td className="px-4 py-4">

                                <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
                                  {student.department ||
                                    "-"}
                                </span>

                              </td>

                              {/* SEMESTER */}

                              <td className="px-4 py-4 text-center">

                                <span className="inline-flex min-w-8 justify-center rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700">
                                  {student.semester || "-"}
                                </span>

                              </td>

                              {/* ATTENDANCE */}

                              <td className="px-4 py-4 text-center">

                                <div className="flex flex-col items-center">

                                  <span className="font-bold text-gray-800">
                                    {student.attendedClasses ||
                                      0}
                                    {" / "}
                                    {student.totalClasses ||
                                      0}
                                  </span>

                                  <span
                                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                      attendancePercentage >=
                                      75
                                        ? "bg-green-50 text-green-700"
                                        : attendancePercentage >=
                                          60
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {attendancePercentage}%
                                  </span>

                                </div>

                              </td>

                              {/* CERTIFICATE */}

                              <td className="px-4 py-4 text-center">

                                {isApproved ? (

                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 ring-1 ring-green-100">
                                    ✓ Approved
                                  </span>

                                ) : student.certificateId ? (

                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                                    Pending
                                  </span>

                                ) : (

                                  <span className="inline-flex rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-400">
                                    Not Available
                                  </span>

                                )}

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                {/* =================================================
                    MOBILE CARDS
                ================================================= */}

                <div className="divide-y divide-gray-100 md:hidden">

                  {/* MOBILE SELECT ALL */}

                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3">

                    <label className="flex cursor-pointer items-center gap-2">

                      <input
                        type="checkbox"
                        checked={allSelectableSelected}
                        onChange={toggleSelectAll}
                        disabled={
                          selectableStudents.length === 0 ||
                          approving
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      <span className="text-sm font-semibold text-gray-700">
                        Select All
                      </span>

                    </label>

                    <span className="text-xs font-medium text-gray-500">
                      {selectedStudents.length} selected
                    </span>

                  </div>

                  {filteredStudents.map(
                    (student, index) => {

                      const isApproved =
                        student.certificateStatus ===
                          "APPROVED" ||
                        student.certificateStatus ===
                          "ISSUED";

                      const canSelect =
                        Boolean(
                          student.certificateId
                        ) && !isApproved;

                      const isSelected =
                        selectedStudents.includes(
                          student.certificateId
                        );

                      const attendancePercentage =
                        Number(
                          student.attendancePercentage ||
                            0
                        );

                      return (
                        <div
                          key={student.studentId}
                          className={`p-4 ${
                            isSelected
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >

                          {/* TOP */}

                          <div className="flex items-start gap-3">

                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={
                                !canSelect || approving
                              }
                              onChange={() =>
                                toggleStudent(
                                  student.certificateId
                                )
                              }
                              className="mt-2 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                            />

                            {student.profilePhoto ? (

                              <img
                                src={student.profilePhoto}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                              />

                            ) : (

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                                {student.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "S"}
                              </div>

                            )}

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-bold text-gray-900">
                                    {student.name?.toUpperCase() || "-"}
                                  </p>

                                  <p className="mt-0.5 truncate text-xs text-gray-500">
                                    {student.email || "-"}
                                  </p>

                                </div>

                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">
                                  #{index + 1}
                                </span>

                              </div>

                            </div>

                          </div>

                          {/* DETAILS */}

                          <div className="mt-4 grid grid-cols-2 gap-2">

                            <MobileInfo
                              label="Register No."
                              value={
                                student.registerNumber ||
                                "-"
                              }
                            />

                            <MobileInfo
                              label="Department"
                              value={
                                student.department ||
                                "-"
                              }
                            />

                            <MobileInfo
                              label="Semester"
                              value={
                                student.semester ||
                                "-"
                              }
                            />

                            <MobileInfo
                              label="Attendance"
                              value={`${student.attendedClasses || 0} / ${student.totalClasses || 0}`}
                            />

                          </div>

                          {/* ATTENDANCE */}

                          <div className="mt-2">

                            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">

                              <span className="text-xs font-medium text-gray-500">
                                Attendance Percentage
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  attendancePercentage >=
                                  75
                                    ? "bg-green-50 text-green-700"
                                    : attendancePercentage >=
                                      60
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {attendancePercentage}%
                              </span>

                            </div>

                          </div>

                          {/* STATUS */}

                          <div className="mt-3">

                            {isApproved ? (

                              <div className="flex w-full items-center justify-center rounded-lg bg-green-50 px-3 py-2.5 text-xs font-bold text-green-700 ring-1 ring-green-100">
                                ✓ Certificate Approved
                              </div>

                            ) : student.certificateId ? (

                              <div className="flex w-full items-center justify-center rounded-lg bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700">
                                Select student to allow certificate
                              </div>

                            ) : (

                              <div className="flex w-full items-center justify-center rounded-lg bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-400">
                                Certificate Not Available
                              </div>

                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </>

            )}

          </div>

        )}

        {/* =================================================
            MOBILE BOTTOM BULK ACTION
        ================================================= */}

        {selectedStudents.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">

            <div className="mx-auto flex max-w-7xl items-center gap-3">

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">
                  {selectedStudents.length} selected
                </p>

                <p className="truncate text-xs text-gray-500">
                  Ready to allow certificate generation
                </p>
              </div>

              <button
                type="button"
                onClick={approveSelectedCertificates}
                disabled={approving}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {approving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Processing
                  </>
                ) : (
                  "✓ Allow"
                )}
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// =====================================================
// MOBILE INFO
// =====================================================

function MobileInfo({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-gray-50 p-2.5 ring-1 ring-gray-100">

      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs font-semibold text-gray-700">
        {value}
      </p>

    </div>
  );
}