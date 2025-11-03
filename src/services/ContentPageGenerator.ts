/**
 * Content Page Generator
 * Generates pages for comments, images, and videos organized by section
 * Content is added AFTER template pages, organized by TREC sections
 */

import { PDFDocument, PDFPage, PDFImage, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs/promises';
import QRCode from 'qrcode';
import { Logger } from '../utils/logger';
import { DEFAULTS, PAGE_CONFIG } from '../config/constants';
import { TRECItem } from '../types/trec';
import { findTRECSubsection, TREC_TEMPLATE_SECTIONS } from '../config/sectionMapping';

export interface ContentStats {
  pagesAdded: number;
  commentsAdded: number;
  imagesAdded: number;
  videosAdded: number;
}

export class ContentPageGenerator {
  private logger = new Logger('ContentPageGenerator');
  private font: any;

  constructor(private pdfDoc: PDFDocument) {}

  /**
   * Generate content pages organized by TREC sections
   * Order: Comments → Images → Videos for each section
   */
  public async generateContentPages(items: TRECItem[]): Promise<ContentStats> {
    this.logger.info('Generating content pages organized by TREC sections...');
    
    // Load font
    this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const stats: ContentStats = {
      pagesAdded: 0,
      commentsAdded: 0,
      imagesAdded: 0,
      videosAdded: 0
    };

    // Group items by TREC section
    const itemsBySection = this.groupItemsByTRECSection(items);
    
    // Generate content for each TREC section in order
    for (const section of TREC_TEMPLATE_SECTIONS) {
      const sectionItems = itemsBySection.get(section.romanNumeral) || [];
      
      if (sectionItems.length === 0) continue;
      
      this.logger.info(`\n${section.romanNumeral}. ${section.name} (${sectionItems.length} items)`);
      
      // Add section separator page
      const sectionStats = await this.generateSectionContent(section.romanNumeral, section.name, sectionItems);
      
      stats.pagesAdded += sectionStats.pagesAdded;
      stats.commentsAdded += sectionStats.commentsAdded;
      stats.imagesAdded += sectionStats.imagesAdded;
      stats.videosAdded += sectionStats.videosAdded;
    }
    
    // Handle items that don't match any TREC section
    const unmatchedItems = itemsBySection.get('UNMATCHED') || [];
    if (unmatchedItems.length > 0) {
      this.logger.info(`\nADDITIONAL ITEMS (${unmatchedItems.length} items)`);
      const sectionStats = await this.generateSectionContent('', 'Additional Items', unmatchedItems);
      
      stats.pagesAdded += sectionStats.pagesAdded;
      stats.commentsAdded += sectionStats.commentsAdded;
      stats.imagesAdded += sectionStats.imagesAdded;
      stats.videosAdded += sectionStats.videosAdded;
    }

    return stats;
  }

  /**
   * Group items by their TREC section
   */
  private groupItemsByTRECSection(items: TRECItem[]): Map<string, TRECItem[]> {
    const groups = new Map<string, TRECItem[]>();
    
    for (const item of items) {
      // Find TREC match
      const trecSubsection = findTRECSubsection(item.title, item.section);
      
      let sectionKey: string;
      if (trecSubsection) {
        // Find which main section this belongs to
        const mainSection = TREC_TEMPLATE_SECTIONS.find(s => 
          s.subsections.some(sub => sub.checkboxIndex === trecSubsection.checkboxIndex)
        );
        sectionKey = mainSection?.romanNumeral || 'UNMATCHED';
      } else {
        sectionKey = 'UNMATCHED';
      }
      
      if (!groups.has(sectionKey)) {
        groups.set(sectionKey, []);
      }
      groups.get(sectionKey)!.push(item);
    }
    
    return groups;
  }

  /**
   * Generate content for a single section
   */
  private async generateSectionContent(
    romanNumeral: string,
    sectionName: string,
    items: TRECItem[]
  ): Promise<ContentStats> {
    const stats: ContentStats = {
      pagesAdded: 0,
      commentsAdded: 0,
      imagesAdded: 0,
      videosAdded: 0
    };

    for (const item of items) {
      // Skip if no content
      if (item.comments.length === 0 && item.photos.length === 0 && item.videos.length === 0) {
        continue;
      }

      // 1. Comments page(s)
      if (item.comments.length > 0) {
        const commentStats = await this.addCommentPages(romanNumeral, sectionName, item);
        stats.pagesAdded += commentStats.pagesAdded;
        stats.commentsAdded += commentStats.commentsAdded;
      }

      // 2. Images page(s)
      if (item.photos.length > 0) {
        const imageStats = await this.addImagePages(romanNumeral, sectionName, item);
        stats.pagesAdded += imageStats.pagesAdded;
        stats.imagesAdded += imageStats.imagesAdded;
      }

      // 3. Videos page(s)
      if (item.videos.length > 0) {
        const videoStats = await this.addVideoPages(romanNumeral, sectionName, item);
        stats.pagesAdded += videoStats.pagesAdded;
        stats.videosAdded += videoStats.videosAdded;
      }
    }

    return stats;
  }

  /**
   * Add comment pages for an item
   */
  private async addCommentPages(
    romanNumeral: string,
    sectionName: string,
    item: TRECItem
  ): Promise<{ pagesAdded: number; commentsAdded: number }> {
    let pagesAdded = 0;
    let commentsAdded = 0;

    for (const comment of item.comments) {
      const page = this.pdfDoc.addPage([PAGE_CONFIG.IMAGE_PAGE_WIDTH, PAGE_CONFIG.IMAGE_PAGE_HEIGHT]);
      pagesAdded++;

      // Draw header
      this.drawItemHeader(page, romanNumeral, sectionName, item, 'COMMENTS');

      // Draw comment text (wrapped)
      const y = await this.drawWrappedText(page, comment, 50, 650, 512, 12);
      commentsAdded++;

      this.logger.debug(`  + Comment page for "${item.title}"`);
    }

    return { pagesAdded, commentsAdded };
  }

  /**
   * Add image pages for an item
   */
  private async addImagePages(
    romanNumeral: string,
    sectionName: string,
    item: TRECItem
  ): Promise<{ pagesAdded: number; imagesAdded: number }> {
    let pagesAdded = 0;
    let imagesAdded = 0;

    for (const photo of item.photos) {
      try {
        const page = this.pdfDoc.addPage([PAGE_CONFIG.IMAGE_PAGE_WIDTH, PAGE_CONFIG.IMAGE_PAGE_HEIGHT]);
        pagesAdded++;

        // Draw header
        this.drawItemHeader(page, romanNumeral, sectionName, item, 'PHOTO');

        // Embed and draw image
        const imageBytes = await this.downloadOrReadImage(photo.url);
        const image = await this.embedImage(imageBytes, photo.url);
        
        if (image) {
          const dims = this.calculateImageDimensions(image);
          page.drawImage(image, {
            x: (PAGE_CONFIG.IMAGE_PAGE_WIDTH - dims.width) / 2, // Center
            y: 300,
            width: dims.width,
            height: dims.height
          });

          // Caption
          if (photo.caption) {
            await this.drawWrappedText(page, photo.caption, 50, 280, 512, 10);
          }

          imagesAdded++;
          this.logger.debug(`  + Image page for "${item.title}"`);
        }
      } catch (error) {
        this.logger.error(`Failed to add image for "${item.title}":`, error);
      }
    }

    return { pagesAdded, imagesAdded };
  }

  /**
   * Add video (QR code) pages for an item
   */
  private async addVideoPages(
    romanNumeral: string,
    sectionName: string,
    item: TRECItem
  ): Promise<{ pagesAdded: number; videosAdded: number }> {
    let pagesAdded = 0;
    let videosAdded = 0;

    for (const video of item.videos) {
      try {
        const page = this.pdfDoc.addPage([PAGE_CONFIG.IMAGE_PAGE_WIDTH, PAGE_CONFIG.IMAGE_PAGE_HEIGHT]);
        pagesAdded++;

        // Draw header
        this.drawItemHeader(page, romanNumeral, sectionName, item, 'VIDEO');

        // Generate QR code
        const qrBuffer = await QRCode.toBuffer(video.url, { width: 200, margin: 1 });
        const qrImage = await this.pdfDoc.embedPng(qrBuffer);

        // Draw QR code (centered)
        const qrSize = 200;
        const qrX = (PAGE_CONFIG.IMAGE_PAGE_WIDTH - qrSize) / 2;
        page.drawImage(qrImage, {
          x: qrX,
          y: 350,
          width: qrSize,
          height: qrSize
        });

        // Instructions
        page.drawText('Scan QR code with your mobile device to view video', {
          x: 50,
          y: 320,
          size: 11,
          font: this.font,
          color: rgb(0.3, 0.3, 0.3)
        });

        // Video URL (truncated)
        const displayUrl = video.url.length > 70 ? video.url.substring(0, 67) + '...' : video.url;
        page.drawText(displayUrl, {
          x: 50,
          y: 295,
          size: 9,
          font: this.font,
          color: rgb(0.5, 0.5, 0.5)
        });

        // Caption
        if (video.caption) {
          await this.drawWrappedText(page, video.caption, 50, 270, 512, 10);
        }

        videosAdded++;
        this.logger.debug(`  + Video (QR) page for "${item.title}"`);
      } catch (error) {
        this.logger.error(`Failed to add video QR for "${item.title}":`, error);
      }
    }

    return { pagesAdded, videosAdded };
  }

  /**
   * Draw item header on page
   */
  private drawItemHeader(
    page: PDFPage,
    romanNumeral: string,
    sectionName: string,
    item: TRECItem,
    contentType: string
  ): void {
    const { height } = page.getSize();

    // Section
    const sectionText = romanNumeral ? `${romanNumeral}. ${sectionName}` : sectionName;
    page.drawText(sectionText, {
      x: 50,
      y: height - 50,
      size: 10,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Item title
    page.drawText(`${item.title}`, {
      x: 50,
      y: height - 70,
      size: 14,
      font: this.font,
      color: rgb(0, 0, 0)
    });

    // Content type
    page.drawText(contentType, {
      x: 50,
      y: height - 90,
      size: 10,
      font: this.font,
      color: rgb(0.3, 0.3, 0.3)
    });

    // Horizontal line
    page.drawLine({
      start: { x: 50, y: height - 100 },
      end: { x: 562, y: height - 100 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
  }

  /**
   * Draw wrapped text
   */
  private async drawWrappedText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number
  ): Promise<number> {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const testWidth = this.font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && line !== '') {
        page.drawText(line, { x, y: currentY, size: fontSize, font: this.font });
        line = word + ' ';
        currentY -= fontSize + 4;
      } else {
        line = testLine;
      }
    }

    if (line !== '') {
      page.drawText(line, { x, y: currentY, size: fontSize, font: this.font });
      currentY -= fontSize + 4;
    }

    return currentY;
  }

  /**
   * Download or read image
   */
  private async downloadOrReadImage(url: string): Promise<Buffer> {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Download from URL
      const https = await import('https');
      const http = await import('http');
      const client = url.startsWith('https://') ? https : http;

      return new Promise((resolve, reject) => {
        client.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: ${response.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });
    } else {
      // Local file
      return await fs.readFile(url);
    }
  }

  /**
   * Embed image (try both JPG and PNG)
   */
  private async embedImage(imageBytes: Buffer, url: string): Promise<PDFImage | null> {
    try {
      if (url.toLowerCase().match(/\.(png|gif)$/)) {
        return await this.pdfDoc.embedPng(imageBytes);
      } else {
        return await this.pdfDoc.embedJpg(imageBytes);
      }
    } catch {
      // Try the other format
      try {
        return url.toLowerCase().match(/\.(png|gif)$/)
          ? await this.pdfDoc.embedJpg(imageBytes)
          : await this.pdfDoc.embedPng(imageBytes);
      } catch {
        return null;
      }
    }
  }

  /**
   * Calculate image dimensions
   */
  private calculateImageDimensions(image: PDFImage): { width: number; height: number } {
    const maxWidth = 500;
    const maxHeight = 300;

    let width = image.width;
    let height = image.height;

    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }

    if (height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }

    return { width, height };
  }
}
