'use client';

import { useState, useEffect } from 'react';
import { X, Car, Upload, Save } from 'lucide-react';

// Car makes options
const CAR_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 
  'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volvo',
  'Tesla', 'Jeep', 'GMC', 'Ram', 'Dodge', 'Chrysler', 'Lexus', 'Infiniti',
  'Acura', 'Cadillac', 'Lincoln', 'Buick', 'Porsche', 'Jaguar', 'Land Rover',
  'Genesis', 'Mini', 'Fiat', 'Alfa Romeo', 'Mitsubishi', 'Suzuki', 'Other'
];

// Car models (popular models across makes) - removing duplicates
const CAR_MODELS = [
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

// Remove duplicates (in case any slip through)
const UNIQUE_CAR_MODELS = [...new Set(CAR_MODELS)];

// Generate years from 2000 to current year + 1
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2000; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years.reverse(); // Most recent first
};

// Popular locations (major cities in Morocco)
const LOCATIONS = [
  'Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier', 'Agadir', 'Meknes',
  'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'Mohammedia', 'El Jadida', 'Nador',
  'Settat', 'Beni Mellal', 'Khouribga', 'Taza', 'Larache', 'Ksar El Kebir',
  'Taroudant', 'Errachidia', 'Guelmim', 'Khemisset', 'Berrechid', 'Tifelt',
  'Chefchaouen', 'Al Hoceima', 'Ouarzazate', 'Taourirt', 'Dakhla', 'Laayoune',
  'Azrou', 'Ifrane', 'Essaouira', 'Oualidia', 'Asilah', 'Tarfaya', 'Zagora',
  'Tinghir', 'Midelt', 'Khenifra', 'Azemmour', 'Aguelmous',
  'Other'
];

