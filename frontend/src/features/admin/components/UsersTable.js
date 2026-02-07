'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Users, Download, Ban, CheckCircle, ArrowUpDown, RefreshCw, Shield, UserCheck, User, Mail, Phone, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/features/admin/services/adminService';
import { useToast } from '@/contexts/ToastContext';
import UserDetailsModal from './UserDetailsModal';
import { SelectField } from '@/components/ui/select-field';

export default function UsersTable({ users, loading, error: propError, onRefresh }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date_joined', direction: 'desc' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure users is an array
  const usersList = Array.isArray(users) ? users : [];

  // Helpers
  const getUserRole = (user) => {
    if (user.is_superuser || user.is_staff) return 'admin';
    if (user.is_partner || user.role === 'partner') return 'partner';
    return user.role || 'customer';
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', icon: Shield, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' };
      case 'partner':
        return { label: 'Partner', icon: UserCheck, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' };
      default:
        return { label: 'Customer', icon: User, bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' };
    }
  };

  const getAvatarColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500 dark:bg-red-600';
      case 'partner': return 'bg-blue-500 dark:bg-blue-600';
      default: return 'bg-gray-400 dark:bg-gray-600';
    }
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const getProfileImage = (user) => {
    return user.profile_picture_url || user.profile_image_url || user.profile_image || null;
  };

  const getFullName = (user) => {
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.username && user.username !== user.email) return user.username;
    return 'No Name';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
    return `${Math.floor(diff / 365)}y ago`;
  };

  // Stats
  const stats = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter(u => u.is_active).length;
    const admins = usersList.filter(u => getUserRole(u) === 'admin').length;
    const partners = usersList.filter(u => getUserRole(u) === 'partner').length;
    const customers = total - admins - partners;
    return { total, active, inactive: total - active, admins, partners, customers };
  }, [usersList]);

  // Filtering & Sorting
  const filteredUsers = useMemo(() => {
    let filtered = usersList.filter(user => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        user.email?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term) ||
        user.phone_number?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      const role = getUserRole(user);
      const matchesRole =
        roleFilter === "all" ||
        roleFilter === role;

      return matchesSearch && matchesStatus && matchesRole;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'date_joined' || sortConfig.key === 'last_login') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else if (sortConfig.key === 'role') {
          aVal = getUserRole(a);
          bVal = getUserRole(b);
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [usersList, searchTerm, statusFilter, roleFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, roleFilter]);

  // Handlers
  const handleViewUser = async (userId) => {
    try {
      const response = await adminService.getUserById(userId);
      let userData = response?.data || response?.result || response;
      if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
        setSelectedUser(userData);
      } else {
        const cached = usersList.find(u => u.id === userId);
        setSelectedUser(cached || null);
      }
      setShowDetailsModal(true);
    } catch (error) {
      const cached = usersList.find(u => u.id === userId);
      if (cached) {
        setSelectedUser(cached);
        setShowDetailsModal(true);
      } else {
        addToast(`Failed to load user: ${error?.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleEditUser = (user) => {
    addToast(`Edit feature for ${user?.email || user?.id} — coming soon`, 'info');
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      const response = await adminService.updateUser(userId, { is_active: !isActive });
      if (response?.success !== false) {
        addToast(`User ${isActive ? 'deactivated' : 'activated'}`, 'success');
        if (onRefresh) await onRefresh();
      } else {
        addToast(`Failed to update user status`, 'error');
      }
    } catch (error) {
      addToast(`Failed to update: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = usersList.find(u => u.id === userId);
    const name = user?.email || `User #${userId}`;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    try {
      await adminService.deleteUser(userId);
      addToast(`${name} deleted`, 'success');
      if (onRefresh) await onRefresh();
    } catch (error) {
      addToast(`Failed to delete: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    addToast('Users refreshed', 'success');
    setIsRefreshing(false);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'Joined', 'Nationality'].join(','),
        ...filteredUsers.map(user => [
          user.id || '',
          `"${getFullName(user).replace(/"/g, '""')}"`,
          `"${(user.email || '').replace(/"/g, '""')}"`,
          `"${(user.phone_number || '').replace(/"/g, '""')}"`,
          getUserRole(user),
          user.is_active ? 'Active' : 'Inactive',
          user.is_verified ? 'Yes' : 'No',
          user.date_joined ? new Date(user.date_joined).toLocaleDateString() : '',
          `"${(user.nationality || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Exported successfully', 'success');
    } catch (error) {
      addToast('Export failed', 'error');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.active} active</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Customers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.customers}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Partners</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.partners}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Admins</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.admins}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Users Management</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredUsers.length} of {usersList.length} users
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <SelectField
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />

            <SelectField
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'admin', label: 'Admins' },
                { value: 'partner', label: 'Partners' },
                { value: 'customer', label: 'Customers' },
              ]}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 sm:p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              {propError ? (
                <>
                  <p className="text-red-600 dark:text-red-400 font-medium text-lg mb-2">Error Loading Users</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{propError}</p>
                  {(propError.includes('Permission') || propError.includes('403')) && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">🔒 Admin permissions required</p>
                    </div>
                  )}
                </>
              ) : usersList.length === 0 ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No users in database</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Users will appear here once they register</p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No users match your filters</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRoleFilter('all'); }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                        onClick={() => handleSort('first_name')}
                      >
                        <div className="flex items-center gap-1">
                          <span>User</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 hidden sm:table-cell"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Contact</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 hidden lg:table-cell"
                        onClick={() => handleSort('date_joined')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Joined</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedUsers.map((user, index) => {
                      const role = getUserRole(user);
                      const roleBadge = getRoleBadge(role);
                      const RoleIcon = roleBadge.icon;
                      const profileImage = getProfileImage(user);

                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => handleViewUser(user.id)}
                        >
                          {/* User cell — avatar + name + role on mobile */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                {profileImage ? (
                                  <img
                                    src={profileImage}
                                    alt={getFullName(user)}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                    onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                  />
                                ) : null}
                                <div
                                  className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getAvatarColor(role)} ${profileImage ? 'hidden' : ''}`}
                                >
                                  {getInitials(user)}
                                </div>
                                {/* Online indicator */}
                                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${
                                  user.is_active ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                              </div>
                              {/* Name + email on mobile */}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {getFullName(user)}
                                </p>
                                {/* Show email on mobile since Contact column is hidden */}
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate sm:hidden">
                                  {user.email}
                                </p>
                                {/* Show role badge on mobile since Role column is hidden */}
                                <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold md:hidden ${roleBadge.bg} ${roleBadge.text}`}>
                                  <RoleIcon className="h-2.5 w-2.5" />
                                  {roleBadge.label}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact — hidden on mobile */}
                          <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[200px]">{user.email}</span>
                              </div>
                              {user.phone_number && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span>{user.phone_number}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Role — hidden on mobile */}
                          <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
                              <RoleIcon className="h-3 w-3" />
                              {roleBadge.label}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                                user.is_active
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                              {user.is_verified && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Joined — hidden on small screens */}
                          <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">{formatDate(user.date_joined)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeDate(user.date_joined)}</p>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewUser(user.id); }}
                                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditUser(user); }}
                                className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleActive(user.id, user.is_active); }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  user.is_active
                                    ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                    : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                                title={user.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                    <SelectField
                      value={String(itemsPerPage)}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      options={[
                        { value: '10', label: '10' },
                        { value: '25', label: '25' },
                        { value: '50', label: '50' },
                        { value: '100', label: '100' },
                      ]}
                      className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-1 text-gray-400 dark:text-gray-600">…</span>;
                      }
                      return null;
                    })}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedUser(null); }}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
