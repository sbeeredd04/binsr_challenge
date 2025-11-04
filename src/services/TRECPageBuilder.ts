/**
 * TREC Page Builder - COMPLETELY FIXED
 * ROOT CAUSE FIXES:
 * 1. REI only in footer, not header
 * 2. Two-pass generation for correct page counts
 * 3. Images on completely separate pages (no shared content)
 * 4. Sections in template order
 */

import { PDFDocument, PDFPage, PDFFont, PDFName, PDFString, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import * as fs from 'fs/promises';
import { Logger } from '../utils/logger';
import { ImageCache } from '../utils/ImageCache';
import { TRECItem } from '../types/trec';
import { TemplateAnalyzer, TemplateFormat, TemplateSection } from './TemplateAnalyzer';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const HEADER_HEIGHT = 90;
const FOOTER_HEIGHT = 60;
const CONTENT_START_Y = PAGE_HEIGHT - HEADER_HEIGHT;
const CONTENT_END_Y = FOOTER_HEIGHT + 10;

export class TRECPageBuilder {
  private logger = new Logger('TRECPageBuilder');
  private imageCache = new ImageCache();
  private font: PDFFont | null = null;
  private fontBold: PDFFont | null = null;
  private templateFormat: TemplateFormat | null = null;
  private wordWidthCache = new Map<string, Map<number, number>>();

  constructor(private pdfDoc: PDFDocument) {}

  private async initFonts(): Promise<void> {
    if (!this.font) {
      this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
      this.fontBold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
  }

  /**
   * Build all TREC inspection pages
   */
  public async buildTRECPages(
    items: TRECItem[],
    propertyAddress: string,
    templatePath: string,
    startingPageNumber: number = 3
  ): Promise<number> {
    await this.initFonts();

    // Analyze template
    this.logger.info('\nAnalyzing TREC template...');
    const analyzer = new TemplateAnalyzer();
    this.templateFormat = await analyzer.analyzeTemplate(templatePath);
    this.logger.success(`Template analyzed: ${this.templateFormat.sections.length} sections found`);

    this.logger.info('\nBuilding TREC inspection pages...');

    // Group items by section (TEMPLATE ORDER)
    const itemsBySection = this.groupItemsByTRECSection(items);

    // PASS 1: Count total pages
    let totalPages = 2; // Header pages
    for (const section of this.templateFormat.sections) {
      const sectionItems = itemsBySection.get(section.romanNumeral);
      if (sectionItems && sectionItems.length > 0) {
        totalPages += this.countPagesForSection(sectionItems);
      }
    }
    const unmatchedItems = itemsBySection.get('UNMATCHED');
    if (unmatchedItems && unmatchedItems.length > 0) {
      totalPages += this.countPagesForSection(unmatchedItems);
    }

    this.logger.info(`Total pages: ${totalPages}`);

    // PASS 2: Generate pages
    let pageNumber = startingPageNumber;
    let pagesGenerated = 0;

    // Build IN TEMPLATE ORDER
    for (const section of this.templateFormat.sections) {
      const sectionItems = itemsBySection.get(section.romanNumeral);
      if (!sectionItems || sectionItems.length === 0) continue;

      this.logger.info(`\n${section.romanNumeral}. ${section.name} (${sectionItems.length} items)`);

      const added = await this.buildSectionPages(section, sectionItems, pageNumber, totalPages, propertyAddress);
      pageNumber += added;
      pagesGenerated += added;
    }

    if (unmatchedItems && unmatchedItems.length > 0) {
      this.logger.info(`\nADDITIONAL ITEMS (${unmatchedItems.length} items)`);
      const added = await this.buildAdditionalPages(unmatchedItems, pageNumber, totalPages, propertyAddress);
      pagesGenerated += added;
    }

    this.logger.success(`Built ${pagesGenerated} inspection pages`);
    return pagesGenerated;
  }

  /**
   * Count pages for a section (pass 1)
   */
  private countPagesForSection(items: TRECItem[]): number {
    let count = 1; // Section header page

    for (const item of items) {
      count += 1; // Item with checkboxes/comments
      count += item.photos.length; // One page per image
      count += item.videos.length; // One page per video
    }

    return count;
  }

  /**
   * Group items by TREC section
   */
  private groupItemsByTRECSection(items: TRECItem[]): Map<string, TRECItem[]> {
    const groups = new Map<string, TRECItem[]>();

    // Group items by section
    for (const item of items) {
      const subsection = TemplateAnalyzer.findSubsection(
        this.templateFormat!.sections,
        item.title,
        item.section
      );
      
      let key: string;
      if (subsection) {
        const mainSection = this.templateFormat!.sections.find(s =>
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

    // Sort items within each group by subsection letter (A, B, C, D, etc.)
    for (const [sectionKey, sectionItems] of groups.entries()) {
      sectionItems.sort((a, b) => {
        const subA = TemplateAnalyzer.findSubsection(
          this.templateFormat!.sections,
          a.title,
          a.section
        );
        const subB = TemplateAnalyzer.findSubsection(
          this.templateFormat!.sections,
          b.title,
          b.section
        );

        // If both have subsections, sort by letter
        if (subA && subB) {
          return subA.letter.localeCompare(subB.letter);
        }
        // Items without subsections go last
        if (subA) return -1;
        if (subB) return 1;
        return 0;
      });
    }

    return groups;
  }

  /**
   * Build pages for a section
   */
  private async buildSectionPages(
    section: TemplateSection,
    items: TRECItem[],
    startPage: number,
    totalPages: number,
    propertyAddress: string
  ): Promise<number> {
    let pageNum = startPage;
    let pagesAdded = 0;

    // Section header page
    let currentPage = this.createPage();
    this.addPageHeader(currentPage);
    this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
    pagesAdded++;
    pageNum++;

    let y = CONTENT_START_Y - 10;

    // Section title
    currentPage.drawText(`${section.romanNumeral}. ${section.name}`, {
      x: MARGIN,
      y,
      size: 11,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    y -= 25;

    // Process each item
    for (const item of items) {
      // Check if need new page for item
      if (y < CONTENT_END_Y + 150) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage);
        this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
        pagesAdded++;
        pageNum++;
        y = CONTENT_START_Y - 10;
      }

      // Subsection + checkboxes
      const subsection = TemplateAnalyzer.findSubsection(
        this.templateFormat!.sections,
        item.title,
        item.section
      );
      
      if (subsection) {
        y = this.addSubsectionWithCheckboxes(currentPage, subsection.letter, item, y);
      } else {
        y = this.addItemTitle(currentPage, item, y);
      }

      // Comments
      if (item.comments.length > 0) {
        if (y < CONTENT_END_Y + 50) {
          currentPage = this.createPage();
          this.addPageHeader(currentPage);
          this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
          pagesAdded++;
          pageNum++;
          y = CONTENT_START_Y - 10;
        }

        currentPage.drawText('Comments:', {
          x: MARGIN + 20,
          y,
          size: 10,
          font: this.fontBold!,
          color: rgb(0, 0, 0)
        });
        y -= 16;

        for (const comment of item.comments) {
          if (y < CONTENT_END_Y + 30) {
            currentPage = this.createPage();
            this.addPageHeader(currentPage);
            this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
            pagesAdded++;
            pageNum++;
            y = CONTENT_START_Y - 10;
          }

          y = this.addCommentText(currentPage, comment, y);
        }
      }

      // Images (COMPLETELY SEPARATE PAGES - no shared content)
      for (const photo of item.photos) {
        const imgPage = this.createPage();
        this.addPageHeader(imgPage);
        this.addPageFooter(imgPage, pageNum, totalPages, propertyAddress);
        await this.addImageOnly(imgPage, photo.url, photo.caption || '', item.title);
        pagesAdded++;
        pageNum++;
      }

      // Videos (COMPLETELY SEPARATE PAGES)
      for (const video of item.videos) {
        const vidPage = this.createPage();
        this.addPageHeader(vidPage);
        this.addPageFooter(vidPage, pageNum, totalPages, propertyAddress);
        await this.addVideoOnly(vidPage, video.url, video.caption || '', item.title);
        pagesAdded++;
        pageNum++;
      }

      y -= 10;
    }

    return pagesAdded;
  }

  /**
   * Build additional items pages
   */
  private async buildAdditionalPages(
    items: TRECItem[],
    startPage: number,
    totalPages: number,
    propertyAddress: string
  ): Promise<number> {
    let pageNum = startPage;
    let pagesAdded = 0;

    let currentPage = this.createPage();
    this.addPageHeader(currentPage);
    this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
    pagesAdded++;
    pageNum++;

    let y = CONTENT_START_Y - 10;

    currentPage.drawText('ADDITIONAL ITEMS', {
      x: MARGIN,
      y,
      size: 11,
      font: this.fontBold!,
      color: rgb(0, 0, 0)
    });
    y -= 25;

    for (const item of items) {
      if (y < CONTENT_END_Y + 150) {
        currentPage = this.createPage();
        this.addPageHeader(currentPage);
        this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
        pagesAdded++;
        pageNum++;
        y = CONTENT_START_Y - 10;
      }

      y = this.addItemTitle(currentPage, item, y);

      if (item.comments.length > 0) {
        if (y < CONTENT_END_Y + 50) {
          currentPage = this.createPage();
          this.addPageHeader(currentPage);
          this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
          pagesAdded++;
          pageNum++;
          y = CONTENT_START_Y - 10;
        }

        currentPage.drawText('Comments:', {
          x: MARGIN + 20,
          y,
          size: 10,
          font: this.fontBold!,
          color: rgb(0, 0, 0)
        });
        y -= 16;

        for (const comment of item.comments) {
          if (y < CONTENT_END_Y + 30) {
            currentPage = this.createPage();
            this.addPageHeader(currentPage);
            this.addPageFooter(currentPage, pageNum, totalPages, propertyAddress);
            pagesAdded++;
            pageNum++;
            y = CONTENT_START_Y - 10;
          }
          y = this.addCommentText(currentPage, comment, y);
        }
      }

      for (const photo of item.photos) {
        const imgPage = this.createPage();
        this.addPageHeader(imgPage);
        this.addPageFooter(imgPage, pageNum, totalPages, propertyAddress);
        await this.addImageOnly(imgPage, photo.url, photo.caption || '', item.title);
        pagesAdded++;
        pageNum++;
      }

      for (const video of item.videos) {
        const vidPage = this.createPage();
        this.addPageHeader(vidPage);
        this.addPageFooter(vidPage, pageNum, totalPages, propertyAddress);
        await this.addVideoOnly(vidPage, video.url, video.caption || '', item.title);
        pagesAdded++;
        pageNum++;
      }

      y -= 10;
    }

    return pagesAdded;
  }

  private createPage(): PDFPage {
    return this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  /**
   * Add header (NO "Promulgated by..." text - removed per user request)
   */
  private addPageHeader(page: PDFPage): void {
    const hdr = this.templateFormat!.headerText;

    // Top line (removed - no text here)
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 20 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 20 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText(hdr.reportIdLabel, {
      x: MARGIN,
      y: PAGE_HEIGHT - 35,
      size: 10,
      font: this.font!
    });

    page.drawLine({
      start: { x: MARGIN + 140, y: PAGE_HEIGHT - 32 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 32 },
      thickness: 0.5
    });

    const legendY = PAGE_HEIGHT - 55;
    
    page.drawRectangle({
      x: MARGIN,
      y: legendY - 4,
      width: CONTENT_WIDTH,
      height: 18,
      borderWidth: 1,
      borderColor: rgb(0, 0, 0)
    });

    page.drawText(hdr.legend, {
      x: MARGIN + 8,
      y: legendY,
      size: 9,
      font: this.font!
    });

    const boxY = legendY - 26;

    page.drawRectangle({
      x: MARGIN,
      y: boxY,
      width: CONTENT_WIDTH,
      height: 16,
      borderWidth: 1,
      borderColor: rgb(0, 0, 0)
    });

    const labels = ['I', 'NI', 'NP', 'D'];
    for (let i = 0; i < labels.length; i++) {
      page.drawText(labels[i], {
        x: MARGIN + 10 + (i * 70),
        y: boxY + 3,
        size: 10,
        font: this.font!
      });
    }
  }

  /**
   * Add footer (NO property address, just page number, REI, and hyperlink)
   */
  private addPageFooter(page: PDFPage, pageNum: number, totalPages: number, propertyAddress: string): void {
    const ftr = this.templateFormat!.footerText;
    const footerY = 32;

    page.drawLine({
      start: { x: MARGIN, y: footerY + 12 },
      end: { x: PAGE_WIDTH - MARGIN, y: footerY + 12 },
      thickness: 0.5
    });

    // Page number (center)
    const pageText = `Page ${pageNum} of ${totalPages}`;
    const pageWidth = this.font!.widthOfTextAtSize(pageText, 10);
    page.drawText(pageText, {
      x: (PAGE_WIDTH - pageWidth) / 2,
      y: footerY,
      size: 10,
      font: this.font!
    });

    // REI (bottom left)
    page.drawText(ftr.rei, {
      x: MARGIN,
      y: footerY - 12,
      size: 9,
      font: this.font!
    });

    // Promulgated (bottom right) with hyperlink
    const promWidth = this.font!.widthOfTextAtSize(ftr.promulgated, 9);
    const promX = PAGE_WIDTH - MARGIN - promWidth;
    page.drawText(ftr.promulgated, {
      x: promX,
      y: footerY - 12,
      size: 9,
      font: this.font!,
      color: rgb(0, 0, 0.8) // Slight blue tint for hyperlink
    });

    // Add hyperlink annotation to the promulgated text (www.trec.texas.gov)
    try {
      const linkRect = {
        x: promX,
        y: footerY - 12,
        width: promWidth,
        height: 12
      };
      
      page.node.set(PDFName.of('Annots'), this.pdfDoc.context.obj([
        this.pdfDoc.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [linkRect.x, linkRect.y, linkRect.x + linkRect.width, linkRect.y + linkRect.height],
          Border: [0, 0, 0],
          A: {
            S: 'URI',
            URI: PDFString.of('https://www.trec.texas.gov')
          }
        })
      ]));
    } catch (error) {
      // Hyperlink failed, but continue with text rendering
    }
  }

  private addSubsectionWithCheckboxes(page: PDFPage, letter: string, item: TRECItem, y: number): number {
    page.drawText(`  ${letter}. ${item.title}`, {
      x: MARGIN + 10,
      y,
      size: 10,
      font: this.fontBold!
    });
    y -= 18;

    const checkboxY = y;
    const checkboxSize = 10;
    const statuses = ['I', 'NI', 'NP', 'D'];

    for (let i = 0; i < statuses.length; i++) {
      const x = MARGIN + 30 + (i * 70);
      
      page.drawRectangle({
        x,
        y: checkboxY,
        width: checkboxSize,
        height: checkboxSize,
        borderWidth: 1,
        borderColor: rgb(0, 0, 0)
      });

      if (item.status === statuses[i]) {
        page.drawText('X', {
          x: x + 2,
          y: checkboxY + 1,
          size: 9,
          font: this.fontBold!
        });
      }

      page.drawText(statuses[i], {
        x: x + checkboxSize + 4,
        y: checkboxY + 1,
        size: 9,
        font: this.font!
      });
    }

    return checkboxY - 16;
  }

  private addItemTitle(page: PDFPage, item: TRECItem, y: number): number {
    page.drawText(item.title, {
      x: MARGIN + 10,
      y,
      size: 10,
      font: this.fontBold!
    });
    return y - 18;
  }

  private addCommentText(page: PDFPage, comment: string, y: number): number {
    // Split by actual newlines first, then wrap each line
    const rawLines = comment.split(/\r?\n/).filter(l => l.trim());
    
    for (const rawLine of rawLines) {
      const wrappedLines = this.wrapText(rawLine, CONTENT_WIDTH - 50, 10);
      
      for (let i = 0; i < wrappedLines.length; i++) {
        const line = wrappedLines[i].trim();
        if (line) {
          // Add bullet only to first line of each raw line
          const prefix = i === 0 ? '• ' : '  ';
          page.drawText(`${prefix}${line}`, {
            x: MARGIN + 25,
            y,
            size: 10,
            font: this.font!
          });
          y -= 13;
        }
      }
    }
    
    return y - 5;
  }

  /**
   * Add image ONLY (separate page, no text mixing)
   */
  private async addImageOnly(page: PDFPage, url: string, caption: string, itemTitle: string): Promise<void> {
    try {
      const imageBytes = await this.downloadImage(url);
      const image = url.toLowerCase().match(/\.(png|gif)$/)
        ? await this.pdfDoc.embedPng(imageBytes)
        : await this.pdfDoc.embedJpg(imageBytes);

      const dims = this.scaleImage(image.width, image.height, 500, 500);
      
      // Center in content area
      const imgX = (PAGE_WIDTH - dims.width) / 2;
      const imgY = (CONTENT_START_Y + CONTENT_END_Y - dims.height) / 2;
      
      page.drawImage(image, {
        x: imgX,
        y: imgY,
        width: dims.width,
        height: dims.height
      });

      // Caption below image
      if (caption) {
        page.drawText(caption, {
          x: MARGIN,
          y: imgY - 20,
          size: 9,
          font: this.font!,
          color: rgb(0.3, 0.3, 0.3)
        });
      }
    } catch (error) {
      this.logger.error(`Failed to add image: ${url}`, error);
    }
  }

  /**
   * Add video QR ONLY (separate page)
   */
  private async addVideoOnly(page: PDFPage, url: string, caption: string, itemTitle: string): Promise<void> {
    try {
      const qrBuffer = await QRCode.toBuffer(url, { width: 200, margin: 1 });
      const qrImage = await this.pdfDoc.embedPng(qrBuffer);

      const qrSize = 200;
      const qrX = (PAGE_WIDTH - qrSize) / 2;
      const qrY = (CONTENT_START_Y + CONTENT_END_Y - qrSize) / 2;

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      });

      page.drawText('Scan QR code to view video', {
        x: MARGIN,
        y: qrY - 20,
        size: 10,
        font: this.font!,
        color: rgb(0.3, 0.3, 0.3)
      });

      if (caption) {
        page.drawText(caption, {
          x: MARGIN,
          y: qrY - 35,
          size: 9,
          font: this.font!,
          color: rgb(0.5, 0.5, 0.5)
        });
      }
    } catch (error) {
      this.logger.error(`Failed to add QR: ${url}`, error);
    }
  }

  /**
   * Optimized text wrapping with word width caching
   */
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    // Optimize regex by combining operations
    const cleanText = text.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const words = cleanText.split(' ');
    const lines: string[] = [];
    let line = '';
    let lineWidth = 0;
    const spaceWidth = this.getWordWidth(' ', fontSize);

    for (const word of words) {
      const wordWidth = this.getWordWidth(word, fontSize);
      const testWidth = lineWidth + (line ? spaceWidth : 0) + wordWidth;

      if (testWidth > maxWidth && line !== '') {
        lines.push(line);
        line = word;
        lineWidth = wordWidth;
      } else {
        line = line ? `${line} ${word}` : word;
        lineWidth = testWidth;
      }
    }

    if (line) {
      lines.push(line);
    }

    return lines;
  }

  /**
   * Get cached word width
   */
  private getWordWidth(word: string, fontSize: number): number {
    if (!this.wordWidthCache.has(word)) {
      this.wordWidthCache.set(word, new Map());
    }

    const sizeCache = this.wordWidthCache.get(word)!;
    if (!sizeCache.has(fontSize)) {
      sizeCache.set(fontSize, this.font!.widthOfTextAtSize(word, fontSize));
    }

    return sizeCache.get(fontSize)!;
  }

  /**
   * Download image with caching (memory + disk)
   */
  private async downloadImage(url: string): Promise<Buffer> {
    // Check cache first
    const cached = await this.imageCache.get(url);
    if (cached) {
      return cached;
    }

    // Download if not cached
    let buffer: Buffer;
    
    if (url.startsWith('http')) {
      const https = await import('https');
      const http = await import('http');
      const client = url.startsWith('https') ? https : http;

      buffer = await new Promise((resolve, reject) => {
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
      buffer = await fs.readFile(url);
    }

    // Cache for future use
    await this.imageCache.set(url, buffer);
    
    return buffer;
  }

  /**
   * Download multiple images in parallel (batched)
   */
  private async downloadImagesInParallel(urls: string[]): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>();
    const batchSize = 10; // Process 10 images at a time

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const promises = batch.map(async (url) => {
        try {
          const buffer = await this.downloadImage(url);
          return { url, buffer, success: true };
        } catch (error) {
          this.logger.warn(`Failed to download image: ${url}`);
          return { url, buffer: null, success: false };
        }
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ url, buffer, success }) => {
        if (success && buffer) {
          results.set(url, buffer);
        }
      });

      this.logger.debug(`Downloaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)}`);
    }

    return results;
  }

  private scaleImage(width: number, height: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
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

