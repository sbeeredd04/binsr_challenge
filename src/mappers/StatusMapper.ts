/**
 * Status Mapper: Intelligent name-based mapping for TREC inspection items
 * Maps inspection.json items to TREC template sections by NAME, not position
 */

import { InspectionStatus } from '../types/inspection';
import { CheckboxField, TRECItem } from '../types/trec';
import { STATUS_TO_CHECKBOX, CHECKBOX_PATTERN, PAGE_CONFIG } from '../config/constants';
import { findTRECSubsection, getCheckboxFieldNameForSubsection } from '../config/sectionMapping';
import { Logger } from '../utils/logger';

export class StatusMapper {
  private static logger = new Logger('StatusMapper');

  /**
   * Get checkbox field name using INTELLIGENT NAME-BASED MAPPING
   * Matches item title/section to TREC template sections by keywords
   */
  public static getCheckboxFieldNameByName(
    item: TRECItem,
    status: InspectionStatus
  ): string | null {
    if (!status) {
      this.logger.debug(`Item "${item.title}": status is null, skipping checkbox`);
      return null;
    }

    // Find matching TREC subsection by name/keywords
    const trecSubsection = findTRECSubsection(item.title, item.section);
    
    if (!trecSubsection) {
      this.logger.warn(`⚠️  No TREC template match for: "${item.title}" (section: ${item.section})`);
      this.logger.warn(`   → This item will be added as content page only (no checkbox)`);
      return null;
    }
    
    this.logger.debug(`✓ Matched "${item.title}" → TREC ${trecSubsection.letter}. ${trecSubsection.name} (index: ${trecSubsection.checkboxIndex})`);
    
    // Get checkbox field name for this TREC subsection
    return getCheckboxFieldNameForSubsection(trecSubsection, status as 'I' | 'NI' | 'NP' | 'D');
  }

  /**
   * LEGACY: Get checkbox field name for a specific item index and status
   * @deprecated Use getCheckboxFieldNameByName() for intelligent mapping
   */
  public static getCheckboxFieldName(
    itemIndex: number, 
    status: InspectionStatus
  ): string | null {
    if (!status) {
      this.logger.debug(`Item ${itemIndex}: status is null, skipping checkbox`);
      return null;
    }

    const checkboxOffset = STATUS_TO_CHECKBOX[status];
    
    if (checkboxOffset === undefined) {
      this.logger.warn(`Item ${itemIndex}: unknown status '${status}', skipping checkbox`);
      return null;
    }
    
    // Calculate which page this item is on (pages 3-6 contain inspection items)
    const page = Math.floor(itemIndex / PAGE_CONFIG.ITEMS_PER_PAGE) + PAGE_CONFIG.FIRST_INSPECTION_PAGE;
    
    // Calculate index within the page
    const indexOnPage = itemIndex % PAGE_CONFIG.ITEMS_PER_PAGE;
    
    // Calculate absolute checkbox index (each item has 4 checkboxes)
    const checkboxIndex = indexOnPage * 4 + checkboxOffset;
    
    const fieldName = `${CHECKBOX_PATTERN.PAGE_PREFIX}${page}${CHECKBOX_PATTERN.CHECKBOX_SUFFIX}[${checkboxIndex}]`;
    
    this.logger.debug(`Item ${itemIndex} (status: ${status}) -> ${fieldName}`);
    
    return fieldName;
  }

  /**
   * Get all checkbox field names for an item (all 4: I, NI, NP, D)
   * Useful for debugging or verification
   */
  public static getAllCheckboxes(itemIndex: number): Record<CheckboxField, string> {
    const page = Math.floor(itemIndex / PAGE_CONFIG.ITEMS_PER_PAGE) + PAGE_CONFIG.FIRST_INSPECTION_PAGE;
    const indexOnPage = itemIndex % PAGE_CONFIG.ITEMS_PER_PAGE;
    const baseIndex = indexOnPage * 4;
    
    return {
      I: `${CHECKBOX_PATTERN.PAGE_PREFIX}${page}${CHECKBOX_PATTERN.CHECKBOX_SUFFIX}[${baseIndex}]`,
      NI: `${CHECKBOX_PATTERN.PAGE_PREFIX}${page}${CHECKBOX_PATTERN.CHECKBOX_SUFFIX}[${baseIndex + 1}]`,
      NP: `${CHECKBOX_PATTERN.PAGE_PREFIX}${page}${CHECKBOX_PATTERN.CHECKBOX_SUFFIX}[${baseIndex + 2}]`,
      D: `${CHECKBOX_PATTERN.PAGE_PREFIX}${page}${CHECKBOX_PATTERN.CHECKBOX_SUFFIX}[${baseIndex + 3}]`,
    };
  }

  /**
   * Validate that item index is within expected range
   */
  public static validateItemIndex(itemIndex: number, totalItems: number): boolean {
    if (itemIndex < 0 || itemIndex >= totalItems) {
      this.logger.error(`Invalid item index: ${itemIndex} (total: ${totalItems})`);
      return false;
    }

    const page = Math.floor(itemIndex / PAGE_CONFIG.ITEMS_PER_PAGE) + PAGE_CONFIG.FIRST_INSPECTION_PAGE;
    
    if (page > PAGE_CONFIG.LAST_INSPECTION_PAGE) {
      this.logger.warn(`Item ${itemIndex} exceeds template pages (calculated page: ${page})`);
      // Don't return false - we'll add pages if needed
    }

    return true;
  }

  /**
   * Get status display name
   */
  public static getStatusDisplayName(status: InspectionStatus): string {
    switch (status) {
      case 'I': return 'Inspected';
      case 'NI': return 'Not Inspected';
      case 'NP': return 'Not Present';
      case 'D': return 'Deficient';
      default: return 'Unknown';
    }
  }
}

