import { Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { AppError } from "../../common/AppError";
import { ExportFormat, ReportTable } from "./reports.types";

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cell = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

const toXlsx = async (res: Response, table: ReportTable): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "BIOMED XPERT";
  const ws = wb.addWorksheet(table.title.slice(0, 31));
  ws.columns = table.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF005A9C" } };
  });
  table.rows.forEach((r) => ws.addRow(r));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${slug(table.title)}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
};

const toCsv = (res: Response, table: ReportTable): void => {
  const esc = (v: unknown): string => {
    const s = cell(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [table.columns.map((c) => esc(c.header)).join(",")];
  for (const row of table.rows) lines.push(table.columns.map((c) => esc(row[c.key])).join(","));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${slug(table.title)}.csv"`);
  res.send(lines.join("\n"));
};

const toPdf = (res: Response, table: ReportTable): void => {
  const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${slug(table.title)}.pdf"`);
  doc.pipe(res);

  doc.fillColor("#005A9C").fontSize(16).text(table.title, { align: "left" });
  doc.moveDown(0.6);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalW = table.columns.reduce((s, c) => s + (c.width ?? 18), 0);
  const widths = table.columns.map((c) => ((c.width ?? 18) / totalW) * pageWidth);
  const startX = doc.page.margins.left;

  const drawRow = (values: string[], bold: boolean, bg?: string): void => {
    const y = doc.y;
    const height = 18;
    if (bg) doc.rect(startX, y, pageWidth, height).fill(bg);
    let x = startX;
    doc.fillColor(bold ? "#FFFFFF" : "#0F1B2D").font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    values.forEach((v, i) => {
      doc.text(v, x + 4, y + 5, { width: widths[i] - 8, height, ellipsis: true, lineBreak: false });
      x += widths[i];
    });
    doc.y = y + height;
  };

  drawRow(table.columns.map((c) => c.header), true, "#005A9C");
  table.rows.forEach((row, idx) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      drawRow(table.columns.map((c) => c.header), true, "#005A9C");
    }
    drawRow(table.columns.map((c) => cell(row[c.key])), false, idx % 2 ? "#F1F5F9" : undefined);
  });

  doc.end();
};

export const exportTable = async (res: Response, table: ReportTable, format: ExportFormat): Promise<void> => {
  switch (format) {
    case "json":
      res.status(200).json({ success: true, data: table });
      return;
    case "xlsx":
      await toXlsx(res, table);
      return;
    case "csv":
      toCsv(res, table);
      return;
    case "pdf":
      toPdf(res, table);
      return;
    default:
      throw new AppError(400, "UNSUPPORTED_FORMAT", "Use one of: json, xlsx, csv, pdf");
  }
};
