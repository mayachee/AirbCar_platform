'use client';

import { useState } from 'react';

export default function ProfileSection({ accountData, handleFieldChange, formatProfileCompletion, profileCompletion, onProfilePictureChange }) {
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (onProfilePictureChange) {
        setUploading(true);
        onProfilePictureChange(file).finally(() => setUploading(false));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture Upload */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <img
              src={accountData.profileImage || '/default-avatar.svg'}
              alt="Profile"
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                if (e.target.src !== '/default-avatar.svg') {
                  e.target.src = '/default-avatar.svg';
                }
              }}
            />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Picture</h3>
            <label className="inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="hidden"
                id="profile-picture-upload"
              />
              <span className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {uploading ? 'Uploading...' : 'Change Picture'}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
          </div>
        </div>
      </div>

      {/* Profile Completion Indicator */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-5 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <span className="text-sm font-medium opacity-90">Profile Completion</span>
          <span className="text-2xl font-bold">{profileCompletion}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300" 
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        <p className="text-sm mt-2 opacity-90">{formatProfileCompletion(profileCompletion)}</p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={accountData.firstName}
            onChange={handleFieldChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={accountData.lastName}
            onChange={handleFieldChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={accountData.email}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={accountData.phoneNumber}
            onChange={handleFieldChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={accountData.dateOfBirth}
            onChange={handleFieldChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              name="address"
              value={accountData.address}
              onChange={handleFieldChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={accountData.city}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={accountData.country}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={accountData.postalCode}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Identity Documents */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity Documents</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload clear photos of the front and back of your ID. These are used to verify your identity and will be reviewed by our team.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            const frontPreview = accountData.idFrontDocumentPreview || accountData.idFrontDocumentUrl;
            const backPreview = accountData.idBackDocumentPreview || accountData.idBackDocumentUrl;

            const renderDocumentCard = (label, preview, url, fileName, onSelect) => (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelect}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-orange-600"
                  />
                </label>
                {fileName && (
                  <p className="text-xs text-gray-500 truncate">
                    Selected file: <span className="font-medium">{fileName}</span>
                  </p>
                )}
                {preview ? (
                  <a href={url || preview} target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <img
                        src={preview}
                        alt={`${label}`}
                        className="h-40 w-full object-contain bg-gray-100 transition-transform duration-200 group-hover:scale-[1.02]"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/document-placeholder.svg';
                        }}
                      />
                    </div>
                    <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-orange-600 group-hover:text-orange-700">
                      {url ? 'View current document' : 'View upload preview'}
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14" />
                      </svg>
                    </span>
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No document on file.</p>
                )}
              </div>
            );

            return (
              <>
                {renderDocumentCard(
                  'Front Document',
                  frontPreview,
                  accountData.idFrontDocumentUrl,
                  accountData.idFrontDocumentFile?.name,
                  (event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      if (accountData.idFrontDocumentPreview) {
                        URL.revokeObjectURL(accountData.idFrontDocumentPreview);
                      }
                      handleFieldChange({ name: 'idFrontDocumentFile', value: file });
                      const previewUrl = URL.createObjectURL(file);
                      handleFieldChange({ name: 'idFrontDocumentPreview', value: previewUrl });
                    } else {
                      if (accountData.idFrontDocumentPreview) {
                        URL.revokeObjectURL(accountData.idFrontDocumentPreview);
                      }
                      handleFieldChange({ name: 'idFrontDocumentFile', value: null });
                      handleFieldChange({ name: 'idFrontDocumentPreview', value: '' });
                    }
                  }
                )}
                {renderDocumentCard(
                  'Back Document',
                  backPreview,
                  accountData.idBackDocumentUrl,
                  accountData.idBackDocumentFile?.name,
                  (event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      if (accountData.idBackDocumentPreview) {
                        URL.revokeObjectURL(accountData.idBackDocumentPreview);
                      }
                      handleFieldChange({ name: 'idBackDocumentFile', value: file });
                      const previewUrl = URL.createObjectURL(file);
                      handleFieldChange({ name: 'idBackDocumentPreview', value: previewUrl });
                    } else {
                      if (accountData.idBackDocumentPreview) {
                        URL.revokeObjectURL(accountData.idBackDocumentPreview);
                      }
                      handleFieldChange({ name: 'idBackDocumentFile', value: null });
                      handleFieldChange({ name: 'idBackDocumentPreview', value: '' });
                    }
                  }
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
