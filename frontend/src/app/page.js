"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function RegistrationDashboard() {
  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [summary, setSummary] = useState([]);
const [clubSearch, setClubSearch] = useState("");


// =====================================================
// MANUAL STUDENT STRENGTH
// Edit these values whenever required
// =====================================================

const MANUAL_STRENGTH = {
  AT: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 57,
    6: 0,
  },

  CH: {
    1: 63,
    2: 0,
    3: 60,
    4: 0,
    5: 63,
    6: 0,
  },

  CE: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  },

  CS: {
    1: 60,
    2: 58,
    3: 62,
    4: 59,
    5: 55,
    6: 61,
  },

  EE: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  },

  EC: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  },

  ME: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  },

  PO: {
    1: 41,
    2: 0,
    3: 29,
    4: 0,
    5: 31,
    6: 0,
  },


};

  // Filters used only for the Club-wise table
  const [clubTableDepartmentFilter, setClubTableDepartmentFilter] =
    useState("ALL");

  const [clubTableSemesterFilter, setClubTableSemesterFilter] =
    useState("ALL");
  const [semesterTotals, setSemesterTotals] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  });

  const [grandTotal, setGrandTotal] = useState(0);

  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  const [semesterFilter, setSemesterFilter] =
    useState("ALL");

  const [clubFilter, setClubFilter] =
    useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


const getDepartmentStrength = (departmentCode, semester) => {
  const code = String(departmentCode || "")
    .trim()
    .toUpperCase();

  return Number(
    MANUAL_STRENGTH[code]?.[semester] || 0
  );
};

