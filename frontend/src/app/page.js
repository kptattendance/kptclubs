"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

/* =========================================================
   COLLEGE IMAGES
========================================================= */

const LOGO_LEFT = "/logo.jpg";
const LOGO_CENTER = "/logo3.png";
const LOGO_RIGHT = "/logo2.png";
const COLLEGE_PHOTO = "/kpt-bg.jpg";

/* =========================================================
   MANUAL STUDENT STRENGTH
========================================================= */

const MANUAL_STRENGTH = {
  AT: {
    1: 64,
    2: 64,
    3: 55,
    4: 55,
    5: 57,
    6: 57,
  },

  CE: {
    1: 63,
    2: 63,
    3: 55,
    4: 55,
    5: 43,
    6: 43,
  },

  CH: {
    1: 63,
    2: 63,
    3: 61,
    4: 61,
    5: 63,
    6: 63,
  },

  CS: {
    1: 62,
    2: 62,
    3: 54,
    4: 54,
    5: 64,
    6: 64,
  },

  EC: {
    1: 63,
    2: 63,
    3: 62,
    4: 62,
    5: 68,
    6: 68,
  },

  EE: {
    1: 63,
    2: 63,
    3: 58,
    4: 58,
    5: 61,
    6: 61,
  },

  ME: {
    1: 63,
    2: 63,
    3: 57,
    4: 57,
    5: 60,
    6: 60,
  },

  PO: {
    1: 42,
    2: 42,
    3: 29,
    4: 29,
    5: 31,
    6: 31,
  },
};

/* =========================================================
   HIDE SCIENCE DEPARTMENT
========================================================= */

const isScienceDepartment = (department) => {
  const code = String(
    department?.code ||
      department?.departmentCode ||
      ""
  )
    .trim()
    .toLowerCase();

  const name = String(
    department?.name ||
      department?.departmentName ||
      ""
  )
    .trim()
    .toLowerCase();

  return (
    code === "sc" ||
    code === "science" ||
    name === "science" ||
    name === "science department"
  );
};

