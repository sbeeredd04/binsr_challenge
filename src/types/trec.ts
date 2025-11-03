/**
 * Type definitions for TREC form data
 * Represents the transformed data ready for PDF generation
 */

import { InspectionStatus, Photo, Video } from './inspection';

export interface TRECFormData {
  // Header fields - Client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  
  // Header fields - Inspector
  inspectorName: string;
  inspectorEmail: string;
  inspectorPhone: string;
  inspectorLicense: string;
  sponsorName: string;
  
  // Header fields - Property
  propertyAddress: string;
  propertyCity: string;
  inspectionDate: string;
  
  // Inspection items
  items: TRECItem[];
}

export interface TRECItem {
  number: number;
  title: string;
  section: string;
  sectionNumber: string;
  status: InspectionStatus;
  isDeficient: boolean;
  comments: string[];
  photos: Photo[];
  videos: Video[];
}

export type CheckboxField = 'I' | 'NI' | 'NP' | 'D';

export interface FieldMapping {
  fieldName: string;
  value: string;
}

export interface CheckboxMapping {
  fieldName: string;
  status: CheckboxField;
}

