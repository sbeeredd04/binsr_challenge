# TREC PDF Generator - API Reference

**Version**: 1.0.0  
**Date**: November 4, 2025

---

## 📚 Table of Contents

- [Entry Point](#entry-point)
- [Core Services](#core-services)
- [Mappers](#mappers)
- [Utilities](#utilities)
- [Types](#types)
- [Configuration](#configuration)

---

## Entry Point

### index.ts

Main entry point for the application.

```typescript
async function main(): Promise<void>
```

**Usage:**
```bash
npm start [inputFile] [outputFile]
```

**Parameters:**
- `inputFile` (optional): Path to inspection JSON file (default: `assets/inspection.json`)
- `outputFile` (optional): Path for output PDF

**Example:**
```bash
npm start custom-inspection.json output/my-report.pdf
```

---

## Core Services

### TRECGenerator

Main orchestrator service that coordinates the entire PDF generation workflow.

#### Class Definition

```typescript
class TRECGenerator {
  constructor();
  async generate(inspectionData: InspectionData, outputPath?: string): Promise<string>;
}
```

#### Methods

##### `generate(inspectionData, outputPath?): Promise<string>`

Generates a TREC PDF from inspection data.

**Parameters:**
- `inspectionData` (InspectionData): The inspection data object
- `outputPath` (string, optional): Custom output path for the PDF

**Returns:** Promise<string> - Path to the generated PDF

**Throws:** Error if generation fails

**Example:**
```typescript
const generator = new TRECGenerator();
const pdfPath = await generator.generate(inspectionData);
console.log(`PDF generated: ${pdfPath}`);
```

---

### TRECPageBuilder

Dynamically generates inspection pages from scratch.

#### Class Definition

```typescript
class TRECPageBuilder {
  constructor(pdfDoc: PDFDocument);
  
  async buildTRECPages(
    items: TRECItem[], 
    startingPageNumber: number, 
    propertyAddress: string
  ): Promise<number>;
}
```

#### Methods

##### `buildTRECPages(items, startingPageNumber, propertyAddress): Promise<number>`

Builds all inspection pages using two-pass generation.

**Parameters:**
- `items` (TRECItem[]): Array of inspection items
- `startingPageNumber` (number): Starting page number (usually 3)
- `propertyAddress` (string): Property address for footer

**Returns:** Promise<number> - Number of pages generated

**Example:**
```typescript
const pageBuilder = new TRECPageBuilder(pdfDoc);
const pagesGenerated = await pageBuilder.buildTRECPages(items, 3, address);
console.log(`Generated ${pagesGenerated} pages`);
```

---

### TemplateAnalyzer

Extracts structure and formatting information from the TREC template PDF.

#### Class Definition

```typescript
class TemplateAnalyzer {
  static async analyzeTemplate(pdfDoc: PDFDocument): Promise<TemplateFormat>;
  static findSubsection(sections: TemplateSection[], itemTitle: string, sectionName: string): TemplateSubsection | null;
}
```

#### Methods

##### `analyzeTemplate(pdfDoc): Promise<TemplateFormat>`

Analyzes the template PDF to extract structure.

**Parameters:**
- `pdfDoc` (PDFDocument): The template PDF document

**Returns:** Promise<TemplateFormat> - Extracted template structure

**Example:**
```typescript
const format = await TemplateAnalyzer.analyzeTemplate(pdfDoc);
console.log(`Found ${format.sections.length} sections`);
```

##### `findSubsection(sections, itemTitle, sectionName): TemplateSubsection | null`

Finds a matching subsection for an inspection item.

**Parameters:**
- `sections` (TemplateSection[]): Array of template sections
- `itemTitle` (string): Title of the inspection item
- `sectionName` (string): Name of the section

**Returns:** TemplateSubsection | null

**Example:**
```typescript
const subsection = TemplateAnalyzer.findSubsection(sections, 'Foundation', 'Structural');
if (subsection) {
  console.log(`Matched to ${subsection.letter}. ${subsection.name}`);
}
```

---

### FormFiller

Fills form fields and checkboxes in the PDF.

#### Class Definition

```typescript
class FormFiller {
  constructor(logger: Logger);
  
  fillHeaderFields(form: PDFForm, formData: TRECFormData): void;
  fillCheckboxes(form: PDFForm, items: TRECItem[]): void;
}
```

#### Methods

##### `fillHeaderFields(form, formData): void`

Fills all header text fields on pages 1-2.

**Parameters:**
- `form` (PDFForm): The PDF form object
- `formData` (TRECFormData): Form data containing header information

**Example:**
```typescript
const formFiller = new FormFiller(logger);
formFiller.fillHeaderFields(form, formData);
```

##### `fillCheckboxes(form, items): void`

Checks appropriate checkboxes for inspection items.

**Parameters:**
- `form` (PDFForm): The PDF form object
- `items` (TRECItem[]): Array of inspection items

**Example:**
```typescript
formFiller.fillCheckboxes(form, items);
```

---

## Mappers

### DataMapper

Transforms raw inspection JSON data into structured TREC form data.

#### Class Definition

```typescript
class DataMapper {
  constructor(inspectionData: InspectionData, logger: Logger);
  
  getHeaderData(): Omit<TRECFormData, 'items'>;
  getLineItems(): TRECItem[];
  getFormData(): TRECFormData;
}
```

#### Methods

##### `getHeaderData(): Omit<TRECFormData, 'items'>`

Extracts header information.

**Returns:** Header data (client, inspector, property, date)

**Example:**
```typescript
const mapper = new DataMapper(inspectionData, logger);
const header = mapper.getHeaderData();
console.log(`Client: ${header.clientName}`);
```

##### `getLineItems(): TRECItem[]`

Flattens and extracts all line items.

**Returns:** Array of TREC items

**Example:**
```typescript
const items = mapper.getLineItems();
console.log(`Found ${items.length} inspection items`);
```

##### `getFormData(): TRECFormData`

Combines header and items into complete form data.

**Returns:** Complete TREC form data

**Example:**
```typescript
const formData = mapper.getFormData();
```

---

### StatusMapper

Maps inspection status codes to checkbox field names.

#### Class Definition

```typescript
class StatusMapper {
  static getCheckboxFieldName(itemIndex: number, status: InspectionStatus): string | null;
  static getCheckboxOffset(status: InspectionStatus): number;
  static getAllCheckboxes(itemIndex: number): string[];
}
```

#### Methods

##### `getCheckboxFieldName(itemIndex, status): string | null`

Gets the PDF field name for a specific checkbox.

**Parameters:**
- `itemIndex` (number): Index of the item (0-based)
- `status` (InspectionStatus): Status code ('I', 'NI', 'NP', 'D')

**Returns:** Field name or null

**Example:**
```typescript
const fieldName = StatusMapper.getCheckboxFieldName(0, 'I');
// Returns: "topmostSubform[0].Page3[0].CheckBox1[0]"
```

##### `getCheckboxOffset(status): number`

Gets the offset for a status code.

**Parameters:**
- `status` (InspectionStatus): Status code

**Returns:** Checkbox offset (0-3) or -1

**Example:**
```typescript
const offset = StatusMapper.getCheckboxOffset('D'); // Returns: 3
```

---

## Utilities

### Logger

Provides structured logging with timestamps.

#### Class Definition

```typescript
class Logger {
  constructor(context?: string);
  
  info(message: string): void;
  debug(message: string): void;
  warn(message: string): void;
  error(message: string, error?: any): void;
  success(message: string): void;
}
```

#### Methods

##### `info(message): void`

Logs an informational message.

**Example:**
```typescript
const logger = new Logger('MyService');
logger.info('Processing started');
```

##### `debug(message): void`

Logs a debug message.

**Example:**
```typescript
logger.debug('Variable value: ' + value);
```

##### `warn(message): void`

Logs a warning message.

**Example:**
```typescript
logger.warn('Missing optional field');
```

##### `error(message, error?): void`

Logs an error message.

**Example:**
```typescript
logger.error('Failed to process', error);
```

##### `success(message): void`

Logs a success message.

**Example:**
```typescript
logger.success('PDF generated successfully');
```

---

### Validator

Validates inspection data and PDF files.

#### Class Definition

```typescript
class Validator {
  static validateInspectionData(data: unknown): boolean;
  static async validateTemplate(templatePath: string): Promise<boolean>;
  static async validatePDF(pdfPath: string): Promise<boolean>;
}
```

#### Methods

##### `validateInspectionData(data): boolean`

Validates inspection data structure.

**Parameters:**
- `data` (unknown): Data to validate

**Returns:** true if valid

**Example:**
```typescript
if (Validator.validateInspectionData(data)) {
  console.log('Data is valid');
}
```

##### `validateTemplate(templatePath): Promise<boolean>`

Validates that the template PDF exists and is readable.

**Parameters:**
- `templatePath` (string): Path to template PDF

**Returns:** Promise<boolean>

**Example:**
```typescript
const isValid = await Validator.validateTemplate('assets/template.pdf');
```

##### `validatePDF(pdfPath): Promise<boolean>`

Validates that a PDF was generated successfully.

**Parameters:**
- `pdfPath` (string): Path to PDF file

**Returns:** Promise<boolean>

**Example:**
```typescript
const isValid = await Validator.validatePDF('output/report.pdf');
```

---

### FileUtils

Utility functions for file operations.

#### Class Definition

```typescript
class FileUtils {
  static async ensureDirectory(dirPath: string): Promise<void>;
  static generateOutputFilename(basePath: string, prefix: string): string;
  static async readJSON<T>(filePath: string): Promise<T>;
  static async fileExists(filePath: string): Promise<boolean>;
  static async getFileSizeMB(filePath: string): Promise<number>;
}
```

#### Methods

##### `ensureDirectory(dirPath): Promise<void>`

Ensures a directory exists, creates if not.

**Parameters:**
- `dirPath` (string): Directory path

**Example:**
```typescript
await FileUtils.ensureDirectory('output/');
```

##### `generateOutputFilename(basePath, prefix): string`

Generates a timestamped filename.

**Parameters:**
- `basePath` (string): Base directory path
- `prefix` (string): Filename prefix

**Returns:** Complete file path

**Example:**
```typescript
const filename = FileUtils.generateOutputFilename('output/', 'TREC_Report');
// Returns: "output/TREC_Report_2025-11-04_1762218467701.pdf"
```

##### `readJSON<T>(filePath): Promise<T>`

Reads and parses a JSON file.

**Parameters:**
- `filePath` (string): Path to JSON file

**Returns:** Parsed JSON data

**Example:**
```typescript
const data = await FileUtils.readJSON<InspectionData>('assets/inspection.json');
```

##### `fileExists(filePath): Promise<boolean>`

Checks if a file exists.

**Parameters:**
- `filePath` (string): File path

**Returns:** true if file exists

**Example:**
```typescript
if (await FileUtils.fileExists('template.pdf')) {
  console.log('Template found');
}
```

##### `getFileSizeMB(filePath): Promise<number>`

Gets file size in megabytes.

**Parameters:**
- `filePath` (string): File path

**Returns:** File size in MB

**Example:**
```typescript
const sizeMB = await FileUtils.getFileSizeMB('output/report.pdf');
console.log(`File size: ${sizeMB.toFixed(2)} MB`);
```

---

## Types

### InspectionData

Root inspection data structure.

```typescript
interface InspectionData {
  clientInfo: {
    name: string;
    email: string;
    phone: string;
  };
  inspector: {
    name: string;
    phone: string;
    license: string;
  };
  sponsor?: {
    name: string;
  };
  address: {
    fullAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  schedule: {
    date: string; // ISO format
  };
  sections: InspectionSection[];
}
```

### InspectionSection

Section containing line items.

```typescript
interface InspectionSection {
  sectionName: string;
  lineItems: LineItem[];
}
```

### LineItem

Individual inspection item.

```typescript
interface LineItem {
  lineNumber: string;
  itemTitle: string;
  inspectionStatus: InspectionStatus;
  comments: Comment[];
}
```

### TRECFormData

Transformed form data for PDF generation.

```typescript
interface TRECFormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  inspectorName: string;
  inspectorPhone: string;
  inspectorLicense: string;
  sponsorName: string;
  propertyAddress: string;
  inspectionDate: string;
  items: TRECItem[];
}
```

### TRECItem

Individual item for TREC report.

```typescript
interface TRECItem {
  lineNumber: string;
  title: string;
  section: string;
  status: InspectionStatus;
  comments: string[];
  photos: Photo[];
  videos: Video[];
}
```

### InspectionStatus

Status code type.

```typescript
type InspectionStatus = 'I' | 'NI' | 'NP' | 'D';
```

---

## Configuration

### Constants

Configuration constants and field mappings.

```typescript
// File paths
export const PATHS = {
  TEMPLATE: 'assets/TREC_Template_Blank.pdf',
  OUTPUT_DIR: 'output',
  INSPECTION_DATA: 'assets/inspection.json'
} as const;

// Form field names
export const FORM_FIELDS = {
  CLIENT_NAME: 'topmostSubform[0].Page1[0].Name of Client[0]',
  INSPECTOR_NAME: 'topmostSubform[0].Page1[0].Name of Inspector[0]',
  PROPERTY_ADDRESS: 'topmostSubform[0].Page1[0].Address of Inspected Property[0]',
  INSPECTION_DATE: 'topmostSubform[0].Page1[0].Date of Inspection[0]',
  // ... more fields
} as const;

// Page configuration
export const PAGE_CONFIG = {
  ITEMS_PER_PAGE: 35,
  MAX_CHECKBOX_ITEMS: 36
} as const;
```

---

## Usage Examples

### Complete Generation Workflow

```typescript
import { TRECGenerator } from './services/TRECGenerator';
import { FileUtils } from './utils/fileUtils';

async function generateReport() {
  // 1. Load inspection data
  const inspectionData = await FileUtils.readJSON('assets/inspection.json');
  
  // 2. Create generator
  const generator = new TRECGenerator();
  
  // 3. Generate PDF
  const pdfPath = await generator.generate(inspectionData);
  
  // 4. Get file info
  const sizeMB = await FileUtils.getFileSizeMB(pdfPath);
  
  console.log(`Generated: ${pdfPath} (${sizeMB.toFixed(2)} MB)`);
}
```

### Custom Data Mapping

```typescript
import { DataMapper } from './mappers/DataMapper';
import { Logger } from './utils/logger';

const logger = new Logger('CustomMapper');
const mapper = new DataMapper(inspectionData, logger);

// Get header data only
const header = mapper.getHeaderData();
console.log(`Inspector: ${header.inspectorName}`);

// Get items only
const items = mapper.getLineItems();
console.log(`Items: ${items.length}`);

// Get complete form data
const formData = mapper.getFormData();
```

### Custom Validation

```typescript
import { Validator } from './utils/validator';

// Validate before processing
if (!Validator.validateInspectionData(data)) {
  throw new Error('Invalid inspection data');
}

// Validate template exists
if (!await Validator.validateTemplate('assets/template.pdf')) {
  throw new Error('Template not found');
}

// Validate output
if (!await Validator.validatePDF('output/report.pdf')) {
  throw new Error('PDF generation failed');
}
```

---

**API Version**: 1.0.0  
**Date**: November 4, 2025  
**Status**: Complete

