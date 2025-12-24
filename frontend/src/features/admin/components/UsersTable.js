'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Users, Download, Link as LinkIcon, ExternalLink, Ban, CheckCircle, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/features/admin/services/adminService';
import { useToast } from '@/contexts/ToastContext';
import UserDetailsModal from './UserDetailsModal';
import { SelectField } from '@/components/ui/select-field';

export default function UsersTable({ users, loading, error: propError, onRefresh }) {
  const { addToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const usersApiUrl = `${apiUrl}/users/`;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAll, setShowAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Ensure users is an array
  const usersList = Array.isArray(users) ? users : [];

  const filteredUsers = useMemo(() => {
    let filtered = usersList.filter(user => {
      const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "active" && user.is_active) ||
                           (statusFilter === "inactive" && !user.is_active);
      
      const matchesRole = roleFilter === "all" ||
                         (roleFilter === "admin" && (user.is_superuser || user.is_staff)) ||
                         (roleFilter === "partner" && user.is_partner) ||
                         (roleFilter === "user" && !user.is_superuser && !user.is_staff && !user.is_partner);
      
      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'date_joined' || sortConfig.key === 'last_login') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        // Handle string sorting
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [usersList, searchTerm, statusFilter, roleFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Pagination - Show all if showAll is true
  const totalPages = showAll ? 1 : Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = showAll ? filteredUsers.length : startIndex + itemsPerPage;
  const paginatedUsers = showAll ? filteredUsers : filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  const handleViewUser = async (userId) => {
    try {
      console.log('🔄 Loading fresh user data from database for ID:', userId);
      const response = await adminService.getUserById(userId);
      
      console.log('📦 User API Response:', {
        responseType: typeof response,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : [],
        userId: userId
      });
      
      // Extract user data from API response - prioritize fresh API data
      let userData = null;
      if (response) {
        if (response.data) {
          userData = response.data;
        } else if (response.result) {
          userData = response.result;
        } else if (typeof response === 'object' && !Array.isArray(response)) {
          userData = response;
        }
      }
      
      if (userData) {
        console.log('✅ Using fresh user data from database:', {
          id: userData.id,
          email: userData.email,
          username: userData.username
        });
        setSelectedUser(userData);
      } else {
        // Fallback to cached user if API didn't return valid data
        const existingUser = users.find(u => u.id === userId);
        if (existingUser) {
          console.warn('⚠️ No valid data from API, using cached user data');
          setSelectedUser(existingUser);
        } else {
          throw new Error('User not found in API response or cache');
        }
      }
      setShowDetailsModal(true);
    } catch (error) {
      console.error('❌ Error loading user from database:', error);
      // Fallback to user from list cache
      const existingUser = users.find(u => u.id === userId);
      if (existingUser) {
        console.warn('⚠️ Using cached user data due to API error');
        setSelectedUser(existingUser);
        setShowDetailsModal(true);
        addToast('Loaded user from cache (API unavailable)', 'info');
      } else {
        addToast(`Failed to load user details: ${error?.message || 'Unknown error'}`, 'error');
        console.error('Error loading user:', error);
      }
    }
  };

  const handleEditUser = async (user) => {
    // For now, show a toast. In the future, you can open an edit modal
    addToast(`Edit user feature for ${user?.email || user?.id} - Coming soon`, 'info');
    console.log('Edit user:', user);
    // TODO: Implement edit modal
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      // Update user active status via backend API
      const response = await adminService.updateUser(userId, { is_active: !isActive });
      
      if (response?.success !== false) {
        addToast(`User ${isActive ? 'deactivated' : 'activated'} successfully`, 'success');
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        addToast(`Failed to ${isActive ? 'deactivate' : 'activate'} user`, 'error');
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to reach the server. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to ${isActive ? 'deactivate' : 'activate'} user: ${errorMessage}`, 'error');
      }
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.email || `User #${userId}`;
    
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      addToast(`User ${userName} deleted successfully`, 'success');
      
      // Refresh the users list
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      // Check for network errors
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to reach the server. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to delete user: ${errorMessage}`, 'error');
      }
      console.error('Error deleting user:', error);
    }
  };

  const handleExport = async () => {
    try {
      // Try to use API endpoint first if available
      try {
        const response = await adminService.exportUsers();
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        addToast('Users exported successfully from API', 'success');
      } catch (apiError) {
        // Check if it's a network error
        const errorMessage = apiError?.message || '';
        if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
          console.warn('API export failed due to network error, using client-side export');
        } else {
          console.warn('API export endpoint not available, using client-side export:', apiError);
        }
        
        // Fallback to client-side CSV generation
        const csvContent = [
          ['Name', 'Email', 'Role', 'Status', 'Joined Date'].join(','),
          ...filteredUsers.map(user => [
            `"${(`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A').replace(/"/g, '""')}"`,
            `"${(user.email || 'N/A').replace(/"/g, '""')}"`,
            user.role || 'customer',
            user.is_active ? 'Active' : 'Inactive',
            user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        addToast('Users exported successfully (client-side)', 'success');
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        addToast('Network error: Unable to export. Please check if the backend is running.', 'error');
      } else {
        addToast(`Failed to export users: ${errorMessage}`, 'error');
      }
      console.error('Error exporting users:', error);
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
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Debug logging
  useEffect(() => {
    console.log('👥 Users Management Debug:', {
      usersType: typeof users,
      usersIsArray: Array.isArray(users),
      usersLength: usersList.length,
      filteredUsersLength: filteredUsers.length,
      paginatedUsersLength: paginatedUsers.length,
      loading,
      itemsPerPage,
      currentPage,
      totalPages,
      showAll
    });
  }, [users, usersList.length, filteredUsers.length, paginatedUsers.length, loading, itemsPerPage, currentPage, totalPages, showAll]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Users Management</h3>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {usersList.length} Total User{usersList.length !== 1 ? 's' : ''}
              </span>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Connected to backend"></div>
              <span className="text-xs text-gray-500">API: {apiUrl}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            {filteredUsers.length !== usersList.length && (
              <span className="text-gray-400 ml-2">
                (from {usersList.length} total)
              </span>
            )}
          </p>
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
            <LinkIcon className="h-3 w-3" />
            <span>Endpoint: </span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{usersApiUrl}</code>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <SelectField
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <SelectField
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'admin', label: 'Admin' },
                { value: 'partner', label: 'Partner' },
                { value: 'user', label: 'User' },
              ]}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Show All Toggle */}
          <button
            onClick={() => {
              setShowAll(!showAll);
              setCurrentPage(1);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showAll
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={showAll ? 'Show paginated view' : 'Show all users at once'}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{showAll ? 'Show Pages' : 'Show All'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh users from database"
          >
            <ChevronRight className={`h-4 w-4 transform transition-transform ${loading ? 'rotate-90 animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

          <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Users table with pagination</caption>
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('first_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>User</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date_joined')}
              >
                <div className="flex items-center space-x-1">
                  <span>Joined</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.first_name?.[0] || user.email?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : 'No Name'
                        }
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-800'
                      : user.role === 'partner'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role || 'customer'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewUser(user.id)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`p-1 rounded transition-colors ${
                        user.is_active
                          ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          {propError ? (
            <>
              <p className="text-red-600 font-medium mb-2">Error Loading Users</p>
              <p className="text-gray-500 text-sm mb-4">{propError}</p>
              {propError.includes('Permission denied') || propError.includes('403') ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-800 text-sm font-medium mb-2">🔒 Permission Required</p>
                  <p className="text-yellow-700 text-xs">You need admin permissions to view users. Please contact your system administrator.</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-blue-800 text-sm font-medium mb-2">Troubleshooting Tips:</p>
                  <ul className="text-blue-700 text-xs text-left space-y-1">
                    <li>• Check if the backend server is running</li>
                    <li>• Verify your authentication token is valid</li>
                    <li>• Check browser console for more details</li>
                    <li>• Try refreshing the page</li>
                  </ul>
                </div>
              )}
            </>
          ) : usersList.length === 0 ? (
            <>
              <p className="text-gray-500 font-medium">No users in database</p>
              <p className="text-gray-400 text-sm mt-1">Users will appear here once they register</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium">No users match your filters</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Pagination - Hide when showing all */}
      {filteredUsers.length > 0 && !showAll && totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Items per page:</label>
            <SelectField
              value={String(itemsPerPage)}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: '5', label: '5' },
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' },
              ]}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedUser(null);
        }}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
