/**
 * RFC 4180–style CSV helpers with Excel-friendly UTF-8 BOM.
 */

export function escapeCsvField(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows — each row is an array of cell values in header order
 */
export function rowsToCsv(headers, rows) {
  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ];
  return lines.join('\n');
}

/**
 * @param {string} filename — with or without .csv
 * @param {string} csvString — raw CSV body (no BOM); BOM is prepended here
 */
export function downloadCsv(filename, csvString) {
  const name = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const blob = new Blob([`\uFEFF${csvString}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvFromRows(filename, headers, rows) {
  downloadCsv(filename, rowsToCsv(headers, rows));
}
