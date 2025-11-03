"""
Image handler service for downloading and processing images.

Handles downloading images from URLs, processing with Pillow,
and preparing them for PDF embedding.
"""

import io
import logging
from typing import Optional, Tuple
from pathlib import Path

import requests
from PIL import Image
from reportlab.lib.utils import ImageReader


logger = logging.getLogger(__name__)


class ImageHandler:
    """Handle image downloading, processing, and caching."""
    
    DEFAULT_TIMEOUT = 5
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_WIDTH = 500
    MAX_HEIGHT = 400
    
    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize image handler.
        
        Args:
            cache_dir: Optional directory for caching downloaded images
        """
        self.cache_dir = Path(cache_dir) if cache_dir else None
        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Image cache directory: {self.cache_dir}")
    
    def download_image(self, url: str, timeout: int = DEFAULT_TIMEOUT) -> Optional[bytes]:
        """
        Download image from URL.
        
        Args:
            url: Image URL to download
            timeout: Request timeout in seconds
            
        Returns:
            Image data as bytes or None if download fails
        """
        if not url:
            logger.warning("Empty URL provided for image download")
            return None
        
        try:
            logger.debug(f"Downloading image from: {url}")
            
            response = requests.get(
                url,
                timeout=timeout,
                headers={'User-Agent': 'Binsr-Report-Generator/1.0'}
            )
            response.raise_for_status()
            
            image_data = response.content
            
            if len(image_data) > self.MAX_IMAGE_SIZE:
                logger.warning(f"Image size {len(image_data)} bytes exceeds maximum {self.MAX_IMAGE_SIZE}")
                return None
            
            logger.info(f"Downloaded image: {len(image_data)} bytes from {url}")
            return image_data
            
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout downloading image from {url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.warning(f"Failed to download image from {url}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error downloading image from {url}: {str(e)}", exc_info=True)
            return None
    
    def process_image(
        self,
        image_data: bytes,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None
    ) -> Optional[Image.Image]:
        """
        Process image data with Pillow.
        
        Args:
            image_data: Raw image bytes
            max_width: Maximum width for resizing
            max_height: Maximum height for resizing
            
        Returns:
            Processed PIL Image or None if processing fails
        """
        if not image_data:
            logger.warning("Empty image data provided")
            return None
        
        max_width = max_width or self.MAX_WIDTH
        max_height = max_height or self.MAX_HEIGHT
        
        try:
            logger.debug(f"Processing image: {len(image_data)} bytes")
            
            image = Image.open(io.BytesIO(image_data))
            
            original_size = image.size
            logger.debug(f"Original image size: {original_size}")
            
            if image.size[0] > max_width or image.size[1] > max_height:
                image = self._resize_image(image, max_width, max_height)
                logger.info(f"Resized image from {original_size} to {image.size}")
            
            if image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')
                logger.debug(f"Converted image mode to RGB")
            
            return image
            
        except Exception as e:
            logger.error(f"Failed to process image: {str(e)}", exc_info=True)
            return None
    
    def _resize_image(
        self,
        image: Image.Image,
        max_width: int,
        max_height: int
    ) -> Image.Image:
        """
        Resize image maintaining aspect ratio.
        
        Args:
            image: PIL Image to resize
            max_width: Maximum width
            max_height: Maximum height
            
        Returns:
            Resized PIL Image
        """
        width, height = image.size
        aspect_ratio = width / height
        
        if width > max_width:
            width = max_width
            height = int(width / aspect_ratio)
        
        if height > max_height:
            height = max_height
            width = int(height * aspect_ratio)
        
        logger.debug(f"Resizing image to {width}x{height}")
        return image.resize((width, height), Image.Resampling.LANCZOS)
    
    def get_image_reader(self, url: str) -> Optional[ImageReader]:
        """
        Get ReportLab ImageReader from URL.
        
        Downloads, processes, and prepares image for PDF embedding.
        
        Args:
            url: Image URL
            
        Returns:
            ReportLab ImageReader or None if fails
        """
        try:
            logger.debug(f"Getting ImageReader for: {url}")
            
            image_data = self.download_image(url)
            if not image_data:
                return None
            
            image = self.process_image(image_data)
            if not image:
                return None
            
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG', quality=85)
            img_buffer.seek(0)
            
            reader = ImageReader(img_buffer)
            logger.info(f"Created ImageReader for {url}")
            return reader
            
        except Exception as e:
            logger.error(f"Failed to create ImageReader for {url}: {str(e)}", exc_info=True)
            return None
    
    def get_image_dimensions(
        self,
        image: Image.Image,
        max_width: int,
        max_height: int
    ) -> Tuple[int, int]:
        """
        Calculate display dimensions for image in PDF.
        
        Args:
            image: PIL Image
            max_width: Maximum display width
            max_height: Maximum display height
            
        Returns:
            Tuple of (width, height) for display
        """
        width, height = image.size
        aspect_ratio = width / height
        
        display_width = min(width, max_width)
        display_height = int(display_width / aspect_ratio)
        
        if display_height > max_height:
            display_height = max_height
            display_width = int(display_height * aspect_ratio)
        
        logger.debug(f"Display dimensions: {display_width}x{display_height}")
        return display_width, display_height
