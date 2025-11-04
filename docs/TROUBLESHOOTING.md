# TREC PDF Generator - Troubleshooting Guide

**Version**: 1.0.0  
**Date**: November 4, 2025

---

## 📋 Table of Contents

- [Common Issues](#common-issues)
- [Installation Problems](#installation-problems)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)
- [PDF Generation Issues](#pdf-generation-issues)
- [Performance Issues](#performance-issues)
- [Data Issues](#data-issues)
- [Debug Tools](#debug-tools)

---

## Common Issues

### Issue: Module not found

**Symptom:**
```
Error: Cannot find module 'pdf-lib'
```

**Solution:**
```bash
npm install
```

If the problem persists:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: TypeScript compilation errors

**Symptom:**
```
error TS2307: Cannot find module './types/inspection'
```

**Solution:**
```bash
npm run clean
npm install
npm run build
```

---

### Issue: Permission denied

**Symptom:**
```
Error: EACCES: permission denied, mkdir 'output'
```

**Solution:**
```bash
# Option 1: Fix permissions
chmod 755 .
mkdir -p output
chmod 755 output

# Option 2: Run with sudo (not recommended)
sudo npm start
```

---

## Installation Problems

### Node.js version too old

**Symptom:**
```
npm ERR! engine Unsupported engine
```

**Solution:**
1. Check your Node.js version:
```bash
node --version
```

2. Upgrade to Node.js v16 or higher:
```bash
# Using nvm
nvm install 16
nvm use 16

# Or download from https://nodejs.org/
```

---

### npm install fails

**Symptom:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, use --legacy-peer-deps
npm install --legacy-peer-deps
```

---

## Build Errors

### TypeScript cannot find types

**Symptom:**
```
error TS2688: Cannot find type definition file for 'node'
```

**Solution:**
```bash
npm install --save-dev @types/node @types/qrcode
```

---

### tsconfig.json errors

**Symptom:**
```
error TS5023: Unknown compiler option 'moduleDetection'
```

**Solution:**
Ensure TypeScript version is 5.0 or higher:
```bash
npm install --save-dev typescript@latest
```

---

## Runtime Errors

### Template not found

**Symptom:**
```
✗ Template not found: assets/TREC_Template_Blank.pdf
```

**Solution:**
1. Check if file exists:
```bash
ls -l assets/TREC_Template_Blank.pdf
```

2. If missing, ensure you have the correct file in the `assets/` directory.

3. Check file permissions:
```bash
chmod 644 assets/TREC_Template_Blank.pdf
```

---

### Inspection data not found

**Symptom:**
```
❌ Error: File not found: assets/inspection.json
```

**Solution:**
1. Check if file exists:
```bash
ls -l assets/inspection.json
```

2. Verify file path is correct:
```bash
npm start assets/inspection.json
```

---

### Image download errors

**Symptom:**
```
ERROR: Failed to add image: https://...
Error: SOI not found in JPEG
```

**Explanation:**
- This error indicates a corrupted JPEG file from the source
- **This is NOT a code bug** - it's a data quality issue

**What the application does:**
- Logs the error
- Continues processing
- Generates PDF without the corrupted image

**Solution (if needed):**
1. Check the source image URL in a browser
2. If image is corrupted, fix it at the source (Firebase Storage)
3. Or remove the item from `inspection.json`

**Example:**
```json
// Remove or fix the item with corrupted image
{
  "lineNumber": "1.A",
  "itemTitle": "Foundations",
  "comments": [{
    "photos": [
      // Remove this photo if corrupted
      {"url": "https://corrupted-image.jpg"}
    ]
  }]
}
```

---

### Output directory permission denied

**Symptom:**
```
Error: EACCES: permission denied, open 'output/TREC_Report_*.pdf'
```

**Solution:**
```bash
# Create and set permissions
mkdir -p output
chmod 755 output

# Or specify a different output directory
npm start assets/inspection.json ~/Documents/report.pdf
```

---

## PDF Generation Issues

### PDF is blank or incomplete

**Symptom:**
- PDF opens but pages are blank
- PDF has fewer pages than expected

**Possible Causes & Solutions:**

1. **Form flattening failed:**
```typescript
// Check logs for:
[TRECGenerator] ✓ Form flattened

// If missing, there may be a pdf-lib version issue
npm install pdf-lib@latest
```

2. **Images failed to embed:**
```typescript
// Check logs for image errors
[TRECPageBuilder] ERROR: Failed to add image

// Images may be corrupted or inaccessible
```

3. **Template structure issue:**
```bash
# Verify template is valid
npm run debug:fields
```

---

### Checkboxes not checked

**Symptom:**
- PDF generated but no checkboxes are checked

**Solution:**

1. Check if items have valid status codes:
```json
{
  "inspectionStatus": "I"  // Must be one of: I, NI, NP, D
}
```

2. Verify checkbox fields exist in template:
```bash
npm run debug:fields
```

3. Check logs for checkbox filling:
```typescript
[FormFiller] DEBUG: ✓ Checked: topmostSubform[0].Page3[0].CheckBox1[0]
```

---

### Header fields not filled

**Symptom:**
- PDF generated but header fields are empty

**Solution:**

1. Check if data exists:
```json
{
  "clientInfo": {
    "name": "John Doe",  // Must not be empty
    "email": "john@example.com"
  }
}
```

2. Verify field names match template:
```bash
npm run debug:fields
```

3. Check logs:
```typescript
[FormFiller] DEBUG: ✓ Filled: Name of Client = John Doe
```

---

### Page numbers wrong

**Symptom:**
- Page numbers show "Page 1 of 2" on all pages
- Total page count incorrect

**Explanation:**
This should not happen with the current two-pass implementation.

**Debug:**
1. Check logs for page count:
```typescript
[TRECPageBuilder] INFO: Total pages: 98
```

2. Verify both passes run:
```typescript
[TRECPageBuilder] INFO: Building TREC inspection pages...
// Should show page counting, then generation
```

---

### Images not appearing

**Symptom:**
- PDF generated but images are missing

**Possible Causes:**

1. **Image URLs are invalid:**
```bash
# Test URL in browser
curl -I <image-url>
```

2. **Network issues:**
```bash
# Check network connectivity
ping firebase.google.com
```

3. **Image format not supported:**
- Supported formats: JPEG, PNG
- Check image format:
```bash
file image.jpg
```

4. **Corrupted images:**
- Check logs for "SOI not found in JPEG"
- This is a data issue, not a code bug

---

## Performance Issues

### Generation is very slow

**Symptom:**
- PDF generation takes 10+ minutes

**Possible Causes & Solutions:**

1. **Many high-resolution images:**
- **Solution**: Use lower resolution images
- **Solution**: Implement image compression

2. **Slow network for image downloads:**
- **First run**: ~15 minutes (downloading images)
- **Subsequent runs**: ~25 seconds (cached)
- **Solution**: Use local images instead of remote URLs

3. **Large JSON file:**
- **Solution**: Optimize JSON structure
- **Solution**: Split into multiple reports

---

### High memory usage

**Symptom:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

---

## Data Issues

### Invalid JSON format

**Symptom:**
```
SyntaxError: Unexpected token } in JSON at position 1234
```

**Solution:**
1. Validate JSON:
```bash
# Using jq
jq . assets/inspection.json

# Or online validator
# https://jsonlint.com/
```

2. Common JSON errors:
- Trailing commas
- Missing quotes
- Unescaped characters

---

### Missing required fields

**Symptom:**
```
ValidationError: Missing required field: clientInfo.name
```

**Solution:**
Ensure all required fields exist:
```json
{
  "clientInfo": {
    "name": "Required",
    "email": "Required",
    "phone": "Required"
  },
  "inspector": {
    "name": "Required"
  },
  "address": {
    "fullAddress": "Required"
  },
  "schedule": {
    "date": "Required (ISO format)"
  },
  "sections": []  // Can be empty array
}
```

---

### Date format issues

**Symptom:**
- Date appears as "Invalid Date" in PDF

**Solution:**
Use ISO 8601 format:
```json
{
  "schedule": {
    "date": "2025-08-13T10:00:00Z"  // Correct
    // NOT: "08/13/2025"
    // NOT: "August 13, 2025"
  }
}
```

---

## Debug Tools

### Inspect PDF Fields

Lists all form fields in the template:

```bash
npm run debug:fields
```

**Output:**
```
Field: topmostSubform[0].Page1[0].Name of Client[0]
  Type: text
  Value: (empty)

Field: topmostSubform[0].Page3[0].CheckBox1[0]
  Type: button
  Value: (unchecked)
```

**Use this to:**
- Verify field names
- Check field types
- Debug form filling issues

---

### Inspect Template Structure

Analyzes the template structure:

```bash
npm run debug:template
```

**Output:**
```
Template Structure:
  Pages: 6
  Form fields: 250
  Sections found: 6
```

---

### Compare PDFs

Compares generated PDF with sample:

```bash
npm run debug:compare
```

**Use this to:**
- Verify output matches expected format
- Debug layout issues
- Check field positions

---

## Getting Help

### Check Logs

Always check the console output first. Look for:
- ✓ Success messages
- ⚠️ Warnings
- ✗ Errors

### Enable Debug Logging

Set environment variable:
```bash
export DEBUG=true
npm start
```

### Common Log Messages

**Success:**
```
[TRECGenerator] ✓ PDF saved: 89.50 MB, 98 pages
```

**Warning:**
```
[TRECPageBuilder] ERROR: Failed to add image: <url>
```
- Not critical - PDF continues without this image

**Error:**
```
[TRECGenerator] ERROR: PDF generation failed
```
- Critical - check error message and stack trace

---

### Still Having Issues?

1. **Check this guide** for similar issues
2. **Review logs** for specific error messages
3. **Verify data format** using JSON validator
4. **Test with default data** (`assets/inspection.json`)
5. **Check Node.js and npm versions**

---

## Appendix: System Requirements

### Minimum Requirements
- Node.js: v16.0.0+
- npm: v7.0.0+
- RAM: 512 MB
- Disk: 100 MB

### Recommended Requirements
- Node.js: v18.0.0+
- npm: v8.0.0+
- RAM: 2 GB
- Disk: 500 MB

### Tested Platforms
- ✅ macOS 12+
- ✅ Ubuntu 20.04+
- ✅ Windows 10+

---

**Troubleshooting Guide Version**: 1.0.0  
**Last Updated**: November 4, 2025  
**Status**: Complete

