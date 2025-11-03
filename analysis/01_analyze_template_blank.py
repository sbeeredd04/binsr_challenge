#!/usr/bin/env python3
"""
Comprehensive analysis of TREC_Template_Blank.pdf
Analyzes: form fields, pages, layout, structure, fonts, metadata
"""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('analysis/template_blank_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

try:
    from pypdf import PdfReader
    import pikepdf
except ImportError as e:
    logger.error(f"Missing required library: {e}")
    logger.info("Install with: pip install pypdf pikepdf")
    sys.exit(1)


class TemplateBlankAnalyzer:
    """Comprehensive analyzer for TREC_Template_Blank.pdf"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.analysis = {}
    
    def analyze_all(self):
        """Run all analysis methods"""
        logger.info("="*80)
        logger.info(f"ANALYZING: {self.pdf_path}")
        logger.info("="*80)
        
        self.analyze_basic_structure()
        self.analyze_form_fields_pypdf()
        self.analyze_form_fields_pikepdf()
        self.analyze_page_content()
        self.analyze_fonts_and_resources()
        
        self.generate_report()
    
    def analyze_basic_structure(self):
        """Analyze basic PDF structure"""
        logger.info("\n" + "="*80)
        logger.info("1. BASIC STRUCTURE ANALYSIS (pypdf)")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        
        # Basic info
        num_pages = len(reader.pages)
        logger.info(f"Total pages: {num_pages}")
        
        # Page sizes
        for i, page in enumerate(reader.pages, 1):
            box = page.mediabox
            width = float(box.width)
            height = float(box.height)
            logger.info(f"  Page {i}: {width:.1f} x {height:.1f} pts ({width/72:.2f} x {height/72:.2f} inches)")
        
        # Metadata
        if reader.metadata:
            logger.info("\nMetadata:")
            for key, value in reader.metadata.items():
                logger.info(f"  {key}: {value}")
        
        # AcroForm presence
        has_acroform = '/AcroForm' in reader.trailer.get('/Root', {})
        logger.info(f"\nHas AcroForm (fillable form): {has_acroform}")
        
        self.analysis['basic'] = {
            'num_pages': num_pages,
            'has_acroform': has_acroform,
            'page_size': f"{width:.1f} x {height:.1f} pts"
        }
    
    def analyze_form_fields_pypdf(self):
        """Analyze form fields using pypdf"""
        logger.info("\n" + "="*80)
        logger.info("2. FORM FIELD ANALYSIS (pypdf)")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        fields = reader.get_fields()
        
        if not fields:
            logger.warning("No form fields found with pypdf")
            return
        
        logger.info(f"Total fields: {len(fields)}")
        
        # Categorize fields by type
        field_types = {}
        for name, field in fields.items():
            ftype = str(field.get('/FT', 'Unknown'))
            field_types[ftype] = field_types.get(ftype, 0) + 1
        
        logger.info("\nField types:")
        for ftype, count in field_types.items():
            logger.info(f"  {ftype}: {count}")
        
        # Sample fields
        logger.info("\nSample fields (first 10):")
        for i, (name, field) in enumerate(list(fields.items())[:10], 1):
            ftype = field.get('/FT', 'Unknown')
            value = field.get('/V', 'NO_VALUE')
            logger.info(f"  {i}. {name}")
            logger.info(f"     Type: {ftype}, Value: {value}")
        
        # Checkbox pattern analysis
        checkbox_fields = [n for n in fields.keys() if 'CheckBox' in n]
        logger.info(f"\nCheckbox fields: {len(checkbox_fields)}")
        if checkbox_fields:
            logger.info("First 10 checkbox field names:")
            for cb in checkbox_fields[:10]:
                logger.info(f"  {cb}")
        
        # Text field analysis
        text_fields = [n for n in fields.keys() if 'Text' in n]
        logger.info(f"\nText fields: {len(text_fields)}")
        if text_fields:
            logger.info("First 10 text field names:")
            for tf in text_fields[:10]:
                logger.info(f"  {tf}")
        
        self.analysis['fields_pypdf'] = {
            'total': len(fields),
            'by_type': field_types,
            'checkbox_count': len(checkbox_fields),
            'text_count': len(text_fields)
        }
    
    def analyze_form_fields_pikepdf(self):
        """Analyze form fields using pikepdf (more detailed)"""
        logger.info("\n" + "="*80)
        logger.info("3. FORM FIELD ANALYSIS (pikepdf - detailed)")
        logger.info("="*80)
        
        try:
            with pikepdf.open(self.pdf_path) as pdf:
                if '/AcroForm' not in pdf.Root:
                    logger.warning("No AcroForm found")
                    return
                
                form = pdf.Root.AcroForm
                if '/Fields' not in form:
                    logger.warning("No Fields in AcroForm")
                    return
                
                # Count top-level fields
                top_level_count = len(form.Fields)
                logger.info(f"Top-level form fields: {top_level_count}")
                
                # Recursively collect all fields
                all_fields = []
                
                def collect_fields(field, parent_name='', depth=0):
                    try:
                        field_name = str(field.get('/T', ''))
                        full_name = f"{parent_name}.{field_name}" if parent_name else field_name
                        field_type = str(field.get('/FT', 'NO_TYPE'))
                        
                        if '/Kids' in field:
                            # Has children
                            kids_count = len(field.Kids)
                            logger.debug(f"{'  '*depth}{full_name} ({field_type}) - {kids_count} children")
                            for kid in field.Kids:
                                collect_fields(kid, full_name, depth+1)
                        else:
                            # Leaf field
                            all_fields.append({
                                'name': full_name,
                                'type': field_type,
                                'has_appearance': '/AP' in field,
                                'has_value': '/V' in field
                            })
                    except Exception as e:
                        logger.debug(f"Error processing field: {e}")
                
                for field in form.Fields:
                    collect_fields(field)
                
                logger.info(f"Total leaf fields: {len(all_fields)}")
                
                # Analyze field patterns
                logger.info("\nField naming patterns:")
                patterns = {}
                for field in all_fields:
                    parts = field['name'].split('.')
                    if len(parts) > 1:
                        pattern = '.'.join(parts[:-1])
                        patterns[pattern] = patterns.get(pattern, 0) + 1
                
                for pattern, count in sorted(patterns.items(), key=lambda x: x[1], reverse=True)[:10]:
                    logger.info(f"  {pattern}: {count} fields")
                
                # Checkbox analysis
                checkboxes = [f for f in all_fields if 'CheckBox' in f['name']]
                logger.info(f"\nCheckbox fields: {len(checkboxes)}")
                if checkboxes:
                    logger.info("Sample checkbox names:")
                    for cb in checkboxes[:5]:
                        logger.info(f"  {cb['name']}")
                
                self.analysis['fields_pikepdf'] = {
                    'top_level': top_level_count,
                    'total_leaf': len(all_fields),
                    'checkboxes': len(checkboxes),
                    'patterns': patterns
                }
                
        except Exception as e:
            logger.error(f"Error with pikepdf analysis: {e}")
    
    def analyze_page_content(self):
        """Analyze page content and layout"""
        logger.info("\n" + "="*80)
        logger.info("4. PAGE CONTENT ANALYSIS")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        
        for page_num, page in enumerate(reader.pages[:3], 1):  # First 3 pages
            logger.info(f"\nPage {page_num}:")
            
            # Extract text
            text = page.extract_text()
            text_lines = text.split('\n')
            logger.info(f"  Text lines: {len(text_lines)}")
            logger.info(f"  Text length: {len(text)} characters")
            
            # Sample text
            logger.info("  First 200 characters:")
            logger.info(f"    {text[:200].replace(chr(10), ' ')}")
            
            # Count resources
            if '/Resources' in page:
                resources = page['/Resources']
                if '/Font' in resources:
                    fonts = resources['/Font']
                    logger.info(f"  Fonts: {len(fonts)}")
                if '/XObject' in resources:
                    xobjects = resources['/XObject']
                    logger.info(f"  XObjects (images, forms): {len(xobjects)}")
    
    def analyze_fonts_and_resources(self):
        """Analyze fonts and other resources"""
        logger.info("\n" + "="*80)
        logger.info("5. FONTS AND RESOURCES ANALYSIS")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        
        all_fonts = set()
        all_xobjects = set()
        
        for page in reader.pages:
            if '/Resources' in page:
                resources = page['/Resources']
                
                if '/Font' in resources:
                    fonts = resources['/Font']
                    for font_name in fonts.keys():
                        all_fonts.add(font_name)
                
                if '/XObject' in resources:
                    xobjects = resources['/XObject']
                    for xobj_name in xobjects.keys():
                        all_xobjects.add(xobj_name)
        
        logger.info(f"Unique fonts across all pages: {len(all_fonts)}")
        for font in sorted(all_fonts):
            logger.info(f"  {font}")
        
        logger.info(f"\nUnique XObjects: {len(all_xobjects)}")
        for xobj in sorted(all_xobjects)[:10]:
            logger.info(f"  {xobj}")
    
    def generate_report(self):
        """Generate final summary report"""
        logger.info("\n" + "="*80)
        logger.info("ANALYSIS SUMMARY")
        logger.info("="*80)
        
        logger.info(f"\nBasic Structure:")
        logger.info(f"  Pages: {self.analysis['basic']['num_pages']}")
        logger.info(f"  Page size: {self.analysis['basic']['page_size']}")
        logger.info(f"  Has form: {self.analysis['basic']['has_acroform']}")
        
        if 'fields_pypdf' in self.analysis:
            logger.info(f"\nForm Fields (pypdf):")
            logger.info(f"  Total fields: {self.analysis['fields_pypdf']['total']}")
            logger.info(f"  Checkboxes: {self.analysis['fields_pypdf']['checkbox_count']}")
            logger.info(f"  Text fields: {self.analysis['fields_pypdf']['text_count']}")
        
        if 'fields_pikepdf' in self.analysis:
            logger.info(f"\nForm Fields (pikepdf):")
            logger.info(f"  Top-level fields: {self.analysis['fields_pikepdf']['top_level']}")
            logger.info(f"  Total leaf fields: {self.analysis['fields_pikepdf']['total_leaf']}")
            logger.info(f"  Checkboxes: {self.analysis['fields_pikepdf']['checkboxes']}")
        
        logger.info("\n" + "="*80)
        logger.info("Analysis complete! Check analysis/template_blank_analysis.log for details")
        logger.info("="*80)


def main():
    pdf_path = "assets/TREC_Template_Blank.pdf"
    
    if not Path(pdf_path).exists():
        logger.error(f"File not found: {pdf_path}")
        return
    
    analyzer = TemplateBlankAnalyzer(pdf_path)
    analyzer.analyze_all()


if __name__ == '__main__':
    main()
