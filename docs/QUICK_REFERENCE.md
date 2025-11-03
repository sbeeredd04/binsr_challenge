# TREC PDF Generator - Quick Reference

## 🎯 30-Second Summary

**What**: Generate TREC inspection PDFs from JSON data  
**Input**: `inspection.json` (18 sections, 139 items)  
**Output**: Professional PDF report (6-30 pages)  
**Technology**: **TypeScript + pdf-lib** ⭐  
**Code**: ~300-400 lines core logic  
**Performance**: 3-4 seconds per report  

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install pdf-lib qrcode
npm install -D typescript @types/node @types/qrcode
```

### 2. Initialize TypeScript Project
```bash
npm init -y
npx tsc --init
```

### 3. Project Structure
```
src/
├── types/
│   └── inspection.types.ts
├── services/
│   ├── TRECGenerator.ts
│   ├── FormFiller.ts
│   ├── ImageEmbedder.ts
│   └── QRGenerator.ts
├── mappers/
│   ├── DataMapper.ts
│   └── StatusMapper.ts
├── utils/
│   └── pdfHelpers.ts
└── index.ts
```

### 4. Run
```bash
npm run build
npm start
```

---

## 📊 The Numbers

| Metric | Template | Sample | Data | Output |
|--------|----------|--------|------|--------|
| **Pages** | 6 | 30 | - | 6-15 |
| **Size** | 606 KB | 5.36 MB | - | 1-10 MB |
| **Fields** | 250 | 0 | - | 0 |
| **Images** | 3 | 125 | 0 | 0-125+ |
| **Items** | - | - | 139 | 139 |

---

## 🔑 Key Code Snippets

### Load Template and Fill Form
```typescript
import { PDFDocument, PDFForm } from 'pdf-lib';
import * as fs from 'fs/promises';

async function fillForm(data: InspectionData): Promise<Uint8Array> {
  // Load template
  const templateBytes = await fs.readFile('assets/TREC_Template_Blank.pdf');
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  // Fill text fields
  form.getTextField('ClientName').setText(data.client.name);
  form.getTextField('ClientEmail').setText(data.client.email);
  form.getTextField('PropertyAddress').setText(data.property.address);
  
  // Fill checkboxes
  data.sections.forEach(section => {
    section.items.forEach((item, idx) => {
      const status = mapStatus(item.inspectionStatus);
      if (status) {
        const fieldName = `CheckBox1[${idx * 4 + statusOffset(status)}]`;
        form.getCheckBox(fieldName).check();
      }
    });
  });
  
  // Flatten and save
  form.flatten();
  return await pdfDoc.save();
}
```

### Embed Images
```typescript
import { PDFDocument, PDFImage } from 'pdf-lib';

async function embedImages(
  pdfDoc: PDFDocument, 
  images: string[]
): Promise<void> {
  for (const imagePath of images) {
    const imageBytes = await fs.readFile(imagePath);
    const image = await pdfDoc.embedJpg(imageBytes); // or embedPng
    
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    // Scale image to fit page
    const scale = Math.min(
      (width - 100) / image.width,
      (height - 100) / image.height
    );
    
    page.drawImage(image, {
      x: 50,
      y: height - 50 - (image.height * scale),
      width: image.width * scale,
      height: image.height * scale,
    });
  }
}
```

### Generate QR Codes
```typescript
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

async function addQRCode(
  pdfDoc: PDFDocument,
  page: PDFPage,
  url: string,
  x: number,
  y: number
): Promise<void> {
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(url, { width: 200 });
  
  // Convert data URL to bytes
  const qrBytes = Buffer.from(
    qrDataUrl.split(',')[1],
    'base64'
  );
  
  // Embed and draw
  const qrImage = await pdfDoc.embedPng(qrBytes);
  page.drawImage(qrImage, { x, y, width: 100, height: 100 });
}
```

---

## 📋 Status Mapping

```typescript
enum InspectionStatus {
  INSPECTED = 'inspected',
  NOT_INSPECTED = 'not_inspected',
  NOT_PRESENT = 'not_present',
  DEFICIENT = 'deficient',
  UNKNOWN = 'unknown'
}

const STATUS_TO_CHECKBOX_INDEX = {
  [InspectionStatus.INSPECTED]: 0,      // I
  [InspectionStatus.NOT_INSPECTED]: 1,  // NI
  [InspectionStatus.NOT_PRESENT]: 2,    // NP
  [InspectionStatus.DEFICIENT]: 3,      // D
  [InspectionStatus.UNKNOWN]: null      // No checkbox
};

function getCheckboxFieldName(
  page: number, 
  itemIndex: number, 
  status: InspectionStatus
): string {
  const offset = STATUS_TO_CHECKBOX_INDEX[status];
  if (offset === null) return null;
  
  const fieldIndex = itemIndex * 4 + offset;
  return `topmostSubform[0].Page${page}[0].CheckBox1[${fieldIndex}]`;
}
```

---

## 🎨 pdf-lib Essentials

### Load and Save
```typescript
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';

// Load existing PDF
const bytes = await fs.readFile('input.pdf');
const pdfDoc = await PDFDocument.load(bytes);

// Create new PDF
const pdfDoc = await PDFDocument.create();

// Save PDF
const pdfBytes = await pdfDoc.save();
await fs.writeFile('output.pdf', pdfBytes);
```

### Work with Forms
```typescript
const form = pdfDoc.getForm();

// Text fields
const textField = form.getTextField('FieldName');
textField.setText('Value');

// Checkboxes
const checkbox = form.getCheckBox('CheckBoxName');
checkbox.check();   // Check the box
checkbox.uncheck(); // Uncheck the box

