import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetName = "Sheet1",
) {
  const data = rows.map((row) => {
    const record: Record<string, string | number> = {};
    for (const col of columns) {
      record[col.header] = col.accessor(row);
    }
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  title: string,
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("AEROVAULT", 14, 16);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(title, 14, 23);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);

  autoTable(doc, {
    startY: 34,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(c.accessor(row)))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  doc.save(`${fileName}.pdf`);
}
