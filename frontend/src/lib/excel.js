// Excel export used by list pages.
// The spreadsheet library is large, so it is only downloaded
// when someone actually clicks a download button.

const cellText = (value) =>
  value === null || value === undefined ? "" : String(value);

export const downloadExcel = async (
  rows,
  fileName,
  sheetName = "Sheet1"
) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }

  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column widths that fit the content
  const headers = Object.keys(rows[0]);

  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.min(
      45,
      Math.max(
        header.length,
        ...rows.map((row) => cellText(row[header]).length)
      ) + 2
    ),
  }));

  const workbook = XLSX.utils.book_new();

  // Sheet names: max 31 characters, no special characters
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName.replace(/[\/?*[\]:]/g, " ").slice(0, 31)
  );

  const date = new Date().toISOString().slice(0, 10);

  const safeName = fileName
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "_");

  XLSX.writeFile(workbook, `${safeName}_${date}.xlsx`);

  return true;
};
