"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function StudentCertificatePage() {
  const { getToken, isLoaded } = useAuth();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    loadCertificate();
  }, [isLoaded]);

  // =====================================================
  // LOAD CERTIFICATE
  // =====================================================

  const loadCertificate = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/certificates/student",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCertificate(
        response.data.certificate || null
      );
    } catch (error) {
      console.error(
        "Load certificate error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load certificate"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DOWNLOAD
  // =====================================================

  const downloadCertificate = async () => {
    try {
      setDownloading(true);
      setError("");

      const token = await getToken();

      const response = await api.get(
        "/api/certificates/student/download",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `Certificate-${
          certificate?.certificateNumber ||
          "Club"
        }.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(
        "Download certificate error:",
        error
      );

      setError(
        "Failed to download certificate"
      );
    } finally {
      setDownloading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">

        <div className="h-7 w-7 animate-spin rounded-full border-3 border-slate-200 border-t-blue-600" />

      </div>
    );
  }

  // =====================================================
  // STATUS
  // =====================================================

  const approved =
    certificate?.status === "APPROVED" ||
    certificate?.status === "ISSUED";

  return (
    <div className="w-full">

      {/* PAGE TITLE */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Certificate
        </h1>

      </div>


      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* =================================================
          CERTIFICATE TABLE
      ================================================= */}

      {certificate ? (

        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)]">

          {/* DESKTOP */}

          <div className="hidden md:block">

            <table className="w-full">

              <thead>

                <tr className="bg-slate-50/80">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Club
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Certificate No.
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                <tr>

                  {/* CLUB */}

                  <td className="px-6 py-6">

                    <div>

                      <p className="text-sm font-semibold text-slate-800">
                        {certificate.club?.name || "—"}
                      </p>

                      {certificate.club?.code && (
                        <p className="mt-1 text-xs text-slate-400">
                          {certificate.club.code}
                        </p>
                      )}

                    </div>

                  </td>


                  {/* CERTIFICATE NUMBER */}

                  <td className="px-6 py-6">

                    <p className="text-sm text-slate-600">
                      {certificate.certificateNumber || "—"}
                    </p>

                  </td>


                  {/* STATUS */}

                  <td className="px-6 py-6">

                    <StatusText
                      status={certificate.status}
                    />

                  </td>


                  {/* ACTION */}

                  <td className="px-6 py-6 text-right">

                    {approved ? (

                      <button
                        type="button"
                        onClick={downloadCertificate}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        <DownloadIcon />

                        {downloading
                          ? "Preparing..."
                          : "Download"}

                      </button>

                    ) : (

                      <span className="text-sm text-slate-400">
                        —
                      </span>

                    )}

                  </td>

                </tr>

              </tbody>

            </table>

          </div>


          {/* =================================================
              MOBILE
          ================================================= */}

          <div className="px-5 py-5 md:hidden">

            {/* CLUB */}

            <div className="mb-5">

              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Club
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {certificate.club?.name || "—"}
              </p>

              {certificate.club?.code && (
                <p className="mt-1 text-xs text-slate-400">
                  {certificate.club.code}
                </p>
              )}

            </div>


            {/* CERTIFICATE NUMBER */}

            <div className="mb-5">

              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Certificate No.
              </p>

              <p className="break-all text-sm text-slate-600">
                {certificate.certificateNumber || "—"}
              </p>

            </div>


            {/* STATUS */}

            <div className="mb-6">

              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>

              <StatusText
                status={certificate.status}
              />

            </div>


            {/* ACTION */}

            {approved && (

              <button
                type="button"
                onClick={downloadCertificate}
                disabled={downloading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <DownloadIcon />

                {downloading
                  ? "Preparing Certificate..."
                  : "Download Certificate"}

              </button>

            )}

          </div>

        </div>

      ) : (

        /* =================================================
           NO CERTIFICATE
        ================================================= */

        <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-[0_2px_12px_rgba(15,23,42,0.06)]">

          <p className="text-sm font-semibold text-slate-700">
            Certificate not available
          </p>

          <p className="mt-1 text-xs text-slate-400">
            No certificate has been generated for your club membership.
          </p>

        </div>

      )}

    </div>
  );
}


/* =========================================================
   STATUS
========================================================= */

function StatusText({ status }) {
  if (
    status === "APPROVED" ||
    status === "ISSUED"
  ) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">

        <span className="h-2 w-2 rounded-full bg-emerald-500" />

        {status === "ISSUED"
          ? "Issued"
          : "Approved"}

      </span>
    );
  }

  if (status === "ELIGIBLE") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-600">

        <span className="h-2 w-2 rounded-full bg-amber-400" />

        Pending Approval

      </span>
    );
  }

  if (status === "PENDING_APPROVAL") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-600">

        <span className="h-2 w-2 rounded-full bg-amber-400" />

        Pending Approval

      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-red-600">

        <span className="h-2 w-2 rounded-full bg-red-500" />

        Rejected

      </span>
    );
  }

  return (
    <span className="text-sm text-slate-500">
      {status || "Unknown"}
    </span>
  );
}


/* =========================================================
   DOWNLOAD ICON
========================================================= */

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v12"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m7 10 5 5 5-5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 21h14"
      />

    </svg>
  );
}