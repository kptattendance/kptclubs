"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function ClubApplicationsPage() {
  const { getToken } = useAuth();
  const params = useParams();

  const clubCode = params.clubCode;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FILTER STATES
  // =====================================================

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState(
    "PENDING_CLUB_APPROVAL"
  );

  // =====================================================
  // SELECTION
  // =====================================================

  const [selectedIds, setSelectedIds] = useState([]);

  const [processing, setProcessing] = useState(false);

  // =====================================================
  // LOAD APPLICATIONS
  // =====================================================

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await axios.get(
        `${API_URL}/api/club-incharge/applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Club applications:",
        response.data
      );

      if (response.data?.success) {
        setApplications(
          response.data.applications || []
        );
        setSelectedIds([]);
      } else {
        setError(
          response.data?.message ||
            "Failed to load applications"
        );
      }
    } catch (error) {
      console.error(
        "Load applications error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load applications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubCode) {
      loadApplications();
    }
  }, [clubCode]);

  // =====================================================
  // APPROVE APPLICATION
  // =====================================================

  const approveApplication = async (
    membershipId,
    showConfirmation = true
  ) => {
    if (showConfirmation) {
      const confirmApproval = window.confirm(
        "Are you sure you want to approve this student?"
      );

      if (!confirmApproval) return false;
    }

    try {
      const token = await getToken();

      const response = await axios.put(
        `${API_URL}/api/club-incharge/applications/${membershipId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        return true;
      }

      throw new Error(
        response.data?.message ||
          "Failed to approve application"
      );
    } catch (error) {
      console.error(
        "Approve application error:",
        error.response?.data || error.message
      );

      throw error;
    }
  };

  // =====================================================
  // REJECT APPLICATION
  // =====================================================

  const rejectApplication = async (
    membershipId,
    reason = null,
    showPrompt = true
  ) => {
    let rejectionReason = reason;

    if (showPrompt) {
      rejectionReason = window.prompt(
        "Enter rejection reason:"
      );

      if (
        !rejectionReason ||
        !rejectionReason.trim()
      ) {
        return false;
      }
    }

    try {
      const token = await getToken();

      const response = await axios.put(
        `${API_URL}/api/club-incharge/applications/${membershipId}/reject`,
        {
          reason: rejectionReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        return true;
      }

      throw new Error(
        response.data?.message ||
          "Failed to reject application"
      );
    } catch (error) {
      console.error(
        "Reject application error:",
        error.response?.data || error.message
      );

      throw error;
    }
  };

  // =====================================================
  // BRANCH OPTIONS
  // =====================================================

  const branchOptions = useMemo(() => {
    const branches = applications
      .map(
        (item) =>
          item.student?.department?.code ||
          item.student?.department?.name
      )
      .filter(Boolean);

    return [...new Set(branches)].sort();
  }, [applications]);

  // =====================================================
  // SEMESTER OPTIONS
  // =====================================================

  const semesterOptions = useMemo(() => {
    const semesters = applications
      .map((item) => item.student?.semester)
      .filter(
        (semester) =>
          semester !== undefined &&
          semester !== null &&
          semester !== ""
      );

    return [...new Set(semesters)].sort(
      (a, b) =>
        Number(a) - Number(b)
    );
  }, [applications]);

  // =====================================================
  // FILTER APPLICATIONS
  // =====================================================

  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Search
    if (search.trim()) {
      const query = search
        .toLowerCase()
        .trim();

      result = result.filter((item) => {
        const student = item.student;

        const name =
          student?.name?.toLowerCase() || "";

        const registerNumber =
          student?.registerNumber?.toLowerCase() ||
          "";

        const email =
          student?.email?.toLowerCase() || "";

        const phone =
          student?.phone?.toLowerCase() || "";

        return (
          name.includes(query) ||
          registerNumber.includes(query) ||
          email.includes(query) ||
          phone.includes(query)
        );
      });
    }

    // Branch
    if (branchFilter !== "ALL") {
      result = result.filter((item) => {
        const branch =
          item.student?.department?.code ||
          item.student?.department?.name;

        return branch === branchFilter;
      });
    }

    // Semester
    if (semesterFilter !== "ALL") {
      result = result.filter(
        (item) =>
          String(item.student?.semester) ===
          String(semesterFilter)
      );
    }

    // Status
    if (statusFilter !== "ALL") {
      result = result.filter(
        (item) =>
          item.status === statusFilter
      );
    }

    return result;
  }, [
    applications,
    search,
    branchFilter,
    semesterFilter,
    statusFilter,
  ]);

  // =====================================================
  // PENDING FILTERED APPLICATIONS
  // =====================================================

  const pendingFilteredApplications =
    filteredApplications.filter(
      (item) =>
        item.status ===
        "PENDING_CLUB_APPROVAL"
    );

  // =====================================================
  // SELECT ALL
  // =====================================================

  const allVisibleSelected =
    pendingFilteredApplications.length > 0 &&
    pendingFilteredApplications.every((item) =>
      selectedIds.includes(
        item.membershipId
      )
    );

  const someVisibleSelected =
    pendingFilteredApplications.some((item) =>
      selectedIds.includes(
        item.membershipId
      )
    );

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) =>
            !pendingFilteredApplications.some(
              (item) =>
                item.membershipId === id
            )
        )
      );
    } else {
      const idsToAdd =
        pendingFilteredApplications.map(
          (item) => item.membershipId
        );

      setSelectedIds((previous) => [
        ...new Set([
          ...previous,
          ...idsToAdd,
        ]),
      ]);
    }
  };

  // =====================================================
  // SELECT INDIVIDUAL
  // =====================================================

  const toggleSelection = (membershipId) => {
    setSelectedIds((previous) =>
      previous.includes(membershipId)
        ? previous.filter(
            (id) => id !== membershipId
          )
        : [...previous, membershipId]
    );
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setBranchFilter("ALL");
    setSemesterFilter("ALL");
    setStatusFilter(
      "PENDING_CLUB_APPROVAL"
    );
    setSelectedIds([]);
  };

  // =====================================================
  // BULK APPROVE
  // =====================================================

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to approve ${selectedIds.length} selected application(s)?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      let successCount = 0;
      let failedCount = 0;

      for (const membershipId of selectedIds) {
        try {
          await approveApplication(
            membershipId,
            false
          );

          successCount++;
        } catch (error) {
          failedCount++;
        }
      }

      setSelectedIds([]);

      if (failedCount === 0) {
        alert(
          `${successCount} application(s) approved successfully.`
        );
      } else {
        alert(
          `${successCount} approved, ${failedCount} failed.`
        );
      }

      await loadApplications();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to process selected applications."
      );
    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // BULK REJECT
  // =====================================================

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;

    const reason = window.prompt(
      `Enter rejection reason for ${selectedIds.length} selected application(s):`
    );

    if (!reason || !reason.trim()) {
      return;
    }

    const confirmed = window.confirm(
      `Reject ${selectedIds.length} selected application(s)?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      let successCount = 0;
      let failedCount = 0;

      for (const membershipId of selectedIds) {
        try {
          await rejectApplication(
            membershipId,
            reason,
            false
          );

          successCount++;
        } catch (error) {
          failedCount++;
        }
      }

      setSelectedIds([]);

      if (failedCount === 0) {
        alert(
          `${successCount} application(s) rejected successfully.`
        );
      } else {
        alert(
          `${successCount} rejected, ${failedCount} failed.`
        );
      }

      await loadApplications();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to process selected applications."
      );
    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // INDIVIDUAL APPROVE
  // =====================================================

  const handleIndividualApprove = async (
    membershipId
  ) => {
    try {
      setProcessing(true);

      const success =
        await approveApplication(
          membershipId,
          true
        );

      if (success) {
        alert(
          "Application approved. It has been forwarded to the HOD."
        );

        await loadApplications();
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve application"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // INDIVIDUAL REJECT
  // =====================================================

  const handleIndividualReject = async (
    membershipId
  ) => {
    try {
      const reason = window.prompt(
        "Enter rejection reason:"
      );

      if (
        !reason ||
        !reason.trim()
      ) {
        return;
      }

      setProcessing(true);

      const success =
        await rejectApplication(
          membershipId,
          reason,
          false
        );

      if (success) {
        alert(
          "Application rejected."
        );

        await loadApplications();
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject application"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (status) => {
    if (
      status ===
      "PENDING_CLUB_APPROVAL"
    ) {
      return "Pending Club Approval";
    }

    if (
      status ===
      "PENDING_HOD_APPROVAL"
    ) {
      return "Pending HOD Approval";
    }

    if (status === "CONFIRMED") {
      return "Confirmed";
    }

    if (status === "REJECTED") {
      return "Rejected";
    }

    return status
      ?.replaceAll("_", " ")
      || "-";
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {
    if (
      status ===
      "PENDING_CLUB_APPROVAL"
    ) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (
      status ===
      "PENDING_HOD_APPROVAL"
    ) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === "CONFIRMED") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
  };

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const pendingCount =
    applications.filter(
      (item) =>
        item.status ===
        "PENDING_CLUB_APPROVAL"
    ).length;

  const hodPendingCount =
    applications.filter(
      (item) =>
        item.status ===
        "PENDING_HOD_APPROVAL"
    ).length;

  const confirmedCount =
    applications.filter(
      (item) =>
        item.status === "CONFIRMED"
    ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px] space-y-6">

          <div className="h-36 animate-pulse rounded-3xl bg-white" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-white"
                />
              )
            )}
          </div>

          <div className="h-[500px] animate-pulse rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">

        {/* =================================================
            HEADER
            ================================================= */}

        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-xl sm:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    />
                  </svg>
                </div>

                <span className="text-sm font-medium text-blue-200">
                  Club In-charge
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Club Applications
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Review and manage student applications
                for{" "}
                <span className="font-semibold text-white">
                  {clubCode?.toUpperCase()}
                </span>
                .
              </p>
            </div>

            <button
              onClick={loadApplications}
              disabled={processing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0117.5 5.5L20 8M18.5 15A7 7 0 016.5 18.5L4 16"
                />
              </svg>

              Refresh
            </button>
          </div>
        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY
            ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            label="Total Applications"
            value={applications.length}
            color="blue"
            icon="users"
          />

          <SummaryCard
            label="Pending Approval"
            value={pendingCount}
            color="amber"
            icon="clock"
          />

          <SummaryCard
            label="Waiting for HOD"
            value={hodPendingCount}
            color="violet"
            icon="forward"
          />

          <SummaryCard
            label="Confirmed"
            value={confirmedCount}
            color="emerald"
            icon="check"
          />

        </div>

        {/* =================================================
            FILTER + BULK ACTION PANEL
            ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-slate-900">
                Application Management
              </h2>

              <p className="text-sm text-slate-500">
                Filter students and select multiple
                applications for bulk action.
              </p>
            </div>

          </div>

          <div className="p-5 sm:p-6">

            {/* Filters */}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">

              {/* Search */}

              <div className="relative xl:col-span-2">
                <svg
                  className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />
                  <path
                    strokeLinecap="round"
                    d="M20 20l-4-4"
                  />
                </svg>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search name, register number, email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              {/* Branch */}

              <select
                value={branchFilter}
                onChange={(e) =>
                  setBranchFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="ALL">
                  All Branches
                </option>

                {branchOptions.map(
                  (branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {branch}
                    </option>
                  )
                )}
              </select>

              {/* Semester */}

              <select
                value={semesterFilter}
                onChange={(e) =>
                  setSemesterFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
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

              {/* Status */}

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="PENDING_CLUB_APPROVAL">
                  Pending Club Approval
                </option>

                <option value="PENDING_HOD_APPROVAL">
                  Pending HOD Approval
                </option>

                <option value="CONFIRMED">
                  Confirmed
                </option>

                <option value="REJECTED">
                  Rejected
                </option>
              </select>

            </div>

            {/* Bottom controls */}

            <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex flex-wrap items-center gap-3">

                <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-bold text-slate-900">
                    {filteredApplications.length}
                  </span>{" "}
                  applications
                </div>

                {selectedIds.length > 0 && (
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                    {selectedIds.length} selected
                  </div>
                )}

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear Filters
                </button>

                <button
                  type="button"
                  disabled={
                    selectedIds.length === 0 ||
                    processing
                  }
                  onClick={handleBulkReject}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      d="M6 6l12 12M18 6L6 18"
                    />
                  </svg>

                  Reject Selected
                </button>

                <button
                  type="button"
                  disabled={
                    selectedIds.length === 0 ||
                    processing
                  }
                  onClick={handleBulkApprove}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12l4 4L19 6"
                    />
                  </svg>

                  Approve Selected
                </button>

              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            APPLICATION TABLE / CARDS
            ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Table header */}

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Student Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select students to approve or reject
                applications in bulk.
              </p>
            </div>

            {pendingFilteredApplications.length >
              0 && (
              <div className="text-sm text-slate-500">
                {pendingFilteredApplications.length}{" "}
                pending
              </div>
            )}

          </div>

          {filteredApplications.length === 0 ? (

            /* EMPTY */

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 py-12 text-center">

              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50">
                <svg
                  className="h-9 w-9 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                No applications found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                No applications match the selected
                filters.
              </p>

            </div>

          ) : (

            <>

              {/* =================================================
                  DESKTOP TABLE
                  ================================================= */}

              <div className="hidden overflow-x-auto lg:block">

                <table className="min-w-[1200px] w-full">

                  <thead className="sticky top-0 z-10 bg-slate-50">

                    <tr className="border-b border-slate-200">

                      {/* Select all */}

                      <th className="w-12 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={
                            allVisibleSelected
                          }
                          ref={(element) => {
                            if (element) {
                              element.indeterminate =
                                !allVisibleSelected &&
                                someVisibleSelected;
                            }
                          }}
                          onChange={
                            toggleSelectAll
                          }
                          disabled={
                            pendingFilteredApplications.length ===
                            0
                          }
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>

                      {/* Sl no */}

                      <th className="w-16 px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Sl. No.
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Student
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Register No.
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Branch
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                        Sem
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Contact
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredApplications.map(
                      (application, index) => {
                        const student =
                          application.student;

                        const isPending =
                          application.status ===
                          "PENDING_CLUB_APPROVAL";

                        const isSelected =
                          selectedIds.includes(
                            application.membershipId
                          );

                        const branch =
                          student?.department
                            ?.code ||
                          student?.department
                            ?.name ||
                          "-";

                        return (
                          <tr
                            key={
                              application.membershipId
                            }
                            className={`transition ${
                              isSelected
                                ? "bg-blue-50/60"
                                : "hover:bg-slate-50"
                            }`}
                          >

                            {/* Checkbox */}

                            <td className="px-4 py-4 text-center">

                              {isPending ? (
                                <input
                                  type="checkbox"
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    toggleSelection(
                                      application.membershipId
                                    )
                                  }
                                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-slate-300">
                                  —
                                </span>
                              )}

                            </td>

                            {/* Sl No */}

                            <td className="px-4 py-4 text-sm font-semibold text-slate-400">
                              {index + 1}
                            </td>

                            {/* Student */}

                            <td className="px-4 py-4">

                              <div className="flex items-center gap-3">

                                {student?.photoUrl ? (
                                  <img
                                    src={
                                      student.photoUrl
                                    }
                                    alt={
                                      student.name
                                    }
                                    className="h-11 w-11 rounded-xl object-cover shadow-sm"
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                                    {student?.name
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                      "S"}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">
                                    {student?.name ||
                                      "-"}
                                  </p>

                                  <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-500">
                                    {student?.email ||
                                      "-"}
                                  </p>
                                </div>

                              </div>

                            </td>

                            {/* Register */}

                            <td className="px-4 py-4">
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700">
                                {student?.registerNumber ||
                                  "-"}
                              </span>
                            </td>

                            {/* Branch */}

                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                                {branch}
                              </span>
                            </td>

                            {/* Semester */}

                            <td className="px-4 py-4 text-center">
                              <span className="font-semibold text-slate-700">
                                {student?.semester ||
                                  "-"}
                              </span>
                            </td>

                            {/* Contact */}

                            <td className="px-4 py-4">
                              <div className="space-y-1 text-xs text-slate-500">
                                <p>
                                  {student?.phone ||
                                    "-"}
                                </p>
                              </div>
                            </td>

                            {/* Status */}

                            <td className="px-4 py-4">

                              <span
                                className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                  application.status
                                )}`}
                              >
                                {getStatusLabel(
                                  application.status
                                )}
                              </span>

                            </td>

                            {/* Actions */}

                            <td className="px-4 py-4">

                              {isPending ? (
                                <div className="flex gap-2">

                                  <button
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      handleIndividualApprove(
                                        application.membershipId
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    <svg
                                      className="h-3.5 w-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 12l4 4L19 6"
                                      />
                                    </svg>
                                    Approve
                                  </button>

                                  <button
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      handleIndividualReject(
                                        application.membershipId
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>

                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  No action
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

              <div className="space-y-3 p-4 lg:hidden">

                {/* Mobile select all */}

                {pendingFilteredApplications.length >
                  0 && (
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">

                    <label className="flex cursor-pointer items-center gap-3">

                      <input
                        type="checkbox"
                        checked={
                          allVisibleSelected
                        }
                        ref={(element) => {
                          if (element) {
                            element.indeterminate =
                              !allVisibleSelected &&
                              someVisibleSelected;
                          }
                        }}
                        onChange={
                          toggleSelectAll
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        Select all pending
                      </span>

                    </label>

                    {selectedIds.length >
                      0 && (
                      <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {selectedIds.length} selected
                      </span>
                    )}

                  </div>
                )}

                {filteredApplications.map(
                  (application, index) => {
                    const student =
                      application.student;

                    const isPending =
                      application.status ===
                      "PENDING_CLUB_APPROVAL";

                    const isSelected =
                      selectedIds.includes(
                        application.membershipId
                      );

                    const branch =
                      student?.department
                        ?.code ||
                      student?.department
                        ?.name ||
                      "-";

                    return (
                      <div
                        key={
                          application.membershipId
                        }
                        className={`rounded-2xl border p-4 transition ${
                          isSelected
                            ? "border-blue-300 bg-blue-50/50"
                            : "border-slate-200 bg-white"
                        }`}
                      >

                        {/* Top */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-3">

                            {isPending && (
                              <input
                                type="checkbox"
                                checked={
                                  isSelected
                                }
                                onChange={() =>
                                  toggleSelection(
                                    application.membershipId
                                  )
                                }
                                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}

                            {student?.photoUrl ? (
                              <img
                                src={
                                  student.photoUrl
                                }
                                alt={
                                  student.name
                                }
                                className="h-12 w-12 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white">
                                {student?.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "S"}
                              </div>
                            )}

                            <div className="min-w-0">

                              <p className="truncate font-bold text-slate-900">
                                {student?.name ||
                                  "-"}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {student?.registerNumber ||
                                  "-"}
                              </p>

                            </div>

                          </div>

                          <span className="shrink-0 text-xs font-semibold text-slate-400">
                            #{index + 1}
                          </span>

                        </div>

                        {/* Details */}

                        <div className="mt-4 grid grid-cols-2 gap-3">

                          <InfoBox
                            label="Branch"
                            value={branch}
                          />

                          <InfoBox
                            label="Semester"
                            value={
                              student?.semester ||
                              "-"
                            }
                          />

                          <InfoBox
                            label="Phone"
                            value={
                              student?.phone ||
                              "-"
                            }
                          />

                          <InfoBox
                            label="Status"
                            value={
                              <span
                                className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                                  application.status
                                )}`}
                              >
                                {application.status ===
                                "PENDING_CLUB_APPROVAL"
                                  ? "Pending"
                                  : getStatusLabel(
                                      application.status
                                    )}
                              </span>
                            }
                          />

                        </div>

                        {/* Actions */}

                        {isPending && (
                          <div className="mt-4 grid grid-cols-2 gap-2">

                            <button
                              disabled={
                                processing
                              }
                              onClick={() =>
                                handleIndividualApprove(
                                  application.membershipId
                                )
                              }
                              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 12l4 4L19 6"
                                />
                              </svg>
                              Approve
                            </button>

                            <button
                              disabled={
                                processing
                              }
                              onClick={() =>
                                handleIndividualReject(
                                  application.membershipId
                                )
                              }
                              className="h-10 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </>
          )}

        </section>

        {/* =================================================
            BULK ACTION BAR
            ================================================= */}

        {selectedIds.length > 0 && (
          <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:p-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                  {selectedIds.length}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Applications selected
                  </p>

                  <p className="text-xs text-slate-500">
                    Choose an action below
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">

                <button
                  onClick={handleBulkReject}
                  disabled={processing}
                  className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  Reject
                </button>

                <button
                  onClick={handleBulkApprove}
                  disabled={processing}
                  className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Approve
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  label,
  value,
  color,
  icon,
}) {
  const styles = {
    blue: {
      box: "bg-blue-50",
      icon: "text-blue-600",
      value: "text-blue-700",
    },
    amber: {
      box: "bg-amber-50",
      icon: "text-amber-600",
      value: "text-amber-700",
    },
    violet: {
      box: "bg-violet-50",
      icon: "text-violet-600",
      value: "text-violet-700",
    },
    emerald: {
      box: "bg-emerald-50",
      icon: "text-emerald-600",
      value: "text-emerald-700",
    },
  };

  const current = styles[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${current.value}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${current.box} ${current.icon}`}
        >
          {icon === "users" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              />
            </svg>
          )}

          {icon === "clock" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <path
                strokeLinecap="round"
                d="M12 7v5l3 2"
              />
            </svg>
          )}

          {icon === "forward" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 12h15M13 6l6 6-6 6"
              />
            </svg>
          )}

          {icon === "check" && (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12l4 4L19 6"
              />
            </svg>
          )}
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   MOBILE INFO BOX
   ========================================================= */

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </div>

    </div>
  );
}