'use client';

import { useState, useEffect } from 'react';
import { X, Car, Upload, Save } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';
import { apiClient } from '@/lib/api/client';

import { 
  CAR_MAKES, 
  UNIQUE_CAR_MODELS, 
  generateYears, 
  LOCATIONS, 
  AVAILABLE_FEATURES 
} from '@/constants/vehicleData';

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
    security_deposit: '5000',
    location: '',
    description: '',
    features: [],
    fuel_type: 'diesel',
    transmission: 'automatic',
    seating_capacity: '',
    vehicle_style: 'sedan',
    color: 'White',
    pictures: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkCount, setBulkCount] = useState(3);

  // Initialize form when vehicleData changes or modal opens
  useEffect(() => {
    // If modal is closed, don't continuously reset/edit to avoid performance issues
    if (!showModal) return;

    // Reset UI states whenever modal opens
    setErrors({});
    setLoading(false);
    setBulkMode(false);

    if (vehicleData?.id) {
      // Edit Mode: Populate form with vehicle data
      
      // Handle images - convert from backend format
      let existingImages = [];
      if (vehicleData.images && Array.isArray(vehicleData.images) && vehicleData.images.length > 0) {
        existingImages = vehicleData.images.map(img => {
          if (typeof img === 'string') return img;
          if (img && img.url) return img.url;
          return null;
        }).filter(Boolean);
      } else if (vehicleData.pictures && Array.isArray(vehicleData.pictures)) {
        existingImages = vehicleData.pictures;
      }
      
      setFormData({
        make: vehicleData.make || vehicleData.brand || '',
        model: vehicleData.model || vehicleData.model_name || '',
        year: vehicleData.year || '',
        price_per_day: vehicleData.price_per_day || vehicleData.dailyRate || vehicleData.price || '',
        security_deposit: (vehicleData.security_deposit ?? vehicleData.securityDeposit ?? '5000'),
        location: vehicleData.location || '',
        description: vehicleData.description || vehicleData.vehicle_description || '',
        features: vehicleData.features || vehicleData.available_features || [],
        fuel_type: vehicleData.fuel_type || vehicleData.fuelType || 'diesel',
        transmission: vehicleData.transmission || 'automatic',
        seating_capacity: vehicleData.seating_capacity || vehicleData.seats || '',
        vehicle_style: vehicleData.vehicle_style || vehicleData.style || 'sedan',
        color: vehicleData.color || 'White',
        pictures: existingImages,
        is_available: vehicleData.is_available !== undefined ? vehicleData.is_available : true,
        instant_booking: vehicleData.instant_booking !== undefined ? vehicleData.instant_booking : false,
        is_b2b_enabled: vehicleData.is_b2b_enabled !== undefined ? vehicleData.is_b2b_enabled : false,
        b2b_price_per_day: vehicleData.b2b_price_per_day || ''
      });
    } else {
      // Add Mode: Reset form to defaults
      setFormData({
        make: '',
        model: '',
        year: '',
        price_per_day: '',
        security_deposit: '5000',
        location: '',
        description: '',
        features: [],
        fuel_type: 'diesel',
        transmission: 'automatic',
        seating_capacity: '',
        vehicle_style: 'sedan',
        color: 'White',
        pictures: [],
        is_available: true,
        instant_booking: false,
        is_b2b_enabled: false,
        b2b_price_per_day: ''
      });
    }
  }, [vehicleData?.id, showModal]); // Only re-run if ID changes or modal visibility changes

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const actualValue = type === 'checkbox' ? checked : value;
    console.log(`📝 Field Changed: ${name} =`, value);
    setFormData(prev => ({
      ...prev,
      [name]: actualValue
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

  const handleBulkCreate = async (count) => {
    // Validate form first
    const validationErrors = {};
    if (!formData.make) validationErrors.make = 'Make is required';
    if (!formData.model) validationErrors.model = 'Model is required';
    if (!formData.year) validationErrors.year = 'Year is required';
    if (!formData.price_per_day) validationErrors.price_per_day = 'Price per day is required';
    if (!formData.security_deposit) validationErrors.security_deposit = 'Security deposit is required';
    if (!formData.location) validationErrors.location = 'Location is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare images array from formData.pictures
      // Separate File objects (new uploads) from URL strings (existing images)
      const pictureFiles = formData.pictures ? formData.pictures.filter(p => p instanceof File) : [];
      const existingImageUrls = formData.pictures ? formData.pictures.filter(p => {
        // Include strings and objects with url property (but not File objects)
        return (typeof p === 'string') || (typeof p === 'object' && p !== null && p.url && !(p instanceof File));
      }) : [];
      
      // Debug: Log what we have in formData.pictures
      console.log('📸 Bulk create - formData.pictures:', {
        raw: formData.pictures,
        length: formData.pictures?.length || 0,
        types: formData.pictures?.map(p => typeof p) || [],
        pictureFilesCount: pictureFiles.length,
        existingImageUrlsCount: existingImageUrls.length
      });
      
      // If we have File objects, we need to upload them first to get URLs
      let uploadedImageUrls = [];
      if (pictureFiles.length > 0) {
        console.log('📤 Bulk create - Uploading image files first...');
        try {
          // Upload files to get URLs - create a temporary vehicle or use image upload endpoint
          // For now, we'll create a single vehicle with the images first, then use those URLs
          // This is a workaround - ideally we'd have a dedicated image upload endpoint
          
          // Create FormData for image upload
          const uploadFormData = new FormData();
          pictureFiles.forEach((file, index) => {
            uploadFormData.append('pictures', file);
          });
          
          // Also include basic vehicle data for the temporary vehicle
          uploadFormData.append('make', formData.make);
          uploadFormData.append('model', formData.model);
          uploadFormData.append('year', formData.year);
          uploadFormData.append('price_per_day', formData.price_per_day);
          uploadFormData.append('security_deposit', formData.security_deposit);
          uploadFormData.append('location', formData.location);
          uploadFormData.append('description', formData.description || '');
          uploadFormData.append('fuel_type', formData.fuel_type);
          uploadFormData.append('transmission', formData.transmission);
          uploadFormData.append('seating_capacity', formData.seating_capacity || 5);
          uploadFormData.append('vehicle_style', 'sedan');
          uploadFormData.append('color', 'White');
          uploadFormData.append('is_available', 'false'); // Make it unavailable so it's not shown
          
          // Upload images by creating a temporary vehicle
          const tempVehicleResponse = await apiClient.post('/listings/', uploadFormData, { timeout: 180000 });
          
          if (tempVehicleResponse?.data?.data) {
            const tempVehicleData = tempVehicleResponse.data.data;
            const tempImages = tempVehicleData?.images || [];
            
            // Extract URLs from the uploaded images
            uploadedImageUrls = tempImages.map(img => {
              if (typeof img === 'string') {
                return { url: img, name: '' };
              } else if (img && img.url) {
                return { url: img.url, name: img.name || '' };
              }
              return null;
            }).filter(Boolean);
            
            console.log('✅ Bulk create - Images uploaded successfully:', uploadedImageUrls);
            
            // Delete the temporary vehicle after extracting image URLs
            if (tempVehicleData?.id) {
              try {
                await apiClient.delete(`/listings/${tempVehicleData.id}/`);
                console.log('🗑️ Bulk create - Temporary vehicle deleted');
              } catch (deleteError) {
                console.warn('⚠️ Failed to delete temporary vehicle (non-critical):', deleteError);
              }
            }
          } else {
            console.error('⚠️ Failed to upload images - no data returned');
          }
        } catch (uploadError) {
          console.error('❌ Error uploading images:', uploadError);
          // Continue without uploaded images - user can add them later
        }
      }
      
      // Prepare existing images array for backend (convert URLs to objects with url property)
      const existingImages = existingImageUrls.map(item => {
        // If it's already an object with url property, use it as is
        if (typeof item === 'object' && item !== null && item.url) {
          return { url: item.url, name: item.name || '' };
        }
        // If it's a string URL, convert to object
        if (typeof item === 'string') {
          return { url: item, name: '' };
        }
        return null;
      }).filter(Boolean); // Remove any null values
      
      // Combine uploaded images with existing image URLs
      const imagesArray = [...uploadedImageUrls, ...existingImages];
      
      // Debug logging
      console.log('📸 Bulk create - Images preparation:', {
        pictureFiles: pictureFiles.length,
        existingImageUrls: existingImageUrls.length,
        uploadedImageUrls: uploadedImageUrls.length,
        existingImages: existingImages,
        imagesArray: imagesArray,
        imagesArrayLength: imagesArray.length
      });
      
      // Warn if no images at all
      if (imagesArray.length === 0) {
        console.warn('⚠️ No images found in form. Vehicles will be created without images.');
      }
      
      // Prepare base vehicle data
      const baseVehicleData = {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        price_per_day: formData.price_per_day,
        security_deposit: formData.security_deposit,
        location: formData.location,
        vehicle_description: formData.description || '',
        available_features: formData.features || [],
        is_b2b_enabled: formData.is_b2b_enabled,
        b2b_price_per_day: formData.is_b2b_enabled ? b2bPriceValue : null,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        seating_capacity: formData.seating_capacity || 5,
        vehicle_style: formData.vehicle_style || 'sedan',
        color: formData.color || 'White',
        is_available: true,
        instant_booking: false,
        is_b2b_enabled: formData.is_b2b_enabled,
        b2b_price_per_day: formData.is_b2b_enabled ? formData.b2b_price_per_day : null,
        images: imagesArray // Include existing image URLs (new file uploads not supported in bulk)
      };

      // Create array of vehicles (all with same data including images)
      // Deep clone to ensure each vehicle has its own images array
      const vehiclesArray = Array(count).fill(null).map(() => ({
        ...baseVehicleData,
        images: JSON.parse(JSON.stringify(imagesArray)) // Deep clone images array
      }));

      // Debug: Log the vehicles array to verify images are included
      console.log('🚗 Bulk create - Vehicles array:', {
        count: vehiclesArray.length,
        firstVehicle: {
          make: vehiclesArray[0]?.make,
          model: vehiclesArray[0]?.model,
          imagesCount: vehiclesArray[0]?.images?.length || 0,
          images: vehiclesArray[0]?.images
        }
      });

      // Call onSubmit - parent component will handle the API call to avoid duplication
      await onSubmit({ vehicles: vehiclesArray, bulk: true });
      
      // Show success message
      alert(`✅ Successfully created ${count} vehicle${count > 1 ? 's' : ''}!`);
      
      // Reset form after successful submission
      setFormData({
        make: '',
        model: '',
        year: '',
        price_per_day: '',
        security_deposit: '5000',
        location: '',
        description: '',
        features: [],
        fuel_type: 'diesel',
        transmission: 'automatic',
        seating_capacity: '',
        vehicle_style: 'sedan',
        color: 'White',
        pictures: [],
        is_available: true,
        instant_booking: false,
        is_b2b_enabled: false,
        b2b_price_per_day: ''
      });
      setErrors({});
      setBulkMode(false);
      
      // Close modal after successful creation
      setShowModal(false);
    } catch (error) {
      console.error('Error creating vehicles in bulk:', error);
      setErrors({
        submit: error?.data?.message || error?.message || `Failed to create ${count} vehicles. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  // Image validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_IMAGES = 10;

  const validateImageFile = (file) => {
    const errors = [];
    
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push(`${file.name}: Invalid file type. Allowed types: JPEG, PNG, GIF, WebP`);
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: File is too large. Maximum size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB`);
    }
    
    // Check if file is actually an image by checking extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      errors.push(`${file.name}: Invalid file extension`);
    }
    
    return errors;
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Check total image count
    const currentImageCount = formData.pictures.filter(p => p instanceof File).length;
    if (currentImageCount + files.length > MAX_IMAGES) {
      setErrors(prev => ({
        ...prev,
        pictures: `Maximum ${MAX_IMAGES} images allowed. You have ${currentImageCount} and trying to add ${files.length} more.`
      }));
      e.target.value = ''; // Reset file input
      return;
    }
    
    // Validate each file
    const validationErrors = [];
    const validFiles = [];
    
    files.forEach(file => {
      const fileErrors = validateImageFile(file);
      if (fileErrors.length > 0) {
        validationErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });
    
    // Show validation errors if any
    if (validationErrors.length > 0) {
      setErrors(prev => ({
        ...prev,
        pictures: validationErrors.join('; ')
      }));
    } else {
      // Clear any previous errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.pictures;
        return newErrors;
      });
    }
    
    // Add valid files to form data
    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        pictures: [...prev.pictures, ...validFiles]
      }));
    }
    
    // Reset file input to allow selecting the same file again
    e.target.value = '';
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
    if (!formData.security_deposit || formData.security_deposit < 0) {
      newErrors.security_deposit = 'Valid security deposit is required';
    }
    const validImageCount = (formData.pictures || []).filter((img) => {
      if (!img) return false;
      if (img instanceof File) return true;
      if (typeof img === 'string') return img.trim() !== '' && img.trim() !== '/carsymbol.jpg';
      if (typeof img === 'object' && img.url) {
        const url = String(img.url).trim();
        return url !== '' && url !== '/carsymbol.jpg';
      }
      return false;
    }).length;
    if (validImageCount < 3) {
      newErrors.pictures = 'At least 3 images are required for listing quality.';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.fuel_type) newErrors.fuel_type = 'Fuel type is required';
    if (!formData.transmission) newErrors.transmission = 'Transmission is required';
    
    const seats = parseInt(formData.seating_capacity, 10);
    if (!formData.seating_capacity || isNaN(seats) || seats < 2 || seats > 8) {
      newErrors.seating_capacity = 'Valid seating capacity (2-8) is required';
    }
    
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
      const securityDepositValue = formData.security_deposit ? parseFloat(formData.security_deposit) : null;
      const seatingValue = formData.seating_capacity ? parseInt(formData.seating_capacity, 10) : null;
      const b2bPriceValue = (formData.is_b2b_enabled && formData.b2b_price_per_day) ? parseFloat(formData.b2b_price_per_day) : null;
      
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

      if (isNaN(securityDepositValue) || securityDepositValue < 0) {
        setErrors({ security_deposit: 'Please enter a valid security deposit' });
        setLoading(false);
        return;
      }
      
      if (isNaN(seatingValue) || seatingValue < 2 || seatingValue > 8) {
        setErrors({ seating_capacity: 'Please select a valid seating capacity' });
        setLoading(false);
        return;
      }
      if (formData.is_b2b_enabled && (isNaN(b2bPriceValue) || b2bPriceValue <= 0)) {
        setErrors({ b2b_price_per_day: 'Please enter a valid B2B daily rate' });
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
        security_deposit: securityDepositValue,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        seating_capacity: seatingValue,
        vehicle_style: formData.vehicle_style || 'sedan',
        color: formData.color || 'White',
        vehicle_description: formData.description?.trim() || '',
        available_features: formData.features || [],
        is_b2b_enabled: formData.is_b2b_enabled,
        b2b_price_per_day: formData.is_b2b_enabled ? b2bPriceValue : null, // Use available_features for backend
      };

      // Validate all required fields are present
      const requiredFields = {
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        location: vehicleData.location,
        price_per_day: vehicleData.price_per_day,
        seating_capacity: vehicleData.seating_capacity,
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
      
      // Separate File objects (new uploads) from URL strings (existing images)
      const pictureFiles = formData.pictures ? formData.pictures.filter(p => p instanceof File) : [];
      const existingImageUrls = formData.pictures ? formData.pictures.filter(p => typeof p === 'string') : [];
      
      // Prepare existing images array for backend
      const existingImages = existingImageUrls.map(url => {
        return typeof url === 'string' ? { url } : url;
      });
      
      if (pictureFiles.length > 0 || existingImages.length > 0) {
        // Use FormData if there are files to upload OR existing images to preserve
        console.log('📎 Using FormData (files or existing images detected)');
        dataToSend = new FormData();
        
        // Append all text fields - ensure numeric values are converted to strings for FormData
        // Exclude 'images' and 'pictures' from vehicleData loop - we handle them separately
        Object.keys(vehicleData).forEach(key => {
          // Skip images and pictures - we handle them separately
          if (key === 'images' || key === 'pictures') {
            return;
          }
          
          const value = vehicleData[key];
          // Handle different value types
          if (value !== null && value !== undefined) {
            // Field name is already correct in vehicleData (available_features)
            
            if (key === 'available_features' && Array.isArray(value)) {
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
        
        // Include existing images in the images array
        if (existingImages.length > 0) {
          dataToSend.append('images', JSON.stringify(existingImages));
          console.log('📸 Including existing images:', existingImages);
        }
        
        // Append new picture files
        pictureFiles.forEach((file) => {
          dataToSend.append('pictures', file);
          console.log('📤 Adding new file:', file.name);
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
        // Use JSON if no files but include existing images
        console.log('📄 Using JSON (no new files, but may have existing images)');
        if (existingImages.length > 0) {
          dataToSend = {
            ...vehicleData,
            images: existingImages
          };
        } else {
          dataToSend = vehicleData;
        }
      }
      
      console.log('🚀 Sending vehicle data:', dataToSend instanceof FormData ? 'FormData (see above)' : JSON.stringify(dataToSend, null, 2));
      await onSubmit(dataToSend);
      
      // Reset form after successful submission
      setFormData({
        make: '',
        model: '',
        year: '',
        price_per_day: '',
        security_deposit: '5000',
        location: '',
        description: '',
        features: [],
        fuel_type: 'diesel',
        transmission: 'automatic',
        seating_capacity: '',
        vehicle_style: 'sedan',
        color: 'White',
        pictures: [],
        is_available: true,
        instant_booking: false,
        is_b2b_enabled: false,
        b2b_price_per_day: ''
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

  const availableFeatures = AVAILABLE_FEATURES;

  // Logic to ensure current values are in options (Edit Mode fix)
  const yearOptions = (() => {
    const years = generateYears().map(y => ({ value: String(y), label: String(y) }));
    if (formData.year) {
      const yearStr = String(formData.year);
      if (!years.some(y => y.value === yearStr)) {
        // Add current year if not in generated range
        years.unshift({ value: yearStr, label: yearStr });
      }
    }
    return years;
  })();

  const locationOptions = (() => {
    const locs = LOCATIONS.map(l => ({ value: l, label: l }));
    if (formData.location && !locs.some(l => l.value === formData.location)) {
      // Add current location if not in LOCATIONS list
      locs.unshift({ value: formData.location, label: formData.location });
    }
    return locs;
  })();
  
  const seatingOptions = (() => {
    const seats = [2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: `${s} ${s === 1 ? 'Seat' : 'Seats'}` }));
    if (formData.seating_capacity) {
      const seatStr = String(formData.seating_capacity);
      if (!seats.some(s => s.value === seatStr)) {
        // Add current seating capacity if not in standard list
        seats.unshift({ value: seatStr, label: `${seatStr} Seats` });
      }
    }
    return seats;
  })();

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <Car className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {vehicleData?.id ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Make *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  list="make-list"
                  placeholder="Type or select a make"
                  autoComplete="off"
                  required
                  className={`w-60 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    errors.make ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                />
                <datalist id="make-list">
                  {CAR_MAKES.map(make => (
                    <option key={make} value={make} />
                  ))}
                </datalist>
                {formData.make && CAR_MAKES.includes(formData.make) && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-xs">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.make ? `${CAR_MAKES.filter(m => m.toLowerCase().includes(formData.make.toLowerCase())).length} suggestion(s)` : 'Type to see suggestions or select from list'}
              </p>
              {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Model *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  list="model-list"
                  placeholder="Type or select a model"
                  autoComplete="off"
                  required
                  className={`w-60 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    errors.model ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                />
                <datalist id="model-list">
                  {UNIQUE_CAR_MODELS.map((model, index) => (
                    <option key={`${model}-${index}`} value={model} />
                  ))}
                </datalist>
                {formData.model && UNIQUE_CAR_MODELS.includes(formData.model) && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-xs">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.model ? `${UNIQUE_CAR_MODELS.filter(m => m.toLowerCase().includes(formData.model.toLowerCase())).length} suggestion(s)` : 'Type to see suggestions or select from list'}
              </p>
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Year *
              </label>
              <SelectField
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                placeholder="Select Year"
                showPlaceholderOption
                options={yearOptions}
                className={`w-60 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.year ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
              />
              
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>
          </div>

          {/* Pricing & Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Daily Rate ($) *
              </label>
              <input
                type="number"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className={`w-60 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                  errors.price_per_day ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="e.g., 50"
              />
              {errors.price_per_day && <p className="text-red-500 text-xs mt-1">{errors.price_per_day}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Security Deposit ($) *
              </label>
              <input
                type="number"
                name="security_deposit"
                value={formData.security_deposit}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-60 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                  errors.security_deposit ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="e.g., 5000"
              />
              {errors.security_deposit && <p className="text-red-500 text-xs mt-1">{errors.security_deposit}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Location *
              </label>
              <SelectField
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                placeholder="Select Location"
                showPlaceholderOption
                options={locationOptions}
                className={`w-60 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Fuel Type
              </label>
              <SelectField
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                options={[
                  { value: 'diesel', label: 'Diesel' },
                  { value: 'hybrid', label: 'Hybrid' },
                  { value: 'electric', label: 'Electric' },
                ]}
                className="w-50 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Transmission
              </label>
              <SelectField
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                options={[
                  { value: 'automatic', label: 'Automatic' },
                  { value: 'manual', label: 'Manual' },
                ]}
                className="w-50 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Seating Capacity *
              </label>
              <SelectField
                name="seating_capacity"
                value={formData.seating_capacity}
                onChange={handleInputChange}
                required
                placeholder="Select Seating"
                showPlaceholderOption
                options={seatingOptions}
                className={`w-50 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.seating_capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
              />
              {errors.seating_capacity && <p className="text-red-500 text-xs mt-1">{errors.seating_capacity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Vehicle Style
              </label>
              <SelectField
                name="vehicle_style"
                value={formData.vehicle_style}
                onChange={handleInputChange}
                options={[
                  { value: 'sedan', label: 'Sedan' },
                  { value: 'suv', label: 'SUV' },
                  { value: 'hatchback', label: 'Hatchback' },
                  { value: 'coupe', label: 'Coupe' },
                  { value: 'convertible', label: 'Convertible' },
                  { value: 'truck', label: 'Truck' },
                  { value: 'van', label: 'Van' },
                ]}
                className="w-50 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your vehicle..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.description?.length || 0}/500 characters
            </p>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Photos {formData.pictures.filter(p => p instanceof File).length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  ({formData.pictures.filter(p => p instanceof File).length} new, max {MAX_IMAGES})
                </span>
              )}
            </label>
            <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              errors.pictures 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700/60' 
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
            }`}>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                id="vehicle-photos"
                disabled={formData.pictures.filter(p => p instanceof File).length >= MAX_IMAGES}
              />
              <label
                htmlFor="vehicle-photos"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  formData.pictures.filter(p => p instanceof File).length >= MAX_IMAGES 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  {formData.pictures.filter(p => p instanceof File).length >= MAX_IMAGES
                    ? `Maximum ${MAX_IMAGES} images reached`
                    : 'Click to upload photos'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPEG, PNG, GIF, WebP (max {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB each)
                </span>
              </label>
            </div>
            {errors.pictures && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700/60 rounded text-sm text-red-600 dark:text-red-200">
                {errors.pictures.split('; ').map((error, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="mr-1">⚠️</span>
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}
            
            {formData.pictures.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {formData.pictures.filter(p => p instanceof File).length > 0 && 
                   formData.pictures.filter(p => typeof p === 'string').length > 0
                    ? 'Existing images and new uploads:'
                    : formData.pictures[0] instanceof File
                    ? 'New images to upload:'
                    : 'Existing images:'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {formData.pictures.map((picture, index) => {
                    // Handle both File objects (new uploads) and URL strings (existing images)
                    const imageSrc = picture instanceof File 
                      ? URL.createObjectURL(picture) 
                      : picture;
                    const isExistingImage = typeof picture === 'string';
                    
                    return (
                      <div key={index} className="relative group">
                        <img
                          src={imageSrc}
                          alt={`Vehicle ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.target.src = '/default-avatar.svg';
                          }}
                        />
                        {isExistingImage && (
                          <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                            Existing
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePicture(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100 shadow-md"
                          title={isExistingImage ? "Remove image" : "Remove uploaded image"}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {picture instanceof File && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-b-lg">
                            {(picture.size / (1024 * 1024)).toFixed(2)}MB
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700/60 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-200">{errors.submit}</p>
            </div>
          )}

          {/* Bulk Create Options */}
          {Object.keys(vehicleData).length === 0 && (
            <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">Quick Create Multiple Vehicles</p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent form submission
                    e.stopPropagation();
                    setBulkMode(true);
                    setBulkCount(3);
                    handleBulkCreate(3);
                  }}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {loading && bulkCount === 3 ? 'Creating...' : 'Create 3 Vehicles'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent form submission
                    e.stopPropagation();
                    setBulkMode(true);
                    setBulkCount(5);
                    handleBulkCreate(5);
                  }}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {loading && bulkCount === 5 ? 'Creating...' : 'Create 5 Vehicles'}
                </button>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                Uses current form data as template for all vehicles
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
