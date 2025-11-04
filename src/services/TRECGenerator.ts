/**
 * TREC Generator Service: Main orchestration service for PDF generation
 * Coordinates all other services to generate the final TREC report
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DataMapper } from '../mappers/DataMapper';
import { FormFiller } from './FormFiller';
import { TRECPageBuilder } from './TRECPageBuilder';
import { Logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { Validator } from '../utils/validator';
import { FileUtils } from '../utils/fileUtils';
import { PATHS } from '../config/constants';
import { InspectionData } from '../types/inspection';

export class TRECGenerator {
  private logger = new Logger('TRECGenerator');
  private perfMonitor = new PerformanceMonitor();

  /**
   * Generate TREC PDF report from inspection data
   */
  public async generate(inspectionData: InspectionData, outputPath?: string): Promise<string> {
    this.logger.info('='.repeat(60));
    this.logger.info('Starting TREC PDF generation...');
    this.logger.info('='.repeat(60));
    
    // Reset performance monitor
    this.perfMonitor.reset();
    const overallStart = Date.now();
    
    try {
      // Step 1: Validate input data
      this.perfMonitor.startPhase('1. Validate Input Data');
      this.logger.info('Step 1: Validating input data...');
      if (!Validator.validateInspectionData(inspectionData)) {
        throw new Error('Inspection data validation failed');
      }
      this.perfMonitor.logPhaseCompletion('1. Validate Input Data');

      // Step 2: Validate template exists
      this.perfMonitor.startPhase('2. Validate Template');
      this.logger.info('Step 2: Validating template file...');
      if (!await Validator.validateTemplate(PATHS.TEMPLATE)) {
        throw new Error('Template validation failed');
      }
      this.perfMonitor.logPhaseCompletion('2. Validate Template');

      // Step 3: Load template
      this.perfMonitor.startPhase('3. Load Template PDF');
      this.logger.info('Step 3: Loading template PDF...');
      const templateBytes = await fs.readFile(PATHS.TEMPLATE);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      this.logger.success(`Loaded template: ${pdfDoc.getPageCount()} pages`);
      this.perfMonitor.logPhaseCompletion('3. Load Template PDF');

      // Step 4: Map data
      this.perfMonitor.startPhase('4. Map Data');
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
      this.perfMonitor.logPhaseCompletion('4. Map Data');

      // Step 5: Fill header fields only (pages 1-2)
      this.perfMonitor.startPhase('5. Fill Header Fields');
      this.logger.info('Step 5: Filling header fields on pages 1-2...');
      const formFiller = new FormFiller(pdfDoc, form);
      
      // Fill only header fields (not checkboxes - we'll generate those dynamically)
      await formFiller.fillHeaderFields(formData);
      this.logger.success('Header fields filled');
      this.perfMonitor.logPhaseCompletion('5. Fill Header Fields');

      // Step 6: Flatten form BEFORE removing pages
      this.perfMonitor.startPhase('6. Flatten Form');
      this.logger.info('Step 6: Flattening form fields on pages 1-2...');
      form.flatten();
      this.logger.success('Form flattened (fields converted to static content)');
      this.perfMonitor.logPhaseCompletion('6. Flatten Form');

      // Step 7: Remove template pages 3-6 (we'll regenerate them)
      this.perfMonitor.startPhase('7. Remove Template Pages');
      this.logger.info('Step 7: Removing template pages 3-6...');
      const originalPageCount = pdfDoc.getPageCount();
      if (originalPageCount >= 6) {
        // Remove pages 3-6 (indices 2-5)
        for (let i = 0; i < 4; i++) {
          pdfDoc.removePage(2); // Always remove index 2 (as pages shift down)
        }
        this.logger.success(`Removed 4 template pages, ${pdfDoc.getPageCount()} pages remaining`);
      }
      this.perfMonitor.logPhaseCompletion('7. Remove Template Pages');

      // Step 8: Build TREC pages dynamically with proper section flow
      this.perfMonitor.startPhase('8. Build Inspection Pages');
      this.logger.info('Step 8: Building TREC inspection pages...');
      this.logger.info('Format: Section Header → Checkboxes → Comments → Images → Videos');
      
      const pageBuilder = new TRECPageBuilder(pdfDoc);
      const inspectionPages = await pageBuilder.buildTRECPages(
        formData.items,
        formData.propertyAddress,
        PATHS.TEMPLATE, // Pass template path for analysis
        3 // Start from page 3
      );
      
      this.logger.success(`Built ${inspectionPages} inspection pages`);
      this.perfMonitor.logPhaseCompletion('8. Build Inspection Pages');

      // Step 9: Ensure output directory exists
      this.perfMonitor.startPhase('9. Prepare Output Directory');
      this.logger.info('Step 9: Preparing output...');
      await FileUtils.ensureDirectory(PATHS.OUTPUT_DIR);
      this.perfMonitor.logPhaseCompletion('9. Prepare Output Directory');

      // Step 10: Save PDF
      this.perfMonitor.startPhase('10. Save PDF');
      const finalOutputPath = outputPath || path.join(
        PATHS.OUTPUT_DIR,
        FileUtils.generateOutputFilename('TREC_Report')
      );
      
      this.logger.info(`Step 10: Saving PDF to: ${finalOutputPath}`);
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(finalOutputPath, pdfBytes);
      
      const fileSize = (pdfBytes.length / 1024 / 1024).toFixed(2);
      this.logger.success(`PDF saved: ${fileSize} MB, ${pdfDoc.getPageCount()} pages`);
      this.perfMonitor.logPhaseCompletion('10. Save PDF');

      // Step 11: Validate output
      this.perfMonitor.startPhase('11. Validate Output');
      this.logger.info('Step 11: Validating output...');
      if (!await Validator.validatePDF(finalOutputPath)) {
        throw new Error('Output PDF validation failed');
      }
      this.perfMonitor.logPhaseCompletion('11. Validate Output');

      // Calculate and display performance report
      const totalTime = Date.now() - overallStart;
      this.logger.info('='.repeat(60));
      this.logger.success(`✓ TREC PDF generation complete! (${(totalTime / 1000).toFixed(2)}s)`);
      this.logger.info('='.repeat(60));
      
      // Display detailed performance report
      console.log(this.perfMonitor.generateReport());
      
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

