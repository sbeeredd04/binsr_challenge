"""Report generation routes for PDF creation."""

from flask import Blueprint, jsonify, send_file, current_app
import logging
import time
import os
from typing import Dict, Any

logger = logging.getLogger(__name__)
reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/reports/trec', methods=['POST'])
def generate_trec_report():
    """
    Generate TREC-formatted inspection report using template filling.
    
    Returns:
        JSON response with generation status and file information
    """
    logger.info("TREC report generation requested")
    start_time = time.time()
    
    try:
        from app.services.data_parser import InspectionDataParser
        from app.services.trec_generator_v2 import TRECReportGeneratorV2
        
        # Parse inspection data
        logger.info("Parsing inspection data")
        parser = InspectionDataParser(current_app.config['INSPECTION_DATA_PATH'])
        parser.parse()  # Parse to validate, but we'll use raw_data
        
        # Generate TREC report using V2 (template-based)
        logger.info("Generating TREC PDF report using template filling")
        generator = TRECReportGeneratorV2(
            config=current_app.config,
            template_path='assets/TREC_Template_Blank.pdf'
        )
        
        # Use raw data for TREC mapping
        output_path = generator.generate(
            inspection_data=parser.raw_data,
            output_filename='trec_report.pdf',
            validate=True
        )
        
        generation_time = time.time() - start_time
        logger.info(f"TREC report generated successfully in {generation_time:.2f} seconds")
        
        return jsonify({
            'status': 'success',
            'message': 'TREC report generated successfully',
            'file_path': output_path,
            'file_name': os.path.basename(output_path),
            'generation_time': round(generation_time, 2)
        }), 201
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Required file not found',
            'error': str(e)
        }), 404
        
    except Exception as e:
        logger.error(f"Error generating TREC report: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate TREC report',
            'error': str(e)
        }), 500


@reports_bp.route('/reports/bonus', methods=['POST'])
def generate_bonus_report():
    """
    Generate custom-designed inspection report.
    
    Returns:
        JSON response with generation status and file information
    """
    logger.info("Bonus report generation requested")
    start_time = time.time()
    
    try:
        from app.services.data_parser import InspectionDataParser
        from app.services.bonus_generator import BonusReportGenerator
        
        # Parse inspection data
        logger.info("Parsing inspection data")
        parser = InspectionDataParser(current_app.config['INSPECTION_DATA_PATH'])
        inspection_data = parser.parse()
        
        # Generate bonus report
        logger.info("Generating bonus PDF report")
        generator = BonusReportGenerator(current_app.config)
        output_path = generator.generate(inspection_data)
        
        generation_time = time.time() - start_time
        logger.info(f"Bonus report generated successfully in {generation_time:.2f} seconds")
        
        return jsonify({
            'status': 'success',
            'message': 'Bonus report generated successfully',
            'file_path': output_path,
            'file_name': os.path.basename(output_path),
            'generation_time': round(generation_time, 2)
        }), 201
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Required file not found',
            'error': str(e)
        }), 404
        
    except Exception as e:
        logger.error(f"Error generating bonus report: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate bonus report',
            'error': str(e)
        }), 500


@reports_bp.route('/reports/all', methods=['POST'])
def generate_all_reports():
    """
    Generate both TREC and bonus inspection reports.
    
    Returns:
        JSON response with generation status for both reports
    """
    logger.info("Both reports generation requested")
    start_time = time.time()
    
    try:
        from app.services.data_parser import InspectionDataParser
        from app.services.trec_generator_v2 import TRECReportGeneratorV2
        from app.services.bonus_generator import BonusReportGenerator
        
        # Parse inspection data once
        logger.info("Parsing inspection data")
        parser = InspectionDataParser(current_app.config['INSPECTION_DATA_PATH'])
        inspection_data = parser.parse()
        
        # Generate TREC report using V2 (template-based)
        logger.info("Generating TREC PDF report using template filling")
        trec_start = time.time()
        trec_generator = TRECReportGeneratorV2(
            config=current_app.config,
            template_path='assets/TREC_Template_Blank.pdf'
        )
        trec_path = trec_generator.generate(
            inspection_data=parser.raw_data,
            output_filename='trec_report.pdf',
            validate=True
        )
        trec_time = time.time() - trec_start
        
        # Generate bonus report
        logger.info("Generating bonus PDF report")
        bonus_start = time.time()
        bonus_generator = BonusReportGenerator(current_app.config)
        bonus_path = bonus_generator.generate(inspection_data)
        bonus_time = time.time() - bonus_start
        
        total_time = time.time() - start_time
        logger.info(f"Both reports generated successfully in {total_time:.2f} seconds")
        
        return jsonify({
            'status': 'success',
            'message': 'Both reports generated successfully',
            'trec_report': {
                'file_path': trec_path,
                'file_name': os.path.basename(trec_path),
                'generation_time': round(trec_time, 2)
            },
            'bonus_report': {
                'file_path': bonus_path,
                'file_name': os.path.basename(bonus_path),
                'generation_time': round(bonus_time, 2)
            },
            'total_time': round(total_time, 2)
        }), 201
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Required file not found',
            'error': str(e)
        }), 404
        
    except Exception as e:
        logger.error(f"Error generating reports: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate reports',
            'error': str(e)
        }), 500


@reports_bp.route('/reports/download/<filename>', methods=['GET'])
def download_report(filename: str):
    """
    Download a generated PDF report.
    
    Args:
        filename: Name of the PDF file to download
        
    Returns:
        PDF file download or error response
    """
    logger.info(f"Report download requested: {filename}")
    
    try:
        # Validate filename to prevent path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            logger.warning(f"Invalid filename attempted: {filename}")
            return jsonify({
                'status': 'error',
                'message': 'Invalid filename'
            }), 400
        
        # Construct file path
        file_path = os.path.join(current_app.config['OUTPUT_DIR'], filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            return jsonify({
                'status': 'error',
                'message': 'File not found'
            }), 404
        
        logger.info(f"Sending file: {file_path}")
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Error downloading report: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Failed to download report',
            'error': str(e)
        }), 500
