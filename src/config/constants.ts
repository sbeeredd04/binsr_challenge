/**
 * Configuration constants for TREC PDF generation
 * Includes paths, form field mappings, and page configuration
 */

import { InspectionStatus } from '../types/inspection';

export const PATHS = {
  TEMPLATE: 'assets/TREC_Template_Blank.pdf',
  OUTPUT_DIR: 'output',
  INSPECTION_DATA: 'assets/inspection.json',
} as const;

/**
 * TREC form field names for header information
 * These map to the actual field names in TREC_Template_Blank.pdf
 * Note: Inspected via pdf-lib - these are the ACTUAL field names from the template
 */
export const FORM_FIELDS = {
  CLIENT_NAME: 'Name of Client',
  CLIENT_EMAIL: null, // Field does not exist in template
  CLIENT_PHONE: null, // Field does not exist in template
  INSPECTOR_NAME: 'Name of Inspector',
  INSPECTOR_EMAIL: null, // Field does not exist in template
  PROPERTY_ADDRESS: 'Address of Inspected Property',
  PROPERTY_CITY: null, // Field does not exist in template (combined with address)
  INSPECTION_DATE: 'Date of Inspection',
  INSPECTOR_LICENSE: 'TREC License',
  INSPECTOR_LICENSE_2: 'TREC License_2',
  SPONSOR_NAME: 'Name of Sponsor if applicable',
  PAGE_NUMBER: 'Page 2 of',
} as const;

/**
 * Checkbox field naming pattern
 * Pattern: topmostSubform[0].Page{N}[0].CheckBox1[{index}]
 */
export const CHECKBOX_PATTERN = {
  PAGE_PREFIX: 'topmostSubform[0].Page',
  CHECKBOX_SUFFIX: '[0].CheckBox1',
} as const;

/**
 * Maps inspection status to checkbox offset
 * Each item has 4 checkboxes: I=0, NI=1, NP=2, D=3
 */
export const STATUS_TO_CHECKBOX: Record<string, number> = {
  'I': 0,        // Inspected
  'NI': 1,       // Not Inspected
  'NP': 2,       // Not Present
  'D': 3,        // Deficient
};

/**
 * Page configuration for items and images
 * Note: Template has only 144 checkboxes (36 items max)
 * Checkbox distribution: Page3=48, Page4=40, Page5=44, Page6=12 (total 144)
 */
export const PAGE_CONFIG = {
  ITEMS_PER_PAGE: 12,              // Actual items per page (144 checkboxes / 4 / 3 pages ≈ 12)
  MAX_CHECKBOX_ITEMS: 36,          // Maximum items that can have checkboxes (144 / 4)
  FIRST_INSPECTION_PAGE: 3,        // Pages 1-2 are header/disclaimers
  LAST_INSPECTION_PAGE: 6,         // Template has 6 pages
  IMAGE_PAGE_WIDTH: 612,           // Letter size width
  IMAGE_PAGE_HEIGHT: 792,          // Letter size height
  IMAGE_MAX_WIDTH: 500,            // Max image width
  IMAGE_MAX_HEIGHT: 300,           // Max image height per image
  IMAGE_MARGIN: 50,                // Page margin
  IMAGES_PER_PAGE: 2,              // Images per page
} as const;

/**
 * Default values and formatting
 */
export const DEFAULTS = {
  DEFAULT_STATUS: 'I',             // Default to "Inspected" if null
  DATE_FORMAT: 'en-US',           // Date format locale
  FONT_SIZE: {
    HEADER: 14,
    NORMAL: 12,
    SMALL: 10,
    CAPTION: 9,
  },
  COLORS: {
    BLACK: { r: 0, g: 0, b: 0 },
    GRAY: { r: 0.5, g: 0.5, b: 0.5 },
    LIGHT_GRAY: { r: 0.3, g: 0.3, b: 0.3 },
  },
} as const;

/**
 * QR Code configuration
 */
export const QR_CONFIG = {
  WIDTH: 200,
  MARGIN: 1,
  ERROR_CORRECTION_LEVEL: 'M' as const,
} as const;

