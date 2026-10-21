"use client";

import { useState } from "react";

import { downloadExcel } from "@/lib/excel";

// "Download Excel" button. `getRows` builds the rows only
// when the button is clicked.
export default function ExcelButton({
  getRows,
  fileName,
  sheetName,
  label = "Download Excel",
  className = "",
}) {
  const [working, setWorking] = useState(false);

  const rows = typeof getRows === "function" ? null : getRows;

  const handleClick = async () => {
    try {
      setWorking(true);

      await downloadExcel(
        rows || getRows(),
        fileName,
        sheetName
      );
    } catch (error) {
      console.error("Excel download error:", error);
    } finally {
      setWorking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={working}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"
        />
      </svg>

      {working ? "Preparing..." : label}
    </button>
  );
}

// Small line showing who runs a club
export function InchargeLine({ incharge, className = "" }) {
  if (!incharge) {
    return (
      <p className={`text-sm text-slate-500 ${className}`}>
        Club In-charge: <span className="italic">not assigned</span>
      </p>
    );
  }

  return (
    <p className={`text-sm text-slate-600 ${className}`}>
      Club In-charge:{" "}
      <span className="font-semibold text-slate-800">
        {incharge.name}
      </span>
      {incharge.department?.code && (
        <span className="text-slate-500">
          {" "}
          ({incharge.department.code})
        </span>
      )}
      {incharge.phone && (
        <>
          {" · "}
          <a
            href={`tel:${incharge.phone}`}
            className="text-blue-700 hover:underline"
          >
            {incharge.phone}
          </a>
        </>
      )}
      {incharge.email && (
        <>
          {" · "}
          <a
            href={`mailto:${incharge.email}`}
            className="break-all text-blue-700 hover:underline"
          >
            {incharge.email}
          </a>
        </>
      )}
    </p>
  );
}
