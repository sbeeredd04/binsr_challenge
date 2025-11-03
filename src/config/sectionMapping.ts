/**
 * Section Mapping Configuration
 * Maps inspection.json section names to TREC template sections
 * 
 * TREC Standard Sections:
 * I. STRUCTURAL SYSTEMS (A-L: 12 items)
 * II. ELECTRICAL SYSTEMS (A-B: 2 items)
 * III. HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS (A-C: 3 items)
 * IV. PLUMBING SYSTEMS (A-E: 5 items)
 * V. APPLIANCES (A-H: 8 items)
 * VI. OPTIONAL SYSTEMS (A-F: 6 items)
 * Total: 36 items
 */

export interface TRECSection {
  romanNumeral: string;      // e.g., "I", "II", "III"
  sectionNumber: number;      // e.g., 1, 2, 3
  name: string;               // e.g., "STRUCTURAL SYSTEMS"
  subsections: TRECSubsection[];
}

export interface TRECSubsection {
  letter: string;             // e.g., "A", "B", "C"
  name: string;               // e.g., "Foundations"
  checkboxIndex: number;      // Absolute index in template (0-35)
  keywords: string[];         // Keywords for matching
}

/**
 * TREC Template Structure (Standard REI 7-6 Form)
 * This represents the actual 36 inspection items in the template
 */
export const TREC_TEMPLATE_SECTIONS: TRECSection[] = [
  {
    romanNumeral: "I",
    sectionNumber: 1,
    name: "STRUCTURAL SYSTEMS",
    subsections: [
      { letter: "A", name: "Foundations", checkboxIndex: 0, keywords: ["foundation", "concrete slab", "pier", "beam", "crawl space"] },
      { letter: "B", name: "Grading and Drainage", checkboxIndex: 1, keywords: ["grading", "drainage", "grade", "water drainage", "slope"] },
      { letter: "C", name: "Roof Covering Materials", checkboxIndex: 2, keywords: ["roof covering", "shingle", "tile", "metal roof", "roofing material"] },
      { letter: "D", name: "Roof Structure and Attics", checkboxIndex: 3, keywords: ["roof structure", "attic", "rafter", "truss", "roof framing"] },
      { letter: "E", name: "Walls (Interior and Exterior)", checkboxIndex: 4, keywords: ["wall", "exterior wall", "interior wall", "siding", "stucco"] },
      { letter: "F", name: "Ceilings and Floors", checkboxIndex: 5, keywords: ["ceiling", "floor", "flooring", "ceiling structure"] },
      { letter: "G", name: "Doors (Interior and Exterior)", checkboxIndex: 6, keywords: ["door", "interior door", "exterior door", "entry door"] },
      { letter: "H", name: "Windows", checkboxIndex: 7, keywords: ["window", "glazing", "window frame"] },
      { letter: "I", name: "Stairways (Interior and Exterior)", checkboxIndex: 8, keywords: ["stairway", "stair", "handrail", "railing", "steps"] },
      { letter: "J", name: "Fireplaces and Chimneys", checkboxIndex: 9, keywords: ["fireplace", "chimney", "hearth", "flue"] },
      { letter: "K", name: "Porches, Balconies, Decks, and Carports", checkboxIndex: 10, keywords: ["porch", "balcony", "deck", "carport", "patio"] },
      { letter: "L", name: "Other", checkboxIndex: 11, keywords: ["other structural", "structural other"] },
    ]
  },
  {
    romanNumeral: "II",
    sectionNumber: 2,
    name: "ELECTRICAL SYSTEMS",
    subsections: [
      { letter: "A", name: "Service Entrance and Panels", checkboxIndex: 12, keywords: ["electrical panel", "service entrance", "main panel", "breaker panel", "electrical service"] },
      { letter: "B", name: "Branch Circuits, Connected Devices, and Fixtures", checkboxIndex: 13, keywords: ["electrical outlet", "switch", "light fixture", "branch circuit", "receptacle", "gfci", "afci"] },
    ]
  },
  {
    romanNumeral: "III",
    sectionNumber: 3,
    name: "HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS",
    subsections: [
      { letter: "A", name: "Heating Equipment", checkboxIndex: 14, keywords: ["heating", "furnace", "heater", "hvac heating", "heat pump"] },
      { letter: "B", name: "Cooling Equipment", checkboxIndex: 15, keywords: ["cooling", "air conditioning", "ac unit", "air conditioner", "hvac cooling"] },
      { letter: "C", name: "Duct Systems, Chases, and Vents", checkboxIndex: 16, keywords: ["duct", "vent", "ventilation", "ductwork", "air distribution"] },
    ]
  },
  {
    romanNumeral: "IV",
    sectionNumber: 4,
    name: "PLUMBING SYSTEMS",
    subsections: [
      { letter: "A", name: "Plumbing Supply, Distribution Systems and Fixtures", checkboxIndex: 17, keywords: ["plumbing supply", "water supply", "plumbing fixture", "faucet", "toilet", "sink"] },
      { letter: "B", name: "Drains, Wastes, and Vents", checkboxIndex: 18, keywords: ["drain", "waste", "sewer", "dwv", "plumbing drain"] },
      { letter: "C", name: "Water Heating Equipment", checkboxIndex: 19, keywords: ["water heater", "hot water", "water heating", "tankless"] },
      { letter: "D", name: "Hydro-Massage Therapy Equipment", checkboxIndex: 20, keywords: ["spa", "hot tub", "jacuzzi", "hydro massage", "whirlpool"] },
      { letter: "E", name: "Gas Distribution Systems and Gas Appliances", checkboxIndex: 21, keywords: ["gas line", "gas distribution", "gas appliance", "natural gas", "propane"] },
    ]
  },
  {
    romanNumeral: "V",
    sectionNumber: 5,
    name: "APPLIANCES",
    subsections: [
      { letter: "A", name: "Dishwashers", checkboxIndex: 22, keywords: ["dishwasher"] },
      { letter: "B", name: "Food Waste Disposers", checkboxIndex: 23, keywords: ["disposal", "garbage disposal", "food waste disposer"] },
      { letter: "C", name: "Range Hood and Exhaust Systems", checkboxIndex: 24, keywords: ["range hood", "kitchen exhaust", "vent hood", "exhaust fan"] },
      { letter: "D", name: "Ranges, Cooktops, and Ovens", checkboxIndex: 25, keywords: ["range", "cooktop", "oven", "stove"] },
      { letter: "E", name: "Microwave Ovens", checkboxIndex: 26, keywords: ["microwave"] },
      { letter: "F", name: "Mechanical Exhaust Vents and Bathroom Heaters", checkboxIndex: 27, keywords: ["bathroom fan", "exhaust vent", "bathroom heater", "bathroom exhaust"] },
      { letter: "G", name: "Garage Door Operators", checkboxIndex: 28, keywords: ["garage door opener", "garage door operator", "garage door"] },
      { letter: "H", name: "Dryer Exhaust Systems", checkboxIndex: 29, keywords: ["dryer vent", "dryer exhaust", "laundry vent"] },
    ]
  },
  {
    romanNumeral: "VI",
    sectionNumber: 6,
    name: "OPTIONAL SYSTEMS",
    subsections: [
      { letter: "A", name: "Landscape Irrigation (Sprinkler) Systems", checkboxIndex: 30, keywords: ["sprinkler", "irrigation", "landscape irrigation", "sprinkler system"] },
      { letter: "B", name: "Swimming Pools, Spas, Hot Tubs, and Equipment", checkboxIndex: 31, keywords: ["swimming pool", "pool", "spa equipment", "pool equipment"] },
      { letter: "C", name: "Outbuildings", checkboxIndex: 32, keywords: ["outbuilding", "shed", "detached garage", "barn", "workshop"] },
      { letter: "D", name: "Private Water Wells", checkboxIndex: 33, keywords: ["well", "water well", "private well"] },
      { letter: "E", name: "Private Sewage Disposal (Septic) Systems", checkboxIndex: 34, keywords: ["septic", "sewage disposal", "septic system", "private sewer"] },
      { letter: "F", name: "Other", checkboxIndex: 35, keywords: ["other optional", "optional other"] },
    ]
  }
];

