/**
 * TREC Page Builder
 * Builds TREC-formatted pages from scratch with proper section organization
 * Format: Section Header → Checkboxes → Comments → Images → Videos → Next Section
 */

import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import * as fs from 'fs/promises';
import { Logger } from '../utils/logger';
import { TRECItem } from '../types/trec';
import { findTRECSubsection, TREC_TEMPLATE_SECTIONS, TRECSection } from '../config/sectionMapping';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

export class TRECPageBuilder {
  private logger = new Logger('TRECPageBuilder');
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
   * Build all TREC inspection pages
   * Replaces pages 3-6 with dynamically generated pages
   */
  public async buildTRECPages(
    items: TRECItem[],
    propertyAddress: string,
    startingPageNumber: number = 3
  ): Promise<number> {
    await this.initFonts();

    this.logger.info('\nBuilding TREC inspection pages from scratch...');
    this.logger.info('Format: Section → Checkboxes → Comments → Media');

    let pageNumber = startingPageNumber;
    let totalPages = 0;

    // Group items by TREC section
    const itemsBySection = this.groupItemsByTRECSection(items);

    // Build pages for each section
    for (const section of TREC_TEMPLATE_SECTIONS) {
      const sectionItems = itemsBySection.get(section.romanNumeral);
      if (!sectionItems || sectionItems.length === 0) {
        continue;
      }

      this.logger.info(`\n${section.romanNumeral}. ${section.name} (${sectionItems.length} items)`);

      const pagesAdded = await this.buildSectionPages(
        section,
        sectionItems,
        pageNumber,
        propertyAddress
      );

      pageNumber += pagesAdded;
      totalPages += pagesAdded;
    }

    // Handle unmatched items
    const unmatchedItems = itemsBySection.get('UNMATCHED');
    if (unmatchedItems && unmatchedItems.length > 0) {
      this.logger.info(`\nADDITIONAL ITEMS (${unmatchedItems.length} items)`);
      
      const pagesAdded = await this.buildAdditionalItemsPages(
        unmatchedItems,
        pageNumber,
        propertyAddress
      );

      totalPages += pagesAdded;
    }

    this.logger.success(`Built ${totalPages} TREC inspection pages`);
    return totalPages;
  }

  /**
   * Group items by TREC section
   */
  private groupItemsByTRECSection(items: TRECItem[]): Map<string, TRECItem[]> {
    const groups = new Map<string, TRECItem[]>();

    for (const item of items) {
      const subsection = findTRECSubsection(item.title, item.section);
      
      let key: string;
      if (subsection) {
        const mainSection = TREC_TEMPLATE_SECTIONS.find(s =>
          s.subsections.some(sub => sub.checkboxIndex === subsection.checkboxIndex)
        );
        key = mainSection?.romanNumeral || 'UNMATCHED';
      } else {
        key = 'UNMATCHED';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    return groups;
  }

  /**
   * Build pages for a single TREC section
   */
  private async buildSectionPages(
    section: TRECSection,
    items: TRECItem[],
    startPageNumber: number,
    propertyAddress: string
  ): Promise<number> {
    let pagesAdded = 0;
    let currentPage = this.createPage();
    let y = PAGE_HEIGHT - 120; // Start below header

    // Add page header
    this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
    pagesAdded++;

    // Section title
    currentPage.drawText(`${section.romanNumeral}. ${section.name}`, {
      x: MARGIN,
      y,
      size: 14,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    y -= 30;

    // For each item in this section
    for (const item of items) {
      // Check if we need a new page
      if (y < 150) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
        y = PAGE_HEIGHT - 120;
        pagesAdded++;
      }

      // Subsection label and checkboxes
      const subsection = findTRECSubsection(item.title, item.section);
      if (subsection) {
        y = this.addSubsectionWithCheckboxes(currentPage, subsection.letter, item, y);
      } else {
        // No checkbox, just title
        y = this.addItemTitle(currentPage, item, y);
      }

      // Comments
      if (item.comments.length > 0) {
        for (const comment of item.comments) {
          // Check for page break
          if (y < 100) {
            currentPage = this.createPage();
            this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
            y = PAGE_HEIGHT - 120;
            pagesAdded++;
          }

          y = this.addComment(currentPage, comment, y);
        }
      }

      // Images
      for (const photo of item.photos) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
        pagesAdded++;

        await this.addImage(currentPage, photo.url, photo.caption || '');
      }

      // Videos
      for (const video of item.videos) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
        pagesAdded++;

        await this.addVideoQR(currentPage, video.url, video.caption || '');
      }

      y -= 10; // Space between items
    }

    return pagesAdded;
  }

  /**
   * Build pages for unmatched items
   */
  private async buildAdditionalItemsPages(
    items: TRECItem[],
    startPageNumber: number,
    propertyAddress: string
  ): Promise<number> {
    // Similar to buildSectionPages but without section headers
    let pagesAdded = 0;
    let currentPage = this.createPage();
    let y = PAGE_HEIGHT - 120;

    this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
    pagesAdded++;

    currentPage.drawText('ADDITIONAL ITEMS', {
      x: MARGIN,
      y,
      size: 14,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    y -= 30;

    for (const item of items) {
      if (y < 150) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
        y = PAGE_HEIGHT - 120;
        pagesAdded++;
      }

      y = this.addItemTitle(currentPage, item, y);

      for (const comment of item.comments) {
        if (y < 100) {
          currentPage = this.createPage();
          this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
          y = PAGE_HEIGHT - 120;
          pagesAdded++;
        }
        y = this.addComment(currentPage, comment, y);
      }

      for (const photo of item.photos) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
        pagesAdded++;
        await this.addImage(currentPage, photo.url, photo.caption || '');
      }

      for (const video of item.videos) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage, startPageNumber + pagesAdded, propertyAddress);
        pagesAdded++;
        await this.addVideoQR(currentPage, video.url, video.caption || '');
      }

      y -= 10;
    }

