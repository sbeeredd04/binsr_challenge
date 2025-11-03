/**
 * TREC Generator Service: Main orchestration service for PDF generation
 * Coordinates all other services to generate the final TREC report
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DataMapper } from '../mappers/DataMapper';
import { FormFiller } from './FormFiller';
import { ContentPageGenerator } from './ContentPageGenerator';
import { PageHeaderFooter } from './PageHeaderFooter';
import { Logger } from '../utils/logger';
import { Validator } from '../utils/validator';
import { FileUtils } from '../utils/fileUtils';
import { PATHS } from '../config/constants';
import { InspectionData } from '../types/inspection';

export class TRECGenerator {
  private logger = new Logger('TRECGenerator');

  /**
   * Generate TREC PDF report from inspection data
   */
  public async generate(inspectionData: InspectionData, outputPath?: string): Promise<string> {
    this.logger.info('='.repeat(60));
    this.logger.info('Starting TREC PDF generation...');
    this.logger.info('='.repeat(60));
    
    try {
      // Step 1: Validate input data
      this.logger.info('Step 1: Validating input data...');
      if (!Validator.validateInspectionData(inspectionData)) {
        throw new Error('Inspection data validation failed');
      }

      // Step 2: Validate template exists
      this.logger.info('Step 2: Validating template file...');
      if (!await Validator.validateTemplate(PATHS.TEMPLATE)) {
        throw new Error('Template validation failed');
      }

      // Step 3: Load template
      this.logger.info('Step 3: Loading template PDF...');
      const templateBytes = await fs.readFile(PATHS.TEMPLATE);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      this.logger.success(`Loaded template: ${pdfDoc.getPageCount()} pages`);

      // Step 4: Map data
      this.logger.info('Step 4: Mapping inspection data to form data...');
      const dataMapper = new DataMapper(inspectionData);
      const formData = dataMapper.getFormData();
      
      // Log summary
      const summary = dataMapper.getSummary();
      this.logger.info(`  Sections: ${summary.totalSections}`);
      this.logger.info(`  Line items: ${summary.totalItems}`);
      this.logger.info(`  Inspected: ${summary.inspectedItems}`);
      this.logger.info(`  Deficient: ${summary.deficientItems}`);
      this.logger.info(`  With photos: ${summary.itemsWithPhotos}`);
      this.logger.info(`  With videos: ${summary.itemsWithVideos}`);

      // Step 5: Fill form fields
      this.logger.info('Step 5: Filling form fields...');
      const formFiller = new FormFiller(pdfDoc, form);
      
      // Optional: List all fields for debugging
      const formStats = formFiller.getFormStats();
      this.logger.info(`  Form fields: ${formStats.totalFields} total (${formStats.textFields} text, ${formStats.checkboxes} checkboxes)`);
      
      await formFiller.fillForm(formData);

      // Step 6: Generate content pages (comments → images → videos per item)
      const hasContent = summary.itemsWithPhotos > 0 || 
                         summary.itemsWithVideos > 0 || 
                         formData.items.some(item => item.comments && item.comments.length > 0);
      
      if (hasContent) {
        this.logger.info('Step 6: Generating content pages (comments, images, videos)...');
        const contentGenerator = new ContentPageGenerator(pdfDoc);
        const contentStats = await contentGenerator.generateContentPages(formData.items);
        this.logger.info(`  Content pages: ${contentStats.pagesAdded} pages added`);
        this.logger.info(`  Comments: ${contentStats.commentsAdded}`);
        this.logger.info(`  Images: ${contentStats.imagesAdded}`);
        this.logger.info(`  Videos: ${contentStats.videosAdded}`);
      } else {
        this.logger.info('Step 6: No content to add, skipping...');
      }

      // Step 7: Add page numbers and footers
      this.logger.info('Step 7: Adding page numbers and footers...');
      const pageHeaderFooter = new PageHeaderFooter(pdfDoc);
      await pageHeaderFooter.addPageNumbersAndFooters(
        'TREC Inspection Report',
        formData.inspectorName,
        formData.propertyAddress
      );

      // Step 8: Flatten form
      this.logger.info('Step 8: Flattening PDF form...');
      form.flatten();
      this.logger.success('Form flattened (fields converted to static content)');

      // Step 9: Ensure output directory exists
      this.logger.info('Step 9: Preparing output...');
      await FileUtils.ensureDirectory(PATHS.OUTPUT_DIR);

      // Step 10: Save PDF
      const finalOutputPath = outputPath || path.join(
        PATHS.OUTPUT_DIR,
        FileUtils.generateOutputFilename('TREC_Report')
      );
      
      this.logger.info(`Step 10: Saving PDF to: ${finalOutputPath}`);
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(finalOutputPath, pdfBytes);
      
      const fileSize = (pdfBytes.length / 1024 / 1024).toFixed(2);
      this.logger.success(`PDF saved: ${fileSize} MB, ${pdfDoc.getPageCount()} pages`);

      // Step 11: Validate output
      this.logger.info('Step 11: Validating output...');
      if (!await Validator.validatePDF(finalOutputPath)) {
        throw new Error('Output PDF validation failed');
      }

      this.logger.info('='.repeat(60));
      this.logger.success('✓ TREC PDF generation complete!');
      this.logger.info('='.repeat(60));
      
      return finalOutputPath;
      
    } catch (error) {
      this.logger.error('PDF generation failed', error);
      throw error;
    }
  }

  /**
   * Generate multiple PDFs from array of inspection data
   */
  public async generateBatch(inspections: InspectionData[]): Promise<string[]> {
    this.logger.info(`Starting batch generation for ${inspections.length} inspections...`);
    
    const results: string[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < inspections.length; i++) {
      try {
        this.logger.info(`\n[${ i + 1 }/${inspections.length}] Processing inspection...`);
        const outputPath = await this.generate(inspections[i]);
        results.push(outputPath);
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to generate PDF for inspection ${i + 1}`, error);
        failCount++;
      }
    }

    this.logger.info(`\nBatch generation complete: ${successCount} success, ${failCount} failed`);
    return results;
  }

  /**
   * Get generator version and info
   */
  public static getInfo(): {
    name: string;
    version: string;
    description: string;
  } {
    return {
      name: 'TREC PDF Generator',
      version: '1.0.0',
      description: 'Generates TREC inspection reports from JSON data using pdf-lib',
    };
  }
}

