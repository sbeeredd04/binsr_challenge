# TREC PDF Generator - System Architecture

**Version**: 2.0 (Final Production)  
**Date**: November 4, 2025  
**Status**: Production Ready

---

## 📐 High-Level Architecture

The TREC PDF Generator follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     TREC PDF Generator                       │
│                                                              │
│  Input: inspection.json → Output: TREC_Report.pdf          │
│  Technology: TypeScript + pdf-lib + qrcode                  │
│  Status: Production Ready                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Layer Architecture

### Layer Stack

```
┌──────────────────────────────────────────────────────┐
│  ENTRY LAYER - index.ts                              │
│  • CLI argument parsing                               │
│  • Error handling & reporting                         │
│  • Performance metrics                                │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────┴───────────────────────────────────┐
│  ORCHESTRATION LAYER - TRECGenerator                 │
│  • Workflow coordination                              │
│  • Service integration                                │
│  • Step-by-step processing                            │
└──────────────────┬───────────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
┌─────┴─────┐ ┌───┴────┐ ┌────┴──────┐
│TRECPage   │ │Template│ │Form       │
│Builder    │ │Analyzer│ │Filler     │
│           │ │        │ │           │
│Dynamic    │ │Extract │ │Fill       │
│pages      │ │structure│ │headers    │
└───────────┘ └────────┘ └───────────┘
      │            │            │
┌─────┴────────────┴────────────┴───────────────────────┐
│  MAPPER LAYER                                          │
│  • DataMapper: JSON → TRECFormData                     │
│  • StatusMapper: Status codes → Checkboxes             │
└──────────────────┬─────────────────────────────────────┘
                   │
┌──────────────────┴─────────────────────────────────────┐
│  UTILITY LAYER                                          │
│  • Logger: Progress tracking                            │
│  • Validator: Data validation                           │
│  • FileUtils: File operations                           │
└──────────────────┬─────────────────────────────────────┘
                   │
┌──────────────────┴─────────────────────────────────────┐
│  CONFIGURATION LAYER                                    │
│  • constants.ts: Field mappings & config                │
│  • sectionMapping.ts: TREC section definitions          │
└──────────────────┬─────────────────────────────────────┘
                   │
┌──────────────────┴─────────────────────────────────────┐
│  TYPE LAYER                                             │
│  • inspection.ts: Input types                           │
│  • trec.ts: Output types                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Complete Processing Pipeline

```
1. Load inspection.json (InspectionData)
   ↓
2. Validate structure (Validator)
   ↓
3. Transform data (DataMapper)
   → TRECFormData { header + items[] }
   ↓
4. Load TREC template PDF (6 pages)
   ↓
5. Fill header fields on pages 1-2 (FormFiller)
   ↓
6. Flatten form fields to static content
   ↓
7. Remove template pages 3-6
   ↓
8. Analyze template structure (TemplateAnalyzer)
   → Extract sections, subsections, keywords
   ↓
9. TWO-PASS GENERATION (TRECPageBuilder)
   │
   ├─ Pass 1: Count total pages needed
   │   • Section headers
   │   • Item pages (with checkboxes/comments)
   │   • Image pages (1 per image)
   │   • Video pages (1 per QR code)
   │   Result: totalPages = 98
   │
   └─ Pass 2: Generate pages with correct numbering
       • Add page headers (no promulgated text)
       • Add section titles (I, II, III, etc.)
       • Add subsections with checkboxes (A, B, C, etc.)
       • Add comments with bullet points
       • Add images on separate pages
       • Add QR codes on separate pages
       • Add page footers (page X of totalPages, REI, link)
   ↓
10. Save PDF
    ↓
11. Validate output
    ↓
