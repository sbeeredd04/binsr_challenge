"""
TREC PDF Report Generator (Template-based).

This module generates TREC-formatted PDF reports by filling the official
TREC template with inspection data, preserving all template formatting.
"""

import logging
from typing import Dict, Any, Optional
from pathlib import Path

from app.services.trec_data_mapper import TRECDataMapper
from app.services.trec_template_filler import TRECTemplateFiller


logger = logging.getLogger(__name__)


class TRECReportGeneratorV2:
    """
    Generate TREC-formatted PDF reports using template filling.
    
    This class uses the official TREC template and fills it with inspection data,
    ensuring the output matches the TREC format exactly.
    """
    
    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        output_dir: str = 'output',
        template_path: str = 'assets/TREC_Template_Blank.pdf'
    ):
        """
        Initialize TREC report generator.
        
        Args:
            config: Flask app config (optional)
            output_dir: Directory for output files
            template_path: Path to TREC template PDF
        """
        if config:
            self.output_dir = Path(config.get('OUTPUT_DIR', 'output'))
            self.template_path = config.get('TREC_TEMPLATE_PATH', template_path)
        else:
            self.output_dir = Path(output_dir)
            self.template_path = template_path
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        self.data_mapper = TRECDataMapper()
        self.template_filler = TRECTemplateFiller(self.template_path)
        
        logger.info("Initialized TRECReportGeneratorV2 (template-based)")
    
    def generate(
        self,
        inspection_data: Dict[str, Any],
        output_filename: str = 'trec_report.pdf',
        validate: bool = True
    ) -> str:
        """
        Generate TREC PDF report from inspection data.
        
        Args:
            inspection_data: Raw inspection data from inspection.json
            output_filename: Output PDF filename
            validate: If True, validate field mapping before generating
            
        Returns:
            Path to generated PDF file
            
        Raises:
            ValueError: If validation fails and validate=True
            Exception: If PDF generation fails
        """
        logger.info(f"Generating TREC report: {output_filename}")
        
        try:
            # Step 1: Map inspection data to TREC template fields
            logger.info("Step 1: Mapping data to TREC format")
            field_values = self.data_mapper.map_to_trec_format(inspection_data)
            
            logger.info(f"Mapped {len(field_values)} field values")
            
            # Step 2: Validate field mapping if requested
            if validate:
                logger.info("Step 2: Validating field mapping")
                validation = self.template_filler.validate_field_mapping(field_values)
                
                if not validation['is_valid']:
                    error_msg = (
                        f"Field mapping validation failed:\n"
                        f"  - Invalid fields: {len(validation['invalid_fields'])}\n"
                        f"  - Missing required: {len(validation['missing_required'])}\n"
                        f"  Details: {validation}"
                    )
                    logger.error(error_msg)
                    
                    if validation['missing_required']:
                        raise ValueError(f"Missing required fields: {validation['missing_required']}")
                
                logger.info(
                    f"Validation passed: {validation['matched_fields']}/{validation['total_provided_fields']} fields matched"
                )
            
            # Step 3: Fill template with mapped data
            logger.info("Step 3: Filling TREC template")
            output_path = self.output_dir / output_filename
            
            result_path = self.template_filler.fill_template(
                field_values=field_values,
                output_path=str(output_path),
                flatten=False  # Keep editable for now
            )
            
            logger.info(f"Successfully generated TREC report: {result_path}")
            
            # Log statistics
            file_size = Path(result_path).stat().st_size
            logger.info(f"Output file size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
            
            return result_path
            
        except Exception as e:
            logger.error(f"Failed to generate TREC report: {e}", exc_info=True)
            raise
    
    def get_field_preview(self, inspection_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Get preview of field values without generating PDF.
        
        Useful for debugging field mapping.
        
        Args:
            inspection_data: Raw inspection data
            
        Returns:
            Dictionary of {field_name: value}
        """
        logger.info("Generating field preview")
        
        try:
            field_values = self.data_mapper.map_to_trec_format(inspection_data)
            return field_values
            
        except Exception as e:
            logger.error(f"Failed to generate field preview: {e}", exc_info=True)
            raise
    
    def validate_template(self) -> Dict[str, Any]:
        """
        Validate that TREC template is usable.
        
        Returns:
            Dictionary with template validation info
        """
        logger.info("Validating TREC template")
        
        try:
            template_fields = self.template_filler.get_template_fields()
            
            result = {
                'template_path': str(self.template_path),
                'exists': Path(self.template_path).exists(),
                'has_form_fields': len(template_fields) > 0,
                'field_count': len(template_fields),
                'field_names': list(template_fields.keys())[:20],  # First 20 fields
                'is_valid': len(template_fields) > 0
            }
            
            if result['is_valid']:
                logger.info(f"Template is valid with {result['field_count']} fields")
            else:
                logger.error("Template validation failed")
            
            return result
            
        except Exception as e:
            logger.error(f"Template validation error: {e}", exc_info=True)
            return {
                'template_path': str(self.template_path),
                'exists': False,
                'has_form_fields': False,
                'field_count': 0,
                'is_valid': False,
                'error': str(e)
            }
