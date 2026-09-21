"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ClubApplicationsPage() {
  const { getToken } = useAuth();
  const params = useParams();

  const clubCode = params.clubCode;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState(
    "PENDING_CLUB_APPROVAL"
  );

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

      if (response.data?.success) {
        setApplications(response.data.applications || []);
        setSelectedIds([]);
      } else {
        setError(
          response.data?.message ||
            "Failed to load applications"
        );
      }
    } catch (error) {
      console.error("Load applications error:", error);

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
  // APPROVE
  // =====================================================

  const approveApplication = async (
    membershipId,
    showConfirmation = true
  ) => {
    if (showConfirmation) {
      const confirmed = window.confirm(
        "Are you sure you want to approve this student?"
      );

      if (!confirmed) return false;
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
  // REJECT
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
      (a, b) => Number(a) - Number(b)
    );
  }, [applications]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredApplications = useMemo(() => {
    let result = [...applications];

    if (search.trim()) {
      const query = search.toLowerCase().trim();

      result = result.filter((item) => {
        const student = item.student;

        const name =
          student?.name?.toLowerCase() || "";

        const registerNumber =
          student?.registerNumber?.toLowerCase() || "";

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

    if (branchFilter !== "ALL") {
      result = result.filter((item) => {
        const branch =
          item.student?.department?.code ||
          item.student?.department?.name;

        return branch === branchFilter;
      });
    }

    if (semesterFilter !== "ALL") {
      result = result.filter(
        (item) =>
          String(item.student?.semester) ===
          String(semesterFilter)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter(
        (item) => item.status === statusFilter
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
  // PENDING APPLICATIONS
  // =====================================================

  const pendingFilteredApplications =
    filteredApplications.filter(
      (item) =>
        item.status === "PENDING_CLUB_APPROVAL"
    );

  // =====================================================
  // SELECTION
  // =====================================================

  const allVisibleSelected =
    pendingFilteredApplications.length > 0 &&
    pendingFilteredApplications.every((item) =>
      selectedIds.includes(item.membershipId)
    );

  const someVisibleSelected =
    pendingFilteredApplications.some((item) =>
      selectedIds.includes(item.membershipId)
    );

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) =>
            !pendingFilteredApplications.some(
              (item) => item.membershipId === id
            )
        )
      );
    } else {
      const idsToAdd =
        pendingFilteredApplications.map(
          (item) => item.membershipId
        );

      setSelectedIds((previous) => [
        ...new Set([...previous, ...idsToAdd]),
      ]);
    }
  };

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
    setStatusFilter("PENDING_CLUB_APPROVAL");
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
        } catch {
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

    if (!reason || !reason.trim()) return;

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
        } catch {
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

      if (!reason || !reason.trim()) return;

      setProcessing(true);

      const success =
        await rejectApplication(
          membershipId,
          reason,
          false
        );

      if (success) {
        alert("Application rejected.");
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
  // STATUS
  // =====================================================

  const getStatusLabel = (status) => {
    if (status === "PENDING_CLUB_APPROVAL")
      return "Pending Club Approval";

    if (status === "PENDING_HOD_APPROVAL")
      return "Pending HOD Approval";

    if (status === "CONFIRMED")
      return "Confirmed";

    if (status === "REJECTED")
      return "Rejected";

    return status?.replaceAll("_", " ") || "-";
  };

  const getStatusStyle = (status) => {
    if (status === "PENDING_CLUB_APPROVAL") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (status === "PENDING_HOD_APPROVAL") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === "CONFIRMED") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
  };

  // =====================================================
  // COUNTS
  // =====================================================

  const pendingCount = applications.filter(
    (item) =>
      item.status === "PENDING_CLUB_APPROVAL"
  ).length;

  const hodPendingCount = applications.filter(
    (item) =>
      item.status === "PENDING_HOD_APPROVAL"
  ).length;

  const confirmedCount = applications.filter(
    (item) => item.status === "CONFIRMED"
  ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
              Loading applications...
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50">

      <div className="mx-auto max-w-7xl px-3 py-4 pb-28 sm:px-5 sm:py-6 lg:px-8 lg:pb-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Club Applications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review student applications for{" "}
                <span className="font-semibold text-blue-600">
                  {clubCode?.toUpperCase()}
                </span>
              </p>

            </div>

            <button
              type="button"
              onClick={loadApplications}
              disabled={processing}
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Refresh
            </button>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <SummaryBox
            title="Total"
            value={applications.length}
            text="text-gray-800"
          />

          <SummaryBox
            title="Pending"
            value={pendingCount}
            text="text-amber-600"
          />

          <SummaryBox
            title="Waiting HOD"
            value={hodPendingCount}
            text="text-blue-600"
          />

          <SummaryBox
            title="Confirmed"
            value={confirmedCount}
            text="text-green-600"
          />

        </div>


        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">

          <h2 className="mb-3 text-lg font-bold text-gray-900">
            Filters
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search student..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={branchFilter}
              onChange={(e) =>
                setBranchFilter(e.target.value)
              }
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All Branches
              </option>

              {branchOptions.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={(e) =>
                setSemesterFilter(e.target.value)
              }
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All Semesters
              </option>

              {semesterOptions.map((semester) => (
                <option
                  key={semester}
                  value={semester}
                >
                  Semester {semester}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
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


          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {filteredApplications.length}
              </span>{" "}
              applications

              {selectedIds.length > 0 && (
                <span className="ml-2 font-semibold text-blue-600">
                  ({selectedIds.length} selected)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Clear Filters
            </button>

          </div>

        </div>


        {/* =================================================
            APPLICATIONS
        ================================================= */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">

          <div className="border-b border-gray-200 p-4 sm:p-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Student Applications
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {pendingFilteredApplications.length} pending
                  applications
                </p>
              </div>

              {pendingFilteredApplications.length > 0 && (
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">

                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate =
                          !allVisibleSelected &&
                          someVisibleSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />

                  Select all pending

                </label>
              )}

            </div>

          </div>


          {/* =================================================
              EMPTY
          ================================================= */}

          {filteredApplications.length === 0 ? (

            <div className="p-10 text-center">

              <h3 className="text-lg font-semibold text-gray-800">
                No applications found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                No applications match the selected filters.
              </p>

            </div>

          ) : (

            <>

              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full min-w-[1000px]">

                  <thead className="bg-gray-50">

                    <tr className="border-b border-gray-200">

                      <th className="w-12 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          ref={(element) => {
                            if (element) {
                              element.indeterminate =
                                !allVisibleSelected &&
                                someVisibleSelected;
                            }
                          }}
                          onChange={toggleSelectAll}
                          disabled={
                            pendingFilteredApplications.length ===
                            0
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        #
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Student
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Register No.
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Branch
                      </th>

                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">
                        Sem
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Phone
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Status
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

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
                          student?.department?.code ||
                          student?.department?.name ||
                          "-";

                        return (
                          <tr
                            key={
                              application.membershipId
                            }
                            className={
                              isSelected
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }
                          >

                            <td className="px-4 py-4 text-center">

                              {isPending ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleSelection(
                                      application.membershipId
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                />
                              ) : (
                                <span className="text-gray-300">
                                  —
                                </span>
                              )}

                            </td>


                            <td className="px-4 py-4 text-sm text-gray-400">
                              {index + 1}
                            </td>


                            <td className="px-4 py-4">

                              <div className="flex items-center gap-3">

                                <StudentPhoto
                                  student={student}
                                />

                                <div className="min-w-0">

                                  <p className="font-semibold text-gray-900">
                                    {student?.name || "-"}
                                  </p>

                                  <p className="max-w-[220px] truncate text-xs text-gray-500">
                                    {student?.email || "-"}
                                  </p>

                                </div>

                              </div>

                            </td>


                            <td className="px-4 py-4 text-sm font-medium text-gray-700">
                              {student?.registerNumber || "-"}
                            </td>


                            <td className="px-4 py-4">

                              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                {branch}
                              </span>

                            </td>


                            <td className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                              {student?.semester || "-"}
                            </td>


                            <td className="px-4 py-4 text-sm text-gray-600">
                              {student?.phone || "-"}
                            </td>


                            <td className="px-4 py-4">

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                  application.status
                                )}`}
                              >
                                {getStatusLabel(
                                  application.status
                                )}
                              </span>

                            </td>


                            <td className="px-4 py-4">

                              {isPending ? (

                                <div className="flex gap-2">

                                  <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() =>
                                      handleIndividualApprove(
                                        application.membershipId
                                      )
                                    }
                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() =>
                                      handleIndividualReject(
                                        application.membershipId
                                      )
                                    }
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>

                                </div>

                              ) : (

                                <span className="text-xs text-gray-400">
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

              <div className="divide-y divide-gray-100 md:hidden">

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
                      student?.department?.code ||
                      student?.department?.name ||
                      "-";

                    return (
                      <div
                        key={
                          application.membershipId
                        }
                        className={`p-4 ${
                          isSelected
                            ? "bg-blue-50"
                            : "bg-white"
                        }`}
                      >

                        {/* TOP */}

                        <div className="flex items-start gap-3">

                          {isPending && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleSelection(
                                  application.membershipId
                                )
                              }
                              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600"
                            />
                          )}

                          <StudentPhoto
                            student={student}
                          />

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-2">

                              <div className="min-w-0">

                                <p className="truncate text-sm font-bold text-gray-900">
                                  {student?.name || "-"}
                                </p>

                                <p className="mt-0.5 truncate text-xs text-gray-500">
                                  {student?.registerNumber ||
                                    "-"}
                                </p>

                              </div>

                              <span className="shrink-0 text-xs text-gray-400">
                                #{index + 1}
                              </span>

                            </div>

                            <div className="mt-2">

                              <span
                                className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                                  application.status
                                )}`}
                              >
                                {getStatusLabel(
                                  application.status
                                )}
                              </span>

                            </div>

                          </div>

                        </div>


                        {/* DETAILS */}

                        <div className="mt-3 grid grid-cols-2 gap-2">

                          <MobileInfo
                            label="Branch"
                            value={branch}
                          />

                          <MobileInfo
                            label="Semester"
                            value={
                              student?.semester || "-"
                            }
                          />

                          <MobileInfo
                            label="Phone"
                            value={
                              student?.phone || "-"
                            }
                          />

                          <MobileInfo
                            label="Email"
                            value={
                              student?.email || "-"
                            }
                          />

                        </div>


                        {/* ACTIONS */}

                        {isPending && (
                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <button
                              type="button"
                              disabled={processing}
                              onClick={() =>
                                handleIndividualApprove(
                                  application.membershipId
                                )
                              }
                              className="h-10 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              disabled={processing}
                              onClick={() =>
                                handleIndividualReject(
                                  application.membershipId
                                )
                              }
                              className="h-10 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
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

        </div>

      </div>


      {/* =================================================
          MOBILE BULK ACTION BAR
      ================================================= */}

      {selectedIds.length > 0 && (

        <div className="fixed bottom-3 left-3 right-3 z-50 rounded-xl border border-gray-200 bg-white p-3 shadow-xl md:hidden">

          <div className="mb-2 text-center text-xs font-semibold text-gray-700">
            {selectedIds.length} application(s) selected
          </div>

          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={handleBulkReject}
              disabled={processing}
              className="h-10 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Reject
            </button>

            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={processing}
              className="h-10 rounded-lg bg-green-600 text-sm font-semibold text-white disabled:opacity-50"
            >
              Approve
            </button>

          </div>

        </div>
      )}

    </main>
  );
}


// =====================================================
// SUMMARY BOX
// =====================================================

function SummaryBox({
  title,
  value,
  text,
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">

      <p className="text-xs font-medium text-gray-500">
        {title}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${text}`}
      >
        {value}
      </p>

    </div>
  );
}


// =====================================================
// STUDENT PHOTO
// =====================================================

function StudentPhoto({ student }) {
  if (student?.photoUrl) {
    return (
      <img
        src={student.photoUrl}
        alt={student.name || "Student"}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
      {student?.name
        ?.charAt(0)
        ?.toUpperCase() || "S"}
    </div>
  );
}


// =====================================================
// MOBILE INFO
// =====================================================

function MobileInfo({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">

      <p className="text-[10px] font-semibold uppercase text-gray-400">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs font-medium text-gray-700">
        {value}
      </p>

    </div>
  );
}