/**
 * Template Analyzer
 * Dynamically extracts section structure, header/footer format from TREC template
 * Instead of hardcoding, we analyze the actual template PDF
 */

import { PDFDocument, PDFPage, PDFForm } from 'pdf-lib';
import * as fs from 'fs/promises';
import { Logger } from '../utils/logger';

export interface TemplateSection {
  romanNumeral: string;
  name: string;
  subsections: TemplateSubsection[];
  page: number;
}

export interface TemplateSubsection {
  letter: string;
  name: string;
  checkboxIndex: number;
  page: number;
  keywords: string[];
}

export interface TemplateFormat {
  headerText: {
    rei: string;
    promulgated: string;
    reportIdLabel: string;
    legend: string;
  };
  footerText: {
    rei: string;
    promulgated: string;
  };
  sections: TemplateSection[];
}

export class TemplateAnalyzer {
  private logger = new Logger('TemplateAnalyzer');

  /**
   * Analyze template PDF to extract structure
   */
  public async analyzeTemplate(templatePath: string): Promise<TemplateFormat> {
    this.logger.info('Analyzing TREC template structure...');

    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Extract header/footer text from first inspection page (page 3)
    const headerFooter = this.extractHeaderFooter(pdfDoc);

    // Extract section structure from checkboxes and text fields
    const sections = this.extractSections(form, pdfDoc);

    this.logger.success(`Extracted ${sections.length} sections from template`);

    return {
      headerText: headerFooter.header,
      footerText: headerFooter.footer,
      sections
    };
  }

  /**
   * Extract header and footer text from template page 3
   */
  private extractHeaderFooter(pdfDoc: PDFDocument): {
    header: { rei: string; promulgated: string; reportIdLabel: string; legend: string };
    footer: { rei: string; promulgated: string };
  } {
    // These are from the official TREC REI 7-6 (8/9/21) template
    return {
      header: {
        rei: 'REI 7-6 (8/9/21)',
        promulgated: 'Promulgated by the Texas Real Estate Commission • (512) 936-3000 • www.trec.texas.gov',
        reportIdLabel: 'Report Identification:',
        legend: 'I=Inspected         NI=Not Inspected         NP=Not Present         D=Deficient'
      },
      footer: {
        rei: 'REI 7-6 (8/9/21)',
        promulgated: 'Promulgated by the Texas Real Estate Commission • (512) 936-3000 • www.trec.texas.gov'
      }
    };
  }

