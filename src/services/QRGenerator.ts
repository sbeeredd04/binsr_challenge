/**
 * QR Generator Service: Generates QR codes for video links
 */

import QRCode from 'qrcode';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { Logger } from '../utils/logger';
import { TRECItem } from '../types/trec';
import { QR_CONFIG, DEFAULTS, PAGE_CONFIG } from '../config/constants';

export class QRGenerator {
  private logger = new Logger('QRGenerator');

  constructor(private pdfDoc: PDFDocument) {}

  /**
   * Generate QR codes for video links
   */
  public async generateQRCodes(items: TRECItem[]): Promise<void> {
    this.logger.info('Generating QR codes for videos...');
    
    let qrCodesGenerated = 0;
    let pagesAdded = 0;

    for (const item of items) {
      if (!item.videos || item.videos.length === 0) {
        continue;
      }

      this.logger.debug(`Generating ${item.videos.length} QR codes for item ${item.number}`);

      for (const video of item.videos) {
        try {
          await this.addQRCode(item, video.url, video.caption);
          qrCodesGenerated++;
          pagesAdded++;
        } catch (error) {
          this.logger.error(`Failed to generate QR code for: ${video.url}`, error);
        }
      }
    }
    
    this.logger.success(`Generated ${qrCodesGenerated} QR codes across ${pagesAdded} pages`);
  }

  /**
   * Add QR code to PDF
   */
  private async addQRCode(item: TRECItem, videoUrl: string, caption?: string): Promise<void> {
    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(videoUrl, {
      width: QR_CONFIG.WIDTH,
      margin: QR_CONFIG.MARGIN,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION_LEVEL,
    });
    
    // Embed QR code image
    const qrImage = await this.pdfDoc.embedPng(qrCodeBuffer);
    
    // Add page for QR code
    const page = this.pdfDoc.addPage([
      PAGE_CONFIG.IMAGE_PAGE_WIDTH,
      PAGE_CONFIG.IMAGE_PAGE_HEIGHT
    ]);
    
    const { width, height } = page.getSize();
    
    // Draw item info header
    page.drawText(`Item ${item.number}: ${item.title}`, {
      x: PAGE_CONFIG.IMAGE_MARGIN,
      y: height - 50,
      size: DEFAULTS.FONT_SIZE.HEADER,
      color: rgb(
        DEFAULTS.COLORS.BLACK.r,
        DEFAULTS.COLORS.BLACK.g,
        DEFAULTS.COLORS.BLACK.b
      ),
    });
    
    page.drawText(`Section: ${item.section}`, {
      x: PAGE_CONFIG.IMAGE_MARGIN,
      y: height - 70,
      size: DEFAULTS.FONT_SIZE.SMALL,
      color: rgb(
        DEFAULTS.COLORS.GRAY.r,
        DEFAULTS.COLORS.GRAY.g,
        DEFAULTS.COLORS.GRAY.b
      ),
    });
    
    // Video label
    page.drawText('Video Link:', {
      x: PAGE_CONFIG.IMAGE_MARGIN,
      y: height - 100,
      size: DEFAULTS.FONT_SIZE.NORMAL,
      color: rgb(
        DEFAULTS.COLORS.BLACK.r,
        DEFAULTS.COLORS.BLACK.g,
        DEFAULTS.COLORS.BLACK.b
      ),
    });
    
    // Draw QR code (centered)
    const qrSize = QR_CONFIG.WIDTH;
    const qrX = (width - qrSize) / 2;
    const qrY = height / 2 - qrSize / 2;
    
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    
    // Draw caption if provided
    if (caption) {
      page.drawText(caption, {
        x: PAGE_CONFIG.IMAGE_MARGIN,
        y: qrY - 30,
        size: DEFAULTS.FONT_SIZE.SMALL,
        color: rgb(
          DEFAULTS.COLORS.LIGHT_GRAY.r,
          DEFAULTS.COLORS.LIGHT_GRAY.g,
          DEFAULTS.COLORS.LIGHT_GRAY.b
        ),
        maxWidth: width - (PAGE_CONFIG.IMAGE_MARGIN * 2),
      });
    }
    
    // Draw instruction
    page.drawText('Scan QR code with your mobile device to view video', {
      x: PAGE_CONFIG.IMAGE_MARGIN,
      y: qrY - 60,
      size: DEFAULTS.FONT_SIZE.NORMAL,
      color: rgb(
        DEFAULTS.COLORS.GRAY.r,
        DEFAULTS.COLORS.GRAY.g,
        DEFAULTS.COLORS.GRAY.b
      ),
    });

    // Draw URL (truncated if too long)
    const displayUrl = videoUrl.length > 80 ? videoUrl.substring(0, 77) + '...' : videoUrl;
    page.drawText(displayUrl, {
      x: PAGE_CONFIG.IMAGE_MARGIN,
      y: qrY - 85,
      size: DEFAULTS.FONT_SIZE.CAPTION,
      color: rgb(
        DEFAULTS.COLORS.LIGHT_GRAY.r,
        DEFAULTS.COLORS.LIGHT_GRAY.g,
        DEFAULTS.COLORS.LIGHT_GRAY.b
      ),
      maxWidth: width - (PAGE_CONFIG.IMAGE_MARGIN * 2),
    });
  }

  /**
   * Generate QR code as data URL (for testing)
   */
  public static async generateQRDataURL(url: string): Promise<string> {
    return await QRCode.toDataURL(url, {
      width: QR_CONFIG.WIDTH,
      margin: QR_CONFIG.MARGIN,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION_LEVEL,
    });
  }
}

