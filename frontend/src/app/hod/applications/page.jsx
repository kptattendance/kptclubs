"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function HODApplicationsPage() {
  const { getToken } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [approving, setApproving] = useState(false);

  // =================================================
  // LOAD APPLICATIONS
  // =================================================

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await axios.get(
        `${API_URL}/api/hod/applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
        "Load HOD applications error:",
        error.response?.data ||
          error.message
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
    loadApplications();
  }, []);

  // =================================================
  // SEMESTER LIST
  // =================================================

  const semesters = useMemo(() => {
    const values = applications
      .map(
        (item) => item.student?.semester
      )
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== ""
      );

    return [...new Set(values)].sort(
      (a, b) =>
        Number(a) - Number(b)
    );
  }, [applications]);

  // =================================================
  // FILTER APPLICATIONS
  // =================================================

  const filteredApplications = useMemo(() => {
    if (semesterFilter === "ALL") {
      return applications;
    }

    return applications.filter(
      (item) =>
        String(item.student?.semester) ===
        String(semesterFilter)
    );
  }, [applications, semesterFilter]);

  // =================================================
  // SELECT / UNSELECT
  // =================================================

  const toggleSelection = (membershipId) => {
    setSelectedIds((prev) => {
      if (prev.includes(membershipId)) {
        return prev.filter(
          (id) => id !== membershipId
        );
      }

      return [...prev, membershipId];
    });
  };

  // =================================================
  // SELECT ALL FILTERED
  // =================================================

  const allFilteredSelected =
    filteredApplications.length > 0 &&
    filteredApplications.every((application) =>
      selectedIds.includes(
        application.membershipId
      )
    );

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) =>
        prev.filter(
          (id) =>
            !filteredApplications.some(
              (application) =>
                application.membershipId === id
            )
        )
      );
    } else {
      const filteredIds =
        filteredApplications.map(
          (application) =>
            application.membershipId
        );

      setSelectedIds((prev) => [
        ...new Set([
          ...prev,
          ...filteredIds,
        ]),
      ]);
    }
  };

  // =================================================
  // INDIVIDUAL APPROVE
  // =================================================

  const approveApplication = async (
    membershipId
  ) => {
    if (!membershipId) {
      alert("Membership ID is missing.");
      return;
    }

    const confirmed =
      window.confirm(
        "Approve this student's club membership?"
      );

    if (!confirmed) return;

    try {
      const token = await getToken();

      const response = await axios.put(
        `${API_URL}/api/hod/applications/${membershipId}/approve`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        alert(
          "Student approved successfully."
        );

        loadApplications();
      } else {
        alert(
          response.data?.message ||
            "Failed to approve application"
        );
      }
    } catch (error) {
      console.error(
        "Approve HOD application error:",
        error.response?.data ||
          error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to approve application"
      );
    }
  };

  // =================================================
  // BULK APPROVE
  // =================================================

  const approveSelected = async () => {
    if (selectedIds.length === 0) {
      alert(
        "Please select at least one application."
      );
      return;
    }

    const confirmed = window.confirm(
      `Approve ${selectedIds.length} selected application${
        selectedIds.length > 1
          ? "s"
          : ""
      }?`
    );

    if (!confirmed) return;

    try {
      setApproving(true);

      const token = await getToken();

      let successCount = 0;
      let failedCount = 0;

      for (const membershipId of selectedIds) {
        try {
          const response =
            await axios.put(
              `${API_URL}/api/hod/applications/${membershipId}/approve`,
              {},
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
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
            "Bulk approval error:",
            membershipId,
            error
          );

          failedCount++;
        }
      }

      setSelectedIds([]);

      await loadApplications();

      if (failedCount === 0) {
        alert(
          `${successCount} application${
            successCount > 1
              ? "s"
              : ""
          } approved successfully.`
        );
      } else {
        alert(
          `${successCount} approved, ${failedCount} failed.`
        );
      }
    } catch (error) {
      console.error(
        "Bulk approval error:",
        error
      );

      alert(
        "Failed to process selected applications."
      );
    } finally {
      setApproving(false);
    }
  };

  // =================================================
  // REJECT
  // =================================================

  const rejectApplication = async (
    membershipId
  ) => {
    if (!membershipId) {
      alert("Membership ID is missing.");
      return;
    }

    const reason = window.prompt(
      "Enter rejection reason:"
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      const token = await getToken();

      const response = await axios.put(
        `${API_URL}/api/hod/applications/${membershipId}/reject`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        alert(
          "Student application rejected."
        );

        loadApplications();
      } else {
        alert(
          response.data?.message ||
            "Failed to reject application"
        );
      }
    } catch (error) {
      console.error(
        "Reject HOD application error:",
        error.response?.data ||
          error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to reject application"
      );
    }
  };

  // =================================================
  // LOADING
  // =================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-3 sm:p-5">
        <div
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            p-6
            text-center
            shadow-sm
            sm:p-8
          "
        >
          <p className="text-sm text-gray-500">
            Loading student applications...
          </p>
        </div>
      </main>
    );
  }

  // =================================================
  // PAGE
  // =================================================

  return (
    <main className="min-h-screen bg-gray-50 px-3 py-4 sm:p-5">

      <div className="mx-auto w-full max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-4 sm:mb-5">

          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Student Applications
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Review club applications forwarded by Club In-charges.
          </p>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="
              mb-4
              rounded-lg
              border border-red-200
              bg-red-50
              px-3 py-3
              text-xs
              text-red-600
              sm:px-4
              sm:text-sm
            "
          >
            {error}
          </div>
        )}


        {/* =================================================
            FILTER + ACTIONS
        ================================================= */}

        <div
          className="
            mb-4
            rounded-xl
            border
            border-gray-200
            bg-white
            p-3
            shadow-sm
            sm:p-4
          "
        >

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            {/* FILTER */}

            <div
              className="
                flex
                w-full
                flex-col
                gap-2
                sm:w-auto
                sm:flex-row
                sm:items-center
              "
            >

              <label
                htmlFor="semester"
                className="text-sm font-medium text-gray-700"
              >
                Semester
              </label>

              <select
                id="semester"
                value={semesterFilter}
                onChange={(e) => {
                  setSemesterFilter(
                    e.target.value
                  );
                  setSelectedIds([]);
                }}
                className="
                  w-full
                  rounded-md
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  focus:border-blue-500
                  focus:ring-1
                  focus:ring-blue-500
                  sm:w-auto
                  sm:py-2
                "
              >
                <option value="ALL">
                  All Semesters
                </option>

                {semesters.map((semester) => (
                  <option
                    key={semester}
                    value={semester}
                  >
                    Semester {semester}
                  </option>
                ))}
              </select>

            </div>


            {/* ACTIONS */}

            <div
              className="
                flex
                w-full
                flex-col
                gap-2
                sm:w-auto
                sm:flex-row
                sm:flex-wrap
                sm:items-center
              "
            >

              {selectedIds.length > 0 && (
                <button
                  onClick={approveSelected}
                  disabled={approving}
                  className="
                    w-full
                    rounded-md
                    bg-green-600
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                    text-white
                    hover:bg-green-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    sm:w-auto
                    sm:py-2
                  "
                >
                  {approving
                    ? "Approving..."
                    : `Approve Selected (${selectedIds.length})`}
                </button>
              )}

              <button
                onClick={loadApplications}
                disabled={approving}
                className="
                  w-full
                  rounded-md
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  hover:bg-gray-50
                  disabled:opacity-60
                  sm:w-auto
                  sm:py-2
                "
              >
                Refresh
              </button>

            </div>

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <div
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >

          {filteredApplications.length === 0 ? (

            <div className="px-4 py-10 text-center sm:px-6 sm:py-12">

              <p className="text-sm font-medium text-gray-700">
                No applications found.
              </p>

              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                Try another semester.
              </p>

            </div>

          ) : (

            <div
              className="
                w-full
                overflow-x-auto
                overscroll-x-contain
              "
            >

              <table
                className="
                  w-full
                  min-w-[900px]
                  text-xs
                  sm:text-sm
                "
              >

                {/* TABLE HEADER */}

                <thead
                  className="
                    border-b
                    border-gray-200
                    bg-gray-100
                  "
                >
                  <tr>

                    {/* SELECT ALL */}

                    <th
                      className="
                        w-12
                        px-3
                        py-3
                        text-center
                      "
                    >
                      <input
                        type="checkbox"
                        checked={
                          allFilteredSelected
                        }
                        onChange={
                          toggleSelectAll
                        }
                        className="
                          h-4
                          w-4
                          cursor-pointer
                          rounded
                          border-gray-300
                          text-blue-600
                          focus:ring-blue-500
                        "
                      />
                    </th>


                    {/* S.NO */}

                    <th
                      className="
                        w-14
                        px-3
                        py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        text-gray-600
                      "
                    >
                      S.No.
                    </th>


                    <th
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        text-gray-600
                      "
                    >
                      Student
                    </th>


                    <th
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        text-gray-600
                      "
                    >
                      Register No.
                    </th>


                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        text-gray-600
                      "
                    >
                      Semester
                    </th>


                    <th
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        text-gray-600
                      "
                    >
                      Club
                    </th>


                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        text-gray-600
                      "
                    >
                      Status
                    </th>


                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        text-gray-600
                      "
                    >
                      Action
                    </th>

                  </tr>
                </thead>


                {/* TABLE BODY */}

                <tbody className="divide-y divide-gray-100">

                  {filteredApplications.map(
                    (application, index) => {

                      const student =
                        application.student;

                      const club =
                        application.club;

                      const membershipId =
                        application.membershipId;

                      const isSelected =
                        selectedIds.includes(
                          membershipId
                        );

                      return (
                        <tr
                          key={membershipId}
                          className={`transition ${
                            isSelected
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                        >

                          {/* CHECKBOX */}

                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                toggleSelection(
                                  membershipId
                                )
                              }
                              className="
                                h-4
                                w-4
                                cursor-pointer
                                rounded
                                border-gray-300
                                text-blue-600
                                focus:ring-blue-500
                              "
                            />
                          </td>


                          {/* S.NO */}

                          <td className="px-3 py-3 text-center text-gray-500">
                            {index + 1}
                          </td>


                          {/* STUDENT */}

                          <td className="px-4 py-3">

                            <div className="flex items-center gap-2">

                              {student?.photoUrl ? (

                                <img
                                  src={
                                    student.photoUrl
                                  }
                                  alt={
                                    student.name ||
                                    "Student"
                                  }
                                  className="
                                    h-9
                                    w-9
                                    shrink-0
                                    rounded-full
                                    object-cover
                                  "
                                />

                              ) : (

                                <div
                                  className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-blue-100
                                    text-sm
                                    font-semibold
                                    text-blue-600
                                  "
                                >
                                  {student?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "S"}
                                </div>

                              )}

                              <div className="min-w-0 max-w-[220px]">

                                <p className="truncate font-medium text-gray-800">
                                  {student?.name ||
                                    "-"}
                                </p>

                                <p className="truncate text-xs text-gray-500">
                                  {student?.email ||
                                    ""}
                                </p>

                              </div>

                            </div>

                          </td>


                          {/* REGISTER NUMBER */}

                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                            {student?.registerNumber ||
                              "-"}
                          </td>


                          {/* SEMESTER */}

                          <td className="px-4 py-3 text-center text-gray-600">
                            {student?.semester ||
                              "-"}
                          </td>


                          {/* CLUB */}

                          <td className="px-4 py-3">

                            <p className="whitespace-nowrap font-medium text-gray-800">
                              {club?.name || "-"}
                            </p>

                            {club?.code && (
                              <p className="text-xs text-gray-500">
                                {club.code}
                              </p>
                            )}

                          </td>


                          {/* STATUS */}

                          <td className="px-4 py-3 text-center">

                            <span
                              className="
                                inline-flex
                                whitespace-nowrap
                                rounded-full
                                bg-yellow-100
                                px-2.5
                                py-1
                                text-xs
                                font-medium
                                text-yellow-700
                              "
                            >
                              PENDING
                            </span>

                          </td>


                          {/* ACTION */}

                          <td className="px-4 py-3">

                            <div className="flex justify-center gap-2">

                              <button
                                onClick={() =>
                                  approveApplication(
                                    membershipId
                                  )
                                }
                                className="
                                  min-h-[36px]
                                  rounded-md
                                  bg-green-600
                                  px-3
                                  py-2
                                  text-xs
                                  font-medium
                                  text-white
                                  hover:bg-green-700
                                  active:bg-green-800
                                "
                              >
                                Approve
                              </button>


                              <button
                                onClick={() =>
                                  rejectApplication(
                                    membershipId
                                  )
                                }
                                className="
                                  min-h-[36px]
                                  rounded-md
                                  bg-red-600
                                  px-3
                                  py-2
                                  text-xs
                                  font-medium
                                  text-white
                                  hover:bg-red-700
                                  active:bg-red-800
                                "
                              >
                                Reject
                              </button>

                            </div>

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

    </main>
  );
}