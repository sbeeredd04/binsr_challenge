"""Health check routes for monitoring application status."""

from flask import Blueprint, jsonify
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify application is running.
    
    Returns:
        JSON response with health status and timestamp
    """
    logger.debug("Health check requested")
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'Binsr Inspection Report Generator'
    }), 200


@health_bp.route('/health/detailed', methods=['GET'])
def detailed_health_check():
    """
    Detailed health check with component status.
    
    Returns:
        JSON response with detailed health information
    """
    import os
    from flask import current_app
    
    logger.debug("Detailed health check requested")
    
    # Check critical paths
    inspection_file_exists = os.path.exists(
        current_app.config.get('INSPECTION_DATA_PATH')
    )
    output_dir_exists = os.path.exists(
        current_app.config.get('OUTPUT_DIR')
    )
    output_dir_writable = os.access(
        current_app.config.get('OUTPUT_DIR'), 
        os.W_OK
    )
    
    components = {
        'inspection_data': {
            'status': 'healthy' if inspection_file_exists else 'unhealthy',
            'path': current_app.config.get('INSPECTION_DATA_PATH')
        },
        'output_directory': {
            'status': 'healthy' if (output_dir_exists and output_dir_writable) else 'unhealthy',
            'path': current_app.config.get('OUTPUT_DIR'),
            'writable': output_dir_writable
        }
    }
    
    overall_status = 'healthy' if all(
        c['status'] == 'healthy' for c in components.values()
    ) else 'degraded'
    
    return jsonify({
        'status': overall_status,
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'Binsr Inspection Report Generator',
        'components': components
    }), 200 if overall_status == 'healthy' else 503
