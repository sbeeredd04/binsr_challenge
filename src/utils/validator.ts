/**
 * Validation utilities for PDF generation
 */

import * as fs from 'fs/promises';
import { InspectionData } from '../types/inspection';

export class Validator {
  /**
   * Validate generated PDF file
   */
  public static async validatePDF(pdfPath: string): Promise<boolean> {
    try {
      // Check file exists
      const stats = await fs.stat(pdfPath);
      
      // Check file size
      if (stats.size === 0) {
        console.error('❌ Generated PDF is empty');
        return false;
      }
      
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`\n✓ PDF generated successfully: ${pdfPath}`);
      console.log(`  File size: ${sizeMB} MB`);
      console.log(`  Pages: Ready for inspection`);
      
      return true;
    } catch (error) {
      console.error('❌ PDF validation failed:', error);
      return false;
    }
  }

  /**
   * Validate inspection data structure
   */
  public static validateInspectionData(data: InspectionData): boolean {
    try {
      // Check required fields
      if (!data.inspection) {
        throw new Error('Missing inspection object');
      }

      const inspection = data.inspection;

      // Validate client info
      if (!inspection.clientInfo || !inspection.clientInfo.name) {
        throw new Error('Missing client information');
      }

      // Validate inspector info
      if (!inspection.inspector || !inspection.inspector.name) {
        throw new Error('Missing inspector information');
      }

      // Validate address
      if (!inspection.address || !inspection.address.fullAddress) {
        throw new Error('Missing property address');
      }

      // Validate sections and line items
      if (!inspection.sections || !Array.isArray(inspection.sections)) {
        throw new Error('Missing sections array');
      }

      if (inspection.sections.length === 0) {
        throw new Error('No sections found in inspection data');
      }

      // Count line items
      let totalItems = 0;
      for (const section of inspection.sections) {
        if (!section.lineItems || !Array.isArray(section.lineItems)) {
          console.warn(`Section ${section.name} has no line items`);
          continue;
        }
        totalItems += section.lineItems.length;
      }

      if (totalItems === 0) {
        throw new Error('No line items found in any section');
      }

      console.log(`✓ Validation passed: ${inspection.sections.length} sections, ${totalItems} line items`);
      return true;

    } catch (error) {
      console.error('❌ Inspection data validation failed:', error);
      return false;
    }
  }

  /**
   * Validate template file exists
   */
  public static async validateTemplate(templatePath: string): Promise<boolean> {
    try {
      await fs.access(templatePath);
      const stats = await fs.stat(templatePath);
      
      if (stats.size === 0) {
        console.error('❌ Template PDF is empty');
        return false;
      }

      console.log(`✓ Template found: ${templatePath} (${(stats.size / 1024).toFixed(2)} KB)`);
      return true;
    } catch (error) {
      console.error(`❌ Template not found: ${templatePath}`);
      return false;
    }
  }
}