// Flatten form (convert to static)
form.flatten();
```

### Add Pages
```typescript
import { PageSizes } from 'pdf-lib';

// Add blank page
const page = pdfDoc.addPage();

// Add page with specific size
const page = pdfDoc.addPage(PageSizes.Letter);

// Get page dimensions
const { width, height } = page.getSize();
```

### Draw Text
```typescript
const page = pdfDoc.getPages()[0];

page.drawText('Hello World', {
  x: 50,
  y: 700,
  size: 12,
  color: rgb(0, 0, 0),
});
```

### Embed Images
```typescript
// JPEG
const jpgBytes = await fs.readFile('image.jpg');
const jpgImage = await pdfDoc.embedJpg(jpgBytes);

// PNG
const pngBytes = await fs.readFile('image.png');
const pngImage = await pdfDoc.embedPng(pngBytes);

// Draw image
page.drawImage(jpgImage, {
  x: 100,
  y: 500,
  width: 400,
  height: 300,
});
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Module Not Found
```bash
# Error: Cannot find module 'pdf-lib'
# Fix:
npm install pdf-lib qrcode
npm install -D @types/node @types/qrcode
```

### Issue 2: TypeScript Errors
```bash
# Error: Cannot find name 'PDFDocument'
# Fix: Add proper imports
import { PDFDocument, PDFForm, PDFPage } from 'pdf-lib';
```

### Issue 3: Form Field Not Found
```typescript
// Error: Field 'FieldName' not found
// Fix: List all field names first
const form = pdfDoc.getForm();
const fields = form.getFields();
fields.forEach(field => {
  console.log(`Field: ${field.getName()}`);
});
```

### Issue 4: Flattening Issues
```typescript
// Issue: Form still interactive after flattening
// Fix: Ensure flatten() is called before save()
const form = pdfDoc.getForm();
// ... fill fields ...
form.flatten();  // ← Must call before save
const bytes = await pdfDoc.save();
```

---

## 🧪 Testing Commands

```bash
# Build TypeScript
npm run build

# Run main script
npm start

# Run tests
npm test

# Run with TypeScript directly
npx ts-node src/index.ts

# Watch mode
npm run dev
```

---

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "clean": "rm -rf dist"
  }
}
```

---

## ⚡ Performance Tips

1. **Reuse PDFDocument**: Load template once, clone for multiple reports
2. **Optimize Images**: Resize to 800x600 max before embedding
3. **Batch Processing**: Generate multiple PDFs in parallel
4. **Cache QR Codes**: Generate QR codes once, reuse data URLs
5. **Memory Management**: Clear large objects after processing

---

## 📏 Type Definitions

```typescript
// inspection.types.ts
export interface InspectionData {
  inspection_id: string;
  status: string;
  client: ClientInfo;
  inspector: InspectorInfo;
  property: PropertyInfo;
  schedule: ScheduleInfo;
  sections: Section[];
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface InspectorInfo {
  name: string;
  email: string;
}

export interface PropertyInfo {
  address: string;
  city: string;
}

export interface ScheduleInfo {
  date: number; // timestamp
}

export interface Section {
  id: string;
  name: string;
  title: string;
  items: LineItem[];
}

export interface LineItem {
  id: string;
  name: string;
  title: string;
  lineItemNumber: number;
  inspectionStatus: InspectionStatus | null;
  isDeficient: boolean;
  comments: Comment[];
  media: Media[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
}

export interface Media {
  images: string[];
  videos: string[];
}
```

---

## ✅ Validation Checklist

After generation, verify:

- [ ] PDF file created successfully
- [ ] File size > 0 bytes
- [ ] Page count is correct (6-15 pages)
- [ ] Opens without errors in PDF reader
- [ ] Header contains client information
- [ ] Property address is correct
- [ ] Inspection items are listed
- [ ] Checkboxes are visible and checked correctly
- [ ] Images are embedded (if present)
- [ ] QR codes are scannable (if present)
- [ ] Form is flattened (not editable)

---

## 🔧 Debugging Tips

### Enable Verbose Logging
```typescript
console.log('Loading template...');
const pdfDoc = await PDFDocument.load(bytes);
console.log(`Loaded ${pdfDoc.getPageCount()} pages`);

console.log('Getting form...');
const form = pdfDoc.getForm();
const fields = form.getFields();
console.log(`Found ${fields.length} form fields`);
```

### Inspect Form Fields
```typescript
const form = pdfDoc.getForm();
form.getFields().forEach(field => {
  const type = field.constructor.name;
  const name = field.getName();
  console.log(`${type}: ${name}`);
});
```

### Test Incrementally
```typescript
// Step 1: Just load and save
const pdfDoc = await PDFDocument.load(templateBytes);
const output = await pdfDoc.save();

// Step 2: Fill one field
form.getTextField('ClientName').setText('Test');

// Step 3: Fill all fields
// Step 4: Add images
// Step 5: Flatten
```

---

## 📚 Full Documentation

- **[README.md](./README.md)** - Documentation index
- **[ANALYSIS_SUMMARY.md](./ANALYSIS_SUMMARY.md)** - Analysis results
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete implementation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - This document

---

## 🚀 Production Deployment

### Environment Setup
```bash
# Install Node.js (v18+ recommended)
node --version

# Create project
mkdir trec-pdf-generator
cd trec-pdf-generator
npm init -y

# Install dependencies
npm install pdf-lib qrcode
npm install -D typescript @types/node @types/qrcode ts-node

# Initialize TypeScript
npx tsc --init
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

---

**Quick Reference Updated**: 2024-11-03  
**For complete details**: See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
