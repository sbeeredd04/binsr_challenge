#!/usr/bin/env python3
"""
Comprehensive analysis of TREC_Sample_Filled.pdf
Analyzes: structure, content layout, images, media, how content is embedded
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
        logging.FileHandler('analysis/sample_filled_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

try:
    from pypdf import PdfReader
    import pikepdf
    from PIL import Image
    import io
except ImportError as e:
    logger.error(f"Missing required library: {e}")
    logger.info("Install with: pip install pypdf pikepdf Pillow")
    sys.exit(1)


class SampleFilledAnalyzer:
    """Comprehensive analyzer for TREC_Sample_Filled.pdf"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.analysis = {}
    
    def analyze_all(self):
        """Run all analysis methods"""
        logger.info("="*80)
        logger.info(f"ANALYZING: {self.pdf_path}")
        logger.info("="*80)
        
        self.analyze_basic_structure()
        self.analyze_form_status()
        self.analyze_images_and_media()
        self.analyze_content_layering()
        self.analyze_text_content()
        self.compare_with_template()
        
        self.generate_report()
    
    def analyze_basic_structure(self):
        """Analyze basic PDF structure"""
        logger.info("\n" + "="*80)
        logger.info("1. BASIC STRUCTURE ANALYSIS")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        
        num_pages = len(reader.pages)
        logger.info(f"Total pages: {num_pages}")
        
        # Page sizes
        for i, page in enumerate(reader.pages[:5], 1):
            box = page.mediabox
            width = float(box.width)
            height = float(box.height)
            logger.info(f"  Page {i}: {width:.1f} x {height:.1f} pts")
        
        if num_pages > 5:
            logger.info(f"  ... ({num_pages - 5} more pages)")
        
        # File size
        file_size = Path(self.pdf_path).stat().st_size
        logger.info(f"\nFile size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
        
        # Metadata
        if reader.metadata:
            logger.info("\nMetadata:")
            for key, value in reader.metadata.items():
                logger.info(f"  {key}: {value}")
        
        self.analysis['basic'] = {
            'num_pages': num_pages,
            'file_size': file_size,
            'page_size': f"{width:.1f} x {height:.1f} pts"
        }
    
    def analyze_form_status(self):
        """Check if this is a flattened form or still has form fields"""
        logger.info("\n" + "="*80)
        logger.info("2. FORM STATUS ANALYSIS")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        fields = reader.get_fields()
        
        if fields:
            logger.info(f"HAS FORM FIELDS: {len(fields)} interactive fields")
            logger.info("This PDF is NOT flattened - it's still an interactive form")
            
            # Sample fields
            logger.info("\nSample fields (first 5):")
            for i, (name, field) in enumerate(list(fields.items())[:5], 1):
                value = field.get('/V', 'NO_VALUE')
                logger.info(f"  {i}. {name}: {value}")
            
            self.analysis['form_status'] = {
                'is_flattened': False,
                'field_count': len(fields)
            }
        else:
            logger.info("NO FORM FIELDS - This PDF is flattened")
            logger.info("Form fields have been converted to static content")
            
            self.analysis['form_status'] = {
                'is_flattened': True,
                'field_count': 0
            }
    
    def analyze_images_and_media(self):
        """Analyze embedded images and media"""
        logger.info("\n" + "="*80)
        logger.info("3. IMAGES AND MEDIA ANALYSIS")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        
        total_images = 0
        image_details = []
        
        for page_num, page in enumerate(reader.pages, 1):
            if '/Resources' in page and '/XObject' in page['/Resources']:
                xobjects = page['/Resources']['/XObject']
                
                for obj_name, obj in xobjects.items():
                    obj = obj.get_object()
                    
                    if obj.get('/Subtype') == '/Image':
                        total_images += 1
                        
                        # Get image details
                        width = obj.get('/Width', 'Unknown')
                        height = obj.get('/Height', 'Unknown')
                        color_space = obj.get('/ColorSpace', 'Unknown')
                        bits = obj.get('/BitsPerComponent', 'Unknown')
                        
                        image_details.append({
                            'page': page_num,
                            'name': obj_name,
                            'width': width,
                            'height': height,
                            'color_space': str(color_space)[:20],
                            'bits': bits
                        })
        
        logger.info(f"Total embedded images: {total_images}")
        
        if image_details:
            logger.info("\nImage details (first 10):")
            for i, img in enumerate(image_details[:10], 1):
                logger.info(f"  {i}. Page {img['page']}: {img['width']}x{img['height']} pixels, "
                          f"{img['bits']} bits, {img['color_space']}")
        
        self.analysis['images'] = {
            'total': total_images,
            'details': image_details[:20]  # Keep first 20 for report
        }
    
    def analyze_content_layering(self):
        """Analyze how content is layered (text, images, overlays)"""
        logger.info("\n" + "="*80)
        logger.info("4. CONTENT LAYERING ANALYSIS")
        logger.info("="*80)
        
        try:
            with pikepdf.open(self.pdf_path) as pdf:
                # Analyze first content page (page 4)
                if len(pdf.pages) >= 4:
                    page = pdf.pages[3]  # 0-indexed
                    
                    logger.info("Analyzing Page 4 (first inspection content page):")
                    
                    # Check for content streams
                    if '/Contents' in page:
                        contents = page.Contents
                        if isinstance(contents, list):
                            logger.info(f"  Multiple content streams: {len(contents)}")
                        else:
                            logger.info("  Single content stream")
                    
                    # Check for annotations
                    if '/Annots' in page:
                        annots = page.Annots
                        logger.info(f"  Annotations: {len(annots)}")
                    else:
                        logger.info("  No annotations (expected if flattened)")
                    
                    # Check for resources
                    if '/Resources' in page:
                        resources = page.Resources
                        
                        if '/XObject' in resources:
                            xobjs = resources.XObject
                            logger.info(f"  XObjects: {len(xobjs)} (images, forms)")
                        
                        if '/Font' in resources:
                            fonts = resources.Font
                            logger.info(f"  Fonts: {len(fonts)}")
        
        except Exception as e:
            logger.error(f"Error analyzing layering: {e}")
    
    def analyze_text_content(self):
        """Analyze text content on key pages"""
        logger.info("\n" + "="*80)
        logger.info("5. TEXT CONTENT ANALYSIS")
        logger.info("="*80)
        
        reader = PdfReader(self.pdf_path)
        
        # Analyze page 4 (first inspection content page)
        if len(reader.pages) >= 4:
            page = reader.pages[3]
            text = page.extract_text()
            
            logger.info(f"Page 4 text analysis:")
            logger.info(f"  Total characters: {len(text)}")
            logger.info(f"  Lines: {len(text.split(chr(10)))}")
            
            # Look for checkbox indicators
            checkbox_chars = ['✓', '✔', '☑', '▣', '■', '●', '◆', 'X', 'x', '4', '8']
            found = []
            for char in checkbox_chars:
                if char in text:
                    count = text.count(char)
                    found.append(f"'{char}': {count}")
            
            if found:
                logger.info(f"  Checkbox indicators found: {', '.join(found)}")
            else:
                logger.info("  No text-based checkbox indicators (likely visual elements)")
            
            # Sample text
            logger.info("\n  First 300 characters:")
            logger.info(f"    {text[:300]}")
    
    def compare_with_template(self):
        """Compare structure with blank template"""
        logger.info("\n" + "="*80)
        logger.info("6. COMPARISON WITH BLANK TEMPLATE")
        logger.info("="*80)
        
        template_path = "assets/TREC_Template_Blank.pdf"
        if not Path(template_path).exists():
            logger.warning(f"Template not found: {template_path}")
            return
        
        try:
            filled_reader = PdfReader(self.pdf_path)
            template_reader = PdfReader(template_path)
            
            filled_pages = len(filled_reader.pages)
            template_pages = len(template_reader.pages)
            
            logger.info(f"Template pages: {template_pages}")
            logger.info(f"Filled pages: {filled_pages}")
            logger.info(f"Additional pages: {filled_pages - template_pages}")
            
            # Compare file sizes
            filled_size = Path(self.pdf_path).stat().st_size
            template_size = Path(template_path).stat().st_size
            
            logger.info(f"\nFile size comparison:")
            logger.info(f"  Template: {template_size:,} bytes ({template_size / 1024:.1f} KB)")
            logger.info(f"  Filled: {filled_size:,} bytes ({filled_size / 1024 / 1024:.2f} MB)")
            logger.info(f"  Ratio: {filled_size / template_size:.1f}x larger")
            
            # Check form fields
            template_fields = template_reader.get_fields()
            filled_fields = filled_reader.get_fields()
            
            logger.info(f"\nForm fields comparison:")
            logger.info(f"  Template fields: {len(template_fields) if template_fields else 0}")
            logger.info(f"  Filled fields: {len(filled_fields) if filled_fields else 0}")
            
            if template_fields and not filled_fields:
                logger.info("  ✓ Filled PDF is flattened (form fields removed)")
            elif template_fields and filled_fields:
                logger.info("  ⚠ Filled PDF still has form fields (not flattened)")
            
        except Exception as e:
            logger.error(f"Error comparing with template: {e}")
    
    def generate_report(self):
        """Generate final summary report"""
        logger.info("\n" + "="*80)
        logger.info("ANALYSIS SUMMARY")
        logger.info("="*80)
        
        logger.info(f"\nBasic Structure:")
        logger.info(f"  Pages: {self.analysis['basic']['num_pages']}")
        logger.info(f"  File size: {self.analysis['basic']['file_size'] / 1024 / 1024:.2f} MB")
        logger.info(f"  Page size: {self.analysis['basic']['page_size']}")
        
        if 'form_status' in self.analysis:
            logger.info(f"\nForm Status:")
            logger.info(f"  Is flattened: {self.analysis['form_status']['is_flattened']}")
            logger.info(f"  Field count: {self.analysis['form_status']['field_count']}")
        
        if 'images' in self.analysis:
            logger.info(f"\nMedia Content:")
            logger.info(f"  Total images: {self.analysis['images']['total']}")
        
        logger.info("\n" + "="*80)
        logger.info("KEY FINDINGS:")
        logger.info("="*80)
        
        if self.analysis.get('form_status', {}).get('is_flattened'):
            logger.info("✓ Sample PDF is FLATTENED - form fields converted to static content")
        else:
            logger.info("⚠ Sample PDF is NOT flattened - still has interactive fields")
        
        if self.analysis.get('images', {}).get('total', 0) > 0:
            logger.info(f"✓ Contains {self.analysis['images']['total']} embedded images")
        
        logger.info("\n" + "="*80)
        logger.info("Analysis complete! Check analysis/sample_filled_analysis.log for details")
        logger.info("="*80)


def main():
    pdf_path = "assets/TREC_Sample_Filled.pdf"
    
    if not Path(pdf_path).exists():
        logger.error(f"File not found: {pdf_path}")
        return
    
    analyzer = SampleFilledAnalyzer(pdf_path)
    analyzer.analyze_all()


if __name__ == '__main__':
    main()
