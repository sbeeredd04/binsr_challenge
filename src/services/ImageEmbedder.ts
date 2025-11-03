/**
 * Image Embedder Service: Embeds photos into PDF pages
 */

import { PDFDocument, PDFPage, PDFImage, rgb } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as https from 'https';
import * as http from 'http';
import { Logger } from '../utils/logger';
import { PAGE_CONFIG, DEFAULTS } from '../config/constants';
import { TRECItem } from '../types/trec';
import { Photo } from '../types/inspection';

export class ImageEmbedder {
  private logger = new Logger('ImageEmbedder');

  constructor(private pdfDoc: PDFDocument) {}

  /**
   * Add pages with embedded images for items that have media
   */
  public async embedImages(items: TRECItem[]): Promise<void> {
    this.logger.info('Starting image embedding...');
    
    let imagesAdded = 0;
    let pagesAdded = 0;

    for (const item of items) {
      if (!item.photos || item.photos.length === 0) {
        continue;
      }

      this.logger.debug(`Embedding ${item.photos.length} images for item ${item.number}: ${item.title}`);

      // Process images for this item
      const results = await this.embedImagesForItem(item);
      imagesAdded += results.imagesAdded;
      pagesAdded += results.pagesAdded;
    }
    
    this.logger.success(`Embedded ${imagesAdded} images across ${pagesAdded} pages`);
  }

  /**
   * Embed images for a single item
   */
  private async embedImagesForItem(item: TRECItem): Promise<{ imagesAdded: number; pagesAdded: number }> {
    let imagesAdded = 0;
    let pagesAdded = 0;
    let currentPage: PDFPage | null = null;
    let yPosition = 0;

    for (let i = 0; i < item.photos.length; i++) {
      const photo = item.photos[i];

      // Create new page if needed (first image or page full)
      if (!currentPage || yPosition < 100) {
        currentPage = this.pdfDoc.addPage([
          PAGE_CONFIG.IMAGE_PAGE_WIDTH,
          PAGE_CONFIG.IMAGE_PAGE_HEIGHT,
        ]);
        pagesAdded++;
        
        // Draw page header
        this.drawPageHeader(currentPage, item, i === 0);
        yPosition = 700; // Start position for images
      }

      try {
        const imageBytes = await this.downloadImage(photo.url);
        const embedded = await this.embedSingleImage(
          currentPage,
          imageBytes,
          photo.url,
          yPosition,
          photo.caption
        );

        if (embedded) {
          imagesAdded++;
          yPosition -= 270; // Move down for next image (image height + margin)
        }
      } catch (error) {
        this.logger.error(`Failed to embed image: ${photo.url}`, error);
      }
    }

    return { imagesAdded, pagesAdded };
  }

  /**
   * Draw page header with item information
   */
  private drawPageHeader(page: PDFPage, item: TRECItem, isFirstPage: boolean): void {
    const { width, height } = page.getSize();

    // Item title
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

    // Section name
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

    // Status
    if (isFirstPage) {
      const statusText = `Status: ${item.status || 'N/A'}${item.isDeficient ? ' (Deficient)' : ''}`;
      page.drawText(statusText, {
        x: PAGE_CONFIG.IMAGE_MARGIN,
        y: height - 90,
        size: DEFAULTS.FONT_SIZE.SMALL,
        color: rgb(
          DEFAULTS.COLORS.GRAY.r,
          DEFAULTS.COLORS.GRAY.g,
          DEFAULTS.COLORS.GRAY.b
        ),
      });
    }
  }

  /**
   * Embed single image on page
   */
  private async embedSingleImage(
    page: PDFPage,
    imageBytes: Buffer,
    imageUrl: string,
    yPosition: number,
    caption?: string
  ): Promise<boolean> {
    try {
      // Embed image (detect type by extension or try both)
      let image: PDFImage;
      const urlLower = imageUrl.toLowerCase();
      
      if (urlLower.endsWith('.png') || urlLower.includes('.png')) {
        image = await this.pdfDoc.embedPng(imageBytes);
      } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
        image = await this.pdfDoc.embedJpg(imageBytes);
      } else {
        // Try JPG first, then PNG
        try {
          image = await this.pdfDoc.embedJpg(imageBytes);
        } catch {
          image = await this.pdfDoc.embedPng(imageBytes);
        }
      }
      
      // Calculate dimensions (maintain aspect ratio)
      const { width, height } = this.calculateImageDimensions(image);
      
      // Draw image
      page.drawImage(image, {
        x: PAGE_CONFIG.IMAGE_MARGIN,
        y: yPosition - height,
        width,
        height,
      });
      
      // Draw caption if provided
      if (caption) {
        page.drawText(caption, {
          x: PAGE_CONFIG.IMAGE_MARGIN,
          y: yPosition - height - 20,
          size: DEFAULTS.FONT_SIZE.CAPTION,
          color: rgb(
            DEFAULTS.COLORS.LIGHT_GRAY.r,
            DEFAULTS.COLORS.LIGHT_GRAY.g,
            DEFAULTS.COLORS.LIGHT_GRAY.b
          ),
          maxWidth: PAGE_CONFIG.IMAGE_MAX_WIDTH,
        });
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to embed image`, error);
      return false;
    }
  }

  /**
   * Calculate image dimensions maintaining aspect ratio
   */
  private calculateImageDimensions(image: PDFImage): { width: number; height: number } {
    const maxWidth = PAGE_CONFIG.IMAGE_MAX_WIDTH;
    const maxHeight = PAGE_CONFIG.IMAGE_MAX_HEIGHT;
    
    let width = image.width;
    let height = image.height;
    
    // Scale down if too large
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

  /**
   * Download image from URL or read from local file
   */
  private async downloadImage(url: string): Promise<Buffer> {
    // Check if it's a local file path
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Local file
      return await fs.readFile(url);
    }

    // Download from URL
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https://') ? https : http;
      
      client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }
}

