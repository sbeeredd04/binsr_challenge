"""
Flask Application Factory.

This module creates and configures the Flask application instance.
"""

import logging
from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.utils.logger import setup_logging


def create_app(config_name: str = 'development') -> Flask:
    """
    Create and configure Flask application.
    
    Args:
        config_name: Configuration environment (development/production/testing)
        
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Setup logging
    setup_logging(app)
    logger = logging.getLogger(__name__)
    logger.info(f"Starting Flask application with {config_name} configuration")
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    logger.info("CORS enabled for /api/* routes")
    
    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.reports import reports_bp
    
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(reports_bp, url_prefix='/api')
    logger.info("Blueprints registered successfully")
    
    # Register error handlers
    register_error_handlers(app)
    
    # Log application startup
    logger.info("Flask application created successfully")
    
    return app


def register_error_handlers(app: Flask) -> None:
    """
    Register global error handlers for the application.
    
    Args:
        app: Flask application instance
    """
    from flask import jsonify
    import logging
    
    logger = logging.getLogger(__name__)
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request errors."""
        logger.warning(f"Bad request: {str(error)}")
        return jsonify({
            'status': 'error',
            'message': 'Bad request',
            'error': str(error)
        }), 400
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found errors."""
        logger.warning(f"Resource not found: {str(error)}")
        return jsonify({
            'status': 'error',
            'message': 'Resource not found',
            'error': str(error)
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 Internal Server errors."""
        logger.error(f"Internal server error: {str(error)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'error': 'An unexpected error occurred'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """Handle all unhandled exceptions."""
        logger.error(f"Unhandled exception: {str(error)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred',
            'error': str(error)
        }), 500