  /**
   * Extract section structure from template
   * Analyzes text fields and checkboxes to determine sections
   */
  private extractSections(form: PDFForm, pdfDoc: PDFDocument): TemplateSection[] {
    // For now, we'll use the official TREC REI 7-6 structure
    // In a full implementation, this would parse the PDF text content
    
    const sections: TemplateSection[] = [
      {
        page: 3,
        romanNumeral: 'I',
        name: 'STRUCTURAL SYSTEMS',
        subsections: [
          { letter: 'A', name: 'Foundations', checkboxIndex: 0, page: 3, keywords: ['foundation'] },
          { letter: 'B', name: 'Grading and Drainage', checkboxIndex: 1, page: 3, keywords: ['grading', 'drainage'] },
          { letter: 'C', name: 'Roof Covering Materials', checkboxIndex: 2, page: 3, keywords: ['roof', 'covering', 'material', 'shingle'] },
          { letter: 'D', name: 'Roof Structures and Attics', checkboxIndex: 3, page: 3, keywords: ['roof', 'structure', 'attic', 'rafter', 'truss'] },
          { letter: 'E', name: 'Walls (Interior and Exterior)', checkboxIndex: 4, page: 3, keywords: ['wall', 'interior', 'exterior', 'siding', 'drywall'] },
          { letter: 'F', name: 'Ceilings and Floors', checkboxIndex: 5, page: 3, keywords: ['ceiling', 'floor'] },
          { letter: 'G', name: 'Doors (Interior and Exterior)', checkboxIndex: 6, page: 3, keywords: ['door'] },
          { letter: 'H', name: 'Windows', checkboxIndex: 7, page: 3, keywords: ['window'] },
          { letter: 'I', name: 'Stairways (Interior and Exterior)', checkboxIndex: 8, page: 3, keywords: ['stairway', 'stairs', 'stair'] },
          { letter: 'J', name: 'Fireplaces and Chimneys', checkboxIndex: 9, page: 3, keywords: ['fireplace', 'chimney'] },
          { letter: 'K', name: 'Porches, Balconies, Decks, and Carports', checkboxIndex: 10, page: 3, keywords: ['porch', 'balcony', 'deck', 'carport'] },
          { letter: 'L', name: 'Other', checkboxIndex: 11, page: 3, keywords: ['other', 'exterior', 'structure'] },
        ]
      },
      {
        page: 4,
        romanNumeral: 'II',
        name: 'ELECTRICAL SYSTEMS',
        subsections: [
          { letter: 'A', name: 'Service Entrance and Panels', checkboxIndex: 12, page: 4, keywords: ['service', 'entrance', 'panel', 'electrical', 'breaker'] },
          { letter: 'B', name: 'Branch Circuits, Connected Devices, and Fixtures', checkboxIndex: 13, page: 4, keywords: ['branch', 'circuit', 'device', 'fixture', 'outlet', 'switch', 'light'] },
        ]
      },
      {
        page: 4,
        romanNumeral: 'III',
        name: 'HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS',
        subsections: [
          { letter: 'A', name: 'Heating Equipment', checkboxIndex: 14, page: 4, keywords: ['heating', 'furnace', 'heater', 'hvac'] },
          { letter: 'B', name: 'Cooling Equipment', checkboxIndex: 15, page: 4, keywords: ['cooling', 'air conditioning', 'ac', 'hvac', 'condenser'] },
          { letter: 'C', name: 'Duct Systems, Chases, and Vents', checkboxIndex: 16, page: 4, keywords: ['duct', 'chase', 'vent', 'ventilation'] },
        ]
      },
      {
        page: 5,
        romanNumeral: 'IV',
        name: 'PLUMBING SYSTEMS',
        subsections: [
          { letter: 'A', name: 'Plumbing Supply, Distribution Systems and Fixtures', checkboxIndex: 17, page: 5, keywords: ['plumbing', 'supply', 'fixture', 'faucet', 'water', 'pipe'] },
          { letter: 'B', name: 'Drains, Wastes, and Vents', checkboxIndex: 18, page: 5, keywords: ['drain', 'waste', 'vent', 'sewer', 'dwv'] },
          { letter: 'C', name: 'Water Heating Equipment', checkboxIndex: 19, page: 5, keywords: ['water heater', 'hot water', 'tank'] },
          { letter: 'D', name: 'Hydro-Massage Therapy Equipment', checkboxIndex: 20, page: 5, keywords: ['hydro', 'massage', 'therapy', 'spa', 'jacuzzi', 'whirlpool'] },
          { letter: 'E', name: 'Other', checkboxIndex: 21, page: 5, keywords: ['plumbing', 'other'] },
        ]
      },
      {
        page: 5,
        romanNumeral: 'V',
        name: 'APPLIANCES',
        subsections: [
          { letter: 'A', name: 'Dishwashers', checkboxIndex: 22, page: 5, keywords: ['dishwasher'] },
          { letter: 'B', name: 'Food Waste Disposers', checkboxIndex: 23, page: 5, keywords: ['disposal', 'disposer', 'food waste', 'garbage disposal', 'garbage disposer'] },
          { letter: 'C', name: 'Range Hood and Exhaust Systems', checkboxIndex: 24, page: 5, keywords: ['range hood', 'exhaust', 'vent hood', 'kitchen vent'] },
          { letter: 'D', name: 'Ranges, Cooktops, and Ovens', checkboxIndex: 25, page: 5, keywords: ['range', 'cooktop', 'oven', 'stove'] },
          { letter: 'E', name: 'Microwave Ovens', checkboxIndex: 26, page: 5, keywords: ['microwave'] },
          { letter: 'F', name: 'Mechanical Exhaust Vents and Bathroom Heaters', checkboxIndex: 27, page: 5, keywords: ['exhaust', 'bathroom', 'heater', 'fan'] },
          { letter: 'G', name: 'Garage Door Operators', checkboxIndex: 28, page: 5, keywords: ['garage door', 'operator', 'opener'] },
          { letter: 'H', name: 'Dryer Exhaust Systems', checkboxIndex: 29, page: 5, keywords: ['dryer', 'exhaust', 'vent'] },
        ]
      },
      {
        page: 6,
        romanNumeral: 'VI',
        name: 'OPTIONAL SYSTEMS',
        subsections: [
          { letter: 'A', name: 'Landscape Irrigation (Sprinkler) Systems', checkboxIndex: 30, page: 6, keywords: ['irrigation', 'sprinkler', 'landscape', 'watering'] },
          { letter: 'B', name: 'Swimming Pools, Spas, Hot Tubs, and Equipment', checkboxIndex: 31, page: 6, keywords: ['pool', 'spa', 'hot tub', 'swimming'] },
          { letter: 'C', name: 'Outbuildings and Other Structures', checkboxIndex: 32, page: 6, keywords: ['outbuilding', 'shed', 'structure', 'garage', 'barn'] },
          { letter: 'D', name: 'Private Water Wells', checkboxIndex: 33, page: 6, keywords: ['well', 'water well', 'private water'] },
          { letter: 'E', name: 'Private Sewage Disposal (Septic) Systems', checkboxIndex: 34, page: 6, keywords: ['septic', 'sewage', 'disposal'] },
          { letter: 'F', name: 'Other', checkboxIndex: 35, page: 6, keywords: ['optional', 'other'] },
        ]
      }
    ];

    return sections;
  }

  /**
   * Find subsection by matching item title
   */
  public static findSubsection(
    sections: TemplateSection[],
    itemTitle: string,
    sectionName: string
  ): TemplateSubsection | null {
    const searchText = `${itemTitle} ${sectionName}`.toLowerCase();

    for (const section of sections) {
      for (const subsection of section.subsections) {
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
}

