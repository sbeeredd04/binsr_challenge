/**
 * Main Entry Point for TREC PDF Generator
 * 
 * Usage:
 *   npm run dev                    # Generate PDF from default inspection.json
 *   npm run build && npm start     # Production build and run
 */

import { TRECGenerator } from './services/TRECGenerator';
import { Validator } from './utils/validator';
import { FileUtils } from './utils/fileUtils';
import { PATHS } from './config/constants';
import { InspectionData } from './types/inspection';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  TREC PDF Generator');
  console.log('  Generates TREC inspection reports from JSON data');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();

  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const inputFile = args[0] || PATHS.INSPECTION_DATA;
    const outputFile = args[1]; // Optional output path

    // Load inspection data
    console.log(`📂 Loading inspection data from: ${inputFile}`);
    
    if (!await FileUtils.fileExists(inputFile)) {
      console.error(`❌ Error: File not found: ${inputFile}`);
      console.log('\nUsage: npm start [input.json] [output.pdf]');
      process.exit(1);
    }

    const inspectionData: InspectionData = await FileUtils.readJSON(inputFile);
    console.log(`✓ Inspection data loaded successfully\n`);

    // Generate PDF
    console.log('🔧 Starting PDF generation...\n');
    const generator = new TRECGenerator();
    const pdfPath = await generator.generate(inspectionData, outputFile);

    // Calculate time taken
    const endTime = Date.now();
    const timeTakenMs = endTime - startTime;
    const timeTakenSec = (timeTakenMs / 1000).toFixed(2);
    const timeTakenMin = (timeTakenMs / 60000).toFixed(2);

    // Success
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! TREC report generated successfully.');
    console.log('='.repeat(60));
    console.log(`\n📄 Output file: ${pdfPath}`);
    
    const sizeMB = await FileUtils.getFileSizeMB(pdfPath);
    console.log(`📊 File size: ${sizeMB.toFixed(2)} MB`);
    console.log(`⏱️  Time taken: ${timeTakenSec}s (${timeTakenMin} minutes)`);
    console.log(`⚡ Performance: ${(sizeMB / parseFloat(timeTakenSec)).toFixed(2)} MB/s`);
    console.log(`\n💡 Open the PDF to review the generated report.`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR: PDF generation failed');
    console.error('='.repeat(60));
    
    if (error instanceof Error) {
      console.error(`\n${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    
    console.error('\n' + '='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
main();

