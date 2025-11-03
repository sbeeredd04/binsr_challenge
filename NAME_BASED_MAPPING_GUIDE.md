# Intelligent Name-Based Mapping Implementation

## Overview

The TREC PDF generator now uses **intelligent name-based mapping** instead of position-based mapping. This means:

✅ **OLD (Position-Based)**: Items mapped by index (item #0 → row 0, item #1 → row 1, etc.)  
✅ **NEW (Name-Based)**: Items mapped by NAME/KEYWORDS to matching TREC template sections

---

## How It Works

### 1. TREC Template Structure

The TREC REI 7-6 form has **36 standard inspection sections** organized as:

```
I. STRUCTURAL SYSTEMS (12 subsections: A-L)
   A. Foundations
   B. Grading and Drainage
   C. Roof Covering Materials
   D. Roof Structure and Attics
   E. Walls (Interior and Exterior)
   F. Ceilings and Floors
   G. Doors (Interior and Exterior)
   H. Windows
   I. Stairways (Interior and Exterior)
   J. Fireplaces and Chimneys
   K. Porches, Balconies, Decks, and Carports
   L. Other

II. ELECTRICAL SYSTEMS (2 subsections: A-B)
    A. Service Entrance and Panels
    B. Branch Circuits, Connected Devices, and Fixtures

III. HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS (3 subsections: A-C)
     A. Heating Equipment
     B. Cooling Equipment
     C. Duct Systems, Chases, and Vents

IV. PLUMBING SYSTEMS (5 subsections: A-E)
    A. Plumbing Supply, Distribution Systems and Fixtures
    B. Drains, Wastes, and Vents
    C. Water Heating Equipment
    D. Hydro-Massage Therapy Equipment
    E. Gas Distribution Systems and Gas Appliances

V. APPLIANCES (8 subsections: A-H)
   A. Dishwashers
   B. Food Waste Disposers
   C. Range Hood and Exhaust Systems
   D. Ranges, Cooktops, and Ovens
   E. Microwave Ovens
   F. Mechanical Exhaust Vents and Bathroom Heaters
   G. Garage Door Operators
   H. Dryer Exhaust Systems

VI. OPTIONAL SYSTEMS (6 subsections: A-F)
    A. Landscape Irrigation (Sprinkler) Systems
    B. Swimming Pools, Spas, Hot Tubs, and Equipment
    C. Outbuildings
    D. Private Water Wells
    E. Private Sewage Disposal (Septic) Systems
    F. Other
```

**Total: 36 inspection items** (each with 4 checkboxes: I, NI, NP, D)

---

### 2. Keyword-Based Matching

Each TREC subsection has associated keywords. For example:

```typescript
{
  letter: "A",
  name: "Foundations",
  checkboxIndex: 0,
  keywords: ["foundation", "concrete slab", "pier", "beam", "crawl space"]
}
```

When processing `inspection.json`, the system:
1. Reads item title and section name
2. Searches for matching TREC subsection by keywords
3. If match found: fills checkbox at the TREC subsection's position
4. If no match: creates content page only (no checkbox)

---

### 3. Example Mapping

**inspection.json item:**
```json
{
  "title": "Foundation Inspection",
  "section": "Structural Systems",
  "inspectionStatus": "I",
  "comments": ["Minor cracks observed"],
  "media": []
}
```

**Mapping process:**
1. Search text: `"Foundation Inspection Structural Systems"`
2. Match found: TREC I.A "Foundations" (keywords: ["foundation", ...])
3. Checkbox filled: `topmostSubform[0].Page3[0].CheckBox1[0]` (I.A, status=I)
4. Content page created with comments: "Minor cracks observed"

---

## Implementation Files

### 1. Section Mapping Configuration (`src/config/sectionMapping.ts`)

Defines the complete TREC template structure:
- All 36 subsections with Roman numerals and letters
- Keywords for each subsection
- Checkbox indices (0-35)
- Matching functions

### 2. Updated Status Mapper (`src/mappers/StatusMapper.ts`)

- **New method**: `getCheckboxFieldNameByName(item, status)` - uses intelligent matching
- **Legacy method**: `getCheckboxFieldName(itemIndex, status)` - position-based (deprecated)

### 3. Updated Form Filler (`src/services/FormFiller.ts`)

- Now uses `StatusMapper.getCheckboxFieldNameByName()`
- Logs matched vs unmatched items
- Provides detailed summary

### 4. Content Page Generator (`src/services/ContentPageGenerator.ts`)

Generates pages for comments, images, and videos:
- **Organized by TREC sections** (I, II, III, IV, V, VI)
- **Order**: Comments → Images → Videos for each item
- **Unmatched items**: Added in "Additional Items" section at end

### 5. Page Header Footer (`src/services/PageHeaderFooter.ts`)

Adds consistent page numbers and footers:
- Format: "Page X of Y" at top center
- Footer: "REI 7-6 (8/9/21)" | Title | "www.trec.texas.gov"

---

## Content Organization

Content pages are now organized by TREC section:

```
TEMPLATE PAGES (1-6):
  Page 1-2: Header and disclaimers
  Page 3-6: Checkboxes for 36 TREC sections

CONTENT PAGES (7+):
  I. STRUCTURAL SYSTEMS
    → Item matched to I.A Foundations
       • Comments page
       • Image pages
       • Video (QR code) pages
    → Item matched to I.B Grading
       • Comments page
       ...
    
  II. ELECTRICAL SYSTEMS
    → Item matched to II.A Service Entrance
       • Comments page
       ...
  
  ...
  
  ADDITIONAL ITEMS (if any unmatched)
    → Items that don't match any TREC section
       • Comments pages
       • Image pages
       • Video pages
```

---

## Benefits of Name-Based Mapping

### ✅ Advantages

1. **Semantic Accuracy**: Items are mapped where they belong, not just by order
2. **Flexible Input**: Can handle any number of items in any section
3. **Clear Reporting**: Matched vs unmatched items are clearly distinguished
4. **Template Compliance**: Only fills checkboxes that exist in TREC standard
5. **Content Preservation**: All items get content pages, even if no checkbox match

### ✅ Handles Edge Cases

- **More items than checkboxes**: Extra items become content-only pages
- **Fewer items than checkboxes**: Some checkboxes remain empty (as expected)
- **Custom sections**: Items that don't match TREC sections are preserved in "Additional Items"
- **Missing data**: Null status items are skipped for checkboxes but still get content pages

---

## Usage

### Run the Generator

```bash
npm run build
npm start
```

### Output

The generator will log:

```
Filling checkboxes using NAME-BASED MAPPING for 139 items...
Template supports 36 TREC standard sections with checkboxes

✓ Matched "Foundation Inspection" → TREC A. Foundations (index: 0)
✓ Matched "Electrical Panel" → TREC A. Service Entrance and Panels (index: 12)
⚠️  No TREC template match for: "Custom Item" (section: Additional)
   → This item will be added as content page only (no checkbox)

Checkbox Summary:
  ✓ Matched & checked: 35
  ⚠️  No TREC match (content only): 104
  ○ Skipped (null status): 0
  ✗ Field not found: 0

ℹ️  104 items don't match standard TREC sections.
   These will be added as content pages with comments/images/videos.
```

---

## Customization

### Adding New Keywords

Edit `src/config/sectionMapping.ts`:

```typescript
{
  letter: "A",
  name: "Foundations",
  checkboxIndex: 0,
  keywords: [
    "foundation", 
    "concrete slab", 
    "pier", 
    "beam", 
    "crawl space",
    // Add your custom keywords here
    "foundation wall",
    "slab on grade"
  ]
}
```

### Custom Section Mapping

To map a custom section name to a TREC section, update the keywords to include your section name:

```typescript
keywords: ["foundation", "structural foundation", "your custom section name"]
```

---

## Migration from Position-Based

If you were using the old position-based mapping:

**OLD CODE:**
```typescript
const checkboxFieldName = StatusMapper.getCheckboxFieldName(itemIndex, status);
```

**NEW CODE:**
```typescript
const checkboxFieldName = StatusMapper.getCheckboxFieldNameByName(item, status);
```

The old method is marked as `@deprecated` but still available for backward compatibility.

---

## Technical Details

### Checkbox Field Name Calculation

For a TREC subsection with `checkboxIndex` N and status S:

```typescript
page = floor(N / 12) + 3          // Pages 3-6
indexOnPage = N % 12              // Position on page (0-11)
statusOffset = {'I': 0, 'NI': 1, 'NP': 2, 'D': 3}[S]
checkboxIndex = indexOnPage * 4 + statusOffset

fieldName = `topmostSubform[0].Page${page}[0].CheckBox1[${checkboxIndex}]`
```

### Example:
- TREC subsection: II.A (Service Entrance) - checkboxIndex = 12
- Status: "I" (Inspected) - statusOffset = 0
- Calculation:
  - page = floor(12 / 12) + 3 = 4
  - indexOnPage = 12 % 12 = 0
  - checkboxIndex = 0 * 4 + 0 = 0
  - Result: `topmostSubform[0].Page4[0].CheckBox1[0]`

---

## Summary

The intelligent name-based mapping system:

1. **Matches by semantics**, not position
2. **Preserves all content** (comments, images, videos)
3. **Organizes content by TREC sections**
4. **Handles mismatches gracefully**
5. **Provides clear reporting** of matched vs unmatched items
6. **Follows TREC template structure** exactly

This ensures that your inspection data is mapped correctly to the TREC form fields, regardless of how many items you have or in what order they appear in your `inspection.json`.

---

**Implementation Date**: November 3, 2025  
**Status**: ✅ Complete and Tested  
**Compatibility**: Works with any TREC REI 7-6 compliant form

