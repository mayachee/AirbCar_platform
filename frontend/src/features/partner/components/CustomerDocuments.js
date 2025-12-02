'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, X, Loader2, User, CreditCard, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { partnerService } from '@/features/partner/services/partnerService';
import { adminService } from '@/features/admin/services/adminService';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerDocuments({ bookingId, customer: initialCustomer, userType = 'partner', bookingData = null }) {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    if (bookingId) {
      loadCustomerInfo();
    } else if (initialCustomer) {
      // If we have customer data and booking data, use it directly
      if (bookingData && bookingData.id_front_document_url) {
        setCustomerInfo({ 
          customer: initialCustomer,
          booking_documents: {
            id_front_document_url: bookingData.id_front_document_url,
            id_back_document_url: bookingData.id_back_document_url
          }
        });
      } else {
        setCustomerInfo({ customer: initialCustomer });
      }
    }
  }, [bookingId, initialCustomer, bookingData]);

  const loadCustomerInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For admins, try to get customer info from booking or use admin service
      if (userType === 'admin') {
        // If we have booking data with documents, use it
        if (bookingData) {
          setCustomerInfo({
            customer: initialCustomer || bookingData.customer || bookingData.user,
            booking_documents: {
              id_front_document_url: bookingData.id_front_document_url,
              id_back_document_url: bookingData.id_back_document_url
            }
          });
          setLoading(false);
          return;
        }
        
        // Try to get booking details using admin service
        try {
          const bookingResponse = await adminService.getBookingById?.(bookingId);
          const booking = bookingResponse?.data || bookingResponse;
          if (booking) {
            setCustomerInfo({
              customer: booking.customer || booking.user || initialCustomer,
              booking_documents: {
                id_front_document_url: booking.id_front_document_url,
                id_back_document_url: booking.id_back_document_url
              }
            });
            setLoading(false);
            return;
          }
        } catch (adminErr) {
          console.warn('Admin service failed, trying partner service:', adminErr);
        }
      }
      
      // Fallback to partner service (for partners or if admin service fails)
      const response = await partnerService.getCustomerInfo(bookingId);
      setCustomerInfo(response.data?.data || response.data || null);
    } catch (err) {
      console.error('Error loading customer info:', err);
      // If API fails but we have initial customer, use that
      if (initialCustomer) {
        setCustomerInfo({ customer: initialCustomer });
      } else {
        setError(err.message || 'Failed to load customer information');
      }
    } finally {
      setLoading(false);
    }
  };

  const customer = customerInfo?.customer || initialCustomer;
  const bookingDocuments = customerInfo?.booking_documents || bookingData || {};

  // Debug logging
  useEffect(() => {
    if (customer || bookingDocuments) {
      console.log('=== CUSTOMER DOCUMENTS DEBUG ===');
      console.log('Customer:', customer);
      console.log('Booking Documents:', bookingDocuments);
      console.log('Customer ID Front:', customer?.id_front_document_url);
      console.log('Customer ID Back:', customer?.id_back_document_url);
      console.log('Customer License Front:', customer?.license_front_document_url);
      console.log('Customer License Back:', customer?.license_back_document_url);
      console.log('Booking ID Front:', bookingDocuments?.id_front_document_url);
      console.log('Booking ID Back:', bookingDocuments?.id_back_document_url);
      console.log('================================');
    }
  }, [customer, bookingDocuments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading customer documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 font-medium mb-2">Error loading documents</p>
        <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        {initialCustomer && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Using provided customer data. Customer ID: {initialCustomer.id || initialCustomer.email}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">No customer information available</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          Customer data is required to view documents
        </p>
      </div>
    );
  }

  // Build documents array - include all possible documents
  const documents = [
    {
      title: 'Identity Document (Front)',
      url: customer.id_front_document_url || bookingDocuments.id_front_document_url,
      type: 'id_front',
      source: customer.id_front_document_url ? 'customer' : (bookingDocuments.id_front_document_url ? 'booking' : null)
    },
    {
      title: 'Identity Document (Back)',
      url: customer.id_back_document_url || bookingDocuments.id_back_document_url,
      type: 'id_back',
      source: customer.id_back_document_url ? 'customer' : (bookingDocuments.id_back_document_url ? 'booking' : null)
    },
    {
      title: 'Driver License (Front)',
      url: customer.license_front_document_url,
      type: 'license_front',
      source: customer.license_front_document_url ? 'customer' : null
    },
    {
      title: 'Driver License (Back)',
      url: customer.license_back_document_url,
      type: 'license_back',
      source: customer.license_back_document_url ? 'customer' : null
    }
  ].filter(doc => doc.url); // Only show documents that have URLs

  // Show all document types, even if missing
  const allDocumentTypes = [
    { title: 'Identity Document (Front)', hasUrl: !!(customer.id_front_document_url || bookingDocuments.id_front_document_url) },
    { title: 'Identity Document (Back)', hasUrl: !!(customer.id_back_document_url || bookingDocuments.id_back_document_url) },
    { title: 'Driver License (Front)', hasUrl: !!customer.license_front_document_url },
    { title: 'Driver License (Back)', hasUrl: !!customer.license_back_document_url }
  ];

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
                <div className="space-y-4">
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No documents available</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      The customer has not uploaded any documents yet.
                    </p>
                  </div>
                  
                  {/* Show document status */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Document Status</h4>
                    <div className="space-y-2">
                      {allDocumentTypes.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{doc.title}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            doc.hasUrl 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {doc.hasUrl ? 'Available' : 'Not uploaded'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Debug info */}
                  <details className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                      Debug Information
                    </summary>
                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <strong>Customer ID:</strong> {customer.id || 'N/A'}
                      </div>
                      <div>
                        <strong>Customer Email:</strong> {customer.email || 'N/A'}
                      </div>
                      <div>
                        <strong>Customer ID Front URL:</strong> {customer.id_front_document_url || 'null'}
                      </div>
                      <div>
                        <strong>Customer ID Back URL:</strong> {customer.id_back_document_url || 'null'}
                      </div>
                      <div>
                        <strong>Customer License Front URL:</strong> {customer.license_front_document_url || 'null'}
                      </div>
                      <div>
                        <strong>Customer License Back URL:</strong> {customer.license_back_document_url || 'null'}
                      </div>
                      <div>
                        <strong>Booking ID Front URL:</strong> {bookingDocuments?.id_front_document_url || 'null'}
                      </div>
                      <div>
                        <strong>Booking ID Back URL:</strong> {bookingDocuments?.id_back_document_url || 'null'}
                      </div>
                    </div>
                  </details>
                </div>
              ) : (
                <div>
                  {/* Document Status Summary */}
                  <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>{documents.length}</strong> document{documents.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                            {doc.source && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Source: {doc.source === 'booking' ? 'Booking upload' : 'Customer profile'}
                              </span>
                            )}
                          </div>
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
                        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                          <img
                            src={doc.url}
                            alt={doc.title}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openImage(doc.url)}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'absolute inset-0 flex items-center justify-center text-gray-400 text-sm';
                              errorDiv.textContent = 'Image not available';
                              e.target.parentElement.appendChild(errorDiv);
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
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

