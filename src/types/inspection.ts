/**
 * Type definitions for inspection data from inspection.json
 * Reflects the actual structure of the input data
 */

export interface InspectionData {
  inspection: Inspection;
}

export interface Inspection {
  id: string;
  accountID: string;
  status: string;
  schedule: Schedule;
  clientInfo: ClientInfo;
  inspector: Inspector;
  address: Address;
  paymentStatus: string;
  fee: number;
  servicesID: string[];
  templateIDs: string[];
  addonsID: string[];
  agents: Agent[];
  bookingFormData?: any;
  sections: Section[];
  headerImage?: string;
}

export interface Schedule {
  date: number; // Unix timestamp
  startTime: number;
  endTime: number;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  userType: string;
  id: string;
  date: string;
}

export interface Inspector {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountId: string;
  roles: string[];
  createdAt: number;
  updatedAt: number;
  colorHex: string;
  colorId: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  fullAddress: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  propertyInfo: PropertyInfo;
}

export interface PropertyInfo {
  squareFootage: number;
}

export interface Agent {
  id: string;
  agent: AgentDetails;
  source: string;
  addedAt: number;
  addedBy: string;
  isPrimary: boolean;
}

export interface AgentDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: {
    name: string;
  };
}

export interface Section {
  id: string;
  name: string;
  order: number;
  linkedTo: string | null;
  linkedToType: string | null;
  linkedToName: string | null;
  templateId: string;
  lineItems: LineItem[];
  sectionNumber: string;
}

export interface LineItem {
  id: string;
  name: string;
  title: string;
  lineItemNumber: number;
  order: number;
  itemType: string;
  inspectionStatus: InspectionStatus | null;
  isDeficient: boolean;
  linkedTo: string | null;
  linkedToType: string | null;
  linkedToName: string | null;
  comments: Comment[];
  media: Media[];
}

export type InspectionStatus = 
  | 'I'          // Inspected
  | 'NI'         // Not Inspected
  | 'NP'         // Not Present
  | 'D'          // Deficient
  | null;        // Unknown

export interface Comment {
  id: string;
  catalogueCommentId: string | null;
  inspectionId: string;
  lineItemId: string;
  sectionId: string;
  templateId: string | null;
  commentTemplateId: string | null;
  text: string;
  content: string;
  commentText: string;
  label: string;
  type: string;
  order: number;
  inputType: string;
  options: any[];
  selectedOptions: any[];
  recommendation: any;
  defaultValue: any;
  required: boolean;
  value: string;
  isSelected: boolean;
  location: string;
  isFlagged: boolean;
  selectedBy: string;
  photos: Photo[];
  videos: Video[];
  commentNumber: string;
}

export interface Media {
  images?: string[];
  videos?: string[];
  photos?: Photo[];
}

export interface Photo {
  url: string;
  caption?: string;
  id?: string;
  thumbnail?: string;
}

export interface Video {
  url: string;
  caption?: string;
  id?: string;
  thumbnail?: string;
}

