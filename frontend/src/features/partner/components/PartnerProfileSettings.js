'use client';

import { useState, useEffect } from 'react';
import { Save, Upload, Building2, MapPin, Phone, Globe, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function PartnerProfileSettings({ partnerData, onUpdate, loading }) {
  const [formData, setFormData] = useState({
    company_name: '',
    tax_id: '',
    business_type: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone_number: '',
    website: '',
    description: '',
    verification_document: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (partnerData) {
      setFormData({
        company_name: partnerData.company_name || '',
        tax_id: partnerData.tax_id || '',
        business_type: partnerData.business_type || '',
        address: partnerData.address || '',
        city: partnerData.city || '',
        state: partnerData.state || '',
        zip_code: partnerData.zip_code || '',
        phone_number: partnerData.phone_number || '',
        website: partnerData.website || '',
        description: partnerData.description || '',
        verification_document: partnerData.verification_document || null
      });
    }
  }, [partnerData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Here you would upload the file to your backend
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFormData(prev => ({
        ...prev,
        verification_document: file.name
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatus = () => {
    if (!partnerData?.verification_status) return { status: 'pending', color: 'text-yellow-600', icon: AlertCircle };
    
    switch (partnerData.verification_status) {
      case 'verified': return { status: 'Verified', color: 'text-green-600', icon: CheckCircle };
      case 'rejected': return { status: 'Rejected', color: 'text-red-600', icon: AlertCircle };
      default: return { status: 'Pending', color: 'text-yellow-600', icon: AlertCircle };
    }
  };

  const verificationStatus = getVerificationStatus();
  const StatusIcon = verificationStatus.icon;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Business Profile</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${verificationStatus.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{verificationStatus.status}</span>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID / License Number *
            </label>
            <input
              type="text"
              name="tax_id"
              value={formData.tax_id}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter tax ID or license number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type
            </label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select business type</option>
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="fleet">Fleet Operator</option>
              <option value="dealership">Dealership</option>
            </select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Contact Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="https://your-website.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter business address"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="State"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Business Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          disabled={!isEditing}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Describe your business and services..."
        />
      </div>

      {/* Verification Document */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verification Document
        </label>
        <div className="flex items-center space-x-4">
          {formData.verification_document ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{formData.verification_document}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No document uploaded</div>
          )}
          
          {isEditing && (
            <label className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Upload business license, tax certificate, or other verification documents
        </p>
      </div>
    </div>
  );
}
