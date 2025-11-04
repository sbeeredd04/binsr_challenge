/**
 * TREC Template Section Mapping
 * Maps inspection items to TREC template sections by name matching
 * 
 * Template Structure:
 * - Page 3: Section I (Structural Systems) - Items A-L (12 items)
 * - Page 4: Sections II-III - Items A-B, A-C (5 items)  
 * - Page 5: Sections IV-V - Items A-E, A-H (13 items)
 * - Page 6: Section VI - Items A-F (6 items)
 * Total: 36 checkbox items
 */

import { TRECItem } from '../types/trec';

export interface TRECSection {
  page: number;              // Template page number (3-6)
  romanNumeral: string;      // I, II, III, IV, V, VI
  name: string;              // Section name
  subsections: TRECSubsection[];
}

export interface TRECSubsection {
  letter: string;            // A, B, C, etc.
  name: string;              // Subsection name (e.g., "Foundations")
  checkboxIndex: number;     // Position in template (0-35)
  page: number;              // Template page (3-6)
  keywords: string[];        // Keywords for matching
}

/**
 * TREC Template Sections (as they appear in the official template)
 */
export const TREC_TEMPLATE_SECTIONS: TRECSection[] = [
  {
    page: 3,
    romanNumeral: 'I',
    name: 'STRUCTURAL SYSTEMS',
    subsections: [
      { letter: 'A', name: 'Foundations', checkboxIndex: 0, page: 3, keywords: ['foundation'] },
      { letter: 'B', name: 'Grading and Drainage', checkboxIndex: 1, page: 3, keywords: ['grading', 'drainage'] },
      { letter: 'C', name: 'Roof Covering Materials', checkboxIndex: 2, page: 3, keywords: ['roof', 'covering', 'material'] },
      { letter: 'D', name: 'Roof Structures and Attics', checkboxIndex: 3, page: 3, keywords: ['roof', 'structure', 'attic'] },
      { letter: 'E', name: 'Walls (Interior and Exterior)', checkboxIndex: 4, page: 3, keywords: ['wall', 'interior', 'exterior'] },
      { letter: 'F', name: 'Ceilings and Floors', checkboxIndex: 5, page: 3, keywords: ['ceiling', 'floor'] },
      { letter: 'G', name: 'Doors (Interior and Exterior)', checkboxIndex: 6, page: 3, keywords: ['door', 'interior', 'exterior'] },
      { letter: 'H', name: 'Windows', checkboxIndex: 7, page: 3, keywords: ['window'] },
      { letter: 'I', name: 'Stairways (Interior and Exterior)', checkboxIndex: 8, page: 3, keywords: ['stairway', 'stairs'] },
      { letter: 'J', name: 'Fireplaces and Chimneys', checkboxIndex: 9, page: 3, keywords: ['fireplace', 'chimney'] },
      { letter: 'K', name: 'Porches, Balconies, Decks, and Carports', checkboxIndex: 10, page: 3, keywords: ['porch', 'balcony', 'deck', 'carport'] },
      { letter: 'L', name: 'Other', checkboxIndex: 11, page: 3, keywords: ['other', 'exterior'] },
    ]
  },
  {
    page: 4,
    romanNumeral: 'II',
    name: 'ELECTRICAL SYSTEMS',
    subsections: [
      { letter: 'A', name: 'Service Entrance and Panels', checkboxIndex: 12, page: 4, keywords: ['service', 'entrance', 'panel', 'electrical'] },
      { letter: 'B', name: 'Branch Circuits, Connected Devices, and Fixtures', checkboxIndex: 13, page: 4, keywords: ['branch', 'circuit', 'device', 'fixture', 'outlet', 'switch'] },
    ]
  },
  {
    page: 4,
    romanNumeral: 'III',
    name: 'HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS',
    subsections: [
      { letter: 'A', name: 'Heating Equipment', checkboxIndex: 14, page: 4, keywords: ['heating', 'hvac', 'furnace'] },
      { letter: 'B', name: 'Cooling Equipment', checkboxIndex: 15, page: 4, keywords: ['cooling', 'air conditioning', 'ac', 'hvac'] },
      { letter: 'C', name: 'Duct Systems, Chases, and Vents', checkboxIndex: 16, page: 4, keywords: ['duct', 'chase', 'vent'] },
    ]
  },
  {
    page: 5,
    romanNumeral: 'IV',
    name: 'PLUMBING SYSTEMS',
    subsections: [
      { letter: 'A', name: 'Plumbing Supply, Distribution Systems and Fixtures', checkboxIndex: 17, page: 5, keywords: ['plumbing', 'supply', 'fixture', 'faucet', 'water'] },
      { letter: 'B', name: 'Drains, Wastes, and Vents', checkboxIndex: 18, page: 5, keywords: ['drain', 'waste', 'vent', 'sewer'] },
      { letter: 'C', name: 'Water Heating Equipment', checkboxIndex: 19, page: 5, keywords: ['water heater', 'hot water'] },
      { letter: 'D', name: 'Hydro-Massage Therapy Equipment', checkboxIndex: 20, page: 5, keywords: ['hydro', 'massage', 'therapy', 'spa', 'jacuzzi'] },
      { letter: 'E', name: 'Other', checkboxIndex: 21, page: 5, keywords: ['plumbing', 'other'] },
    ]
  },
  {
    page: 5,
    romanNumeral: 'V',
    name: 'APPLIANCES',
    subsections: [
      { letter: 'A', name: 'Dishwashers', checkboxIndex: 22, page: 5, keywords: ['dishwasher'] },
      { letter: 'B', name: 'Food Waste Disposers', checkboxIndex: 23, page: 5, keywords: ['disposal', 'disposer', 'food waste', 'garbage disposal'] },
      { letter: 'C', name: 'Range Hood and Exhaust Systems', checkboxIndex: 24, page: 5, keywords: ['range hood', 'exhaust', 'vent hood', 'kitchen ventilation'] },
      { letter: 'D', name: 'Ranges, Cooktops, and Ovens', checkboxIndex: 25, page: 5, keywords: ['range', 'cooktop', 'oven', 'stove'] },
      { letter: 'E', name: 'Microwave Ovens', checkboxIndex: 26, page: 5, keywords: ['microwave'] },
      { letter: 'F', name: 'Mechanical Exhaust Vents and Bathroom Heaters', checkboxIndex: 27, page: 5, keywords: ['exhaust', 'bathroom', 'heater'] },
      { letter: 'G', name: 'Garage Door Operators', checkboxIndex: 28, page: 5, keywords: ['garage door', 'operator'] },
      { letter: 'H', name: 'Dryer Exhaust Systems', checkboxIndex: 29, page: 5, keywords: ['dryer', 'exhaust'] },
    ]
  },
  {
    page: 6,
    romanNumeral: 'VI',
    name: 'OPTIONAL SYSTEMS',
    subsections: [
      { letter: 'A', name: 'Landscape Irrigation (Sprinkler) Systems', checkboxIndex: 30, page: 6, keywords: ['irrigation', 'sprinkler', 'landscape'] },
      { letter: 'B', name: 'Swimming Pools, Spas, Hot Tubs, and Equipment', checkboxIndex: 31, page: 6, keywords: ['pool', 'spa', 'hot tub'] },
      { letter: 'C', name: 'Outbuildings and Other Structures', checkboxIndex: 32, page: 6, keywords: ['outbuilding', 'shed', 'structure'] },
      { letter: 'D', name: 'Private Water Wells', checkboxIndex: 33, page: 6, keywords: ['well', 'water well'] },
      { letter: 'E', name: 'Private Sewage Disposal (Septic) Systems', checkboxIndex: 34, page: 6, keywords: ['septic', 'sewage'] },
      { letter: 'F', name: 'Other', checkboxIndex: 35, page: 6, keywords: ['optional', 'other'] },
    ]
  }
];

