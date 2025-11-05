'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle, XCircle, Download, Eye, UserCheck, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/ToastContext';
import PartnerDetailsModal from './PartnerDetailsModal';
import { adminService } from '@/features/admin/services/adminService';

export default function PartnersTable({ partners, loading, onApprove, onReject, onRefresh }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Ensure partners is always an array
  const partnersList = Array.isArray(partners) ? partners : (partners?.results || partners?.data || []);

  const filteredPartners = useMemo(() => {
    if (!Array.isArray(partnersList)) {
      return [];
    }
    return partnersList.filter(partner => {
      const matchesSearch = 
        partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "verified" && partner.is_verified) ||
        (statusFilter === "pending" && !partner.is_verified);
      
      return matchesSearch && matchesStatus;
    });
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
            Total: {Array.isArray(filteredPartners) ? filteredPartners.length : 0} partner{(filteredPartners?.length || 0) !== 1 ? 's' : ''}
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Partners</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
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

      {!Array.isArray(filteredPartners) || filteredPartners.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No partners found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
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
                  key={partner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                        {partner.name?.[0] || partner.email?.[0] || 'P'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{partner.name || 'N/A'}</div>
                        {partner.phone && (
                          <div className="text-sm text-gray-500">{partner.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.company_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      partner.is_verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {partner.is_verified ? (
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
                    <div className="flex items-center space-x-2">
                      {!partner.is_verified && (
                        <>
                          <button
                                      onClick={async () => {
                              try {
                                const success = await onApprove?.(partner.id);
                                if (success !== false) {
                                  addToast(`Partner ${partner.name || partner.email} approved successfully`, 'success');
                                } else {
                                  addToast(`Failed to approve partner ${partner.name || partner.email}`, 'error');
                                }
                              } catch (error) {
                                addToast(`Error: ${error?.message || 'Failed to approve partner'}`, 'error');
                              }
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to reject ${partner.name || partner.email}?`)) {
                                try {
                                  const success = await onReject?.(partner.id);
                                  if (success !== false) {
                                    addToast(`Partner ${partner.name || partner.email} rejected`, 'success');
                                  } else {
                                    addToast(`Failed to reject partner ${partner.name || partner.email}`, 'error');
                                  }
                                } catch (error) {
                                  addToast(`Error: ${error?.message || 'Failed to reject partner'}`, 'error');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
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
            addToast(`Partner approved successfully`, 'success');
            if (onRefresh) await onRefresh();
          } else {
            addToast(`Failed to approve partner`, 'error');
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
      />
    </div>
  );
}