12. Display metrics & open PDF
```

---

## 🎯 Core Services

### 1. TRECGenerator (Orchestrator)

**Responsibility**: Coordinates the entire PDF generation workflow

```typescript
class TRECGenerator {
  async generate(inspectionData, outputPath?): Promise<string> {
    // Step 1: Validate input
    // Step 2: Validate template
    // Step 3: Load template PDF
    // Step 4: Map data (DataMapper)
    // Step 5: Fill header fields (FormFiller)
    // Step 6: Flatten form fields
    // Step 7: Remove template pages 3-6
    // Step 8: Build inspection pages (TRECPageBuilder)
    // Step 9: Prepare output
    // Step 10: Save PDF
    // Step 11: Validate output
    return outputPath;
  }
}
```

### 2. TRECPageBuilder (Page Generator)

**Responsibility**: Dynamically generates inspection pages from scratch

```typescript
class TRECPageBuilder {
  // Initialize fonts and template
  async initFonts(): Promise<void>
  async analyzeTemplate(): Promise<void>
  
  // TWO-PASS generation
  async buildTRECPages(items, startPage, propertyAddress): Promise<number> {
    // Pass 1: Count total pages
    const totalPages = this.countAllPages(items);
    
    // Pass 2: Generate pages with correct page numbers
    for (const section of templateSections) {
      await this.buildSectionPages(section, items, pageNum, totalPages);
    }
    
    return pagesGenerated;
  }
  
  // Drawing methods
  private addPageHeader(page): void
  private addPageFooter(page, pageNum, totalPages, address): void
  private addSectionTitle(page, title, y): number
  private addSubsectionWithCheckboxes(page, letter, item, y): number
  private addCommentText(page, comment, y): number
  private addImageOnly(page, url, caption, itemTitle): Promise<void>
  private addVideoOnly(page, url, caption, itemTitle): Promise<void>
  
  // Utility methods
  private groupItemsByTRECSection(items): Map<string, TRECItem[]>
  private countPagesForSection(items): number
  private wrapText(text, maxWidth, fontSize): string[]
}
```

### 3. TemplateAnalyzer (Template Parser)

**Responsibility**: Extracts structure from the TREC template PDF

```typescript
class TemplateAnalyzer {
  async analyzeTemplate(pdfDoc): Promise<TemplateFormat> {
    // Extract header/footer text
    const headerText = this.extractHeaderFooter(pdfDoc).header;
    const footerText = this.extractHeaderFooter(pdfDoc).footer;
    
    // Extract section structure
    const sections = this.extractSections(form, pdfDoc);
    
    return { headerText, footerText, sections };
  }
  
  static findSubsection(sections, itemTitle, sectionName): TemplateSubsection | null
}
```

### 4. FormFiller (Form Field Filler)

**Responsibility**: Fills header fields and checkboxes on pages 1-2

```typescript
class FormFiller {
  fillHeaderFields(form, formData): void {
    // Fill client name, email, phone
    // Fill inspector name, license, sponsor
    // Fill property address
    // Fill inspection date
  }
  
  fillCheckboxes(form, items): void {
    // For each item with status
    // Calculate checkbox field name
    // Check the appropriate checkbox
  }
}
```

---

## 🗺️ Data Mapping

### DataMapper

Transforms raw JSON to structured form data:

```typescript
class DataMapper {
  getHeaderData(inspectionData): Omit<TRECFormData, 'items'> {
    return {
      clientName: inspectionData.clientInfo.name,
      clientEmail: inspectionData.clientInfo.email,
      clientPhone: inspectionData.clientInfo.phone,
      inspectorName: inspectionData.inspector.name,
      inspectorPhone: inspectionData.inspector.phone,
      inspectorLicense: inspectionData.inspector.license,
      sponsorName: inspectionData.sponsor?.name,
      propertyAddress: this.formatAddress(inspectionData.address),
      inspectionDate: this.formatDate(inspectionData.schedule.date),
    };
  }
  
