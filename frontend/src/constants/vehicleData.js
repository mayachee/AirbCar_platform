// Vehicle data constants
export const CAR_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 
  'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volvo',
  'Tesla', 'Jeep', 'GMC', 'Ram', 'Dodge', 'Chrysler', 'Lexus', 'Infiniti',
  'Acura', 'Cadillac', 'Lincoln', 'Buick', 'Porsche', 'Jaguar', 'Land Rover',
  'Genesis', 'Mini', 'Fiat', 'Alfa Romeo', 'Mitsubishi', 'Suzuki', 'Other'
];

export const CAR_MODELS = [
  // Toyota
  'Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', '4Runner', 'Tacoma', 'Tundra',
  // Honda
  'Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Ridgeline',
  // Ford
  'F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Ranger',
  // Chevrolet
  'Silverado', 'Equinox', 'Tahoe', 'Malibu', 'Traverse', 'Suburban', 'Camaro',
  // BMW
  '3 Series', '5 Series', 'X3', 'X5', 'X1', '7 Series', 'X7',
  // Mercedes-Benz
  'C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class',
  // Audi
  'A4', 'A6', 'Q5', 'Q7', 'Q3', 'A3', 'A8',
  // Tesla
  'Model 3', 'Model S', 'Model Y', 'Model X',
  // Jeep
  'Wrangler', 'Grand Cherokee', 'Cherokee', 'Renegade', 'Compass',
  // Mazda
  'CX-5', 'CX-9', 'CX-3', 'Mazda3', 'Mazda6',
  // Subaru
  'Outback', 'Forester', 'Crosstrek', 'Ascent', 'Legacy',
  // Nissan
  'Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Murano', 'Maxima',
  // Hyundai
  'Sonata', 'Elantra', 'Tucson', 'Santa Fe', 'Palisade',
  // Kia
  'Soul', 'Optima', 'Telluride', 'Sportage', 'Sorento', 'Forte',
  // Other
  'Other'
];

// Remove duplicates
export const UNIQUE_CAR_MODELS = [...new Set(CAR_MODELS)];

// Generate years from 2000 to current year + 1
export const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2000; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years.reverse(); // Most recent first
};

// Popular locations (major cities in Morocco)
export const LOCATIONS = [
  'Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier', 'Agadir', 'Meknes',
  'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'Mohammedia', 'El Jadida', 'Nador',
  'Settat', 'Beni Mellal', 'Khouribga', 'Taza', 'Larache', 'Ksar El Kebir',
  'Taroudant', 'Errachidia', 'Guelmim', 'Khemisset', 'Berrechid', 'Tifelt',
  'Chefchaouen', 'Al Hoceima', 'Ouarzazate', 'Taourirt', 'Dakhla', 'Laayoune',
  'Azrou', 'Ifrane', 'Essaouira', 'Oualidia', 'Asilah', 'Tarfaya', 'Zagora',
  'Tinghir', 'Midelt', 'Khenifra', 'Azemmour', 'Aguelmous',
  'Other'
];

export const AVAILABLE_FEATURES = [
  'GPS Navigation',
  'Bluetooth',
  'Air Conditioning',
  'Heated Seats',
  'Sunroof',
  'Backup Camera',
  'USB Ports',
  'Leather Seats',
  'Cruise Control',
  'Keyless Entry'
];