    return pagesAdded;
  }

  /**
   * Create a blank page
   */
  private createPage(): PDFPage {
    return this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  /**
   * Add TREC-style page header
   */
  private addPageHeader(page: PDFPage, pageNumber: number, propertyAddress: string): void {
    // Top line
    page.drawText('REI 7-6 (8/9/21)', {
      x: MARGIN,
      y: PAGE_HEIGHT - 20,
      size: 9,
      font: this.font!
    });

    const topRight = 'Promulgated by the Texas Real Estate Commission • (512) 936-3000 • www.trec.texas.gov';
    const topRightWidth = this.font!.widthOfTextAtSize(topRight, 9);
    page.drawText(topRight, {
      x: PAGE_WIDTH - MARGIN - topRightWidth,
      y: PAGE_HEIGHT - 20,
      size: 9,
      font: this.font!
    });

    // Line
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 25 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 25 },
      thickness: 1
    });

    // Report ID
    page.drawText('Report Identification: ___________________________________________', {
      x: MARGIN,
      y: PAGE_HEIGHT - 45,
      size: 10,
      font: this.font!
    });

    // Legend
    const legendY = PAGE_HEIGHT - 70;
    page.drawRectangle({
      x: MARGIN,
      y: legendY - 5,
      width: CONTENT_WIDTH,
      height: 20,
      borderWidth: 1,
      borderColor: rgb(0, 0, 0)
    });

    const legendText = 'I=Inspected    NI=Not Inspected    NP=Not Present    D=Deficient';
    page.drawText(legendText, {
      x: MARGIN + 10,
      y: legendY,
      size: 10,
      font: this.font!
    });

    // Footer
    const footerY = 30;
    
    if (propertyAddress) {
      const addr = propertyAddress.length > 50 ? propertyAddress.substring(0, 47) + '...' : propertyAddress;
      page.drawText(addr, {
        x: MARGIN,
        y: footerY,
        size: 8,
        font: this.font!
      });
    }

    const pageText = `Page ${pageNumber}`;
    const pageTextWidth = this.font!.widthOfTextAtSize(pageText, 10);
    page.drawText(pageText, {
      x: (PAGE_WIDTH - pageTextWidth) / 2,
      y: footerY,
      size: 10,
      font: this.font!
    });

    // Line above footer
    page.drawLine({
      start: { x: MARGIN, y: footerY + 15 },
      end: { x: PAGE_WIDTH - MARGIN, y: footerY + 15 },
      thickness: 0.5
    });
  }

  /**
   * Add subsection with checkboxes
   */
  private addSubsectionWithCheckboxes(page: PDFPage, letter: string, item: TRECItem, y: number): number {
    // Subsection letter and title
    page.drawText(`${letter}. ${item.title}`, {
      x: MARGIN + 10,
      y,
      size: 11,
      font: this.fontBold!
    });
    y -= 20;

    // Checkboxes
    const checkboxY = y;
    const checkboxSize = 12;
    const spacing = 80;

    const checkboxes = ['I', 'NI', 'NP', 'D'];
    for (let i = 0; i < checkboxes.length; i++) {
      const x = MARGIN + 30 + (i * spacing);
      
      // Draw checkbox
      page.drawRectangle({
        x,
        y: checkboxY,
        width: checkboxSize,
        height: checkboxSize,
        borderWidth: 1,
        borderColor: rgb(0, 0, 0)
      });

      // Check if this is the selected status
      if (item.status === checkboxes[i]) {
        page.drawText('X', {
          x: x + 2,
          y: checkboxY + 2,
          size: 10,
          font: this.fontBold!
        });
      }

      // Label
      page.drawText(checkboxes[i], {
        x: x + checkboxSize + 5,
        y: checkboxY + 2,
        size: 10,
        font: this.font!
      });
    }

    return checkboxY - 20;
  }

  /**
   * Add item title (no checkbox)
   */
  private addItemTitle(page: PDFPage, item: TRECItem, y: number): number {
    page.drawText(item.title, {
      x: MARGIN + 10,
      y,
      size: 11,
      font: this.fontBold!
    });
    return y - 20;
  }

  /**
   * Add comment
   */
  private addComment(page: PDFPage, comment: string, y: number): number {
    const lines = this.wrapText(comment, CONTENT_WIDTH - 20, 10);
    
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN + 20,
        y,
        size: 10,
        font: this.font!
      });
      y -= 14;
    }

    return y - 5;
  }

  /**
   * Add image
   */
  private async addImage(page: PDFPage, url: string, caption: string): Promise<void> {
    try {
      const imageBytes = await this.downloadImage(url);
      const image = url.toLowerCase().match(/\.(png|gif)$/)
        ? await this.pdfDoc.embedPng(imageBytes)
        : await this.pdfDoc.embedJpg(imageBytes);

      const dims = this.scaleImage(image.width, image.height);
      
      page.drawImage(image, {
        x: (PAGE_WIDTH - dims.width) / 2,
        y: 350,
        width: dims.width,
        height: dims.height
      });

      if (caption) {
        page.drawText(caption, {
          x: MARGIN,
          y: 320,
          size: 9,
          font: this.font!
        });
      }
    } catch (error) {
      this.logger.error(`Failed to add image: ${url}`, error);
    }
  }

  /**
   * Add video QR code
   */
  private async addVideoQR(page: PDFPage, url: string, caption: string): Promise<void> {
    try {
      const qrBuffer = await QRCode.toBuffer(url, { width: 200, margin: 1 });
      const qrImage = await this.pdfDoc.embedPng(qrBuffer);

      const qrSize = 200;
      page.drawImage(qrImage, {
        x: (PAGE_WIDTH - qrSize) / 2,
        y: 400,
        width: qrSize,
        height: qrSize
      });

      page.drawText('Scan QR code to view video', {
        x: MARGIN,
        y: 370,
        size: 10,
        font: this.font!
      });

      if (caption) {
        page.drawText(caption, {
          x: MARGIN,
          y: 350,
          size: 9,
          font: this.font!
        });
      }
    } catch (error) {
      this.logger.error(`Failed to add QR code: ${url}`, error);
    }
  }

  /**
   * Wrap text
   */
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/[\t]/g, ' ').replace(/  +/g, ' ').trim();
    const words = cleanText.split(' ');
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
      const testLine = line + word + ' ';
      const width = this.font!.widthOfTextAtSize(testLine, fontSize);

      if (width > maxWidth && line !== '') {
        lines.push(line);
        line = word + ' ';
      } else {
        line = testLine;
      }
    }

    if (line !== '') {
      lines.push(line);
    }

    return lines;
  }

  /**
   * Download image
   */
  private async downloadImage(url: string): Promise<Buffer> {
    if (url.startsWith('http')) {
      const https = await import('https');
      const http = await import('http');
      const client = url.startsWith('https') ? https : http;

      return new Promise((resolve, reject) => {
        client.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed: ${response.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });
    } else {
      return await fs.readFile(url);
    }
  }

  /**
   * Scale image to fit
   */
  private scaleImage(width: number, height: number): { width: number; height: number } {
    const maxWidth = 500;
    const maxHeight = 300;

    let w = width;
    let h = height;

    if (w > maxWidth) {
      const ratio = maxWidth / w;
      w = maxWidth;
      h = h * ratio;
    }

    if (h > maxHeight) {
      const ratio = maxHeight / h;
      h = maxHeight;
      w = w * ratio;
    }

    return { width: w, height: h };
  }
}

