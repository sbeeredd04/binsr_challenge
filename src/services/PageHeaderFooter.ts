/**
 * Page Header and Footer Service
 * Adds page numbers and footers to all pages
 * Follows TREC template format: "REI 7-6 (8/9/21)" and "Page X of Y"
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { Logger } from '../utils/logger';

export class PageHeaderFooter {
  private logger = new Logger('PageHeaderFooter');
  private font: any;

  constructor(private pdfDoc: PDFDocument) {}

  /**
   * Add page numbers and footers to all pages
   */
  public async addPageNumbersAndFooters(
    reportTitle: string,
    inspectorName: string,
    propertyAddress: string
  ): Promise<void> {
    this.logger.info('Adding page numbers and footers...');

    // Load font
    this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = this.pdfDoc.getPages();
    const totalPages = pages.length;

    this.logger.info(`  Total pages: ${totalPages}`);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNumber = i + 1;

      // Skip page 1 (cover/header page) for page numbers
      if (pageNumber === 1) {
        // Just add footer on page 1
        this.addFooter(page, reportTitle);
        continue;
      }

      // Add page number
      this.addPageNumber(page, pageNumber, totalPages);

      // Add footer
      this.addFooter(page, reportTitle);
    }

    this.logger.info(`  ✓ Added page numbers and footers to ${totalPages} pages`);
  }

  /**
   * Add page number to page (top center or as field)
   */
  private addPageNumber(page: PDFPage, pageNumber: number, totalPages: number): void {
    const { width, height } = page.getSize();
    
    // Page number text
    const pageText = `Page ${pageNumber} of ${totalPages}`;

    // Draw at top center
    const textWidth = this.font.widthOfTextAtSize(pageText, 10);
    page.drawText(pageText, {
      x: (width - textWidth) / 2,
      y: height - 30,
      size: 10,
      font: this.font,
      color: rgb(0.3, 0.3, 0.3)
    });
  }

  /**
   * Add footer to page (bottom of page)
   */
  private addFooter(page: PDFPage, reportTitle: string): void {
    const { width } = page.getSize();

    // Footer left: "REI 7-6 (8/9/21)"
    const footerLeft = 'REI 7-6 (8/9/21)';
    page.drawText(footerLeft, {
      x: 50,
      y: 30,
      size: 9,
      font: this.font,
      color: rgb(0.3, 0.3, 0.3)
    });

    // Footer center: Report title
    const footerCenter = reportTitle;
    const centerWidth = this.font.widthOfTextAtSize(footerCenter, 9);
    page.drawText(footerCenter, {
      x: (width - centerWidth) / 2,
      y: 30,
      size: 9,
      font: this.font,
      color: rgb(0.3, 0.3, 0.3)
    });

    // Footer right: URL
    const footerRight = 'www.trec.texas.gov';
    const rightWidth = this.font.widthOfTextAtSize(footerRight, 9);
    page.drawText(footerRight, {
      x: width - rightWidth - 50,
      y: 30,
      size: 9,
      font: this.font,
      color: rgb(0.3, 0.3, 0.3)
    });

    // Draw line above footer
    page.drawLine({
      start: { x: 50, y: 50 },
      end: { x: width - 50, y: 50 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    });
  }
}
