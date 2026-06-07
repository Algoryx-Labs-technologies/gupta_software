import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_SRC } from '@/components/Logo';

const COMPANY_NAME = 'Gupta Traders';
const BRAND_BLUE: [number, number, number] = [30, 58, 138];

export interface PdfColumn {
  header: string;
  dataKey: string;
}

async function loadLogoAsPng(): Promise<string | null> {
  try {
    const response = await fetch(LOGO_SRC);
    if (!response.ok) return null;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 480;
        canvas.height = img.naturalHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

function drawTextHeader(doc: jsPDF, title: string, startY: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(COMPANY_NAME, 14, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Inventory & Purchase Management', 14, startY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, startY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${formatGeneratedAt()}`, 14, startY + 22);

  return startY + 28;
}

function formatGeneratedAt() {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addPageFooters(doc: jsPDF, title: string) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${COMPANY_NAME} — ${title}`, 14, pageHeight - 8);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

export async function exportToPdf(
  title: string,
  columns: PdfColumn[],
  data: Record<string, unknown>[],
  filename: string,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const logo = await loadLogoAsPng();
  let tableStartY: number;

  if (logo) {
    doc.addImage(logo, 'PNG', 14, 8, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 46, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${formatGeneratedAt()}`, 46, 24);
    tableStartY = 42;
  } else {
    tableStartY = drawTextHeader(doc, title, 14);
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [columns.map((column) => column.header)],
    body: data.map((row) => columns.map((column) => String(row[column.dataKey] ?? ''))),
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  addPageFooters(doc, title);
  doc.save(`${filename}.pdf`);
}
