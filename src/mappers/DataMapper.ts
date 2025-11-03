/**
 * Data Mapper: Transforms inspection.json data to TREC form data
 */

import { InspectionData, LineItem, Photo, Video } from '../types/inspection';
import { TRECFormData, TRECItem } from '../types/trec';
import { DEFAULTS } from '../config/constants';
import { Logger } from '../utils/logger';

export class DataMapper {
  private logger = new Logger('DataMapper');

  constructor(private inspectionData: InspectionData) {}

  /**
   * Extract header metadata for form fields
   */
  public getHeaderData(): Omit<TRECFormData, 'items'> {
    const inspection = this.inspectionData.inspection;
    
    return {
      clientName: inspection.clientInfo.name || '',
      clientEmail: inspection.clientInfo.email || '',
      clientPhone: inspection.clientInfo.phone || '',
      inspectorName: inspection.inspector.name || '',
      inspectorEmail: inspection.inspector.email || '',
      inspectorPhone: inspection.inspector.phone || '',
      inspectorLicense: '', // TODO: Extract from inspector data if available
      sponsorName: '', // TODO: Extract from inspector data if available
      propertyAddress: inspection.address.fullAddress || inspection.address.street || '',
      propertyCity: `${inspection.address.city}, ${inspection.address.state} ${inspection.address.zipcode}`.trim(),
      inspectionDate: this.formatDate(inspection.schedule.date),
    };
  }

  /**
   * Extract all line items from all sections
   */
  public getLineItems(): TRECItem[] {
    const items: TRECItem[] = [];
    const inspection = this.inspectionData.inspection;
    
    if (!inspection.sections) {
      this.logger.warn('No sections found in inspection data');
      return items;
    }

    for (const section of inspection.sections) {
      if (!section.lineItems || section.lineItems.length === 0) {
        this.logger.debug(`Section ${section.name} has no line items, skipping`);
        continue;
      }

      for (const lineItem of section.lineItems) {
        // Extract photos from comments
        const photos: Photo[] = [];
        const videos: Video[] = [];
        
        // Collect photos and videos from comments
        if (lineItem.comments && lineItem.comments.length > 0) {
          for (const comment of lineItem.comments) {
            if (comment.photos && comment.photos.length > 0) {
              photos.push(...comment.photos);
            }
            if (comment.videos && comment.videos.length > 0) {
              videos.push(...comment.videos);
            }
          }
        }

        // Also check media array
        if (lineItem.media && lineItem.media.length > 0) {
          for (const media of lineItem.media) {
            if (media.images) {
              photos.push(...media.images.map(url => ({ url })));
            }
            if (media.videos) {
              videos.push(...media.videos.map(url => ({ url })));
            }
            if (media.photos) {
              photos.push(...media.photos);
            }
          }
        }

        items.push({
          number: lineItem.lineItemNumber,
          title: lineItem.title,
          section: section.name,
          sectionNumber: section.sectionNumber || '',
          status: lineItem.inspectionStatus || DEFAULTS.DEFAULT_STATUS,
          isDeficient: lineItem.isDeficient,
          comments: lineItem.comments ? lineItem.comments.map(c => c.text || c.commentText || '').filter(t => t) : [],
          photos: photos,
          videos: videos,
        });
      }
    }
    
    // Sort by line item number
    items.sort((a, b) => a.number - b.number);
    
    this.logger.info(`Mapped ${items.length} line items from ${inspection.sections.length} sections`);
    
    return items;
  }

  /**
   * Get complete form data
   */
  public getFormData(): TRECFormData {
    this.logger.info('Transforming inspection data to TREC form data...');
    
    const headerData = this.getHeaderData();
    const items = this.getLineItems();
    
    this.logger.success(`Form data ready: ${items.length} items`);
    
    return {
      ...headerData,
      items: items,
    };
  }

  /**
   * Format Unix timestamp to readable date
   */
  private formatDate(timestamp: number): string {
    if (!timestamp || timestamp === 0) {
      return new Date().toLocaleDateString(DEFAULTS.DATE_FORMAT, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const date = new Date(timestamp);
    return date.toLocaleDateString(DEFAULTS.DATE_FORMAT, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get summary statistics
   */
  public getSummary(): {
    totalSections: number;
    totalItems: number;
    inspectedItems: number;
    deficientItems: number;
    itemsWithPhotos: number;
    itemsWithVideos: number;
  } {
    const items = this.getLineItems();
    
    return {
      totalSections: this.inspectionData.inspection.sections?.length || 0,
      totalItems: items.length,
      inspectedItems: items.filter(i => i.status === 'I').length,
      deficientItems: items.filter(i => i.isDeficient || i.status === 'D').length,
      itemsWithPhotos: items.filter(i => i.photos.length > 0).length,
      itemsWithVideos: items.filter(i => i.videos.length > 0).length,
    };
  }
}