  getLineItems(inspectionData): TRECItem[] {
    // Flatten all sections
    // Extract items with photos/videos/comments
    // Sort by line number
    return items;
  }
}
```

### StatusMapper

Maps inspection status codes to checkbox offsets:

```typescript
class StatusMapper {
  static getCheckboxOffset(status: InspectionStatus): number {
    const mapping = { 'I': 0, 'NI': 1, 'NP': 2, 'D': 3 };
    return mapping[status] ?? -1;
  }
}
```

---

## 🎨 PDF Structure

### Final PDF Layout

```
┌──────────────────────────────────────────────────────┐
│  Page 1-2: Header Pages (Form Fields)                │
│  ┌────────────────────────────────────────────────┐  │
│  │ Client: Binsr Demo                             │  │
│  │ Inspector: Binsr                               │  │
│  │ Property: 251 N Bristol Ave, Los Angeles...    │  │
│  │ Date: August 13, 2025                          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Page 3+: Inspection Pages (Dynamically Generated)   │
│  ┌────────────────────────────────────────────────┐  │
│  │ HEADER (all pages)                             │  │
│  │ ─────────────────────────────────────────────  │  │
│  │ Report Identification: ____________________    │  │
│  │ ┌────────────────────────────────────────┐    │  │
│  │ │ I=Inspected NI=Not Inspected ...       │    │  │
│  │ └────────────────────────────────────────┘    │  │
│  │ ┌────────────────────────────────────────┐    │  │
│  │ │ I     NI     NP     D                  │    │  │
│  │ └────────────────────────────────────────┘    │  │
│  │                                                │  │
│  │ CONTENT                                        │  │
│  │ I. STRUCTURAL SYSTEMS                          │  │
│  │                                                │  │
│  │   A. Foundations                               │  │
│  │   ☑ I  ☐ NI  ☐ NP  ☐ D                        │  │
│  │   Comments:                                    │  │
│  │   • Foundation appears stable                  │  │
│  │   • Minor settling observed                    │  │
│  │                                                │  │
│  │   B. Grading and Drainage                      │  │
│  │   ☐ I  ☐ NI  ☐ NP  ☑ D                        │  │
│  │   Comments:                                    │  │
│  │   • Poor drainage observed                     │  │
│  │                                                │  │
│  │ FOOTER                                         │  │
│  │ ─────────────────────────────────────────────  │  │
│  │                   Page 3 of 98                 │  │
│  │ REI 7-6 (8/9/21)    [LINK] Promulgated by...  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Image Pages (Separate from text)                    │
│  ┌────────────────────────────────────────────────┐  │
│  │ HEADER (same as above)                         │  │
│  │                                                │  │
│  │          [CENTERED IMAGE]                      │  │
│  │                                                │  │
│  │ Caption: Foundation crack observed             │  │
│  │                                                │  │
│  │ FOOTER (same as above)                         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  QR Code Pages (Separate from text)                  │
│  ┌────────────────────────────────────────────────┐  │
│  │ HEADER (same as above)                         │  │
│  │                                                │  │
│  │          ┌──────────────┐                      │  │
│  │          │  QR CODE     │                      │  │
│  │          │              │                      │  │
│  │          └──────────────┘                      │  │
│  │                                                │  │
│  │ Scan QR code to view video                     │  │
│  │                                                │  │
│  │ FOOTER (same as above)                         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 🧩 Key Algorithms

### 1. Subsection Sorting

**Purpose**: Order items alphabetically within each section (A→B→C→D)

```typescript
sectionItems.sort((a, b) => {
  const subA = findSubsection(sections, a.title, a.section);
  const subB = findSubsection(sections, b.title, b.section);
  
  if (subA && subB) {
    return subA.letter.localeCompare(subB.letter);
  }
  if (subA) return -1;
  if (subB) return 1;
  return 0;
});
```

### 2. Two-Pass Page Generation

**Purpose**: Calculate total pages before generating, ensuring accurate page numbers

```typescript
// Pass 1: Count pages
let totalPages = 2; // Header pages
for (const section of sections) {
  totalPages += 1; // Section header
  for (const item of sectionItems) {
    totalPages += 1; // Item page
    totalPages += item.photos.length; // Image pages
    totalPages += item.videos.length; // QR pages
  }
}

// Pass 2: Generate with correct totals
for (const section of sections) {
  addPageHeader(page);
  addPageFooter(page, currentPage, totalPages, address);
  addSectionContent(page, section, items);
}
```

