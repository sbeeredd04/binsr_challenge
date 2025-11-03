"""
Inspection data parser service.

Parses inspection.json and extracts structured data for PDF generation.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

from app.utils.validators import DataValidator, DataTransformer


logger = logging.getLogger(__name__)


class InspectionDataParser:
    """Parse and structure inspection data from JSON file."""
    
    def __init__(self, json_file_path: str):
        """
        Initialize parser with JSON file path.
        
        Args:
            json_file_path: Path to inspection.json file
        """
        self.json_file_path = json_file_path
        self.raw_data: Optional[Dict[str, Any]] = None
        self.parsed_data: Optional[Dict[str, Any]] = None
        
        logger.info(f"Initialized InspectionDataParser with file: {json_file_path}")
    
    def parse(self) -> Dict[str, Any]:
        """
        Parse inspection JSON file and return structured data.
        
        Returns:
            Dictionary containing parsed inspection data
            
        Raises:
            FileNotFoundError: If JSON file doesn't exist
            json.JSONDecodeError: If JSON is malformed
        """
        logger.info(f"Parsing inspection data from {self.json_file_path}")
        
        # Load JSON file
        if not Path(self.json_file_path).exists():
            logger.error(f"Inspection file not found: {self.json_file_path}")
            raise FileNotFoundError(f"Inspection file not found: {self.json_file_path}")
        
        try:
            with open(self.json_file_path, 'r', encoding='utf-8') as f:
                self.raw_data = json.load(f)
            logger.info("JSON file loaded successfully")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {str(e)}")
            raise
        
        # Extract and structure data
        inspection = self.raw_data.get('inspection', {})
        
        self.parsed_data = {
            'metadata': self._extract_metadata(inspection),
            'client': self._extract_client_info(inspection),
            'inspector': self._extract_inspector_info(inspection),
            'property': self._extract_property_info(inspection),
            'sections': self._extract_sections(inspection),
            'raw': inspection
        }
        
        logger.info(f"Parsed {len(self.parsed_data['sections'])} sections")
        return self.parsed_data
    
    def _extract_metadata(self, inspection: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract inspection metadata with validation.
        
        Args:
            inspection: Raw inspection dictionary
            
        Returns:
            Dictionary containing validated metadata
        """
        logger.debug("Extracting inspection metadata")
        
        try:
            schedule = DataValidator.validate_dict(inspection.get('schedule'), 'schedule')
            
            metadata = {
                'id': DataValidator.validate_string(inspection.get('id'), 'inspection_id'),
                'status': DataValidator.validate_string(inspection.get('status'), 'status'),
                'date': DataValidator.validate_timestamp(schedule.get('date'), 'date'),
                'start_time': DataValidator.validate_timestamp(schedule.get('startTime'), 'start_time'),
                'end_time': DataValidator.validate_timestamp(schedule.get('endTime'), 'end_time'),
                'fee': DataValidator.validate_number(inspection.get('fee'), 'fee', 0),
                'payment_status': DataValidator.validate_string(
                    inspection.get('paymentStatus'), 
                    'payment_status'
                ),
                'header_image_url': inspection.get('headerImageUrl', None)
            }
            
            logger.info(f"Extracted metadata for inspection ID: {metadata['id']}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to extract metadata: {str(e)}")
    
    def _extract_client_info(self, inspection: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract client information with validation.
        
        Args:
            inspection: Raw inspection dictionary
            
        Returns:
            Dictionary containing validated client information
        """
        logger.debug("Extracting client information")
        
        try:
            client_info = DataValidator.validate_dict(inspection.get('clientInfo'), 'clientInfo')
            
            client_data = {
                'name': DataValidator.validate_string(client_info.get('name'), 'client_name'),
                'email': DataValidator.validate_string(client_info.get('email'), 'client_email'),
                'phone': DataValidator.validate_string(client_info.get('phone'), 'client_phone'),
                'user_type': DataValidator.validate_string(client_info.get('userType'), 'user_type')
            }
            
            logger.info(f"Extracted client info for: {client_data['name']}")
            return client_data
            
        except Exception as e:
            logger.error(f"Error extracting client info: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to extract client info: {str(e)}")
    
    def _extract_inspector_info(self, inspection: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract inspector information with validation.
        
        Args:
            inspection: Raw inspection dictionary
            
        Returns:
            Dictionary containing validated inspector information
        """
        logger.debug("Extracting inspector information")
        
        try:
            inspector = DataValidator.validate_dict(inspection.get('inspector'), 'inspector')
            
            inspector_data = {
                'id': DataValidator.validate_string(inspector.get('id'), 'inspector_id'),
                'name': DataValidator.validate_string(inspector.get('name'), 'inspector_name'),
                'email': DataValidator.validate_string(inspector.get('email'), 'inspector_email'),
                'phone': DataValidator.validate_string(inspector.get('phone'), 'inspector_phone')
            }
            
            logger.info(f"Extracted inspector info for: {inspector_data['name']}")
            return inspector_data
            
        except Exception as e:
            logger.error(f"Error extracting inspector info: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to extract inspector info: {str(e)}")
    
    def _extract_property_info(self, inspection: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract property information with validation.
        
        Args:
            inspection: Raw inspection dictionary
            
        Returns:
            Dictionary containing validated property information
        """
        logger.debug("Extracting property information")
        
        try:
            address = DataValidator.validate_dict(inspection.get('address'), 'address')
            property_info = DataValidator.validate_dict(address.get('propertyInfo'), 'propertyInfo')
            
            property_data = {
                'street': DataValidator.validate_string(address.get('street'), 'street'),
                'city': DataValidator.validate_string(address.get('city'), 'city'),
                'state': DataValidator.validate_string(address.get('state'), 'state'),
                'zipcode': DataValidator.validate_string(address.get('zipcode'), 'zipcode'),
                'full_address': DataValidator.validate_string(
                    address.get('fullAddress'), 
                    'full_address'
                ),
                'square_footage': DataValidator.validate_number(
                    property_info.get('squareFootage'), 
                    'square_footage', 
                    0
                )
            }
            
            # If full_address is placeholder, construct from components
            if property_data['full_address'] == DataValidator.PLACEHOLDER_TEXT:
                property_data['full_address'] = DataTransformer.format_address(address)
            
            logger.info(f"Extracted property info for: {property_data['full_address']}")
            return property_data
            
        except Exception as e:
            logger.error(f"Error extracting property info: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to extract property info: {str(e)}")
    
    def _extract_sections(self, inspection: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract and structure all sections with validation.
        
        Args:
            inspection: Raw inspection dictionary
            
        Returns:
            List of validated section dictionaries
        """
        logger.debug("Extracting sections")
        
        try:
            sections = DataValidator.validate_list(inspection.get('sections'), 'sections')
            
            if not sections:
                logger.warning("No sections found in inspection data")
                return []
            
            structured_sections = []
            
            for idx, section in enumerate(sections):
                try:
                    structured_section = {
                        'id': DataValidator.validate_string(section.get('id'), f'section[{idx}].id'),
                        'name': DataValidator.validate_string(section.get('name'), f'section[{idx}].name'),
                        'order': DataValidator.validate_number(section.get('order'), f'section[{idx}].order', idx),
                        'section_number': DataValidator.validate_string(
                            section.get('sectionNumber'), 
                            f'section[{idx}].sectionNumber',
                            str(idx + 1)
                        ),
                        'line_items': self._extract_line_items(
                            section.get('lineItems', []), 
                            section.get('name', f'Section {idx}')
                        )
                    }
                    structured_sections.append(structured_section)
                    logger.debug(f"Extracted section: {structured_section['name']} "
                               f"with {len(structured_section['line_items'])} line items")
                    
                except Exception as e:
                    logger.error(f"Error extracting section {idx}: {str(e)}", exc_info=True)
                    # Continue processing other sections
                    continue
            
            # Sort sections by order
            structured_sections.sort(key=lambda x: x.get('order', 0))
            
            logger.info(f"Successfully extracted {len(structured_sections)} sections")
            return structured_sections
            
        except Exception as e:
            logger.error(f"Error extracting sections: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to extract sections: {str(e)}")
    
    def _extract_line_items(self, line_items: List[Dict[str, Any]], section_name: str = '') -> List[Dict[str, Any]]:
        """
        Extract and structure line items with validation.
        
        Args:
            line_items: List of raw line item dictionaries
            section_name: Name of parent section (for logging)
            
        Returns:
            List of validated line item dictionaries
        """
        line_items = DataValidator.validate_list(line_items, 'line_items')
        structured_items = []
        
        for idx, item in enumerate(line_items):
            try:
                structured_item = {
                    'id': DataValidator.validate_string(item.get('id'), f'line_item[{idx}].id'),
                    'name': DataValidator.validate_string(item.get('name'), f'line_item[{idx}].name'),
                    'title': DataValidator.validate_string(item.get('title'), f'line_item[{idx}].title'),
                    'order': DataValidator.validate_number(item.get('order'), f'line_item[{idx}].order', idx),
                    'inspection_status': item.get('inspectionStatus'),
                    'inspection_status_text': DataTransformer.get_inspection_status_text(
                        item.get('inspectionStatus')
                    ),
                    'is_deficient': DataValidator.validate_boolean(
                        item.get('isDeficient'), 
                        f'line_item[{idx}].isDeficient', 
                        False
                    ),
                    'line_item_number': DataValidator.validate_number(
                        item.get('lineItemNumber'), 
                        f'line_item[{idx}].lineItemNumber', 
                        idx + 1
                    ),
                    'comments': self._extract_comments(
                        item.get('comments', []), 
                        item.get('name', f'Line Item {idx}')
                    )
                }
                structured_items.append(structured_item)
                
            except Exception as e:
                logger.error(f"Error extracting line item {idx} in section '{section_name}': {str(e)}", 
                           exc_info=True)
                # Continue processing other items
                continue
        
        # Sort by order
        structured_items.sort(key=lambda x: x.get('order', 0))
        
        logger.debug(f"Extracted {len(structured_items)} line items for section '{section_name}'")
        return structured_items
    
    def _extract_comments(self, comments: List[Dict[str, Any]], line_item_name: str = '') -> List[Dict[str, Any]]:
        """
        Extract and structure comments with validation.
        
        Args:
            comments: List of raw comment dictionaries
            line_item_name: Name of parent line item (for logging)
            
        Returns:
            List of validated comment dictionaries
        """
        comments = DataValidator.validate_list(comments, 'comments')
        structured_comments = []
        
        for idx, comment in enumerate(comments):
            try:
                # Get text from multiple possible fields
                text = comment.get('text') or comment.get('commentText') or comment.get('content', '')
                text = DataValidator.sanitize_text(text)
                
                structured_comment = {
                    'id': DataValidator.validate_string(comment.get('id'), f'comment[{idx}].id'),
                    'text': text,
                    'label': DataValidator.validate_string(
                        comment.get('label'), 
                        f'comment[{idx}].label',
                        ''
                    ),
                    'type': DataValidator.validate_string(
                        comment.get('type'), 
                        f'comment[{idx}].type',
                        'info'
                    ),
                    'order': DataValidator.validate_number(
                        comment.get('order'), 
                        f'comment[{idx}].order', 
                        idx
                    ),
                    'location': DataValidator.validate_string(
                        comment.get('location'), 
                        f'comment[{idx}].location',
                        ''
                    ),
                    'is_flagged': DataValidator.validate_boolean(
                        comment.get('isFlagged'), 
                        f'comment[{idx}].isFlagged', 
                        False
                    ),
                    'recommendation': DataValidator.validate_string(
                        comment.get('recommendation'), 
                        f'comment[{idx}].recommendation',
                        ''
                    ),
                    'comment_number': DataValidator.validate_string(
                        comment.get('commentNumber'), 
                        f'comment[{idx}].commentNumber',
                        ''
                    ),
                    'photos': DataValidator.validate_list(comment.get('photos'), f'comment[{idx}].photos'),
                    'videos': DataValidator.validate_list(comment.get('videos'), f'comment[{idx}].videos')
                }
                
                structured_comments.append(structured_comment)
                
            except Exception as e:
                logger.error(f"Error extracting comment {idx} in line item '{line_item_name}': {str(e)}", 
                           exc_info=True)
                # Continue processing other comments
                continue
        
        # Sort by order
        structured_comments.sort(key=lambda x: x.get('order', 0))
        
        logger.debug(f"Extracted {len(structured_comments)} comments for line item '{line_item_name}'")
        return structured_comments
