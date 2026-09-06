"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function ClubInchargeCertificatePage() {
  const { getToken, isLoaded } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    loadStudents();
  }, [isLoaded]);

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

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
    } catch (error) {
      console.error(
        "Load certificate students error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load certificate students"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ALLOW CERTIFICATE
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

      // Update only the approved student
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

      setMessage(
        "Certificate permission granted successfully."
      );
    } catch (error) {
      console.error(
        "Approve certificate error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to allow certificate"
      );
    } finally {
      setApprovingId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Certificate
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review club members and allow certificate generation.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* NO STUDENTS */}
      {students.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            No confirmed club members found.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              {/* TABLE HEADER */}
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Student
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Register No.
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Department
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Attendance
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Certificate
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y">
                {students.map((student) => {
                  const isApproved =
                    student.certificateStatus ===
                      "APPROVED" ||
                    student.certificateStatus ===
                      "ISSUED";

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-gray-50"
                    >
                      {/* STUDENT */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.profilePhoto ? (
                            <img
                              src={student.profilePhoto}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600">
                              {student.name
                                ?.charAt(0)
                                ?.toUpperCase() || "S"}
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-gray-900">
                              {student.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* REGISTER NUMBER */}
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {student.registerNumber || "-"}
                      </td>

                      {/* DEPARTMENT */}
                      <td className="px-4 py-3 text-gray-600">
                        {student.department || "-"}
                      </td>

                      {/* ATTENDANCE */}
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {student.attendedClasses} /{" "}
                          {student.totalClasses}
                        </div>

                        <div className="text-xs text-gray-500">
                          {student.attendancePercentage}%
                        </div>
                      </td>

                      {/* CERTIFICATE */}
                      <td className="px-4 py-3 text-center">
                        {isApproved ? (
                          <span className="inline-flex rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700">
                            Approved
                          </span>
                        ) : student.certificateId ? (
                          <button
                            type="button"
                            onClick={() =>
                              approveCertificate(
                                student.certificateId
                              )
                            }
                            disabled={
                              approvingId ===
                              student.certificateId
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {approvingId ===
                            student.certificateId
                              ? "Approving..."
                              : "Allow Certificate"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not Available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}