export default function RegistrationDashboard() {
  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [summary, setSummary] = useState([]);

  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  const [semesterFilter, setSemesterFilter] =
    useState("ALL");

  const [clubFilter, setClubFilter] =
    useState("ALL");

  const [clubSearch, setClubSearch] = useState("");

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     VISIBLE DEPARTMENTS
  ========================================================= */

  const visibleDepartments = useMemo(() => {
    return departments.filter(
      (department) =>
        !isScienceDepartment(department)
    );
  }, [departments]);

  const visibleSummary = useMemo(() => {
    return summary.filter(
      (department) =>
        !isScienceDepartment(department)
    );
  }, [summary]);

  /* =========================================================
     STRENGTH
  ========================================================= */

  const getDepartmentStrength = (
    departmentCode,
    semester
  ) => {
    const code = String(departmentCode || "")
      .trim()
      .toUpperCase();

    return Number(
      MANUAL_STRENGTH[code]?.[semester] || 0
    );
  };

  const getDepartmentTotalStrength = (
    departmentCode
  ) => {
    return (
      getDepartmentStrength(departmentCode, 1) +
      getDepartmentStrength(departmentCode, 3) +
      getDepartmentStrength(departmentCode, 5)
    );
  };

  /* =========================================================
     CLUB DEPARTMENT DATA
  ========================================================= */

  const getClubDepartmentData = (
    club,
    department
  ) => {
    const data = club?.departments;

    if (!data) return {};

    if (Array.isArray(data)) {
      const departmentId = String(
        department?._id || ""
      ).trim();

      const departmentCode = String(
        department?.code ||
          department?.departmentCode ||
          ""
      )
        .trim()
        .toLowerCase();

      const departmentName = String(
        department?.name ||
          department?.departmentName ||
          ""
      )
        .trim()
        .toLowerCase();

      return (
        data.find((item) => {
          const itemId = String(
            item?.departmentId ||
              item?._id ||
              item?.department?._id ||
              ""
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
            (departmentId &&
              itemId === departmentId) ||
            (departmentCode &&
              itemCode === departmentCode) ||
            (departmentName &&
              itemName === departmentName)
          );
        }) || {}
      );
    }

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

    const keys = Object.keys(data);

    const matchingKey = keys.find((key) => {
      const normalizedKey = String(key)
        .trim()
        .toLowerCase();

      return possibleKeys.some(
        (possibleKey) =>
          normalizedKey ===
          String(possibleKey)
            .trim()
            .toLowerCase()
      );
    });

    return matchingKey
      ? data[matchingKey] || {}
      : {};
  };

  /* =========================================================
     FILTER CLUBS
  ========================================================= */

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const search = clubSearch
        .toLowerCase()
        .trim();

      if (
        search &&
        !(
          club.name
            ?.toLowerCase()
            .includes(search) ||
          club.code
            ?.toLowerCase()
            .includes(search)
        )
      ) {
        return false;
      }

      if (
        clubTableDepartmentFilter !== "ALL"
      ) {
        const selectedDepartment =
          visibleDepartments.find(
            (department) =>
              String(department._id) ===
              String(
                clubTableDepartmentFilter
              )
          );

        if (selectedDepartment) {
          const departmentData =
            getClubDepartmentData(
              club,
              selectedDepartment
            );

          if (
            clubTableSemesterFilter !== "ALL"
          ) {
            const count =
              departmentData.semesters?.[
                clubTableSemesterFilter
              ] || 0;

            if (Number(count) === 0) {
              return false;
            }
          } else if (
            Number(
              departmentData.total || 0
            ) === 0
          ) {
            return false;
          }
        }
      }

      if (
        clubTableDepartmentFilter === "ALL" &&
        clubTableSemesterFilter !== "ALL"
      ) {
        const hasRegistration =
          visibleDepartments.some(
            (department) => {
              const data =
                getClubDepartmentData(
                  club,
                  department
                );

              return (
                Number(
                  data.semesters?.[
                    clubTableSemesterFilter
                  ] || 0
                ) > 0
              );
            }
          );

        if (!hasRegistration) {
          return false;
        }
      }

      return true;
    });
  }, [
    clubs,
    clubSearch,
    clubTableDepartmentFilter,
    clubTableSemesterFilter,
    visibleDepartments,
  ]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

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

  useEffect(() => {
    loadData();
  }, [
    departmentFilter,
    semesterFilter,
    clubFilter,
  ]);

  /* =========================================================
     TOTALS
  ========================================================= */

  const year1Strength =
    visibleSummary.reduce(
      (total, department) =>
        total +
        getDepartmentStrength(
          department.departmentCode,
          1
        ),
      0
    );

  const year2Strength =
    visibleSummary.reduce(
      (total, department) =>
        total +
        getDepartmentStrength(
          department.departmentCode,
          3
        ),
      0
    );

  const year3Strength =
    visibleSummary.reduce(
      (total, department) =>
        total +
        getDepartmentStrength(
          department.departmentCode,
          5
        ),
      0
    );

  const totalStrength =
    year1Strength +
    year2Strength +
    year3Strength;

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearMainFilters = () => {
    setDepartmentFilter("ALL");
    setSemesterFilter("ALL");
    setClubFilter("ALL");
  };

  const clearClubFilters = () => {
    setClubSearch("");
    setClubTableDepartmentFilter("ALL");
    setClubTableSemesterFilter("ALL");
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb]">

      {/* =====================================================
          SIMPLE HEADER
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white shadow-sm">

        <div className="mx-auto max-w-7xl px-3 sm:px-6">

          <div className="relative flex min-h-[82px] items-center justify-between">

            {/* LEFT LOGO */}

            <div className="flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
              <img
                src={LOGO_LEFT}
                alt="College Logo"
                className="h-full w-full object-contain"
              />
            </div>

            {/* CENTER LOGO */}

            <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-16 sm:w-16">
              <img
                src={LOGO_CENTER}
                alt="College Logo"
                className="h-full w-full object-contain"
              />
            </div>

            {/* RIGHT */}

            <div className="ml-auto flex items-center gap-2">

              <img
                src={LOGO_RIGHT}
                alt="College Logo"
                className="hidden h-14 w-14 object-contain sm:block"
              />

              <a
                href="/sign-in"
                className="rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:px-5 sm:text-sm"
              >
                Sign In
              </a>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          ORANGE NOTICE
      ===================================================== */}

      <section className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-400">

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3 sm:items-center sm:gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-md">
                📝
              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-100 sm:text-xs">
                  Important Notice
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
                  Student Club Registration is Compulsory
                </h2>

                <p className="mt-1 text-xs text-orange-50 sm:text-sm">
                  All students are required to complete
                  their club registration.
                </p>

              </div>

            </div>

            <a
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-red-600 shadow-lg transition hover:bg-orange-50 sm:w-auto"
            >
              Register Now →
            </a>

          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">

        {/* PAGE TITLE */}

        <div className="mb-5">

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            Registration Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Student club registration details
          </p>

        </div>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-sm font-bold text-slate-800">
              Filters
            </h2>

            {(departmentFilter !== "ALL" ||
              semesterFilter !== "ALL" ||
              clubFilter !== "ALL") && (
              <button
                type="button"
                onClick={clearMainFilters}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Clear Filters
              </button>
            )}

          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            <select
              value={departmentFilter}
              onChange={(e) =>
                setDepartmentFilter(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >

              <option value="ALL">
                All Departments
              </option>

              {visibleDepartments.map(
                (department) => (
                  <option
                    key={department._id}
                    value={department._id}
                  >
                    {department.code ||
                      department.name}
                  </option>
                )
              )}

            </select>

            <select
              value={semesterFilter}
              onChange={(e) =>
                setSemesterFilter(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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

            <select
              value={clubFilter}
              onChange={(e) =>
                setClubFilter(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >

              <option value="ALL">
                All Clubs
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

        </section>

        {/* ===================================================
            COLLEGE PHOTO + DEPARTMENT TABLE
        =================================================== */}

        <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">

          {/* COLLEGE PHOTO */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="h-48 sm:h-56 lg:h-full lg:min-h-[390px]">

              <img
                src={COLLEGE_PHOTO}
                alt="Karnataka Government Polytechnic Mangaluru"
                className="h-full w-full object-cover"
              />

            </div>

          </div>

          {/* DEPARTMENT TABLE */}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-4">

              <h2 className="text-lg font-extrabold text-slate-800">
                Department-wise Registration
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Registered students compared with department
                strength.
              </p>

            </div>

            {loading ? (

              <Loading />

            ) : error ? (

              <ErrorState
                error={error}
                onRetry={loadData}
              />

            ) : visibleSummary.length === 0 ? (

              <EmptyState />

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[720px]">

                  <thead>

                    <tr className="border-b bg-slate-50">

                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        #
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Department
                      </th>

                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Year 1
                        <span className="block text-[9px] normal-case text-slate-300">
                          Sem 1
                        </span>
                      </th>

                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Year 2
                        <span className="block text-[9px] normal-case text-slate-300">
                          Sem 3
                        </span>
                      </th>

                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Year 3
                        <span className="block text-[9px] normal-case text-slate-300">
                          Sem 5
                        </span>
                      </th>

                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        Total
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {visibleSummary.map(
                      (department, index) => {

                        const code =
                          department.departmentCode;

                        const strength1 =
                          getDepartmentStrength(
                            code,
                            1
                          );

                        const strength2 =
                          getDepartmentStrength(
                            code,
                            3
                          );

                        const strength3 =
                          getDepartmentStrength(
                            code,
                            5
                          );

                        const registered1 =
                          Number(
                            department.semesters?.[
                              1
                            ] || 0
                          );

                        const registered2 =
                          Number(
                            department.semesters?.[
                              3
                            ] || 0
                          );

                        const registered3 =
                          Number(
                            department.semesters?.[
                              5
                            ] || 0
                          );

                        return (
                          <tr
                            key={
                              department.departmentId
                            }
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >

                            <td className="px-4 py-3 text-sm text-slate-400">
                              {index + 1}
                            </td>

                            <td className="px-4 py-3">

                              <div className="flex items-center gap-2">

                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[10px] font-extrabold text-indigo-600">
                                  {code}
                                </span>

                                <span className="font-bold text-slate-700">
                                  {
                                    department.departmentName
                                  }
                                </span>

                              </div>

                            </td>

                            <RegistrationCell
                              registered={
                                registered1
                              }
                              strength={
                                strength1
                              }
                            />

                            <RegistrationCell
                              registered={
                                registered2
                              }
                              strength={
                                strength2
                              }
                            />

                            <RegistrationCell
                              registered={
                                registered3
                              }
                              strength={
                                strength3
                              }
                            />

                            <td className="px-4 py-3 text-center">

                              <span className="inline-flex min-w-[80px] justify-center rounded-lg bg-emerald-50 px-2.5 py-2 text-sm font-extrabold text-emerald-700">
                                {
                                  Number(
                                    department.total ||
                                      0
                                  )
                                }{" "}
                                /{" "}
                                {getDepartmentTotalStrength(
                                  code
                                )}
                              </span>

                            </td>

                          </tr>
                        );
                      }
                    )}

                    {/* GRAND TOTAL */}

                    <tr className="bg-indigo-50">

                      <td
                        colSpan="2"
                        className="px-4 py-3 text-sm font-extrabold text-indigo-800"
                      >
                        Grand Total
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-extrabold text-indigo-700">
                        {
                          Number(
                            semesterTotals?.[1] ||
                              0
                          )
                        }{" "}
                        / {year1Strength}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-extrabold text-indigo-700">
                        {
                          Number(
                            semesterTotals?.[3] ||
                              0
                          )
                        }{" "}
                        / {year2Strength}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-extrabold text-indigo-700">
                        {
                          Number(
                            semesterTotals?.[5] ||
                              0
                          )
                        }{" "}
                        / {year3Strength}
                      </td>

                      <td className="px-4 py-3 text-center">

                        <span className="inline-flex min-w-[82px] justify-center rounded-lg bg-emerald-100 px-2.5 py-2 text-sm font-extrabold text-emerald-700">
                          {grandTotal} /{" "}
                          {totalStrength}
                        </span>

                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </section>

        {/* ===================================================
            CLUB-WISE TABLE
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4">

            <div className="flex flex-col gap-4">

              <div>

                <h2 className="text-lg font-extrabold text-slate-800">
                  Club-wise Registration
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Registration count by club and department.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

                <input
                  type="text"
                  placeholder="Search club..."
                  value={clubSearch}
                  onChange={(e) =>
                    setClubSearch(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />

                <select
                  value={
                    clubTableDepartmentFilter
                  }
                  onChange={(e) =>
                    setClubTableDepartmentFilter(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                >

                  <option value="ALL">
                    All Departments
                  </option>

                  {visibleDepartments.map(
                    (department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.code ||
                          department.name}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={
                    clubTableSemesterFilter
                  }
                  onChange={(e) =>
                    setClubTableSemesterFilter(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
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

              {(clubSearch ||
                clubTableDepartmentFilter !==
                  "ALL" ||
                clubTableSemesterFilter !==
                  "ALL") && (
                <button
                  type="button"
                  onClick={clearClubFilters}
                  className="self-start text-xs font-bold text-indigo-600"
                >
                  Clear club filters
                </button>
              )}

            </div>

          </div>

          {loading ? (

            <Loading />

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px]">

                <thead>

                  <tr className="border-b bg-slate-50">

                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      #
                    </th>

                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Club
                    </th>

                    {visibleDepartments
                      .filter(
                        (department) =>
                          clubTableDepartmentFilter ===
                            "ALL" ||
                          String(
                            department._id
                          ) ===
                            String(
                              clubTableDepartmentFilter
                            )
                      )
                      .map((department) => (
                        <th
                          key={department._id}
                          className="border-l border-slate-100 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-indigo-500"
                        >
                          {department.code ||
                            department.departmentCode}
                        </th>
                      ))}

                    <th className="border-l border-slate-100 bg-emerald-50 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredClubs.map(
                    (club, index) => (
                      <tr
                        key={club._id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-4 py-3 text-sm text-slate-400">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3">

                          <p className="font-bold text-slate-700">
                            {club.name}
                          </p>

                          <p className="text-[11px] text-slate-400">
                            {club.code}
                          </p>

                        </td>

                        {visibleDepartments
                          .filter(
                            (department) =>
                              clubTableDepartmentFilter ===
                                "ALL" ||
                              String(
                                department._id
                              ) ===
                                String(
                                  clubTableDepartmentFilter
                                )
                          )
                          .map((department) => {

                            const data =
                              getClubDepartmentData(
                                club,
                                department
                              );

                            const count =
                              clubTableSemesterFilter ===
                              "ALL"
                                ? data.total || 0
                                : data.semesters?.[
                                    clubTableSemesterFilter
                                  ] || 0;

                            return (
                              <td
                                key={`${club._id}-${department._id}`}
                                className="border-l border-slate-100 px-4 py-3 text-center"
                              >

                                {Number(count) >
                                0 ? (
                                  <span className="inline-flex min-w-9 justify-center rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">
                                    {count}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">
                                    —
                                  </span>
                                )}

                              </td>
                            );
                          })}

                        <td className="border-l border-slate-100 bg-emerald-50 px-4 py-3 text-center">

                          <span className="font-extrabold text-emerald-700">

                            {visibleDepartments
                              .filter(
                                (department) =>
                                  clubTableDepartmentFilter ===
                                    "ALL" ||
                                  String(
                                    department._id
                                  ) ===
                                    String(
                                      clubTableDepartmentFilter
                                    )
                              )
                              .reduce(
                                (
                                  total,
                                  department
                                ) => {

                                  const data =
                                    getClubDepartmentData(
                                      club,
                                      department
                                    );

                                  const count =
                                    clubTableSemesterFilter ===
                                    "ALL"
                                      ? data.total ||
                                        0
                                      : data.semesters?.[
                                          clubTableSemesterFilter
                                        ] || 0;

                                  return (
                                    total +
                                    Number(count)
                                  );
                                },
                                0
                              )}

                          </span>

                        </td>

                      </tr>
                    )
                  )}

                  {filteredClubs.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          visibleDepartments.filter(
                            (department) =>
                              clubTableDepartmentFilter ===
                                "ALL" ||
                              String(
                                department._id
                              ) ===
                                String(
                                  clubTableDepartmentFilter
                                )
                          ).length + 3
                        }
                        className="px-5 py-12 text-center"
                      >

                        <p className="text-sm font-bold text-slate-700">
                          No clubs found
                        </p>

                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-200 bg-white py-5">

        <p className="text-center text-xs text-slate-400">
          Karnataka Government Polytechnic, Mangaluru
        </p>

      </footer>

    </main>
  );
}

/* =========================================================
   REGISTRATION CELL
========================================================= */

function RegistrationCell({
  registered,
  strength,
}) {
  const percentage =
    strength > 0
      ? Math.min(
          100,
          Math.round(
            (registered / strength) * 100
          )
        )
      : 0;

  return (
    <td className="px-4 py-3 text-center">

      <span
        className={`inline-flex min-w-[72px] justify-center rounded-lg px-2.5 py-1.5 text-sm font-bold ${
          registered > 0
            ? "bg-indigo-50 text-indigo-700"
            : "bg-slate-50 text-slate-400"
        }`}
      >
        {registered} / {strength}
      </span>

      <div className="mx-auto mt-1.5 h-1 w-14 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-indigo-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </td>
  );
}

/* =========================================================
   LOADING
========================================================= */

function Loading() {
  return (
    <div className="px-5 py-12 text-center">

      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

      <p className="mt-3 text-sm text-slate-500">
        Loading...
      </p>

    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState() {
  return (
    <div className="px-5 py-12 text-center">

      <p className="text-sm font-semibold text-slate-600">
        No registration data found
      </p>

    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorState({
  error,
  onRetry,
}) {
  return (
    <div className="px-5 py-12 text-center">

      <p className="text-sm font-semibold text-red-600">
        {error}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
      >
        Try Again
      </button>

    </div>
  );
}