### 3. Multi-Line Comment Formatting

**Purpose**: Add bullet points to each line of comments

```typescript
const rawLines = comment.split(/\r?\n/).filter(l => l.trim());

for (const rawLine of rawLines) {
  const wrappedLines = wrapText(rawLine, maxWidth, fontSize);
  
  for (let i = 0; i < wrappedLines.length; i++) {
    const prefix = i === 0 ? '• ' : '  '; // Bullet only on first line
    drawText(`${prefix}${wrappedLines[i]}`, x, y);
    y -= lineHeight;
  }
}
```

### 4. Text Wrapping

**Purpose**: Wrap long text to fit within page boundaries

```typescript
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const cleanText = text.replace(/[\r\n\t]/g, ' ').replace(/  +/g, ' ').trim();
  const words = cleanText.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}
```

---

## ⚡ Performance Characteristics

### Time Complexity

| Operation | Time | Complexity |
|-----------|------|------------|
| Load template | ~100ms | O(1) |
| Parse JSON | ~50ms | O(n) |
| Map data | ~10ms | O(n) |
| Fill form fields | ~100ms | O(n) |
| Analyze template | ~40ms | O(1) |
| Generate pages | ~15s | O(n*m) |
| Embed image (each) | ~100ms | O(1) |
| Generate QR (each) | ~50ms | O(1) |
| Save PDF | ~8s | O(n*m) |

**Total**: ~25 seconds for 139 items with 60 images

Where:
- n = number of items
- m = number of media files

### Space Complexity

- **Memory Usage**: ~200 MB during generation
- **Output Size**: ~90 MB (depends on image sizes)
- **Temp Storage**: Minimal (images streamed)

---

## 🔐 Type Safety

### Type Flow

```typescript
// Input
InspectionData (from JSON)
  ↓
// Transformation
TRECFormData {
  clientName: string
  inspectorName: string
  propertyAddress: string
  inspectionDate: string
  items: TRECItem[]
}
  ↓
// Processing
TRECItem {
  title: string
  section: string
  status: 'I' | 'NI' | 'NP' | 'D'
  comments: string[]
  photos: Photo[]
  videos: Video[]
}
  ↓
// Output
PDFDocument (binary)
```

---

## 🎯 Extension Points

### Adding New Services

```typescript
// 1. Create service
export class NewService {
  constructor(private pdfDoc: PDFDocument) {}
  async process(data: TRECItem[]): Promise<void> {
    // Implementation
  }
}

// 2. Integrate in TRECGenerator
const newService = new NewService(pdfDoc);
await newService.process(formData.items);
```

### Adding New Sections

```typescript
// 1. Update sectionMapping.ts
export const TREC_TEMPLATE_SECTIONS = [
  // ... existing sections
  {
    romanNumeral: 'VII',
    name: 'NEW SECTION',
    subsections: [
      { letter: 'A', name: 'New Subsection', keywords: ['keyword'] }
    ]
  }
];

// 2. No other changes needed - system adapts automatically
```

---

## 📊 System Statistics

- **Total Code**: ~1,800 lines of TypeScript
- **Core Services**: 4 files
- **Mappers**: 2 files
- **Utilities**: 3 files
- **Type Definitions**: 2 files
- **Configuration**: 2 files
- **Dependencies**: 3 runtime, 4 dev

---

## ✅ Architecture Principles

1. **Separation of Concerns** - Each service has one responsibility
2. **Type Safety** - Full TypeScript type checking
3. **Error Handling** - Comprehensive try-catch blocks
4. **Logging** - Detailed progress tracking
5. **Validation** - Input and output validation
6. **Flexibility** - Easy to extend and customize
7. **Performance** - Optimized algorithms
8. **Maintainability** - Clean, documented code

---

**Architecture Version**: 2.0 (Final)  
**Date**: November 4, 2025  
**Status**: Production Ready

