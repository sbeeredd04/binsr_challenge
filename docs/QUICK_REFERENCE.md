# TREC PDF Generator - Quick Reference

**Version**: 1.0.0  
**Last Updated**: November 4, 2025

---

## ⚡ Quick Commands

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
# Default (uses assets/inspection.json)
npm start

# Custom input
npm start path/to/inspection.json

# Custom input and output
npm start input.json output/report.pdf

# Development mode (no build)
npm run dev
```

### Clean

```bash
npm run clean
```

---

## 📝 Common Tasks

### Generate PDF

```bash
npm install && npm run build && npm start
```

### Rebuild Everything

```bash
npm run clean && npm install && npm run build
```

### Test Generation

```bash
npm run build && npm start && open output/TREC_Report_*.pdf
```

---

## 🐛 Debug Commands

### List PDF Fields

```bash
npm run debug:fields
```

### Inspect Template

```bash
npm run debug:template
```

### Compare PDFs

```bash
npm run debug:compare
```

---

## 📂 File Locations

### Input Files
- Template: `assets/TREC_Template_Blank.pdf`
- Data: `assets/inspection.json`

### Output Files
- PDFs: `output/TREC_Report_[timestamp].pdf`

### Source Code
- Services: `src/services/`
- Types: `src/types/`
- Config: `src/config/`

---

## 🎯 Quick Fixes

### Module Not Found
```bash
npm install
```

### Build Errors
```bash
npm run clean
npm install
npm run build
```

### Permission Issues
```bash
chmod 755 .
mkdir -p output
chmod 755 output
```

### Template Not Found
```bash
ls -l assets/TREC_Template_Blank.pdf
```

---

## 📊 Expected Output

### Console Output
```
============================================================
  TREC PDF Generator
  Generates TREC inspection reports from JSON data
============================================================

📂 Loading inspection data from: assets/inspection.json
✓ Inspection data loaded successfully

🔧 Starting PDF generation...

[2025-11-04T...] [TRECGenerator] INFO: Starting TREC PDF generation...
[2025-11-04T...] [TRECGenerator] ✓ Loaded template: 6 pages
[2025-11-04T...] [DataMapper] INFO: Mapped 139 line items from 18 sections
[2025-11-04T...] [TRECPageBuilder] INFO: Total pages: 219
[2025-11-04T...] [TRECPageBuilder] ✓ Built 96 inspection pages
[2025-11-04T...] [TRECGenerator] ✓ PDF saved: 89.50 MB, 98 pages

============================================================
✅ SUCCESS! TREC report generated successfully.
============================================================

📄 Output file: output/TREC_Report_2025-11-04_1762218467701.pdf
📊 File size: 89.50 MB
⏱️  Time taken: 23.32s (0.39 minutes)
⚡ Performance: 3.84 MB/s

💡 Open the PDF to review the generated report.
============================================================
```

### Generated PDF
- **File**: `output/TREC_Report_[timestamp].pdf`
- **Size**: ~90 MB (with images)
- **Pages**: ~98 (2 header + 96 inspection)

---

## 🎨 PDF Structure

```
Pages 1-2:  Header (client, inspector, property info)
Page 3:     I. STRUCTURAL SYSTEMS
Page 4:       A. Foundations (checkboxes + comments)
Page 5:       [Image - Foundation Photo]
Page 6:       B. Grading (checkboxes + comments)
...
Page N:     II. ELECTRICAL SYSTEMS
...
```

---

## 📊 Performance Metrics

### Typical Performance
- **Time**: 20-30 seconds
- **Size**: 80-100 MB
- **Pages**: 90-110

### First Run (Cold Start)
- **Time**: 10-15 minutes (downloading images)
- **Size**: Same
- **Pages**: Same

---

## 🔧 Configuration

### Input Data Format

```json
{
  "clientInfo": {
    "name": "Required",
    "email": "Required",
    "phone": "Required"
  },
  "inspector": {
    "name": "Required",
    "license": "Optional",
    "phone": "Optional"
  },
  "sponsor": {
    "name": "Optional"
  },
  "address": {
    "fullAddress": "Required",
    "city": "Optional",
    "state": "Optional",
    "zipCode": "Optional"
  },
  "schedule": {
    "date": "2025-11-04T10:00:00Z"  // ISO format
  },
  "sections": [
    {
      "sectionName": "Section Name",
      "lineItems": [
        {
          "lineNumber": "1",
          "itemTitle": "Item Title",
          "inspectionStatus": "I",  // I, NI, NP, or D
          "comments": [
            {
              "comment": "Comment text",
              "photos": [{"url": "https://..."}],
              "videos": [{"url": "https://..."}]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🎯 Status Codes

| Code | Meaning | Checkbox |
|------|---------|----------|
| `I` | Inspected | ☑ I |
| `NI` | Not Inspected | ☑ NI |
| `NP` | Not Present | ☑ NP |
| `D` | Deficient | ☑ D |

---

## 📝 Quick Tips

### Tip 1: Use Absolute Paths
```bash
npm start ~/Documents/inspection.json ~/Desktop/report.pdf
```

### Tip 2: Check Logs for Details
Look for:
- ✓ Success messages
- ⚠️ Warnings (non-critical)
- ✗ Errors (critical)

### Tip 3: Image Errors Are Normal
```
ERROR: Failed to add image: https://...
Error: SOI not found in JPEG
```
- This means the source image is corrupted
- NOT a code bug
- PDF continues without that image

### Tip 4: Fast Development
```bash
# Skip build step
npm run dev
```

### Tip 5: Clean Output Directory
```bash
rm -rf output/*.pdf
```

---

## 🔗 Documentation Links

- [Main README](../README.md) - Overview
- [Architecture](ARCHITECTURE.md) - System design
- [API Reference](API.md) - Code documentation
- [Troubleshooting](TROUBLESHOOTING.md) - Problem solving
- [Docs Index](README.md) - Documentation home

---

## 🎓 Learning Resources

### For Users
1. Read [Main README](../README.md)
2. Try the quick start
3. Generate your first PDF

### For Developers
1. Read [Architecture](ARCHITECTURE.md)
2. Study [API Reference](API.md)
3. Explore the source code

### For Troubleshooting
1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review log messages
3. Use debug commands

---

## 🎉 That's It!

You're ready to generate TREC PDFs!

**Quick Start:**
```bash
npm install && npm run build && npm start
```

**Need Help?**
- See [Troubleshooting Guide](TROUBLESHOOTING.md)
- Check [API Reference](API.md)
- Review [Architecture](ARCHITECTURE.md)

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: November 4, 2025