/**
 * Get total number of items in TREC template
 */
export function getTotalTRECItems(): number {
  return TREC_TEMPLATE_SECTIONS.reduce((sum, section) => sum + section.subsections.length, 0);
}

/**
 * Find TREC subsection by name matching (fuzzy match with keywords)
 */
export function findTRECSubsection(itemTitle: string, sectionName: string): TRECSubsection | null {
  const searchText = `${itemTitle} ${sectionName}`.toLowerCase();
  
  for (const section of TREC_TEMPLATE_SECTIONS) {
    for (const subsection of section.subsections) {
      // Exact name match
      if (subsection.name.toLowerCase() === itemTitle.toLowerCase()) {
        return subsection;
      }
      
      // Keyword matching
      for (const keyword of subsection.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return subsection;
        }
      }
    }
  }
  
  return null;
}

/**
 * Find TREC subsection by checkbox index
 */
export function getTRECSubsectionByIndex(checkboxIndex: number): { section: TRECSection; subsection: TRECSubsection } | null {
  for (const section of TREC_TEMPLATE_SECTIONS) {
    for (const subsection of section.subsections) {
      if (subsection.checkboxIndex === checkboxIndex) {
        return { section, subsection };
      }
    }
  }
  return null;
}

/**
 * Get checkbox field name for a TREC subsection
 */
export function getCheckboxFieldNameForSubsection(
  subsection: TRECSubsection,
  status: 'I' | 'NI' | 'NP' | 'D'
): string {
  const statusOffset = {
    'I': 0,
    'NI': 1,
    'NP': 2,
    'D': 3
  }[status];
  
  // Calculate page (pages 3-6, ~12 items per page)
  const page = Math.floor(subsection.checkboxIndex / 12) + 3;
  const indexOnPage = subsection.checkboxIndex % 12;
  const checkboxIndex = indexOnPage * 4 + statusOffset;
  
  return `topmostSubform[0].Page${page}[0].CheckBox1[${checkboxIndex}]`;
}

