"""
PDF helper utilities for TREC report generation.

Common PDF operations, constants, and utility functions.
"""

import logging
from typing import List, Tuple
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas


logger = logging.getLogger(__name__)


class PDFConstants:
    """Constants for PDF generation."""
    
    PAGE_WIDTH, PAGE_HEIGHT = letter
    
    MARGIN_LEFT = 0.75 * inch
    MARGIN_RIGHT = 0.75 * inch
    MARGIN_TOP = 0.75 * inch
    MARGIN_BOTTOM = 0.75 * inch
    
    CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM
    
    FONT_TITLE = 'Helvetica-Bold'
    FONT_HEADER = 'Helvetica-Bold'
    FONT_BODY = 'Helvetica'
    FONT_ITALIC = 'Helvetica-Oblique'
    
    FONT_SIZE_TITLE = 14
    FONT_SIZE_SECTION = 11
    FONT_SIZE_SUBSECTION = 10
    FONT_SIZE_BODY = 9
    FONT_SIZE_SMALL = 8
    
    LINE_HEIGHT_TITLE = 18
    LINE_HEIGHT_SECTION = 14
    LINE_HEIGHT_BODY = 12
    LINE_HEIGHT_SMALL = 10
    
    COLOR_BLACK = colors.black
    COLOR_GRAY = colors.grey
    COLOR_LIGHT_GRAY = colors.Color(0.9, 0.9, 0.9)
    
    CHECKBOX_SIZE = 10
    CHECKBOX_SPACING = 15


