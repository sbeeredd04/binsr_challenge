/**
 * Form Filler Service: Fills PDF form fields with inspection data
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { TRECFormData, TRECItem } from '../types/trec';
import { StatusMapper } from '../mappers/StatusMapper';
import { FORM_FIELDS, PAGE_CONFIG } from '../config/constants';
import { Logger } from '../utils/logger';

export class FormFiller {
  private logger = new Logger('FormFiller');

  constructor(
    private pdfDoc: PDFDocument,
    private form: PDFForm
  ) {}

  /**
   * Fill all form fields with inspection data
   */
  public async fillForm(formData: TRECFormData): Promise<void> {
    this.logger.info('Starting form filling...');
    
    // Fill header fields
    await this.fillHeaderFields(formData);
    
    // Fill checkboxes for inspection items
    await this.fillCheckboxes(formData.items);
    
    this.logger.success('Form filling complete');
  }

  /**
   * Fill header text fields (pages 1-2)
   */
  private async fillHeaderFields(formData: TRECFormData): Promise<void> {
    this.logger.info('Filling header fields...');
    
    const fieldMappings: Record<string, string> = {
      ...(FORM_FIELDS.CLIENT_NAME && { [FORM_FIELDS.CLIENT_NAME]: formData.clientName }),
      ...(FORM_FIELDS.INSPECTOR_NAME && { [FORM_FIELDS.INSPECTOR_NAME]: formData.inspectorName }),
      ...(FORM_FIELDS.PROPERTY_ADDRESS && { [FORM_FIELDS.PROPERTY_ADDRESS]: `${formData.propertyAddress}, ${formData.propertyCity}` }),
      ...(FORM_FIELDS.INSPECTION_DATE && { [FORM_FIELDS.INSPECTION_DATE]: formData.inspectionDate }),
      ...(FORM_FIELDS.INSPECTOR_LICENSE && formData.inspectorLicense && { [FORM_FIELDS.INSPECTOR_LICENSE]: formData.inspectorLicense }),
      ...(FORM_FIELDS.INSPECTOR_LICENSE_2 && formData.inspectorLicense && { [FORM_FIELDS.INSPECTOR_LICENSE_2]: formData.inspectorLicense }),
      ...(FORM_FIELDS.SPONSOR_NAME && formData.sponsorName && { [FORM_FIELDS.SPONSOR_NAME]: formData.sponsorName }),
    };

    let filledCount = 0;
    let notFoundCount = 0;

    // Note: Some fields don't exist in template (email, phone) - they are skipped
    const totalExpectedFields = Object.keys(FORM_FIELDS).filter(k => FORM_FIELDS[k as keyof typeof FORM_FIELDS] !== null).length;

    for (const [fieldName, value] of Object.entries(fieldMappings)) {
      try {
        const field = this.form.getTextField(fieldName);
        field.setText(value);
        this.logger.debug(`✓ Filled: ${fieldName} = ${value}`);
        filledCount++;
      } catch (error) {
        this.logger.warn(`✗ Field not found: ${fieldName}`);
        notFoundCount++;
      }
    }

    this.logger.info(`Header fields: ${filledCount} filled, ${notFoundCount} not found (${Object.keys(FORM_FIELDS).length - totalExpectedFields} fields don't exist in template)`);
  }

  /**
   * Fill checkboxes using INTELLIGENT NAME-BASED MAPPING
   * Maps items by name to TREC template sections (not by position)
   * 
   * Note: TREC template has 36 predefined sections (I.A-L, II.A-B, III.A-C, IV.A-E, V.A-H, VI.A-F)
   * Items that don't match a TREC section will be added as content pages only (no checkbox)
   */
  private async fillCheckboxes(items: TRECItem[]): Promise<void> {
    this.logger.info(`\nFilling checkboxes using NAME-BASED MAPPING for ${items.length} items...`);
    this.logger.info(`Template supports 36 TREC standard sections with checkboxes`);
    
    let checkedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;
    let noMatchCount = 0;

    for (const item of items) {
      // Use intelligent name-based mapping
      const checkboxFieldName = StatusMapper.getCheckboxFieldNameByName(item, item.status);
      
      if (!checkboxFieldName) {
        // No match found or null status
        if (item.status) {
          noMatchCount++; // Has status but no TREC match
        } else {
          skippedCount++; // Null status
        }
        continue;
      }

      try {
        const checkbox = this.form.getCheckBox(checkboxFieldName);
        checkbox.check();
        this.logger.debug(`✓ Checked: ${checkboxFieldName} for "${item.title}" (${item.status})`);
        checkedCount++;
      } catch (error) {
        this.logger.warn(`✗ Checkbox not found: ${checkboxFieldName} for "${item.title}"`);
        notFoundCount++;
      }
    }

    // Summary
    this.logger.info(`\nCheckbox Summary:`);
    this.logger.info(`  ✓ Matched & checked: ${checkedCount}`);
    this.logger.info(`  ⚠️  No TREC match (content only): ${noMatchCount}`);
    this.logger.info(`  ○ Skipped (null status): ${skippedCount}`);
    this.logger.info(`  ✗ Field not found: ${notFoundCount}`);
    
    if (noMatchCount > 0) {
      this.logger.info(`\nℹ️  ${noMatchCount} items don't match standard TREC sections.`);
      this.logger.info(`   These will be added as content pages with comments/images/videos.`);
    }
  }

  /**
   * List all available form fields (for debugging)
   */
  public listAllFields(): void {
    const fields = this.form.getFields();
    this.logger.info(`Total form fields: ${fields.length}`);
    
    const textFields: string[] = [];
    const checkBoxes: string[] = [];
    const otherFields: string[] = [];

    for (const field of fields) {
      const name = field.getName();
      const type = field.constructor.name;
      
      if (type === 'PDFTextField') {
        textFields.push(name);
      } else if (type === 'PDFCheckBox') {
        checkBoxes.push(name);
      } else {
        otherFields.push(name);
      }
    }

    console.log('\n=== Form Fields Summary ===');
    console.log(`Text Fields: ${textFields.length}`);
    console.log(`Checkboxes: ${checkBoxes.length}`);
    console.log(`Other Fields: ${otherFields.length}`);
    
    if (textFields.length > 0 && textFields.length <= 20) {
      console.log('\nText Fields:');
      textFields.forEach(f => console.log(`  - ${f}`));
    }
    
    if (checkBoxes.length > 0 && checkBoxes.length <= 20) {
      console.log('\nCheckboxes (first 20):');
      checkBoxes.slice(0, 20).forEach(f => console.log(`  - ${f}`));
    }
  }

  /**
   * Get form statistics
   */
  public getFormStats(): {
    totalFields: number;
    textFields: number;
    checkboxes: number;
    otherFields: number;
  } {
    const fields = this.form.getFields();
    let textFields = 0;
    let checkboxes = 0;
    let otherFields = 0;

    for (const field of fields) {
      const type = field.constructor.name;
      if (type === 'PDFTextField') textFields++;
      else if (type === 'PDFCheckBox') checkboxes++;
      else otherFields++;
    }

    return {
      totalFields: fields.length,
      textFields,
      checkboxes,
      otherFields,
    };
  }
}

