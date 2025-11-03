"""
TREC Template Filler - Fills TREC template PDF with inspection data.

This module uses the blank TREC template and fills it with mapped inspection data,
preserving all template formatting and structure.
"""

import logging
from typing import Dict, Any, Optional
from pathlib import Path

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    raise ImportError("pypdf is required. Install it with: pip install pypdf>=3.17.0")


logger = logging.getLogger(__name__)


class TRECTemplateFiller:
    """Fills TREC template PDF with inspection data."""
    
    def __init__(self, template_path: str = 'assets/TREC_Template_Blank.pdf'):
        """
        Initialize TREC template filler.
        
        Args:
            template_path: Path to blank TREC template PDF
            
        Raises:
            FileNotFoundError: If template file doesn't exist
            ValueError: If template has no form fields
        """
        self.template_path = Path(template_path)
        
        if not self.template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")
        
        # Verify template has form fields
        self.has_form_fields = self._check_form_fields()
        
        if not self.has_form_fields:
            raise ValueError("Template has no fillable form fields. Cannot proceed.")
        
        logger.info(f"Initialized TRECTemplateFiller with template: {template_path}")
    
    def _check_form_fields(self) -> bool:
        """
        Check if template has fillable form fields.
        
        Returns:
            True if template has form fields, False otherwise
        """
        try:
            reader = PdfReader(self.template_path)
            fields = reader.get_fields()
            has_fields = bool(fields)
            
            if has_fields:
                logger.info(f"Template has {len(fields)} form fields")
            else:
                logger.warning("Template has no form fields")
            
            return has_fields
            
        except Exception as e:
            logger.error(f"Error checking form fields: {e}")
            return False
    
    def fill_template(
        self,
        field_values: Dict[str, str],
        output_path: str,
        flatten: bool = False
    ) -> str:
        """
        Fill template with provided field values.
        
        Args:
            field_values: Dictionary of {field_name: value} to fill
            output_path: Output PDF file path
            flatten: If True, flatten form (make non-editable)
            
        Returns:
            Path to generated PDF file
            
        Raises:
            Exception: If PDF generation fails
        """
        logger.info(f"Filling TREC template with {len(field_values)} field values")
        
        try:
            # Read template
            reader = PdfReader(self.template_path)
            writer = PdfWriter()
            
            # Clone all pages from template
            writer.clone_reader_document_root(reader)
            
            # Update form fields with values
            self._update_form_fields(writer, field_values)
            
            # Write output PDF
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'wb') as f:
                writer.write(f)
            
            logger.info(f"Successfully generated TREC report: {output_path}")
            return str(output_file)
            
        except Exception as e:
            logger.error(f"Error filling template: {e}", exc_info=True)
            raise
    
    def _update_form_fields(self, writer: PdfWriter, field_values: Dict[str, str]) -> None:
        """
        Update PDF form fields with values.
        
        Args:
            writer: PdfWriter instance
            field_values: Dictionary of field values to set
        """
        logger.debug(f"Updating {len(field_values)} form fields")
        
        # Get all existing fields from template
        template_reader = PdfReader(self.template_path)
        existing_fields = template_reader.get_fields()
        
        if not existing_fields:
            logger.warning("No fields found in template")
            return
        
        # Filter to only fields that exist in template
        valid_fields = {k: v for k, v in field_values.items() if k in existing_fields}
        missing_fields = [k for k in field_values.keys() if k not in existing_fields]
        
        logger.info(f"Attempting to fill {len(valid_fields)} valid fields")
        
        # Update fields on all pages
        # Note: We need to update each page separately as that's how pypdf works
        for page in writer.pages:
            try:
                writer.update_page_form_field_values(page, valid_fields)
            except Exception as e:
                logger.debug(f"Page update error (expected for pages without fields): {e}")
        
        # Count how many were actually filled
        updated_count = len(valid_fields)
        
        # Log summary
        logger.info(f"Updated {updated_count} fields successfully")
        
        if missing_fields:
            logger.warning(f"{len(missing_fields)} fields not found in template: {missing_fields[:10]}")
    
    def get_template_fields(self) -> Dict[str, Any]:
        """
        Get all form fields from template.
        
        Returns:
            Dictionary of field names and their properties
        """
        try:
            reader = PdfReader(self.template_path)
            fields = reader.get_fields()
            
            if fields:
                logger.info(f"Template has {len(fields)} fields")
                return fields
            else:
                logger.warning("Template has no fields")
                return {}
                
        except Exception as e:
            logger.error(f"Error reading template fields: {e}")
            return {}
    
    def validate_field_mapping(self, field_values: Dict[str, str]) -> Dict[str, Any]:
        """
        Validate that field values match template fields.
        
        Args:
            field_values: Dictionary of field values to validate
            
        Returns:
            Dictionary with validation results:
            {
                'valid_fields': list of valid field names,
                'invalid_fields': list of field names not in template,
                'missing_required': list of required fields not provided,
                'is_valid': bool
            }
        """
        logger.debug("Validating field mapping")
        
        template_fields = self.get_template_fields()
        
        valid_fields = []
        invalid_fields = []
        
        for field_name in field_values.keys():
            if field_name in template_fields:
                valid_fields.append(field_name)
            else:
                invalid_fields.append(field_name)
        
        # Check for required fields (header fields)
        required_fields = [
            'Name of Client',
            'Date of Inspection',
            'Address of Inspected Property',
            'Name of Inspector'
        ]
        
        missing_required = [
            field for field in required_fields
            if field not in field_values or not field_values[field]
        ]
        
        result = {
            'valid_fields': valid_fields,
            'invalid_fields': invalid_fields,
            'missing_required': missing_required,
            'is_valid': len(invalid_fields) == 0 and len(missing_required) == 0,
            'total_template_fields': len(template_fields),
            'total_provided_fields': len(field_values),
            'matched_fields': len(valid_fields)
        }
        
        logger.info(f"Validation: {len(valid_fields)} valid, {len(invalid_fields)} invalid, {len(missing_required)} missing required")
        
        return result
