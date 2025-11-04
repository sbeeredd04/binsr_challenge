/**
 * Inspect TREC Template Structure
 * Discovers all sections, their fields, and checkbox patterns
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';

async function inspectTemplateStructure() {
  console.log('='.repeat(80));
  console.log('TREC Template Structure Inspector');
  console.log('='.repeat(80));

  // Load template
  const templatePath = 'assets/TREC_Template_Blank.pdf';
  const templateBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  console.log(`\nTotal pages: ${pdfDoc.getPageCount()}`);
  console.log(`Total form fields: ${form.getFields().length}`);

  // Group fields by page and type
  const fieldsByPage: Map<number, { text: string[], checkboxes: string[] }> = new Map();
  
  for (const field of form.getFields()) {
    const name = field.getName();
    const type = field.constructor.name;
    
    // Extract page number from field name (topmostSubform[0].Page3[0].FieldName[0])
    const pageMatch = name.match(/Page(\d+)\[0\]/);
    const pageNum = pageMatch ? parseInt(pageMatch[1]) : 1;
    
    if (!fieldsByPage.has(pageNum)) {
      fieldsByPage.set(pageNum, { text: [], checkboxes: [] });
    }
    
    const pageFields = fieldsByPage.get(pageNum)!;
    if (type === 'PDFTextField') {
      pageFields.text.push(name);
    } else if (type === 'PDFCheckBox') {
      pageFields.checkboxes.push(name);
    }
  }

  // Display by page
  console.log('\n' + '='.repeat(80));
  console.log('FIELDS BY PAGE');
  console.log('='.repeat(80));

  for (let page = 1; page <= pdfDoc.getPageCount(); page++) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`PAGE ${page}`);
    console.log('─'.repeat(80));
    
    const fields = fieldsByPage.get(page);
    if (!fields) {
      console.log('  No form fields on this page');
      continue;
    }

    if (fields.text.length > 0) {
      console.log(`\n  TEXT FIELDS (${fields.text.length}):`);
      fields.text.forEach((name, idx) => {
        console.log(`    ${idx + 1}. ${name}`);
      });
    }

    if (fields.checkboxes.length > 0) {
      console.log(`\n  CHECKBOXES (${fields.checkboxes.length}):`);
      
      // Group checkboxes by base name (detect patterns)
      const checkboxGroups = new Map<string, string[]>();
      
      for (const name of fields.checkboxes) {
        // Extract base name (everything before the last [index])
        const baseMatch = name.match(/(.+)\[\d+\]$/);
        const baseName = baseMatch ? baseMatch[1] : name;
        
        if (!checkboxGroups.has(baseName)) {
          checkboxGroups.set(baseName, []);
        }
        checkboxGroups.get(baseName)!.push(name);
      }

      // Display checkbox groups (likely representing items with 4 checkboxes each)
      checkboxGroups.forEach((checkboxes, baseName) => {
        console.log(`\n    Group: ${baseName} (${checkboxes.length} checkboxes)`);
        if (checkboxes.length === 4) {
          console.log(`      → Likely represents ${checkboxes.length / 4} item(s) with I/NI/NP/D options`);
        }
        // Show first few examples
        checkboxes.slice(0, 8).forEach((cb, idx) => {
          console.log(`      ${idx + 1}. ${cb}`);
        });
        if (checkboxes.length > 8) {
          console.log(`      ... and ${checkboxes.length - 8} more`);
        }
      });
    }
  }

  // Analyze checkbox patterns to find sections
  console.log('\n' + '='.repeat(80));
  console.log('CHECKBOX ANALYSIS - DETECTING SECTIONS');
  console.log('='.repeat(80));

  const allCheckboxes = form.getFields()
    .filter(f => f.constructor.name === 'PDFCheckBox')
    .map(f => f.getName());

  console.log(`\nTotal checkboxes: ${allCheckboxes.length}`);
  console.log(`Expected items (checkboxes / 4): ${allCheckboxes.length / 4}`);

  // Distribution by page
  console.log('\nCheckbox distribution by page:');
  for (let page = 3; page <= 6; page++) {
    const pageCheckboxes = allCheckboxes.filter(name => name.includes(`Page${page}[0]`));
    const itemCount = pageCheckboxes.length / 4;
    console.log(`  Page ${page}: ${pageCheckboxes.length} checkboxes (${itemCount} items)`);
  }

  // Try to detect text labels near checkboxes (section names)
  console.log('\n' + '='.repeat(80));
  console.log('TEXT FIELDS THAT MIGHT BE SECTION LABELS');
  console.log('='.repeat(80));

  const textFields = form.getFields().filter(f => f.constructor.name === 'PDFTextField');
  console.log(`\nTotal text fields: ${textFields.length}`);
  
  // Look for text fields on pages 3-6 (inspection pages)
  for (let page = 3; page <= 6; page++) {
    const pageTextFields = textFields.filter(f => f.getName().includes(`Page${page}[0]`));
    if (pageTextFields.length > 0) {
      console.log(`\nPage ${page} text fields (${pageTextFields.length}):`);
      pageTextFields.forEach((field, idx) => {
        console.log(`  ${idx + 1}. ${field.getName()}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('INSPECTION COMPLETE');
  console.log('='.repeat(80));
}

inspectTemplateStructure().catch(console.error);


