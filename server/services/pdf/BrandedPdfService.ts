/**
 * BrandedPdfService — Shared PDF template for all CoAIleague documents.
 *
 * Enforces consistent branding across payroll, HR, compliance, and operations PDFs:
 *   - Header: company name + document type + CoAIleague platform credit
 *   - Footer: page numbers + document ID + generation timestamp + confidentiality
 *   - Standard LETTER size, professional margins, consistent typography
 *
 * Usage:
 *   const pdf = new BrandedPdfService({ docType: 'Payroll Summary', workspaceName: 'Acme Corp' });
 *   const doc = pdf.create();
 *   // ... add content ...
 *   pdf.finalize();        // draws footer on last page
 *   doc.pipe(res);
 *   doc.end();
 */

import PDFDocument from 'pdfkit';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';

export interface BrandedPdfOptions {
  docType: string;           // e.g. "Payroll Summary", "Pay Stub", "Incident Report"
  workspaceName: string;     // Tenant company name shown in header
  docId?: string;            // Optional pre-generated doc ID (auto-generated if omitted)
  subtitle?: string;         // Optional subtitle under docType
  confidential?: boolean;    // Default true — adds CONFIDENTIAL footer
}

const COLORS = {
  navy:    '#0F1B35',
  accent:  '#1E40AF',
  muted:   '#6B7280',
  divider: '#E5E7EB',
  text:    '#111827',
  white:   '#FFFFFF',
};

const MARGINS = { top: 80, bottom: 70, left: 60, right: 60 };
const PAGE_W = 612;  // LETTER width in points
const FOOTER_Y = 742;

export class BrandedPdfService {
  private doc: InstanceType<typeof PDFDocument>;
  private opts: Required<BrandedPdfOptions>;
  private pageCount = 0;

  constructor(opts: BrandedPdfOptions) {
    this.opts = {
      confidential: true,
      subtitle: '',
      docId: `DOC-${randomUUID().slice(0, 8).toUpperCase()}`,
      ...opts,
    };

    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: MARGINS,
      bufferPages: true,   // needed so we can write footer on all pages at finalize
      info: {
        Title: `${opts.docType} — ${opts.workspaceName}`,
        Author: 'CoAIleague Platform',
        CreationDate: new Date(),
      },
    });

    // Draw header on each new page (including first)
    this.doc.on('pageAdded', () => {
      this.pageCount++;
      this._drawHeader();
    });

    // Trigger first page header
    this.pageCount = 1;
    this._drawHeader();
  }

  /** Returns the underlying PDFDocument — pipe this to res or a stream. */
  get document(): InstanceType<typeof PDFDocument> {
    return this.doc;
  }

  /** Call AFTER all content is added. Draws footers on every page, then ends. */
  finalize(): void {
    const totalPages = this.doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      this.doc.switchToPage(i);
      this._drawFooter(i + 1, totalPages);
    }
    this.doc.flushPages();
  }

  // ── Shared layout helpers ──────────────────────────────────────────────────

  sectionTitle(text: string): this {
    this.doc.moveDown(0.5)
      .fontSize(11).font('Helvetica-Bold').fillColor(COLORS.accent)
      .text(text.toUpperCase(), { characterSpacing: 0.5 });
    this.doc.moveTo(MARGINS.left, this.doc.y + 3)
      .lineTo(PAGE_W - MARGINS.right, this.doc.y + 3)
      .strokeColor(COLORS.divider).lineWidth(0.5).stroke();
    this.doc.moveDown(0.5).font('Helvetica').fillColor(COLORS.text).fontSize(9);
    return this;
  }

  row(label: string, value: string, bold = false): this {
    const y = this.doc.y;
    this.doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
      .fillColor(COLORS.muted).text(label, MARGINS.left, y, { width: 200, continued: false });
    this.doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
      .fillColor(COLORS.text).text(value, MARGINS.left + 210, y);
    return this;
  }

  divider(): this {
    this.doc.moveDown(0.3)
      .moveTo(MARGINS.left, this.doc.y)
      .lineTo(PAGE_W - MARGINS.right, this.doc.y)
      .strokeColor(COLORS.divider).lineWidth(0.5).stroke()
      .moveDown(0.3);
    return this;
  }

  // ── Private rendering ──────────────────────────────────────────────────────

  private _drawHeader(): void {
    const doc = this.doc;
    // Navy header bar
    doc.rect(0, 0, PAGE_W, 58).fill(COLORS.navy);

    // Company name (left)
    doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.white)
      .text(this.opts.workspaceName, MARGINS.left, 14, { width: 320 });

    // Document type (left, smaller)
    doc.font('Helvetica').fontSize(9).fillColor('#93C5FD')
      .text(this.opts.docType.toUpperCase(), MARGINS.left, 34);

    // CoAIleague credit (right)
    doc.font('Helvetica').fontSize(8).fillColor('#93C5FD')
      .text('CoAIleague Platform', PAGE_W - MARGINS.right - 110, 14, { align: 'right', width: 110 });
    doc.font('Helvetica').fontSize(7).fillColor('#60A5FA')
      .text(format(new Date(), 'MMM d, yyyy'), PAGE_W - MARGINS.right - 110, 28, { align: 'right', width: 110 });

    // Subtitle if provided
    if (this.opts.subtitle) {
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
        .text(this.opts.subtitle, MARGINS.left, 62);
    }

    // Reset cursor below header
    doc.y = this.opts.subtitle ? 80 : 72;
    doc.fillColor(COLORS.text);
  }

  private _drawFooter(pageNum: number, totalPages: number): void {
    const doc = this.doc;
    const { docId, confidential, workspaceName, docType } = this.opts;

    // Footer divider
    doc.moveTo(MARGINS.left, FOOTER_Y)
      .lineTo(PAGE_W - MARGINS.right, FOOTER_Y)
      .strokeColor(COLORS.divider).lineWidth(0.5).stroke();

    doc.fontSize(7).font('Helvetica').fillColor(COLORS.muted);

    // Left: doc ID + generated
    doc.text(
      `${docId}  ·  Generated ${format(new Date(), "MMM d, yyyy h:mm a")}`,
      MARGINS.left, FOOTER_Y + 6,
      { width: 300 }
    );

    // Center: confidential
    if (confidential) {
      doc.font('Helvetica-Bold').fillColor(COLORS.muted)
        .text('CONFIDENTIAL', 0, FOOTER_Y + 6, { align: 'center', width: PAGE_W });
    }

    // Right: page number
    doc.font('Helvetica').fillColor(COLORS.muted)
      .text(`Page ${pageNum} of ${totalPages}`,
        PAGE_W - MARGINS.right - 80, FOOTER_Y + 6,
        { width: 80, align: 'right' });
  }
}
