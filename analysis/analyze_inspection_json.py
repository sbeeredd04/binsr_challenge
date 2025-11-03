#!/usr/bin/env python3
"""
Comprehensive analysis of inspection.json structure
Analyzes: data hierarchy, fields, media, section structure, mapping requirements
"""

import logging
import sys
import json
from pathlib import Path
from typing import Dict, Any, List
from collections import Counter

sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('analysis/inspection_json_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class InspectionJSONAnalyzer:
    """Comprehensive analyzer for inspection.json"""
    
    def __init__(self, json_path: str):
        self.json_path = json_path
        self.data = None
        self.analysis = {}
    
    def analyze_all(self):
        """Run all analysis methods"""
        logger.info("="*80)
        logger.info(f"ANALYZING: {self.json_path}")
        logger.info("="*80)
        
        self.load_data()
        self.analyze_structure()
        self.analyze_inspection_metadata()
        self.analyze_sections_and_items()
        self.analyze_media_content()
        self.analyze_status_distribution()
        self.map_to_trec_requirements()
        
        self.generate_report()
    
    def load_data(self):
        """Load JSON data"""
        logger.info("\nLoading JSON file...")
        
        with open(self.json_path, 'r') as f:
            self.data = json.load(f)
        
        logger.info(f"✓ Loaded successfully")
    
    def analyze_structure(self):
        """Analyze overall JSON structure"""
        logger.info("\n" + "="*80)
        logger.info("1. OVERALL STRUCTURE ANALYSIS")
        logger.info("="*80)
        
        top_level_keys = list(self.data.keys())
        logger.info(f"Top-level keys: {top_level_keys}")
        
        for key in top_level_keys:
            value = self.data[key]
            if isinstance(value, dict):
                logger.info(f"  {key}: dict with {len(value)} keys")
            elif isinstance(value, list):
                logger.info(f"  {key}: list with {len(value)} items")
            else:
                logger.info(f"  {key}: {type(value).__name__}")
        
        self.analysis['structure'] = {
            'top_level_keys': top_level_keys
        }
    
    def analyze_inspection_metadata(self):
        """Analyze inspection metadata"""
        logger.info("\n" + "="*80)
        logger.info("2. INSPECTION METADATA ANALYSIS")
        logger.info("="*80)
        
        inspection = self.data.get('inspection', {})
        
        logger.info(f"Inspection ID: {inspection.get('id', 'N/A')}")
        logger.info(f"Status: {inspection.get('status', 'N/A')}")
        
        # Client info
        client = inspection.get('clientInfo', {})
        logger.info(f"\nClient:")
        logger.info(f"  Name: {client.get('name', 'N/A')}")
        logger.info(f"  Email: {client.get('email', 'N/A')}")
        logger.info(f"  Phone: {client.get('phone', 'N/A')}")
        
        # Inspector info
        inspector = inspection.get('inspector', {})
        logger.info(f"\nInspector:")
        logger.info(f"  Name: {inspector.get('name', 'N/A')}")
        logger.info(f"  Email: {inspector.get('email', 'N/A')}")
        
        # Property info
        address = inspection.get('address', {})
        logger.info(f"\nProperty:")
        logger.info(f"  Address: {address.get('fullAddress', 'N/A')}")
        logger.info(f"  City: {address.get('city', 'N/A')}, {address.get('state', 'N/A')} {address.get('zipcode', 'N/A')}")
        
        # Schedule
        schedule = inspection.get('schedule', {})
        logger.info(f"\nSchedule:")
        logger.info(f"  Date: {schedule.get('date', 'N/A')}")
        
        # Header image
        header_image = inspection.get('headerImageUrl', '')
        logger.info(f"\nHeader Image: {'Yes' if header_image else 'No'}")
        
        self.analysis['metadata'] = {
            'has_client_info': bool(client),
            'has_inspector_info': bool(inspector),
            'has_property_info': bool(address),
            'has_header_image': bool(header_image)
        }
    
    def analyze_sections_and_items(self):
        """Analyze sections and line items"""
        logger.info("\n" + "="*80)
        logger.info("3. SECTIONS AND LINE ITEMS ANALYSIS")
        logger.info("="*80)
        
        sections = self.data.get('inspection', {}).get('sections', [])
        
        logger.info(f"Total sections: {len(sections)}")
        
        total_items = 0
        section_details = []
        
        for section in sections:
            section_name = section.get('name', 'Unnamed')
            section_num = section.get('sectionNumber', 'N/A')
            line_items = section.get('lineItems', [])
            item_count = len(line_items)
            total_items += item_count
            
            section_details.append({
                'number': section_num,
                'name': section_name,
                'item_count': item_count
            })
        
        logger.info(f"Total line items across all sections: {total_items}")
        
        logger.info("\nSection breakdown:")
        for i, section in enumerate(section_details, 1):
            logger.info(f"  {i}. Section {section['number']}: {section['name']}")
            logger.info(f"     Line items: {section['item_count']}")
        
        # Analyze line item structure
        logger.info("\n" + "-"*80)
        logger.info("LINE ITEM STRUCTURE ANALYSIS")
        logger.info("-"*80)
        
        if sections and sections[0].get('lineItems'):
            first_item = sections[0]['lineItems'][0]
            logger.info("Sample line item structure (first item):")
            logger.info(f"  Keys: {list(first_item.keys())}")
            
            for key in first_item.keys():
                value = first_item[key]
                if isinstance(value, list):
                    logger.info(f"    {key}: list with {len(value)} items")
                elif isinstance(value, dict):
                    logger.info(f"    {key}: dict with {len(value)} keys")
                else:
                    logger.info(f"    {key}: {type(value).__name__}")
        
        self.analysis['sections'] = {
            'total_sections': len(sections),
            'total_items': total_items,
            'section_details': section_details
        }
    
    def analyze_media_content(self):
        """Analyze media (images, videos) in line items"""
        logger.info("\n" + "="*80)
        logger.info("4. MEDIA CONTENT ANALYSIS")
        logger.info("="*80)
        
        sections = self.data.get('inspection', {}).get('sections', [])
        
        total_items_with_media = 0
        total_images = 0
        total_videos = 0
        media_details = []
        
        for section in sections:
            for item in section.get('lineItems', []):
                media = item.get('media', [])
                
                if media:
                    total_items_with_media += 1
                    
                    images = [m for m in media if m.get('mediaType') == 'image']
                    videos = [m for m in media if m.get('mediaType') == 'video']
                    
                    total_images += len(images)
                    total_videos += len(videos)
                    
                    if images or videos:
                        media_details.append({
                            'item_name': item.get('name', 'Unnamed'),
                            'section': section.get('name', 'Unnamed'),
                            'images': len(images),
                            'videos': len(videos)
                        })
        
        logger.info(f"Items with media: {total_items_with_media}")
        logger.info(f"Total images: {total_images}")
        logger.info(f"Total videos: {total_videos}")
        
        if media_details:
            logger.info("\nItems with media (first 10):")
            for i, item in enumerate(media_details[:10], 1):
                logger.info(f"  {i}. {item['item_name']} ({item['section']})")
                logger.info(f"     Images: {item['images']}, Videos: {item['videos']}")
        
        # Analyze media URLs
        if media_details:
            logger.info("\nSample media URLs:")
            for section in sections[:2]:  # First 2 sections
                for item in section.get('lineItems', [])[:1]:  # First item
                    for media_item in item.get('media', [])[:2]:  # First 2 media
                        media_type = media_item.get('mediaType', 'unknown')
                        url = media_item.get('url', 'N/A')
                        logger.info(f"  {media_type}: {url[:80]}...")
        
        self.analysis['media'] = {
            'items_with_media': total_items_with_media,
            'total_images': total_images,
            'total_videos': total_videos
        }
    
    def analyze_status_distribution(self):
        """Analyze status field distribution"""
        logger.info("\n" + "="*80)
        logger.info("5. STATUS DISTRIBUTION ANALYSIS")
        logger.info("="*80)
        
        sections = self.data.get('inspection', {}).get('sections', [])
        
        statuses = []
        for section in sections:
            for item in section.get('lineItems', []):
                status = item.get('status', 'unknown')
                statuses.append(status)
        
        status_counts = Counter(statuses)
        
        logger.info(f"Total items with status: {len(statuses)}")
        logger.info("\nStatus distribution:")
        for status, count in status_counts.most_common():
            percentage = (count / len(statuses) * 100) if statuses else 0
            logger.info(f"  {status}: {count} ({percentage:.1f}%)")
        
        self.analysis['status'] = {
            'distribution': dict(status_counts),
            'total': len(statuses)
        }
    
    def map_to_trec_requirements(self):
        """Map inspection.json structure to TREC report requirements"""
        logger.info("\n" + "="*80)
        logger.info("6. MAPPING TO TREC REQUIREMENTS")
        logger.info("="*80)
        
        logger.info("\nTREC Report Pages Breakdown:")
        logger.info("  Pages 1-3: Header, property info, disclaimers")
        logger.info("  Pages 4-6: Inspection items with checkboxes (I/NI/NP/D)")
        logger.info("  Subsequent pages: Additional items, summary")
        
        sections = self.data.get('inspection', {}).get('sections', [])
        total_items = sum(len(s.get('lineItems', [])) for s in sections)
        
        logger.info(f"\nTotal inspection items to map: {total_items}")
        logger.info(f"Items per page (approximate): ~35-40")
        logger.info(f"Estimated pages needed for items: {total_items / 35:.1f}")
        
        logger.info("\nData Mapping Requirements:")
        logger.info("  ✓ Client info → Header (Page 1)")
        logger.info("  ✓ Inspector info → Header (Page 1)")
        logger.info("  ✓ Property address → Header (Page 1)")
        logger.info("  ✓ Line items → Inspection pages (4-6+)")
        logger.info("  ✓ Status values → Checkbox columns (I/NI/NP/D)")
        logger.info("  ✓ Comments → Comment fields")
        logger.info("  ✓ Images → Embedded in PDF")
        logger.info("  ✓ Videos → QR codes linking to videos")
        
        logger.info("\nStatus to Checkbox Mapping:")
        logger.info("  'inspected' → I (Inspected)")
        logger.info("  'not_inspected' → NI (Not Inspected)")
        logger.info("  'not_present' → NP (Not Present)")
        logger.info("  'deficient' → D (Deficient)")
    
    def generate_report(self):
        """Generate final summary report"""
        logger.info("\n" + "="*80)
        logger.info("ANALYSIS SUMMARY")
        logger.info("="*80)
        
        logger.info(f"\nStructure:")
        logger.info(f"  Sections: {self.analysis['sections']['total_sections']}")
        logger.info(f"  Line items: {self.analysis['sections']['total_items']}")
        
        logger.info(f"\nMedia:")
        logger.info(f"  Items with media: {self.analysis['media']['items_with_media']}")
        logger.info(f"  Images: {self.analysis['media']['total_images']}")
        logger.info(f"  Videos: {self.analysis['media']['total_videos']}")
        
        logger.info(f"\nStatus Distribution:")
        for status, count in self.analysis['status']['distribution'].items():
            logger.info(f"  {status}: {count}")
        
        logger.info("\n" + "="*80)
        logger.info("Analysis complete! Check analysis/inspection_json_analysis.log for details")
        logger.info("="*80)


def main():
    json_path = "assets/inspection.json"
    
    if not Path(json_path).exists():
        logger.error(f"File not found: {json_path}")
        return
    
    analyzer = InspectionJSONAnalyzer(json_path)
    analyzer.analyze_all()


if __name__ == '__main__':
    main()
