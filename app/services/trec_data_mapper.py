"""
TREC Data Mapper - Maps inspection.json data to TREC template fields.

This module transforms the inspection data structure to match TREC template
field naming and format requirements.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime


logger = logging.getLogger(__name__)


class TRECDataMapper:
    """Maps inspection data to TREC template PDF form fields."""
    
    def __init__(self):
        """Initialize TREC data mapper."""
        self.field_mapping = self._init_field_mapping()
        logger.info("Initialized TRECDataMapper")
    
    def _init_field_mapping(self) -> Dict[str, str]:
        """
        Initialize field mapping from inspection.json to TREC template fields.
        
        Returns:
            Dictionary mapping inspection data paths to TREC field names
        """
        return {
            # Header fields (Page 1)
            'client_name': 'Name of Client',
            'inspection_date': 'Date of Inspection',
            'property_address': 'Address of Inspected Property',
            'inspector_name': 'Name of Inspector',
            'inspector_license': 'TREC License',
            'sponsor_name': 'Name of Sponsor if applicable',
            'sponsor_license': 'TREC License_2',
            
            # Page numbers and report ID on each page
            'report_id_page3': 'topmostSubform[0].Page3[0].TextField1[0]',
            'report_id_page4': 'topmostSubform[0].Page4[0].TextField1[0]',
            'report_id_page5': 'topmostSubform[0].Page5[0].TextField1[0]',
            'report_id_page6': 'topmostSubform[0].Page6[0].TextField1[0]',
            
            # Comment/text fields for each section
            # These are the Text1-Text81 fields that correspond to inspection sections
        }
    
    def map_to_trec_format(self, inspection_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Transform inspection data to TREC template field values.
        
        Args:
            inspection_data: Raw inspection data from inspection.json
            
        Returns:
            Dictionary of {field_name: field_value} for PDF form filling
        """
        logger.info("Mapping inspection data to TREC format")
        
        try:
            inspection = inspection_data.get('inspection', {})
            account = inspection_data.get('account', {})
            
            # Build field values
            field_values = {}
            
            # Map header fields
            field_values.update(self._map_header_fields(inspection, account))
            
            # Map sections and line items
            sections_data = self._map_sections(inspection.get('sections', []))
            field_values.update(sections_data)
            
            # Map checkboxes
            checkbox_data = self._map_checkboxes(inspection.get('sections', []))
            field_values.update(checkbox_data)
            
            logger.info(f"Mapped {len(field_values)} field values")
            return field_values
            
        except Exception as e:
            logger.error(f"Error mapping data to TREC format: {e}", exc_info=True)
            raise
    
    def _map_header_fields(self, inspection: Dict[str, Any], account: Dict[str, Any]) -> Dict[str, str]:
        """
        Map header information fields.
        
        Args:
            inspection: Inspection data
            account: Account/company data
            
        Returns:
            Dictionary of header field values
        """
        logger.debug("Mapping header fields")
        
        header_fields = {}
        
        # Client name
        client_info = inspection.get('clientInfo', {})
        header_fields['Name of Client'] = client_info.get('name', '')
        
        # Inspection date
        schedule = inspection.get('schedule', {})
        inspection_date = schedule.get('date')
        if inspection_date:
            # Convert timestamp to readable date
            date_obj = datetime.fromtimestamp(inspection_date / 1000)  # Convert ms to seconds
            header_fields['Date of Inspection'] = date_obj.strftime('%m/%d/%Y %I:%M%p')
        else:
            header_fields['Date of Inspection'] = ''
        
        # Property address
        address = inspection.get('address', {})
        header_fields['Address of Inspected Property'] = address.get('fullAddress', '')
        
        # Inspector information
        inspector = inspection.get('inspector', {})
        header_fields['Name of Inspector'] = inspector.get('name', '')
        header_fields['TREC License'] = inspector.get('id', '')
        
        # Company/Sponsor information
        header_fields['Name of Sponsor if applicable'] = account.get('companyName', '')
        header_fields['TREC License_2'] = ''  # Company license if applicable
        
        # Report identification on each page
        report_id = f"{address.get('fullAddress', 'Inspection Report')}"
        header_fields['topmostSubform[0].Page3[0].TextField1[0]'] = report_id
        header_fields['topmostSubform[0].Page4[0].TextField1[0]'] = report_id
        header_fields['topmostSubform[0].Page5[0].TextField1[0]'] = report_id
        header_fields['topmostSubform[0].Page6[0].TextField1[0]'] = report_id
        
        # Page numbers
        header_fields['Page 2 of'] = '6'
        header_fields['topmostSubform[0].Page3[0].TextField2[0]'] = '6'
        header_fields['topmostSubform[0].Page4[0].TextField2[0]'] = '6'
        header_fields['topmostSubform[0].Page5[0].TextField2[0]'] = '6'
        header_fields['topmostSubform[0].Page6[0].TextField2[0]'] = '6'
        
        logger.debug(f"Mapped {len(header_fields)} header fields")
        return header_fields
    
    def _map_sections(self, sections: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Map inspection sections to comment fields.
        
        Args:
            sections: List of inspection sections with line items
            
        Returns:
            Dictionary of comment field values
        """
        logger.debug(f"Mapping {len(sections)} sections to Text fields")
        
        section_fields = {}
        
        # Available Text fields in TREC template: Text1, Text3-Text66
        # (Text2, Text22 variations exist but we'll use sequential ones)
        available_text_fields = [
            'Text1', 'Text3', 'Text4', 'Text5', 'Text6', 'Text7', 'Text8', 'Text9', 'Text10',
            'Text11', 'Text12', 'Text13', 'Text14', 'Text15', 'Text16', 'Text17', 'Text18', 'Text19',
            'Text20', 'Text21', 'Text23', 'Text24', 'Text25', 'Text26', 'Text27', 'Text28', 'Text29',
            'Text30', 'Text31', 'Text32', 'Text33', 'Text34', 'Text35', 'Text36', 'Text37', 'Text38',
            'Text39', 'Text40', 'Text41', 'Text42', 'Text43', 'Text44', 'Text45', 'Text46', 'Text47',
            'Text48', 'Text49', 'Text50', 'Text51', 'Text52', 'Text53', 'Text54', 'Text55', 'Text56',
            'Text57', 'Text58', 'Text59', 'Text60', 'Text61', 'Text62', 'Text63', 'Text64', 'Text65', 'Text66'
        ]
        
        field_index = 0
        
        for section in sections:
            section_name = section.get('name', '')
            line_items = section.get('lineItems', [])
            
            logger.debug(f"Section: {section_name}, Items: {len(line_items)}")
            
            # Map each line item with a comment to a Text field
            for item in line_items:
                item_name = item.get('name', '')
                comment_text = item.get('comment', '')
                
                if comment_text and field_index < len(available_text_fields):
                    field_name = available_text_fields[field_index]
                    # Format: "Section > Item: Comment"
                    field_value = f"{section_name} > {item_name}: {comment_text}"
                    section_fields[field_name] = field_value
                    logger.debug(f"Mapped {field_name}: {item_name}")
                    field_index += 1
        
        logger.info(f"Mapped {len(section_fields)} text field comments")
        return section_fields
    
    def _map_checkboxes(self, sections: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Map line item statuses to checkboxes.
        
        TREC checkboxes are in groups of 4 per line item (I, NI, NP, D).
        Distribution across pages:
        - Page 3: CheckBox1[0-47] (12 items x 4 checkboxes)
        - Page 4: CheckBox1[0-39] (10 items x 4 checkboxes)
        - Page 5: CheckBox1[0-47] (12 items x 4 checkboxes)
        - Page 6: CheckBox1[0-11] (3 items x 4 checkboxes)
        Total: 37 line items can have checkboxes
        
        Args:
            sections: List of inspection sections with line items
            
        Returns:
            Dictionary of checkbox field values
        """
        logger.debug("Mapping checkboxes for line items")
        
        checkbox_fields = {}
        
        # Page configuration: (page_num, max_checkbox_index, items_per_page)
        page_config = [
            (3, 47, 12),  # Page 3: indices 0-47
            (4, 39, 10),  # Page 4: indices 0-39
            (5, 47, 12),  # Page 5: indices 0-47
            (6, 11, 3),   # Page 6: indices 0-11
        ]
        
        # Checkbox position mapping (which checkbox in each set of 4)
        checkbox_positions = {
            'I': 1,   # Inspected (2nd checkbox in group)
            'NI': 0,  # Not Inspected (1st checkbox in group)
            'NP': 2,  # Not Present (3rd checkbox in group)
            'D': 3    # Deficient (4th checkbox in group)
        }
        
        current_page_idx = 0
        current_page, max_index, items_per_page = page_config[current_page_idx]
        items_on_current_page = 0
        checkbox_base = 0
        
        for section in sections:
            line_items = section.get('lineItems', [])
            
            for item in line_items:
                # Check if we need to move to next page
                if items_on_current_page >= items_per_page:
                    current_page_idx += 1
                    if current_page_idx >= len(page_config):
                        logger.warning(f"Exceeded available checkbox pages. Mapped {items_on_current_page * current_page_idx} items")
                        break
                    current_page, max_index, items_per_page = page_config[current_page_idx]
                    items_on_current_page = 0
                    checkbox_base = 0
                
                # Determine status
                status = self._determine_status(item)
                
                if status in checkbox_positions:
                    # Calculate checkbox index (4 checkboxes per item)
                    position_offset = checkbox_positions[status]
                    checkbox_index = checkbox_base + position_offset
                    
                    # Verify we're within page limits
                    if checkbox_index <= max_index:
                        checkbox_name = f"topmostSubform[0].Page{current_page}[0].CheckBox1[{checkbox_index}]"
                        checkbox_fields[checkbox_name] = '/Yes'
                        logger.debug(f"Checked {checkbox_name} for {item.get('name', 'unknown')} - status {status}")
                    else:
                        logger.warning(f"Checkbox index {checkbox_index} exceeds max {max_index} for Page {current_page}")
                
                # Move to next set of 4 checkboxes
                checkbox_base += 4
                items_on_current_page += 1
        
        logger.info(f"Mapped {len(checkbox_fields)} checkboxes")
        return checkbox_fields
        
        return checkbox_fields
    
    def _determine_status(self, item: Dict[str, Any]) -> str:
        """
        Determine TREC status (I/NI/NP/D) from inspection item data.
        
        Args:
            item: Line item data
            
        Returns:
            Status code: 'I', 'NI', 'NP', or 'D'
        """
        # Check for explicit status field
        status = item.get('status', '').lower()
        
        # Check if item has issues/defects
        has_comment = bool(item.get('comment', ''))
        has_photos = bool(item.get('photos', []))
        is_deficient = item.get('isDeficient', False)
        
        # Logic to determine TREC status
        if is_deficient or (has_comment and has_photos):
            return 'D'  # Deficient
        elif status == 'not_present':
            return 'NP'  # Not Present
        elif status == 'not_inspected' or status == '':
            return 'NI'  # Not Inspected
        else:
            return 'I'  # Inspected (no issues)
    
    def _format_address(self, address: Dict[str, Any]) -> str:
        """
        Format address dictionary to single line string.
        
        Args:
            address: Address components
            
        Returns:
            Formatted address string
        """
        parts = [
            address.get('street', ''),
            address.get('city', ''),
            address.get('state', ''),
            address.get('zipcode', '')
        ]
        return ', '.join(filter(None, parts))
