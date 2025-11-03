"""
Configuration module for Flask application.

Defines configuration classes for different environments.
"""

import os
from pathlib import Path
from typing import Dict, Type


class Config:
    """Base configuration class with common settings."""
    
    # Base directory
    BASE_DIR = Path(__file__).parent.parent
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Server settings
    HOST = os.getenv('HOST', '127.0.0.1')
    PORT = int(os.getenv('PORT', 5000))
    
    # File upload settings
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 52428800))
    
    # File paths
    INSPECTION_DATA_PATH = os.getenv(
        'INSPECTION_DATA_PATH',
        str(BASE_DIR / 'assets' / 'inspection.json')
    )
    OUTPUT_DIR = os.getenv('OUTPUT_DIR', str(BASE_DIR / 'output'))
    LOGS_DIR = os.getenv('LOGS_DIR', str(BASE_DIR / 'logs'))
    
    # PDF generation settings
    TREC_TEMPLATE_PATH = os.getenv(
        'TREC_TEMPLATE_PATH',
        str(BASE_DIR / 'assets' / 'TREC_Template_Blank.pdf')
    )
    IMAGE_DOWNLOAD_TIMEOUT = int(os.getenv('IMAGE_DOWNLOAD_TIMEOUT', 30))
    MAX_IMAGE_SIZE_MB = int(os.getenv('MAX_IMAGE_SIZE_MB', 10))
    ENABLE_IMAGE_CACHE = os.getenv('ENABLE_IMAGE_CACHE', 'True').lower() == 'true'
    
    # Performance settings
    MAX_WORKERS = int(os.getenv('MAX_WORKERS', 4))
    PDF_GENERATION_TIMEOUT = int(os.getenv('PDF_GENERATION_TIMEOUT', 60))
    
    @staticmethod
    def init_app(app) -> None:
        """
        Initialize application with configuration.
        
        Args:
            app: Flask application instance
        """
        # Create required directories
        os.makedirs(Config.OUTPUT_DIR, exist_ok=True)
        os.makedirs(Config.LOGS_DIR, exist_ok=True)


class DevelopmentConfig(Config):
    """Development environment configuration."""
    
    DEBUG = True
    FLASK_ENV = 'development'


class ProductionConfig(Config):
    """Production environment configuration."""
    
    DEBUG = False
    FLASK_ENV = 'production'
    
    @classmethod
    def init_app(cls, app) -> None:
        """
        Initialize production application.
        
        Args:
            app: Flask application instance
        """
        Config.init_app(app)
        
        # Production-specific initialization
        import logging
        from logging.handlers import RotatingFileHandler
        
        # Setup file logging for production
        if not app.debug:
            file_handler = RotatingFileHandler(
                os.path.join(cls.LOGS_DIR, 'app.log'),
                maxBytes=10485760,
                backupCount=10
            )
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s '
                '[in %(pathname)s:%(lineno)d]'
            ))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            app.logger.setLevel(logging.INFO)


class TestingConfig(Config):
    """Testing environment configuration."""
    
    TESTING = True
    DEBUG = True
    
    # Use temporary paths for testing
    OUTPUT_DIR = '/tmp/binsr_test_output'
    LOGS_DIR = '/tmp/binsr_test_logs'


# Configuration dictionary
config_by_name: Dict[str, Type[Config]] = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(config_name: str = 'development') -> Type[Config]:
    """
    Get configuration class by name.
    
    Args:
        config_name: Name of the configuration environment
        
    Returns:
        Configuration class
    """
    return config_by_name.get(config_name, DevelopmentConfig)