/**
 * Find TREC subsection by matching item title and section name
 */
export function findTRECSubsection(itemTitle: string, sectionName: string): TRECSubsection | null {
  const searchText = `${itemTitle} ${sectionName}`.toLowerCase();
  
  for (const section of TREC_TEMPLATE_SECTIONS) {
    for (const subsection of section.subsections) {
      // Check if any keyword matches
      const matches = subsection.keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
      
      if (matches) {
        return subsection;
      }
    }
  }
  
  return null;
}

/**
 * Get checkbox field name for a TREC subsection and status
 */
export function getCheckboxFieldNameForSubsection(
  subsection: TRECSubsection,
  status: 'I' | 'NI' | 'NP' | 'D'
): string {
  const statusOffsets = { 'I': 0, 'NI': 1, 'NP': 2, 'D': 3 };
  const baseIndex = subsection.checkboxIndex * 4;
  const checkboxIndex = baseIndex + statusOffsets[status];
  
  return `topmostSubform[0].Page${subsection.page}[0].CheckBox1[${checkboxIndex}]`;
}

/**
 * Get comment text field name for a page
 * Pages 3-6 each have 2 text fields for comments
 */
export function getCommentFieldName(page: number, fieldIndex: 1 | 2): string {
  return `topmostSubform[0].Page${page}[0].TextField${fieldIndex}[0]`;
}

/**
 * Map items to TREC template positions
 */
export function mapItemsToTemplate(items: TRECItem[]): Map<number, TRECItem[]> {
  const pageItems = new Map<number, TRECItem[]>();
  
  for (const item of items) {
    const subsection = findTRECSubsection(item.title, item.section);
    if (subsection) {
      const page = subsection.page;
      if (!pageItems.has(page)) {
        pageItems.set(page, []);
      }
      pageItems.get(page)!.push(item);
    }
  }
  
  return pageItems;
}