const getDepartmentTotalStrength = (departmentCode) => {
  return (
    getDepartmentStrength(departmentCode, 1) +
    getDepartmentStrength(departmentCode, 3) +
    getDepartmentStrength(departmentCode, 5)
  );
};

  const getClubDepartmentData = (club, department) => {
    const data = club?.departments;

    if (!data) return {};

    // If backend returns departments as an array
    if (Array.isArray(data)) {
      const departmentId = String(department?._id || "").trim();
      const departmentCode = String(
        department?.code || department?.departmentCode || ""
      ).trim().toLowerCase();
      const departmentName = String(
        department?.name || department?.departmentName || ""
      ).trim().toLowerCase();

      return (
        data.find((item) => {
          const itemId = String(
            item?.departmentId || item?._id || item?.department?._id || ""
          ).trim();

          const itemCode = String(
            item?.departmentCode ||
              item?.code ||
              item?.department?.code ||
              ""
          )
            .trim()
            .toLowerCase();

          const itemName = String(
            item?.departmentName ||
              item?.name ||
              item?.department?.name ||
              ""
          )
            .trim()
            .toLowerCase();

          return (
            (departmentId && itemId === departmentId) ||
            (departmentCode && itemCode === departmentCode) ||
            (departmentName && itemName === departmentName)
          );
        }) || {}
      );
    }

    // If backend returns departments as an object
    const possibleKeys = [
      department?._id,
      department?.code,
      department?.departmentCode,
      department?.name,
      department?.departmentName,
    ].filter(Boolean);

    for (const key of possibleKeys) {
      if (data[key] !== undefined) {
        return data[key] || {};
      }
    }

    // Case-insensitive fallback for object keys
    const keys = Object.keys(data);

    const matchingKey = keys.find((key) => {
      const normalizedKey = String(key).trim().toLowerCase();

      return possibleKeys.some(
        (possibleKey) =>
          normalizedKey ===
          String(possibleKey).trim().toLowerCase()
      );
    });

    return matchingKey ? data[matchingKey] || {} : {};
  };

  // -----------------------------------------------------
  // Filter clubs only once.
  // This also fixes the "No club found" message appearing
  // when the search box is empty.
  // -----------------------------------------------------
  const filteredClubs = clubs.filter((club) => {
    const search = clubSearch.toLowerCase().trim();

    // Club name/code search
    if (
      search &&
      !(
        club.name?.toLowerCase().includes(search) ||
        club.code?.toLowerCase().includes(search)
      )
    ) {
      return false;
    }

    // Department filter for club table
    if (clubTableDepartmentFilter !== "ALL") {
      const selectedDepartment = departments.find(
        (department) =>
          String(department._id) ===
          String(clubTableDepartmentFilter)
      );

      if (selectedDepartment) {
        const departmentData = getClubDepartmentData(
          club,
          selectedDepartment
        );

        // When a semester is also selected, check that
        // this department has registration in that semester.
        if (clubTableSemesterFilter !== "ALL") {
          const count =
            departmentData.semesters?.[
              clubTableSemesterFilter
            ] || 0;

          if (Number(count) === 0) return false;
        } else {
          if (Number(departmentData.total || 0) === 0) {
            return false;
          }
        }
      }
    }

    // Semester filter without a department filter
    if (
      clubTableDepartmentFilter === "ALL" &&
      clubTableSemesterFilter !== "ALL"
    ) {
      const hasRegistrationInSemester = departments.some(
        (department) => {
          const departmentData = getClubDepartmentData(
            club,
            department
          );

          return (
            Number(
              departmentData.semesters?.[
                clubTableSemesterFilter
              ] || 0
            ) > 0
          );
        }
      );

      if (!hasRegistrationInSemester) return false;
    }

    return true;
  });

  // =====================================================
  // LOAD REGISTRATION DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/api/admin/registration-summary",
        {
          params: {
            department: departmentFilter,
            semester: semesterFilter,
            club: clubFilter,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load registration data"
        );
      }

      setSummary(
        response.data.departments || []
      );

      setDepartments(
        response.data.availableDepartments || []
      );

      setClubs(
        response.data.availableClubs || []
      );

      setGrandTotal(
        response.data.stats?.grandTotal || 0
      );

      setSemesterTotals(
        response.data.stats?.semesterTotals || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
        }
      );
    } catch (error) {
      console.error(
        "Registration dashboard error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load registration data"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DATA WHEN FILTER CHANGES
  // =====================================================

  useEffect(() => {
    loadData();
  }, [
    departmentFilter,
    semesterFilter,
    clubFilter,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setDepartmentFilter("ALL");
    setSemesterFilter("ALL");
    setClubFilter("ALL");
  };

  return (
    <main className="min-h-screen bg-slate-50">

   {/* =================================================
    HEADER / NAVBAR
================================================= */}

<header className="sticky top-0 z-50 border-b bg-white shadow-sm">

  <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

    <div className="flex items-center justify-between gap-4">

      {/* LOGO / TITLE */}

      <div className="min-w-0">

        <h1 className="text-lg font-bold text-slate-800 sm:text-2xl">
          KPT Club Management
        </h1>

        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
          Student Club Registration
        </p>

      </div>


      {/* RIGHT SIDE */}

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">

        {/* DASHBOARD LABEL */}

        <div className="hidden rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 sm:block">
          Registration Dashboard
        </div>


        {/* SIGN IN */}

        <a
          href="/sign-in"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Sign In
        </a>

      </div>

    </div>

  </div>

</header>

      {/* =================================================
          IMPORTANT REGISTRATION BANNER
      ================================================= */}

      <section className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-lg">
                📝
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-orange-100">
                  Important Notice
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
                  Student Club Registration is Compulsory
                </h2>

                <p className="mt-1 text-sm leading-6 text-orange-50 sm:text-base">
                  All students are required to complete
                  their club registration.
                </p>

              </div>

            </div>

            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-red-600 shadow-lg transition hover:bg-orange-50 sm:shrink-0"
            >
              Register Now →
            </a>

          </div>

        </div>

      </section>


      {/* =================================================
          DASHBOARD CONTENT
      ================================================= */}

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">


        {/* =================================================
            DEPARTMENT TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b px-5 py-5 sm:px-6">

            <h3 className="text-lg font-bold text-slate-800">
              Department-wise Student Registration Details
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Number of confirmed student registrations
              in each department.
            </p>

          </div>


          {loading ? (

            <div className="px-5 py-16 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading registration details...
              </p>

            </div>

          ) : error ? (

            <div className="px-5 py-12 text-center">

              <p className="font-semibold text-red-600">
                {error}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Please refresh the page and try again.
              </p>

            </div>

          ) : summary.length === 0 ? (

            <div className="px-5 py-14 text-center">

              <div className="text-4xl">
                📋
              </div>

              <p className="mt-3 font-semibold text-slate-700">
                No registration data found
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

  <thead className="bg-slate-50">

    <tr className="border-b">

      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
        #
      </th>

      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
        Department
      </th>

      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
        Year 1
      </th>

      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
        Year 2
      </th>

      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
        Year 3
      </th>

      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-indigo-600">
        Total
      </th>

    </tr>

  </thead>


  <tbody>

    {summary.map((department, index) => {

      const code = department.departmentCode;

      // Current odd semester:
      // Year 1 = Sem 1
      // Year 2 = Sem 3
      // Year 3 = Sem 5

      const year1Strength =
        getDepartmentStrength(code, 1);

      const year2Strength =
        getDepartmentStrength(code, 3);

      const year3Strength =
        getDepartmentStrength(code, 5);

      const totalStrength =
        year1Strength +
        year2Strength +
        year3Strength;

      const year1Registered =
        Number(
          department.semesters?.[1] || 0
        );

      const year2Registered =
        Number(
          department.semesters?.[3] || 0
        );

      const year3Registered =
        Number(
          department.semesters?.[5] || 0
        );

      return (

        <tr
          key={department.departmentId}
          className="border-b border-slate-100 hover:bg-slate-50"
        >

          {/* SL NO */}

          <td className="px-5 py-4 text-sm text-slate-500">
            {index + 1}
          </td>


          {/* DEPARTMENT */}

          <td className="px-5 py-4">

            <p className="font-bold text-slate-800">
              {code}
            </p>

            <p className="max-w-[220px] text-xs text-slate-500">
              {department.departmentName}
            </p>

          </td>


          {/* YEAR 1 = SEM 1 */}

          <td className="px-5 py-4 text-center">

            <span
              className={`inline-flex min-w-[80px] justify-center rounded-lg px-3 py-2 text-sm font-bold ${
                year1Registered > 0
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {year1Registered} / {year1Strength}
            </span>

          </td>


          {/* YEAR 2 = SEM 3 */}

          <td className="px-5 py-4 text-center">

            <span
              className={`inline-flex min-w-[80px] justify-center rounded-lg px-3 py-2 text-sm font-bold ${
                year2Registered > 0
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {year2Registered} / {year2Strength}
            </span>

          </td>


          {/* YEAR 3 = SEM 5 */}

          <td className="px-5 py-4 text-center">

            <span
              className={`inline-flex min-w-[80px] justify-center rounded-lg px-3 py-2 text-sm font-bold ${
                year3Registered > 0
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {year3Registered} / {year3Strength}
            </span>

          </td>


          {/* TOTAL */}

          <td className="px-5 py-4 text-center">

            <span className="inline-flex min-w-[90px] justify-center rounded-lg bg-green-50 px-4 py-2 font-extrabold text-green-700">

              {Number(department.total || 0)}
              {" / "}
              {totalStrength}

            </span>

          </td>

        </tr>

      );

    })}


    {/* =================================================
        GRAND TOTAL
    ================================================= */}

    <tr className="bg-indigo-50">

      <td
        colSpan="2"
        className="px-5 py-4 font-extrabold text-indigo-800"
      >
        GRAND TOTAL
      </td>


      {/* YEAR 1 TOTAL */}

      <td className="px-5 py-4 text-center font-extrabold text-indigo-700">

        {Number(semesterTotals?.[1] || 0)}
        {" / "}

        {summary.reduce(
          (total, department) =>
            total +
            getDepartmentStrength(
              department.departmentCode,
              1
            ),
          0
        )}

      </td>


      {/* YEAR 2 TOTAL */}

      <td className="px-5 py-4 text-center font-extrabold text-indigo-700">

        {Number(semesterTotals?.[3] || 0)}
        {" / "}

        {summary.reduce(
          (total, department) =>
            total +
            getDepartmentStrength(
              department.departmentCode,
              3
            ),
          0
        )}

      </td>


      {/* YEAR 3 TOTAL */}

      <td className="px-5 py-4 text-center font-extrabold text-indigo-700">

        {Number(semesterTotals?.[5] || 0)}
        {" / "}

        {summary.reduce(
          (total, department) =>
            total +
            getDepartmentStrength(
              department.departmentCode,
              5
            ),
          0
        )}

      </td>


      {/* GRAND TOTAL */}

      <td className="px-5 py-4 text-center">

        <span className="inline-flex min-w-[100px] justify-center rounded-lg bg-green-100 px-4 py-2 text-lg font-extrabold text-green-700">

          {Number(grandTotal || 0)}
          {" / "}

          {summary.reduce(
            (total, department) =>
              total +
              getDepartmentTotalStrength(
                department.departmentCode
              ),
            0
          )}

        </span>

      </td>

    </tr>

  </tbody>

</table>

            </div>

          )}

        </div>


{/* =================================================
    CLUB-WISE REGISTRATION TABLE
================================================= */}

{/* =================================================
    CLUB-WISE REGISTRATION TABLE
================================================= */}

<div className="mt-7 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

  {/* HEADER + SEARCH */}

  <div className="border-b px-5 py-5 sm:px-6">

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <h3 className="text-lg font-bold text-slate-800">
          Club-wise Student Registration Details
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Club-wise registration count by department and semester.
        </p>

      </div>


      {/* CLUB TABLE FILTERS */}

      <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">

        {/* SEARCH */}

        <div className="relative min-w-0 sm:w-56">

          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search club..."
            value={clubSearch}
            onChange={(e) => setClubSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

        </div>


        {/* DEPARTMENT FILTER */}

        <select
          value={clubTableDepartmentFilter}
          onChange={(e) =>
            setClubTableDepartmentFilter(e.target.value)
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >

          <option value="ALL">
            All Departments
          </option>

          {departments.map((department) => (
            <option
              key={department._id}
              value={department._id}
            >
              {department.code || department.name}
            </option>
          ))}

        </select>


        {/* SEMESTER FILTER */}

        <select
          value={clubTableSemesterFilter}
          onChange={(e) =>
            setClubTableSemesterFilter(e.target.value)
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >

          <option value="ALL">
            All Semesters
          </option>

          {[1, 2, 3, 4, 5, 6].map(
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

      {/* RESET CLUB TABLE FILTERS */}

      {(clubSearch ||
        clubTableDepartmentFilter !== "ALL" ||
        clubTableSemesterFilter !== "ALL") && (

        <button
          type="button"
          onClick={() => {
            setClubSearch("");
            setClubTableDepartmentFilter("ALL");
            setClubTableSemesterFilter("ALL");
          }}
          className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 sm:mt-0"
        >
          Clear club filters
        </button>

      )}

    </div>

  </div>


  {/* TABLE */}

  {loading ? (

    <div className="px-5 py-16 text-center">

      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

      <p className="mt-4 text-sm text-slate-500">
        Loading registration details...
      </p>

    </div>

  ) : (

    <div className="overflow-x-auto">

      <table className="w-full min-w-[750px]">

        <thead>

          <tr className="border-b bg-slate-50">

            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              #
            </th>

            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              Club
            </th>


            {departments
              .filter(
                (department) =>
                  clubTableDepartmentFilter === "ALL" ||
                  String(department._id) ===
                    String(clubTableDepartmentFilter)
              )
              .map((department) => (

                <th
                  key={department._id}
                  className="border-l border-slate-200 px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-indigo-600"
                >
                  {department.code ||
                    department.departmentCode}
                </th>

              ))}


            <th className="border-l border-slate-200 bg-green-50 px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-green-700">
              Total
            </th>

          </tr>

        </thead>


        <tbody>

          {filteredClubs.map((club, index) => (

              <tr
                key={club._id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >

                {/* S.NO */}

                <td className="px-5 py-4 text-sm text-slate-500">
                  {index + 1}
                </td>


                {/* CLUB */}

                <td className="px-5 py-4">

                  <p className="font-bold text-slate-800">
                    {club.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {club.code}
                  </p>

                </td>


                {/* DEPARTMENT COUNTS */}

                {departments
                  .filter(
                    (department) =>
                      clubTableDepartmentFilter === "ALL" ||
                      String(department._id) ===
                        String(clubTableDepartmentFilter)
                  )
                  .map((department) => {

                    const departmentData =
                      getClubDepartmentData(
                        club,
                        department
                      );

                    const count =
                      clubTableSemesterFilter === "ALL"
                        ? departmentData.total || 0
                        : departmentData.semesters?.[
                            clubTableSemesterFilter
                          ] || 0;

                    return (

                      <td
                        key={`${club._id}-${department._id}`}
                        className="border-l border-slate-100 px-5 py-4 text-center"
                      >

                        <span
                          className={`inline-flex min-w-10 justify-center rounded-lg px-3 py-2 text-sm font-bold ${
                            count > 0
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-slate-300"
                          }`}
                        >
                          {count}
                        </span>

                      </td>

                    );

                  })}


                {/* CLUB TOTAL */}

                <td className="border-l border-slate-200 bg-green-50 px-5 py-4 text-center">

                  <span className="inline-flex rounded-lg bg-green-100 px-4 py-2 font-extrabold text-green-700">

                    {departments
                      .filter(
                        (department) =>
                          clubTableDepartmentFilter === "ALL" ||
                          String(department._id) ===
                            String(clubTableDepartmentFilter)
                      )
                      .reduce(
                        (total, department) => {

                          const departmentData =
                            getClubDepartmentData(
                              club,
                              department
                            );

                          const count =
                            clubTableSemesterFilter === "ALL"
                              ? departmentData.total || 0
                              : departmentData.semesters?.[
                                  clubTableSemesterFilter
                                ] || 0;

                          return (
                            total + Number(count)
                          );

                        },
                        0
                      )}

                  </span>

                </td>

              </tr>

            ))}


          {/* NO SEARCH RESULT */}

          {filteredClubs.length === 0 && (

            <tr>

              <td
                colSpan={
                  departments.filter(
                    (department) =>
                      clubTableDepartmentFilter === "ALL" ||
                      String(department._id) ===
                        String(clubTableDepartmentFilter)
                  ).length + 3
                }
                className="px-5 py-12 text-center"
              >

                <div className="text-3xl">
                  🔍
                </div>

                <p className="mt-3 font-semibold text-slate-700">
                  No club found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try searching with another club name or code.
                </p>

              </td>

            </tr>

          )}


          {/* GRAND TOTAL */}

          <tr className="bg-indigo-50">

            <td
              colSpan="2"
              className="px-5 py-4 font-extrabold text-indigo-800"
            >
              GRAND TOTAL
            </td>


            {departments
              .filter(
                (department) =>
                  clubTableDepartmentFilter === "ALL" ||
                  String(department._id) ===
                    String(clubTableDepartmentFilter)
              )
              .map((department) => {

                let total = 0;

                filteredClubs.forEach((club) => {

                  const departmentData =
                    getClubDepartmentData(
                      club,
                      department
                    );

                  const count =
                    clubTableSemesterFilter === "ALL"
                      ? departmentData.total || 0
                      : departmentData.semesters?.[
                          clubTableSemesterFilter
                        ] || 0;

                  total += Number(count);

                });

                return (

                  <td
                    key={`total-${department._id}`}
                    className="border-l border-slate-200 px-5 py-4 text-center font-extrabold text-indigo-700"
                  >
                    {total}
                  </td>

                );

              })}


            <td className="border-l border-slate-200 bg-green-50 px-5 py-4 text-center text-lg font-extrabold text-green-700">
              {filteredClubs.reduce(
                (grand, club) =>
                  grand +
                  departments
                    .filter(
                      (department) =>
                        clubTableDepartmentFilter === "ALL" ||
                        String(department._id) ===
                          String(clubTableDepartmentFilter)
                    )
                    .reduce(
                      (total, department) => {

                        const departmentData =
                          getClubDepartmentData(
                            club,
                            department
                          );

                        const count =
                          clubTableSemesterFilter === "ALL"
                            ? departmentData.total || 0
                            : departmentData.semesters?.[
                                clubTableSemesterFilter
                              ] || 0;

                        return total + Number(count);

                      },
                      0
                    ),
                0
              )}
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  )}

</div>


        {/* =================================================
            REGISTER BUTTON
        ================================================= */}

        <div className="mt-7 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-6 text-center shadow-lg sm:p-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-orange-100">
            Student Registration
          </p>

          <h3 className="mt-2 text-2xl font-extrabold text-white">
            Have you completed club registration?
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-orange-50">
            Club registration is compulsory for all students.
          </p>

          <a
            href="/register"
            className="mt-5 inline-flex rounded-xl bg-white px-7 py-3 text-sm font-extrabold text-red-600 shadow-md transition hover:bg-orange-50"
          >
            Register Now →
          </a>

        </div>

      </div>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t bg-white">

        <div className="mx-auto max-w-7xl px-5 py-6 text-center text-sm text-slate-500">
          KPT Club Management System
        </div>

      </footer>

    </main>
  );
}