import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportPDF = (columns, rows, fileName = "table") => {
  const doc = new jsPDF();

  // Format columns for autoTable
  const tableColumnHeaders = columns.map((col) => col.headerName);
  const tableRows = rows.map((row) =>
    columns.map((col) => {
      if (col.render) {
        return col.render(row[col.field], row);
      }
      return row[col.field] || "";
    })
  );

  autoTable(doc, {
    head: [tableColumnHeaders],
    body: tableRows,
  });

  doc.save(`${fileName}.pdf`);
};