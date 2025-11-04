/**
 * Template Page Replicator
 * Replicates the TREC template header and footer format on new pages
 * Ensures consistency with the official TREC REI 7-6 format
 */

import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { Logger } from '../utils/logger';

export class TemplatePageReplicator {
  private logger = new Logger('TemplatePageReplicator');
  private font: PDFFont | null = null;
  private fontBold: PDFFont | null = null;

  constructor(private pdfDoc: PDFDocument) {}

  /**
   * Initialize fonts
   */
  private async initFonts(): Promise<void> {
    if (!this.font) {
      this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
      this.fontBold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
  }

  /**
   * Add TREC-formatted header to a page
   * Replicates the format from template pages 3-6
   */
  public async addTRECHeader(page: PDFPage): Promise<void> {
    await this.initFonts();
    const { width, height } = page.getSize();

    // Top line: "REI 7-6 (8/9/21)" on left, "Promulgated by..." on right  
    // (This appears at the VERY top of pages 3-6)
    const topY = height - 20;
    
    page.drawText('REI 7-6 (8/9/21)', {
      x: 50,
      y: topY,
      size: 9,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    const topRightText = 'Promulgated by the Texas Real Estate Commission • (512) 936-3000 • www.trec.texas.gov';
    const topRightWidth = this.font!.widthOfTextAtSize(topRightText, 9);
    page.drawText(topRightText, {
      x: width - topRightWidth - 50,
      y: topY,
      size: 9,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    // Horizontal line below top text
    page.drawLine({
      start: { x: 50, y: topY - 5 },
      end: { x: width - 50, y: topY - 5 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    // "Report Identification:" label
    page.drawText('Report Identification:', {
      x: 60,
      y: height - 45,
      size: 10,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    // Line for report ID
    page.drawLine({
      start: { x: 175, y: height - 42 },
      end: { x: width - 50, y: height - 42 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });

    // Legend: "I=Inspected  NI=Not Inspected  NP=Not Present  D=Deficient"
    const legendY = height - 65;
    page.drawText('I', {
      x: 50,
      y: legendY,
      size: 10,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    page.drawText('=Inspected', {
      x: 60,
      y: legendY,
      size: 10,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    page.drawText('NI', {
      x: 150,
      y: legendY,
      size: 10,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    page.drawText('=Not Inspected', {
      x: 170,
      y: legendY,
      size: 10,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    page.drawText('NP', {
      x: 290,
      y: legendY,
      size: 10,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    page.drawText('=Not Present', {
      x: 315,
      y: legendY,
      size: 10,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    page.drawText('D', {
      x: 430,
      y: legendY,
      size: 10,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    page.drawText('=Deficient', {
      x: 445,
      y: legendY,
      size: 10,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    // Box around legend
    page.drawRectangle({
      x: 45,
      y: legendY - 8,
      width: width - 95,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: undefined // transparent fill
    });
  }

  /**
   * Add TREC-formatted footer to a page
   * Includes page number in the exact format from template
   */
  public async addTRECFooter(page: PDFPage, pageNumber: number, totalPages: number, propertyAddress?: string): Promise<void> {
    await this.initFonts();
    const { width } = page.getSize();

    const footerY = 30;

    // Left: "251 N Bristol Ave, Los Angeles, CA 90049" (property address)
    if (propertyAddress) {
      const addressText = propertyAddress.length > 50 ? propertyAddress.substring(0, 47) + '...' : propertyAddress;
      page.drawText(addressText, {
        x: 50,
        y: footerY,
        size: 8,
        font: this.font!,
        color: rgb(0, 0, 0)
      });
    }

    // Center: "Page X of Y"
    const pageText = `Page ${pageNumber} of ${totalPages}`;
    const pageTextWidth = this.font!.widthOfTextAtSize(pageText, 10);
    page.drawText(pageText, {
      x: (width - pageTextWidth) / 2,
      y: footerY,
      size: 10,
      font: this.font!,
      color: rgb(0, 0, 0)
    });

    // Right: "Binsr" (inspector name - will be dynamic)
    // For now, leave space for it

    // Horizontal line above footer
    page.drawLine({
      start: { x: 50, y: footerY + 15 },
      end: { x: width - 50, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(0, 0, 0)
    });
  }

  /**
   * Create a new page with TREC template formatting
   * This is used when comments/content overflow from template pages
   */
  public async createTRECFormattedPage(
    sectionTitle: string,
    pageNumber: number,
    totalPages: number,
    propertyAddress?: string
  ): Promise<PDFPage> {
    const page = this.pdfDoc.addPage([612, 792]); // Letter size

    // Add header
    await this.addTRECHeader(page);

    // Add section title
    await this.initFonts();
    page.drawText(sectionTitle, {
      x: 50,
      y: 692, // Just below header
      size: 12,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });

    // Underline section
    page.drawLine({
      start: { x: 50, y: 688 },
      end: { x: 562, y: 688 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    // Add footer
    await this.addTRECFooter(page, pageNumber, totalPages, propertyAddress);

    return page;
  }

  /**
   * Update page numbers on all pages
   * Call this after all pages are created
   */
  public async updateAllPageNumbers(propertyAddress?: string): Promise<void> {
    await this.initFonts();
    
    this.logger.info('Updating page numbers on all pages...');
    
    const pages = this.pdfDoc.getPages();
    const totalPages = pages.length;

    // Start from page 3 (index 2) - pages 1-2 are headers
    for (let i = 2; i < pages.length; i++) {
      const page = pages[i];
      const pageNumber = i + 1;

      // Add footer if not already present
      await this.addTRECFooter(page, pageNumber, totalPages, propertyAddress);
    }

    this.logger.info(`✓ Updated ${pages.length - 2} pages`);
  }
}