export default function AddVehicleModal({ 
  showModal, 
  setShowModal, 
  vehicleData = {}, 
  setVehicleData = () => {},
  onSubmit 
}) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    price_per_day: '',
    location: '',
    description: '',
    features: [],
    fuel_type: 'gasoline',
    transmission: 'automatic',
    seating_capacity: '',
    vehicle_condition: 'excellent',
    pictures: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicleData && Object.keys(vehicleData).length > 0) {
      setFormData({
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        year: vehicleData.year || '',
        price_per_day: vehicleData.price_per_day || '',
        location: vehicleData.location || '',
        description: vehicleData.description || vehicleData.vehicle_description || '',
        features: vehicleData.features || [],
        fuel_type: vehicleData.fuel_type || 'gasoline',
        transmission: vehicleData.transmission || 'automatic',
        seating_capacity: vehicleData.seating_capacity || vehicleData.seats || '',
        vehicle_condition: vehicleData.vehicle_condition || 'excellent',
        pictures: vehicleData.pictures || []
      });
    }
  }, [vehicleData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      pictures: [...prev.pictures, ...files]
    }));
  };

  const removePicture = (index) => {
    setFormData(prev => ({
      ...prev,
      pictures: prev.pictures.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required';
    }
    if (!formData.price_per_day || formData.price_per_day <= 0) {
      newErrors.price_per_day = 'Valid daily rate is required';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.fuel_type) newErrors.fuel_type = 'Fuel type is required';
    if (!formData.transmission) newErrors.transmission = 'Transmission is required';
    if (!formData.seating_capacity || formData.seating_capacity < 2 || formData.seating_capacity > 8) {
      newErrors.seating_capacity = 'Valid seating capacity (2-8) is required';
    }
    if (!formData.vehicle_condition) newErrors.vehicle_condition = 'Vehicle condition is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Parse numeric values and handle empty strings
      const yearValue = formData.year ? parseInt(formData.year, 10) : null;
      const priceValue = formData.price_per_day ? parseFloat(formData.price_per_day) : null;
      const seatingValue = formData.seating_capacity ? parseInt(formData.seating_capacity, 10) : null;
      
      // Validate parsed values
      if (isNaN(yearValue) || yearValue < 1900 || yearValue > new Date().getFullYear() + 1) {
        setErrors({ year: 'Please select a valid year' });
        setLoading(false);
        return;
      }
      
      if (isNaN(priceValue) || priceValue <= 0) {
        setErrors({ price_per_day: 'Please enter a valid price' });
        setLoading(false);
        return;
      }
      
      if (isNaN(seatingValue) || seatingValue < 2 || seatingValue > 8) {
        setErrors({ seating_capacity: 'Please select a valid seating capacity' });
        setLoading(false);
        return;
      }
      
      // Prepare data in the format expected by backend
      const vehicleData = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: yearValue,
        location: formData.location.trim(),
        price_per_day: priceValue,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        seating_capacity: seatingValue,
        vehicle_condition: formData.vehicle_condition,
        vehicle_description: formData.description?.trim() || '',
        features: formData.features || [],
      };

      // Validate all required fields are present
      const requiredFields = {
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        location: vehicleData.location,
        price_per_day: vehicleData.price_per_day,
        fuel_type: vehicleData.fuel_type,
        transmission: vehicleData.transmission,
        seating_capacity: vehicleData.seating_capacity,
        vehicle_condition: vehicleData.vehicle_condition,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value && value !== 0)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        const newErrors = {};
        missingFields.forEach(field => {
          newErrors[field] = `${field.replace('_', ' ')} is required`;
        });
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Final validation - ensure all required fields have valid values
      console.log('📦 Prepared vehicle data before sending:', vehicleData);
      
      // Create FormData if there are pictures to upload
      let dataToSend;
      const pictureFiles = formData.pictures.filter(p => p instanceof File);
      
      if (pictureFiles.length > 0) {
        // Use FormData for file uploads
        console.log('📎 Using FormData (files detected)');
        dataToSend = new FormData();
        
        // Append all text fields - ensure numeric values are converted to strings for FormData
        Object.keys(vehicleData).forEach(key => {
          const value = vehicleData[key];
          // Handle different value types
          if (value !== null && value !== undefined) {
            if (key === 'features' && Array.isArray(value)) {
              // For features array, convert to JSON string for FormData
              // The backend JSONField expects a JSON string, not individual form entries
              if (value.length > 0) {
                // Filter out empty items and convert to JSON string
                const validFeatures = value.filter(item => item && String(item).trim() !== '');
                dataToSend.append(key, JSON.stringify(validFeatures));
              } else {
                // Send empty array as JSON string
                dataToSend.append(key, JSON.stringify([]));
              }
            } else if (Array.isArray(value)) {
              // For other arrays, convert to JSON string
              dataToSend.append(key, JSON.stringify(value));
            } else if (value !== '') {
              // Convert numeric values to strings for FormData
              const formValue = typeof value === 'number' ? String(value) : String(value);
              dataToSend.append(key, formValue);
            }
            // Skip empty strings, null, undefined
          }
        });
        
        // Append picture files
        pictureFiles.forEach((file) => {
          dataToSend.append('pictures', file);
        });
        
        // Debug: Log FormData contents
        console.log('📋 FormData contents:');
        for (let pair of dataToSend.entries()) {
          const value = pair[1];
          if (value instanceof File) {
            console.log(`  ${pair[0]}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`  ${pair[0]}: "${value}" (type: ${typeof value})`);
          }
        }
      } else {
        // Use JSON if no files - ensure proper data types
        console.log('📄 Using JSON (no files)');
        dataToSend = vehicleData;
      }
      
      console.log('🚀 Sending vehicle data:', dataToSend instanceof FormData ? 'FormData (see above)' : JSON.stringify(dataToSend, null, 2));
      await onSubmit(dataToSend);
      
      // Reset form after successful submission
      setFormData({
        make: '',
        model: '',
        year: '',
        price_per_day: '',
        location: '',
        description: '',
        features: [],
        fuel_type: 'gasoline',
        transmission: 'automatic',
        seating_capacity: '',
        vehicle_condition: 'excellent',
        pictures: []
      });
      setErrors({});
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ ERROR SUBMITTING VEHICLE');
      console.error('═══════════════════════════════════════════════════════');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error?.status);
      console.error('Error data:', error?.data);
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('═══════════════════════════════════════════════════════');
      
      // Parse Django REST Framework validation errors
      const errorData = error?.data || {};
      const newErrors = {};
      
      console.error('\n📋 Backend error response (formatted):');
      console.error(JSON.stringify(errorData, null, 2));
      console.error('\n');
      
      // Check for field-specific validation errors (DRF format)
      Object.keys(errorData).forEach(key => {
        if (key !== 'detail' && key !== 'error' && key !== 'message') {
          const fieldError = Array.isArray(errorData[key]) 
            ? errorData[key].join(', ') 
            : String(errorData[key]);
          
          // Map backend field names to frontend field names
          const frontendFieldName = key === 'vehicle_description' ? 'description' : key;
          newErrors[frontendFieldName] = fieldError;
        }
      });
      
      // If there are field-specific errors, use them
      if (Object.keys(newErrors).length > 0) {
        console.error('Field-specific errors:', newErrors);
        setErrors(newErrors);
        // Also show a general error message
        const errorMessages = Object.values(newErrors).join('; ');
        alert(`Please fix the following errors:\n${errorMessages}`);
      } else {
        // Otherwise show general error message with more details
        let errorMessage = error.message || 'Failed to save vehicle. Please check all required fields and try again.';
        
        // Try to extract more details from error data
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
          // Show first error found
          const firstKey = Object.keys(errorData)[0];
          const firstError = errorData[firstKey];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
        
        setErrors({ submit: errorMessage });
        alert(`Error: ${errorMessage}\n\nCheck the browser console for more details.`);
        
        // Also log the full error for debugging
        console.error('Full error response:', errorData);
      }
    } finally {
      setLoading(false);
    }
  };

  const availableFeatures = [
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

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Car className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {Object.keys(vehicleData).length > 0 ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <select
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.make ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Make</option>
                {CAR_MAKES.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
              {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <select
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.model ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Model</option>
                {UNIQUE_CAR_MODELS.map((model, index) => (
                  <option key={`${model}-${index}`} value={model}>{model}</option>
                ))}
              </select>
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Year</option>
                {generateYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>
          </div>

          {/* Pricing & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Rate ($) *
              </label>
              <input
                type="number"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price_per_day ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 50"
              />
              {errors.price_per_day && <p className="text-red-500 text-xs mt-1">{errors.price_per_day}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Location</option>
                {LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transmission
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seating Capacity *
              </label>
              <select
                name="seating_capacity"
                value={formData.seating_capacity}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.seating_capacity ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Seating Capacity</option>
                {[2, 3, 4, 5, 6, 7, 8].map(seats => (
                  <option key={seats} value={seats}>
                    {seats} {seats === 1 ? 'Seat' : 'Seats'}
                  </option>
                ))}
              </select>
              {errors.seating_capacity && <p className="text-red-500 text-xs mt-1">{errors.seating_capacity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Condition *
              </label>
              <select
                name="vehicle_condition"
                value={formData.vehicle_condition}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.vehicle_condition ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              {errors.vehicle_condition && <p className="text-red-500 text-xs mt-1">{errors.vehicle_condition}</p>}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your vehicle..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description?.length || 0}/500 characters
            </p>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="vehicle-photos"
              />
              <label
                htmlFor="vehicle-photos"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload photos</span>
              </label>
            </div>
            
            {formData.pictures.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.pictures.map((picture, index) => (
                  <div key={index} className="relative">
                    <img
                      src={typeof picture === 'string' ? picture : URL.createObjectURL(picture)}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePicture(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Vehicle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}