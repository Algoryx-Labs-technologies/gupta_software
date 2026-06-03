import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPdf(
  title: string,
  columns: { header: string; dataKey: string }[],
  data: Record<string, unknown>[],
  filename: string,
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(title, 14, 18);

  autoTable(doc, {
    startY: 24,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((c) => String(row[c.dataKey] ?? ''))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${filename}.pdf`);
}
