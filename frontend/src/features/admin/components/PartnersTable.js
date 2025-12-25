'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle, XCircle, Download, Eye, UserCheck, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import PartnerDetailsModal from './PartnerDetailsModal';
import { adminService } from '@/features/admin/services/adminService';
import { SelectField } from '@/components/ui/select-field';

export default function PartnersTable({ partners, loading, error, onApprove, onReject, onUnverify, onRefresh }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Debug logging
  console.log('📊 PartnersTable - partners prop:', partners);
  console.log('📊 PartnersTable - loading:', loading);
  console.log('📊 PartnersTable - error:', error);
  console.log('📊 PartnersTable - partners type:', typeof partners);
  console.log('📊 PartnersTable - isArray:', Array.isArray(partners));
  console.log('📊 PartnersTable - partners count:', Array.isArray(partners) ? partners.length : 'N/A');

  // Ensure partners is always an array
  const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);
  
  console.log('📊 PartnersTable - partnersList:', partnersList);
  console.log('📊 PartnersTable - partnersList length:', partnersList?.length);
  console.log('📊 PartnersTable - partnersList IDs:', partnersList.map(p => p?.id || p?.pk || 'no-id'));

  const filteredPartners = useMemo(() => {
    console.log('🔍 Filtering partners...');
    console.log('🔍 partnersList:', partnersList);
    console.log('🔍 partnersList length:', partnersList?.length);
    console.log('🔍 searchTerm:', searchTerm);
    console.log('🔍 statusFilter:', statusFilter);
    
    if (!Array.isArray(partnersList) || partnersList.length === 0) {
      console.warn('⚠️ partnersList is not an array or is empty');
      return [];
    }
    
    // If no filters applied, return all partners
    if (!searchTerm && statusFilter === "all") {
      console.log('✅ No filters - returning all partners');
      return partnersList;
    }
    
    const filtered = partnersList.filter(partner => {
      // Search filter - check multiple possible fields
      let matchesSearch = true;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        matchesSearch = 
          partner.name?.toLowerCase().includes(searchLower) ||
          partner.email?.toLowerCase().includes(searchLower) ||
          partner.company_name?.toLowerCase().includes(searchLower) ||
          partner.business_name?.toLowerCase().includes(searchLower) ||
          partner.tax_id?.toLowerCase().includes(searchLower) ||
          partner.user?.email?.toLowerCase().includes(searchLower) ||
          partner.user?.first_name?.toLowerCase().includes(searchLower) ||
          partner.user?.last_name?.toLowerCase().includes(searchLower) ||
          (partner.user?.first_name && partner.user?.last_name && 
           `${partner.user.first_name} ${partner.user.last_name}`.toLowerCase().includes(searchLower)) ||
          false;
      }
      
      // Status filter - be more lenient with null/undefined values
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const isVerified = partner.is_verified === true;
        const verificationStatus = partner.verification_status;
        const isApproved = verificationStatus === 'approved' || verificationStatus === 'verified';
        
        if (statusFilter === "verified") {
          // Show if explicitly verified or approved
          matchesStatus = isVerified || isApproved;
        } else if (statusFilter === "pending") {
          // Show if not verified AND not approved (including null/undefined)
          matchesStatus = !isVerified && !isApproved;
        }
      }
      
      const matches = matchesSearch && matchesStatus;
      
      if (!matches) {
        console.log('❌ Partner filtered out:', {
          id: partner.id,
          matchesSearch,
          matchesStatus,
          searchTerm,
          statusFilter,
          is_verified: partner.is_verified,
          verification_status: partner.verification_status
        });
      }
      
      return matches;
    });
    
    console.log('✅ Filtered partners count:', filtered.length, 'out of', partnersList.length);
    console.log('✅ Filtered partner IDs:', filtered.map(p => p?.id || p?.pk || 'no-id'));
    
    if (filtered.length < partnersList.length) {
      console.warn('⚠️ Some partners were filtered out!');
      const filteredOut = partnersList.filter(p => !filtered.includes(p));
      console.warn('⚠️ Filtered out partners:', filteredOut.map(p => ({
        id: p?.id || p?.pk,
        name: p?.name || p?.company_name || p?.business_name,
        email: p?.email || p?.user?.email,
        is_verified: p?.is_verified,
        verification_status: p?.verification_status
      })));
    }
    
    return filtered;
  }, [partnersList, searchTerm, statusFilter]);

  const handleViewPartner = async (partnerId) => {
    try {
      const response = await adminService.getPartnerById(partnerId);
      // Handle different response structures
      const partnerData = response?.data || response?.result?.data || response?.result || response;
      
      // If we already have the partner in the list, use that for better performance
      const existingPartner = partnersList.find(p => p.id === partnerId);
      if (existingPartner) {
        setSelectedPartner(existingPartner);
      } else {
        setSelectedPartner(partnerData);
      }
      setShowDetailsModal(true);
    } catch (error) {
      // If API fails, try using partner from the list
      const existingPartner = partnersList.find(p => p.id === partnerId);
      if (existingPartner) {
        setSelectedPartner(existingPartner);
        setShowDetailsModal(true);
        addToast('Loaded partner from cache (API unavailable)', 'info');
      } else {
        addToast(`Failed to load partner details: ${error?.message || 'Unknown error'}`, 'error');
        console.error('Error loading partner:', error);
      }
    }
  };

  const handleEditPartner = async (partner) => {
    // For now, show a toast. In the future, you can open an edit modal
    addToast(`Edit partner feature for ${partner.name || partner.email} - Coming soon`, 'info');
    console.log('Edit partner:', partner);
    // TODO: Implement edit modal
  };

  const handleDeletePartner = async (partnerId) => {
    const partner = partnersList.find(p => p.id === partnerId);
    const partnerName = partner?.name || partner?.email || `Partner #${partnerId}`;
    
    if (!window.confirm(`Are you sure you want to delete ${partnerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.deletePartner(partnerId);
      addToast(`Partner ${partnerName} deleted successfully`, 'success');
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to delete partner. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to delete partner: ${errorMessage}`, 'error');
      }
      console.error('Error deleting partner:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Name', 'Email', 'Company', 'Status', 'Phone', 'Created At'].join(','),
        ...filteredPartners.map(partner => [
          `"${(partner.name || 'N/A').replace(/"/g, '""')}"`,
          `"${(partner.email || 'N/A').replace(/"/g, '""')}"`,
          `"${(partner.company_name || 'N/A').replace(/"/g, '""')}"`,
          partner.is_verified ? 'Verified' : 'Pending',
          partner.phone || 'N/A',
          partner.created_at ? new Date(partner.created_at).toLocaleDateString() : 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `partners_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast('Partners exported successfully', 'success');
    } catch (error) {
      addToast('Failed to export partners', 'error');
      console.error('Error exporting partners:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Partners Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            {partnersList.length !== filteredPartners.length ? (
              <>
                Showing: {Array.isArray(filteredPartners) ? filteredPartners.length : 0} of {partnersList.length} partner{partnersList.length !== 1 ? 's' : ''}
                {(searchTerm || statusFilter !== "all") && (
                  <span className="text-blue-600 ml-2">(filtered)</span>
                )}
              </>
            ) : (
              <>
                Total: {Array.isArray(filteredPartners) ? filteredPartners.length : 0} partner{(filteredPartners?.length || 0) !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <SelectField
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Partners' },
                { value: 'verified', label: 'Verified' },
                { value: 'pending', label: 'Pending' },
              ]}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-2">Error loading partners</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <p className="text-red-500 text-xs mt-4">
              Check browser console (F12) for detailed error information
            </p>
          </div>
        </div>
      ) : (!Array.isArray(filteredPartners) || filteredPartners.length === 0) && (!Array.isArray(partnersList) || partnersList.length === 0) ? (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No partners found</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "There are no partners registered yet. Partners will appear here once they register."}
          </p>
          {partnersList.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto text-left">
              <p className="text-yellow-800 font-medium mb-2">Debug Info:</p>
              <p className="text-yellow-700 text-xs mb-2">
                Total partners received: {partnersList.length}
              </p>
              <p className="text-yellow-700 text-xs mb-2">
                Filtered partners: {filteredPartners.length}
              </p>
              <p className="text-yellow-700 text-xs mb-2">
                Search term: "{searchTerm}" | Status filter: "{statusFilter}"
              </p>
              <details className="text-yellow-700 text-xs">
                <summary className="cursor-pointer font-medium">Show raw partner data</summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(partnersList[0], null, 2)}
                </pre>
              </details>
            </div>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          )}
          <p className="text-gray-400 text-xs mt-4">
            Check browser console (F12) for API response details
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPartners.map((partner, index) => (
                <motion.tr
                  key={partner.id || partner.pk || `partner-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                        {partner.name?.[0] || partner.user?.first_name?.[0] || partner.user?.email?.[0] || partner.email?.[0] || partner.company_name?.[0] || partner.business_name?.[0] || 'P'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {partner.name || 
                           (partner.user ? `${partner.user.first_name || ''} ${partner.user.last_name || ''}`.trim() : '') ||
                           partner.company_name || 
                           partner.business_name || 
                           'N/A'}
                        </div>
                        {(partner.phone || partner.user?.phone) && (
                          <div className="text-sm text-gray-500">{partner.phone || partner.user?.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {partner.email || partner.user?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {partner.company_name || partner.business_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (partner.is_verified || partner.verification_status === 'approved') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(partner.is_verified || partner.verification_status === 'approved') ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 flex-wrap">
                      {/* Verification Actions - Always visible for manual verification */}
                      {!(partner.is_verified || partner.verification_status === 'approved') ? (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                const success = await onApprove?.(partner.id);
                                if (success !== false) {
                                  addToast(`Partner verified successfully`, 'success');
                                  if (onRefresh) await onRefresh();
                                } else {
                                  addToast(`Failed to verify partner`, 'error');
                                }
                              } catch (error) {
                                addToast(`Error: ${error?.message || 'Failed to verify partner'}`, 'error');
                              }
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1 transition-colors px-2 py-1 rounded hover:bg-green-50"
                            title="Verify partner"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Verify</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to reject ${partner.name || partner.email || partner.company_name || 'this partner'}?`)) {
                                try {
                                  const success = await onReject?.(partner.id);
                                  if (success !== false) {
                                    addToast(`Partner rejected`, 'success');
                                    if (onRefresh) await onRefresh();
                                  } else {
                                    addToast(`Failed to reject partner`, 'error');
                                  }
                                } catch (error) {
                                  addToast(`Error: ${error?.message || 'Failed to reject partner'}`, 'error');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
                            title="Reject partner"
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">Reject</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to unverify ${partner.name || partner.email || partner.company_name || 'this partner'}?`)) {
                              try {
                                const success = await onUnverify?.(partner.id);
                                if (success !== false) {
                                  addToast(`Partner unverified`, 'success');
                                  if (onRefresh) await onRefresh();
                                } else {
                                  addToast(`Failed to unverify partner`, 'error');
                                }
                              } catch (error) {
                                addToast(`Error: ${error?.message || 'Failed to unverify partner'}`, 'error');
                              }
                            }
                          }}
                          className="text-orange-600 hover:text-orange-900 flex items-center space-x-1 transition-colors px-2 py-1 rounded hover:bg-orange-50"
                          title="Unverify partner"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">Unverify</span>
                        </button>
                      )}
                      
                      {/* Other Actions */}
                      <button
                        onClick={() => handleViewPartner(partner.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditPartner(partner)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                        title="Edit partner"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(partner.id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete partner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Partner Details Modal */}
      <PartnerDetailsModal
        partner={selectedPartner}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPartner(null);
        }}
        onEdit={handleEditPartner}
        onDelete={handleDeletePartner}
        onApprove={async (partnerId) => {
          const success = await onApprove?.(partnerId);
          if (success) {
            addToast(`Partner verified successfully`, 'success');
            if (onRefresh) await onRefresh();
          } else {
            addToast(`Failed to verify partner`, 'error');
          }
        }}
        onReject={async (partnerId) => {
          const success = await onReject?.(partnerId);
          if (success) {
            addToast(`Partner rejected`, 'success');
            if (onRefresh) await onRefresh();
          } else {
            addToast(`Failed to reject partner`, 'error');
          }
        }}
        onUnverify={async (partnerId) => {
          const success = await onUnverify?.(partnerId);
          if (success) {
            addToast(`Partner unverified`, 'success');
            if (onRefresh) await onRefresh();
          } else {
            addToast(`Failed to unverify partner`, 'error');
          }
        }}
      />
    </div>
  );
}