class PDFHelper:
    """Helper functions for PDF operations."""
    
    @staticmethod
    def draw_checkbox(
        c: canvas.Canvas,
        x: float,
        y: float,
        size: float = PDFConstants.CHECKBOX_SIZE,
        checked: bool = False,
        label: str = ''
    ) -> float:
        """
        Draw a checkbox with optional label.
        
        Args:
            c: ReportLab Canvas
            x: X coordinate
            y: Y coordinate
            size: Checkbox size
            checked: Whether checkbox is checked
            label: Label text next to checkbox
            
        Returns:
            X coordinate after checkbox and label
        """
        logger.debug(f"Drawing checkbox at ({x}, {y}), checked={checked}, label={label}")
        
        c.setStrokeColor(PDFConstants.COLOR_BLACK)
        c.setLineWidth(0.5)
        c.rect(x, y - size, size, size)
        
        if checked:
            c.setFont(PDFConstants.FONT_HEADER, size)
            c.drawString(x + 2, y - size + 2, 'X')
        
        if label:
            c.setFont(PDFConstants.FONT_BODY, PDFConstants.FONT_SIZE_SMALL)
            c.drawString(x + size + 3, y - size + 2, label)
            return x + size + 3 + c.stringWidth(label, PDFConstants.FONT_BODY, PDFConstants.FONT_SIZE_SMALL) + 5
        
        return x + size + 5
    
    @staticmethod
    def draw_inspection_status(
        c: canvas.Canvas,
        x: float,
        y: float,
        status: str
    ) -> float:
        """
        Draw inspection status checkboxes (I/NI/D/NP).
        
        Args:
            c: ReportLab Canvas
            x: X coordinate
            y: Y coordinate
            status: Inspection status ('inspected', 'not_inspected', 'deficient', 'not_present')
            
        Returns:
            X coordinate after all checkboxes
        """
        logger.debug(f"Drawing inspection status: {status} at ({x}, {y})")
        
        status_map = {
            'inspected': 'I',
            'not_inspected': 'NI',
            'deficient': 'D',
            'not_present': 'NP',
            None: 'NP'
        }
        
        current_status = status_map.get(status, 'NP')
        
        labels = ['I', 'NI', 'D', 'NP']
        current_x = x
        
        for label in labels:
            checked = (label == current_status)
            current_x = PDFHelper.draw_checkbox(c, current_x, y, checked=checked, label=label)
            current_x += PDFConstants.CHECKBOX_SPACING
        
        return current_x
    
    @staticmethod
    def wrap_text(
        text: str,
        max_width: float,
        font_name: str,
        font_size: int
    ) -> List[str]:
        """
        Wrap text to fit within max width.
        
        Args:
            text: Text to wrap
            max_width: Maximum width in points
            font_name: Font name
            font_size: Font size
            
        Returns:
            List of wrapped text lines
        """
        from reportlab.pdfbase.pdfmetrics import stringWidth
        
        if not text:
            return []
        
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            width = stringWidth(test_line, font_name, font_size)
            
            if width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        logger.debug(f"Wrapped text into {len(lines)} lines")
        return lines
    
    @staticmethod
    def draw_wrapped_text(
        c: canvas.Canvas,
        text: str,
        x: float,
        y: float,
        max_width: float,
        font_name: str = PDFConstants.FONT_BODY,
        font_size: int = PDFConstants.FONT_SIZE_BODY,
        line_height: int = PDFConstants.LINE_HEIGHT_BODY
    ) -> float:
        """
        Draw wrapped text and return new Y coordinate.
        
        Args:
            c: ReportLab Canvas
            text: Text to draw
            x: X coordinate
            y: Y coordinate (top of text)
            max_width: Maximum width
            font_name: Font name
            font_size: Font size
            line_height: Line height
            
        Returns:
            New Y coordinate after text
        """
        lines = PDFHelper.wrap_text(text, max_width, font_name, font_size)
        
        c.setFont(font_name, font_size)
        current_y = y
        
        for line in lines:
            c.drawString(x, current_y, line)
            current_y -= line_height
        
        return current_y
    
    @staticmethod
    def draw_header(
        c: canvas.Canvas,
        text: str,
        y: float,
        font_size: int = PDFConstants.FONT_SIZE_SECTION,
        underline: bool = True
    ) -> float:
        """
        Draw a section header.
        
        Args:
            c: ReportLab Canvas
            text: Header text
            y: Y coordinate
            font_size: Font size
            underline: Whether to underline
            
        Returns:
            New Y coordinate after header
        """
        logger.debug(f"Drawing header: {text} at y={y}")
        
        c.setFont(PDFConstants.FONT_HEADER, font_size)
        c.drawString(PDFConstants.MARGIN_LEFT, y, text)
        
        if underline:
            text_width = c.stringWidth(text, PDFConstants.FONT_HEADER, font_size)
            c.line(
                PDFConstants.MARGIN_LEFT,
                y - 2,
                PDFConstants.MARGIN_LEFT + text_width,
                y - 2
            )
        
        return y - (font_size + 8)
    
    @staticmethod
    def draw_footer(
        c: canvas.Canvas,
        page_number: int,
        total_pages: int = 0
    ) -> None:
        """
        Draw page footer with page number.
        
        Args:
            c: ReportLab Canvas
            page_number: Current page number
            total_pages: Total pages (0 if unknown)
        """
        c.setFont(PDFConstants.FONT_BODY, PDFConstants.FONT_SIZE_SMALL)
        
        if total_pages > 0:
            footer_text = f"Page {page_number} of {total_pages}"
        else:
            footer_text = f"Page {page_number}"
        
        text_width = c.stringWidth(footer_text, PDFConstants.FONT_BODY, PDFConstants.FONT_SIZE_SMALL)
        x = (PDFConstants.PAGE_WIDTH - text_width) / 2
        y = PDFConstants.MARGIN_BOTTOM / 2
        
        c.drawString(x, y, footer_text)
    
    @staticmethod
    def check_page_break(
        c: canvas.Canvas,
        current_y: float,
        required_space: float,
        page_number: int
    ) -> Tuple[float, int]:
        """
        Check if page break is needed and create new page if necessary.
        
        Args:
            c: ReportLab Canvas
            current_y: Current Y coordinate
            required_space: Required space for next element
            page_number: Current page number
            
        Returns:
            Tuple of (new_y, new_page_number)
        """
        min_y = PDFConstants.MARGIN_BOTTOM + 50
        
        if current_y - required_space < min_y:
            logger.debug(f"Page break needed at y={current_y}, required space={required_space}")
            
            PDFHelper.draw_footer(c, page_number)
            c.showPage()
            
            return PDFConstants.PAGE_HEIGHT - PDFConstants.MARGIN_TOP, page_number + 1
        
        return current_y, page_number
