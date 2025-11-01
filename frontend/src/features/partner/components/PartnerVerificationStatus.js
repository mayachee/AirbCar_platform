'use client';

import { useState, useEffect } from 'react';

export default function PartnerVerificationStatus({ partnerData }) {
  const [verificationStatus, setVerificationStatus] = useState({
    isVerified: false,
    verificationLevel: 'basic',
    pendingDocuments: [],
    completedSteps: []
  });

  useEffect(() => {
    if (partnerData) {
      // Mock verification status - replace with real data
      setVerificationStatus({
        isVerified: partnerData.is_verified || false,
        verificationLevel: partnerData.verification_level || 'basic',
        pendingDocuments: ['business_license', 'insurance_certificate'],
        completedSteps: ['email_verification', 'phone_verification']
      });
    }
  }, [partnerData]);

  const getStatusColor = (level) => {
    switch (level) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (level) => {
    switch (level) {
      case 'verified': return '✅';
      case 'advanced': return '🔒';
      case 'basic': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="relative">
      <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <span className="text-lg">{getStatusIcon(verificationStatus.verificationLevel)}</span>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(verificationStatus.verificationLevel)}`}>
          {verificationStatus.verificationLevel}
        </span>
      </button>
      
      {/* Verification Details Tooltip */}
      <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 hidden group-hover:block">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Verification Status</h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(verificationStatus.verificationLevel)}`}>
              {verificationStatus.verificationLevel}
            </span>
          </div>
          
          {verificationStatus.pendingDocuments.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Pending Documents:</p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                {verificationStatus.pendingDocuments.map((doc, index) => (
                  <li key={index}>• {doc.replace('_', ' ')}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button className="w-full mt-3 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors">
            Complete Verification
          </button>
        </div>
      </div>
    </div>
  );
}
