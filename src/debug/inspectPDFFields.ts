/**
 * Debug script to inspect PDF form fields
 * Lists all field names in the template PDF
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';

async function inspectPDFFields() {
  console.log('Loading template PDF...');
  const templateBytes = await fs.readFile('assets/TREC_Template_Blank.pdf');
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const fields = form.getFields();
  
  console.log(`\nTotal fields: ${fields.length}\n`);
  console.log('=' .repeat(80));
  
  // Group by type
  const textFields = fields.filter(f => f.constructor.name === 'PDFTextField');
  const checkboxes = fields.filter(f => f.constructor.name === 'PDFCheckBox');
  const otherFields = fields.filter(f => 
    f.constructor.name !== 'PDFTextField' && 
    f.constructor.name !== 'PDFCheckBox'
  );
  
  console.log(`\nTEXT FIELDS (${textFields.length}):`);
  console.log('-'.repeat(80));
  textFields.forEach((field, idx) => {
    console.log(`${idx + 1}. ${field.getName()}`);
  });
  
  console.log(`\n\nCHECKBOXES (${checkboxes.length}):`);
  console.log('-'.repeat(80));
  checkboxes.slice(0, 50).forEach((field, idx) => {
    console.log(`${idx + 1}. ${field.getName()}`);
  });
  if (checkboxes.length > 50) {
    console.log(`... and ${checkboxes.length - 50} more checkboxes`);
  }
  
  console.log(`\n\nOTHER FIELDS (${otherFields.length}):`);
  console.log('-'.repeat(80));
  otherFields.forEach((field, idx) => {
    console.log(`${idx + 1}. ${field.getName()} (${field.constructor.name})`);
  });
  
  // Check for specific patterns
  console.log('\n\n' + '='.repeat(80));
  console.log('PATTERN ANALYSIS:');
  console.log('='.repeat(80));
  
  const allNames = fields.map(f => f.getName());
  
  // Look for name/email/phone fields
  const nameFields = allNames.filter(n => n.toLowerCase().includes('name'));
  const emailFields = allNames.filter(n => n.toLowerCase().includes('email'));
  const phoneFields = allNames.filter(n => n.toLowerCase().includes('phone'));
  const addressFields = allNames.filter(n => n.toLowerCase().includes('address'));
  const dateFields = allNames.filter(n => n.toLowerCase().includes('date'));
  
  console.log('\nFields containing "name":', nameFields.length);
  nameFields.forEach(n => console.log(`  - ${n}`));
  
  console.log('\nFields containing "email":', emailFields.length);
  emailFields.forEach(n => console.log(`  - ${n}`));
  
  console.log('\nFields containing "phone":', phoneFields.length);
  phoneFields.forEach(n => console.log(`  - ${n}`));
  
  console.log('\nFields containing "address":', addressFields.length);
  addressFields.forEach(n => console.log(`  - ${n}`));
  
  console.log('\nFields containing "date":', dateFields.length);
  dateFields.forEach(n => console.log(`  - ${n}`));
  
  // Checkbox pattern analysis
  const page3Checkboxes = checkboxes.filter(cb => cb.getName().includes('Page3'));
  const page4Checkboxes = checkboxes.filter(cb => cb.getName().includes('Page4'));
  const page5Checkboxes = checkboxes.filter(cb => cb.getName().includes('Page5'));
  const page6Checkboxes = checkboxes.filter(cb => cb.getName().includes('Page6'));
  
  console.log('\n\nCheckbox distribution:');
  console.log(`  Page 3: ${page3Checkboxes.length} checkboxes`);
  console.log(`  Page 4: ${page4Checkboxes.length} checkboxes`);
  console.log(`  Page 5: ${page5Checkboxes.length} checkboxes`);
  console.log(`  Page 6: ${page6Checkboxes.length} checkboxes`);
  console.log(`  Total: ${page3Checkboxes.length + page4Checkboxes.length + page5Checkboxes.length + page6Checkboxes.length}`);
}

inspectPDFFields().catch(console.error);

