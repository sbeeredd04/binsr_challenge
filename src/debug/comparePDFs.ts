/**
 * Compare generated PDF with sample filled PDF
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

async function comparePDFs() {
  console.log('='.repeat(80));
  console.log('PDF COMPARISON: Generated vs Sample');
  console.log('='.repeat(80));
  
  // Load both PDFs
  const generatedPath = 'output/TREC_Report_2025-11-03_1762211220000.pdf';
  const samplePath = 'assets/TREC_Sample_Filled.pdf';
  
  console.log(`\nLoading PDFs...`);
  const generatedBytes = await fs.readFile(generatedPath);
  const sampleBytes = await fs.readFile(samplePath);
  
  const generatedDoc = await PDFDocument.load(generatedBytes);
  const sampleDoc = await PDFDocument.load(sampleBytes);
  
  const generatedStats = await fs.stat(generatedPath);
  const sampleStats = await fs.stat(samplePath);
  
  console.log(`\n${'=' .repeat(80)}`);
  console.log('BASIC COMPARISON');
  console.log('='.repeat(80));
  
  console.log(`\nFile Sizes:`);
  console.log(`  Generated: ${(generatedStats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Sample:    ${(sampleStats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Ratio:     ${(generatedStats.size / sampleStats.size).toFixed(2)}x`);
  
  console.log(`\nPage Counts:`);
  console.log(`  Generated: ${generatedDoc.getPageCount()} pages`);
  console.log(`  Sample:    ${sampleDoc.getPageCount()} pages`);
  console.log(`  Difference: ${generatedDoc.getPageCount() - sampleDoc.getPageCount()} pages`);
  
  // Form analysis
  const generatedForm = generatedDoc.getForm();
  const sampleForm = sampleDoc.getForm();
  
  const generatedFields = generatedForm.getFields();
  const sampleFields = sampleForm.getFields();
  
  console.log(`\nForm Fields:`);
  console.log(`  Generated: ${generatedFields.length} fields`);
  console.log(`  Sample:    ${sampleFields.length} fields`);
  
  // Check if forms are flattened
  console.log(`\nForm Status:`);
  console.log(`  Generated: ${generatedFields.length === 0 ? 'Flattened ✓' : 'Not flattened'}`);
  console.log(`  Sample:    ${sampleFields.length === 0 ? 'Flattened ✓' : 'Not flattened'}`);
  
  // Page size comparison (first page)
  const genPage1 = generatedDoc.getPage(0);
  const samPage1 = sampleDoc.getPage(0);
  
  const genSize = genPage1.getSize();
  const samSize = samPage1.getSize();
  
  console.log(`\nPage 1 Dimensions:`);
  console.log(`  Generated: ${genSize.width} x ${genSize.height}`);
  console.log(`  Sample:    ${samSize.width} x ${samSize.height}`);
  console.log(`  Match:     ${genSize.width === samSize.width && genSize.height === samSize.height ? '✓' : '✗'}`);
  
  // Analyze image content
  console.log(`\n${'='.repeat(80)}`);
  console.log('CONTENT ANALYSIS');
  console.log('='.repeat(80));
  
  console.log(`\nEstimated Image Pages:`);
  console.log(`  Generated: ~${generatedDoc.getPageCount() - 6} pages (${generatedDoc.getPageCount()} total - 6 form pages)`);
  console.log(`  Sample:    ~${sampleDoc.getPageCount() - 6} pages (${sampleDoc.getPageCount()} total - 6 form pages)`);
  
  // Check embedded images (approximate via byte size)
  console.log(`\nEstimated Image Sizes (rough approximation):`);
  const genImageBytes = generatedStats.size - (606 * 1024); // Template is ~606 KB
  const samImageBytes = sampleStats.size - (606 * 1024);
  
  console.log(`  Generated: ~${(genImageBytes / 1024 / 1024).toFixed(2)} MB of images`);
  console.log(`  Sample:    ~${(samImageBytes / 1024 / 1024).toFixed(2)} MB of images`);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('QUALITY ASSESSMENT');
  console.log('='.repeat(80));
  
  const checks = [
    {
      name: 'Page count reasonable',
      pass: generatedDoc.getPageCount() >= sampleDoc.getPageCount() * 0.8,
      value: `${generatedDoc.getPageCount()} vs ${sampleDoc.getPageCount()}`
    },
    {
      name: 'File size reasonable',
      pass: generatedStats.size >= sampleStats.size * 0.5,
      value: `${(generatedStats.size / 1024 / 1024).toFixed(2)} MB vs ${(sampleStats.size / 1024 / 1024).toFixed(2)} MB`
    },
    {
      name: 'Form flattened',
      pass: generatedFields.length === 0,
      value: generatedFields.length === 0 ? 'Yes' : 'No'
    },
    {
      name: 'Has image pages',
      pass: generatedDoc.getPageCount() > 6,
      value: `${generatedDoc.getPageCount() - 6} image pages`
    }
  ];
  
  console.log('');
  checks.forEach(check => {
    const symbol = check.pass ? '✅' : '❌';
    console.log(`  ${symbol} ${check.name}: ${check.value}`);
  });
  
  const passedChecks = checks.filter(c => c.pass).length;
  const totalChecks = checks.length;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`OVERALL: ${passedChecks}/${totalChecks} checks passed`);
  console.log('='.repeat(80));
  
  if (passedChecks === totalChecks) {
    console.log('\n✅ Generated PDF appears to be working correctly!');
    console.log('   The PDF structure matches expected format.');
    console.log('   Visually inspect the PDF to verify content quality.');
  } else {
    console.log('\n⚠️  Some checks failed. Review the generated PDF manually.');
  }
}

comparePDFs().catch(console.error);

