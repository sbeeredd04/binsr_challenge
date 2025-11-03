"""
Data validation utilities for inspection data.

Provides validators and helper functions for validating and transforming inspection data.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime


logger = logging.getLogger(__name__)


class DataValidator:
    """Validator class for inspection data."""
    
    PLACEHOLDER_TEXT = "Data not found in test data"
    
    @staticmethod
    def validate_string(value: Any, field_name: str, default: Optional[str] = None) -> str:
        """
        Validate and return string value.
        
        Args:
            value: Value to validate
            field_name: Name of the field (for logging)
            default: Default value if validation fails
            
        Returns:
            Validated string or default value
        """
        if default is None:
            default = DataValidator.PLACEHOLDER_TEXT
        
        if value is None:
            logger.debug(f"Field '{field_name}' is None, using default")
            return default
        
        if isinstance(value, str):
            stripped = value.strip()
            if stripped:
                return stripped
            logger.debug(f"Field '{field_name}' is empty string, using default")
            return default
        
        # Convert to string if possible
        try:
            result = str(value)
            logger.debug(f"Field '{field_name}' converted from {type(value)} to string")
            return result
        except Exception as e:
            logger.warning(f"Failed to convert '{field_name}' to string: {str(e)}")
            return default
    
    @staticmethod
    def validate_number(value: Any, field_name: str, default: int = 0) -> int:
        """
        Validate and return numeric value.
        
        Args:
            value: Value to validate
            field_name: Name of the field (for logging)
            default: Default value if validation fails
            
        Returns:
            Validated number or default value
        """
        if value is None:
            logger.debug(f"Field '{field_name}' is None, using default {default}")
            return default
        
        if isinstance(value, (int, float)):
            return int(value)
        
        # Try to convert string to number
        if isinstance(value, str):
            try:
                return int(float(value))
            except ValueError:
                logger.warning(f"Failed to convert '{field_name}' value '{value}' to number")
                return default
        
        logger.warning(f"Field '{field_name}' has invalid type {type(value)}")
        return default
    
    @staticmethod
    def validate_boolean(value: Any, field_name: str, default: bool = False) -> bool:
        """
        Validate and return boolean value.
        
        Args:
            value: Value to validate
            field_name: Name of the field (for logging)
            default: Default value if validation fails
            
        Returns:
            Validated boolean or default value
        """
        if value is None:
            logger.debug(f"Field '{field_name}' is None, using default {default}")
            return default
        
        if isinstance(value, bool):
            return value
        
        # Convert string to boolean
        if isinstance(value, str):
            value_lower = value.lower().strip()
            if value_lower in ('true', '1', 'yes', 'y'):
                return True
            if value_lower in ('false', '0', 'no', 'n'):
                return False
        
        logger.warning(f"Field '{field_name}' has unexpected value '{value}'")
        return default
    
    @staticmethod
    def validate_list(value: Any, field_name: str) -> List:
        """
        Validate and return list value.
        
        Args:
            value: Value to validate
            field_name: Name of the field (for logging)
            
        Returns:
            Validated list or empty list
        """
        if value is None:
            logger.debug(f"Field '{field_name}' is None, returning empty list")
            return []
        
        if isinstance(value, list):
            return value
        
        logger.warning(f"Field '{field_name}' is not a list (type: {type(value)}), returning empty list")
        return []
    
    @staticmethod
    def validate_dict(value: Any, field_name: str) -> Dict:
        """
        Validate and return dictionary value.
        
        Args:
            value: Value to validate
            field_name: Name of the field (for logging)
            
        Returns:
            Validated dictionary or empty dictionary
        """
        if value is None:
            logger.debug(f"Field '{field_name}' is None, returning empty dict")
            return {}
        
        if isinstance(value, dict):
            return value
        
        logger.warning(f"Field '{field_name}' is not a dict (type: {type(value)}), returning empty dict")
        return {}
    
    @staticmethod
    def validate_timestamp(value: Any, field_name: str) -> Optional[str]:
        """
        Validate and format timestamp value.
        
        Args:
            value: Value to validate (milliseconds since epoch)
            field_name: Name of the field (for logging)
            
        Returns:
            Formatted timestamp string or placeholder
        """
        if value is None or value == 0:
            logger.debug(f"Field '{field_name}' is None or 0, using placeholder")
            return DataValidator.PLACEHOLDER_TEXT
        
        try:
            if isinstance(value, (int, float)):
                # Convert milliseconds to seconds
                timestamp_seconds = value / 1000
                dt = datetime.fromtimestamp(timestamp_seconds)
                return dt.strftime('%Y-%m-%d %H:%M:%S')
            else:
                logger.warning(f"Field '{field_name}' has invalid type {type(value)}")
                return DataValidator.PLACEHOLDER_TEXT
        except Exception as e:
            logger.error(f"Failed to convert timestamp for '{field_name}': {str(e)}")
            return DataValidator.PLACEHOLDER_TEXT
    
    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Sanitize text for safe output.
        
        Args:
            text: Text to sanitize
            
        Returns:
            Sanitized text
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Replace HTML entities
        sanitized = text.replace('&apos;', "'")
        sanitized = sanitized.replace('&quot;', '"')
        sanitized = sanitized.replace('&amp;', '&')
        sanitized = sanitized.replace('&lt;', '<')
        sanitized = sanitized.replace('&gt;', '>')
        
        return sanitized.strip()


class DataTransformer:
    """Helper class for transforming inspection data."""
    
    @staticmethod
    def format_address(address_data: Dict[str, Any]) -> str:
        """
        Format address data into single string.
        
        Args:
            address_data: Address dictionary
            
        Returns:
            Formatted address string
        """
        parts = []
        
        street = DataValidator.validate_string(address_data.get('street'), 'street', '')
        city = DataValidator.validate_string(address_data.get('city'), 'city', '')
        state = DataValidator.validate_string(address_data.get('state'), 'state', '')
        zipcode = DataValidator.validate_string(address_data.get('zipcode'), 'zipcode', '')
        
        if street:
            parts.append(street)
        
        city_state = []
        if city:
            city_state.append(city)
        if state:
            city_state.append(state)
        if city_state:
            parts.append(', '.join(city_state))
        
        if zipcode:
            if parts:
                parts[-1] = f"{parts[-1]} {zipcode}"
            else:
                parts.append(zipcode)
        
        return ', '.join(parts) if parts else DataValidator.PLACEHOLDER_TEXT
    
    @staticmethod
    def get_inspection_status_text(status: Optional[str]) -> str:
        """
        Convert inspection status code to text.
        
        Args:
            status: Status code (I/NI/D/NP)
            
        Returns:
            Human-readable status text
        """
        status_map = {
            'I': 'Inspected',
            'NI': 'Not Inspected',
            'D': 'Deficient',
            'NP': 'Not Present'
        }
        
        if status is None:
            return 'Not Specified'
        
        return status_map.get(status.upper(), status)
    
    @staticmethod
    def categorize_comments_by_type(comments: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Categorize comments by their type.
        
        Args:
            comments: List of comment dictionaries
            
        Returns:
            Dictionary with comments categorized by type
        """
        categorized = {
            'info': [],
            'deficiency': [],
            'recommendation': [],
            'other': []
        }
        
        for comment in comments:
            comment_type = DataValidator.validate_string(
                comment.get('type'), 
                'comment_type', 
                'other'
            ).lower()
            
            if comment_type in categorized:
                categorized[comment_type].append(comment)
            else:
                categorized['other'].append(comment)
        
        logger.debug(f"Categorized comments: {len(categorized['info'])} info, "
                    f"{len(categorized['deficiency'])} deficiency, "
                    f"{len(categorized['recommendation'])} recommendation, "
                    f"{len(categorized['other'])} other")
        
        return categorized
    
    @staticmethod
    def extract_media_urls(comments: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Extract all media URLs from comments.
        
        Args:
            comments: List of comment dictionaries
            
        Returns:
            Dictionary with photo and video URLs
        """
        media = {
            'photos': [],
            'videos': []
        }
        
        for comment in comments:
            photos = DataValidator.validate_list(comment.get('photos'), 'photos')
            videos = DataValidator.validate_list(comment.get('videos'), 'videos')
            
            media['photos'].extend(photos)
            media['videos'].extend(videos)
        
        logger.debug(f"Extracted {len(media['photos'])} photos and {len(media['videos'])} videos")
        
        return media
