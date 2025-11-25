'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, X, Loader2, User, CreditCard, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { partnerService } from '@/features/partner/services/partnerService';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerDocuments({ bookingId, customer: initialCustomer }) {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    if (bookingId) {
      loadCustomerInfo();
    } else if (initialCustomer) {
      setCustomerInfo({ customer: initialCustomer });
    }
  }, [bookingId, initialCustomer]);

  const loadCustomerInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await partnerService.getCustomerInfo(bookingId);
      setCustomerInfo(response.data?.data || response.data || null);
    } catch (err) {
      console.error('Error loading customer info:', err);
      setError(err.message || 'Failed to load customer information');
    } finally {
      setLoading(false);
    }
  };

  const customer = customerInfo?.customer || initialCustomer;
  const bookingDocuments = customerInfo?.booking_documents || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No customer information available</p>
      </div>
    );
  }

  const documents = [
    {
      title: 'Identity Document (Front)',
      url: customer.id_front_document_url || bookingDocuments.id_front_document_url,
      type: 'id_front'
    },
    {
      title: 'Identity Document (Back)',
      url: customer.id_back_document_url || bookingDocuments.id_back_document_url,
      type: 'id_back'
    },
    {
      title: 'Driver License (Front)',
      url: customer.license_front_document_url,
      type: 'license_front'
    },
    {
      title: 'Driver License (Back)',
      url: customer.license_back_document_url,
      type: 'license_back'
    }
  ].filter(doc => doc.url);

  const openImage = (url) => {
    setSelectedImage(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 px-4">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Documents
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Personal Info
          </button>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No documents available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openImage(doc.url)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={doc.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={doc.url}
                          alt={doc.title}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openImage(doc.url)}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {customer.first_name} {customer.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">{customer.email}</p>
                  </div>
                  {customer.phone_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Phone Number
                      </label>
                      <p className="text-gray-900 dark:text-white">{customer.phone_number}</p>
                    </div>
                  )}
                  {customer.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Date of Birth
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(customer.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {customer.nationality && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
                      <p className="text-gray-900 dark:text-white">{customer.nationality}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              {(customer.address || customer.city || customer.country) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.address && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-gray-900 dark:text-white">{customer.address}</p>
                      </div>
                    )}
                    {customer.city && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                        <p className="text-gray-900 dark:text-white">{customer.city}</p>
                      </div>
                    )}
                    {customer.country && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                        <p className="text-gray-900 dark:text-white">{customer.country}</p>
                      </div>
                    )}
                    {customer.postal_code && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</label>
                        <p className="text-gray-900 dark:text-white">{customer.postal_code}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* License Information */}
              {customer.license_number && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Driver License Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">License Number</label>
                      <p className="text-gray-900 dark:text-white font-medium">{customer.license_number}</p>
                    </div>
                    {customer.license_origin_country && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Origin Country</label>
                        <p className="text-gray-900 dark:text-white">{customer.license_origin_country}</p>
                      </div>
                    )}
                    {customer.issue_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Issue Date</label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(customer.issue_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {customer.expiry_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiry Date</label>
                        <p className={`font-medium ${
                          new Date(customer.expiry_date) < new Date()
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {new Date(customer.expiry_date).toLocaleDateString()}
                          {new Date(customer.expiry_date) < new Date() && ' (Expired)'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

