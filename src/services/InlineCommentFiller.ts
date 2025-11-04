/**
 * Inline Comment Filler
 * Fills comments directly into the template's text fields on pages 3-6
 * Each page has 2 text fields meant for comments
 */

import { PDFForm, PDFTextField } from 'pdf-lib';
import { TRECItem } from '../types/trec';
import { Logger } from '../utils/logger';
import { findTRECSubsection, getCommentFieldName, TREC_TEMPLATE_SECTIONS } from '../config/sectionMapping';

export class InlineCommentFiller {
  private logger = new Logger('InlineCommentFiller');

  constructor(private form: PDFForm) {}

  /**
   * Fill comment fields on template pages (3-6)
   * Groups items by page and fills the 2 text fields per page
   */
  public fillCommentFields(items: TRECItem[]): void {
    this.logger.info('\nFilling inline comment fields on template pages...');

    // Group items by page based on TREC mapping
    const itemsByPage = this.groupItemsByPage(items);

    let filledCount = 0;
    let overflowCount = 0;

    // Fill comments for each page
    for (const [page, pageItems] of itemsByPage.entries()) {
      const result = this.fillPageComments(page, pageItems);
      filledCount += result.filled;
      overflowCount += result.overflow;
    }

    this.logger.info(`Comment fields: ${filledCount} filled, ${overflowCount} items need additional pages`);
  }

  /**
   * Group items by template page number
   */
  private groupItemsByPage(items: TRECItem[]): Map<number, TRECItem[]> {
    const pageItems = new Map<number, TRECItem[]>();

    for (const item of items) {
      // Skip items with no comments
      if (!item.comments || item.comments.length === 0) {
        continue;
      }

      // Find TREC match
      const subsection = findTRECSubsection(item.title, item.section);
      if (!subsection) {
        continue; // Item doesn't match template, will be handled separately
      }

      const page = subsection.page;
      if (!pageItems.has(page)) {
        pageItems.set(page, []);
      }
      pageItems.get(page)!.push(item);
    }

    return pageItems;
  }

  /**
   * Fill comments for a single page
   * Each page has 2 text fields: TextField1 and TextField2
   */
  private fillPageComments(page: number, items: TRECItem[]): { filled: number; overflow: number } {
    let filled = 0;
    let overflow = 0;

    // Collect all comments for this page
    const allComments: Array<{ item: TRECItem; comment: string }> = [];
    
    for (const item of items) {
      for (const comment of item.comments) {
        allComments.push({ item, comment });
      }
    }

    // Try to fit comments into the 2 text fields
    const field1Comments: string[] = [];
    const field2Comments: string[] = [];
    let currentField = 1;
    const maxCharsPerField = 1000; // Approximate limit

    for (const { item, comment } of allComments) {
      const formattedComment = `${item.title}: ${comment}\n\n`;
      
      if (currentField === 1) {
        const currentLength = field1Comments.join('').length;
        if (currentLength + formattedComment.length < maxCharsPerField) {
          field1Comments.push(formattedComment);
          filled++;
        } else {
          currentField = 2;
        }
      }
      
      if (currentField === 2) {
        const currentLength = field2Comments.join('').length;
        if (currentLength + formattedComment.length < maxCharsPerField) {
          field2Comments.push(formattedComment);
          filled++;
        } else {
          // Overflow - needs additional page
          overflow++;
        }
      }
    }

    // Fill TextField1
    if (field1Comments.length > 0) {
      try {
        const fieldName = getCommentFieldName(page, 1);
        const field = this.form.getTextField(fieldName);
        field.setText(field1Comments.join(''));
        this.logger.debug(`✓ Filled ${fieldName} with ${field1Comments.length} comments`);
      } catch (error) {
        this.logger.warn(`✗ Could not fill TextField1 on page ${page}`);
      }
    }

    // Fill TextField2
    if (field2Comments.length > 0) {
      try {
        const fieldName = getCommentFieldName(page, 2);
        const field = this.form.getTextField(fieldName);
        field.setText(field2Comments.join(''));
        this.logger.debug(`✓ Filled ${fieldName} with ${field2Comments.length} comments`);
      } catch (error) {
        this.logger.warn(`✗ Could not fill TextField2 on page ${page}`);
      }
    }

    return { filled, overflow };
  }
}

