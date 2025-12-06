'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/features/admin';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      let response;
      try {
        response = await adminService.getUsers();
      } catch (err) {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.error('❌ Users API timeout/network error:', err.message);
          setError(`Network error: ${err.message || 'Unable to connect to server. Please check if the backend is running.'}`);
          setLoading(false);
          return;
        }
        // Handle permission errors (403)
        if (err?.status === 403) {
          console.error('❌ Permission denied (403):', err.message);
          setError(`Permission denied: ${err.message || 'You do not have permission to view users.'}`);
          setLoading(false);
          return;
        }
        // Handle other errors
        console.error('❌ Users API error:', err);
        setError(err.message || 'Failed to load users');
        setLoading(false);
        return;
      }
      // Extract data from API response
      // Backend UserListView returns: { data: [...] }
      // apiClient wraps it to: { data: { data: [...] }, success: true }
      let usersList = [];
      
      if (!response) {
        // Error already set in catch block above
        setUsers([]);
        setFilteredUsers([]);
        return;
      } else if (Array.isArray(response)) {
        // Direct array response (unlikely but handle it)
        usersList = response;
      } else if (response.data !== undefined) {
        // apiClient wrapped response - extract inner data
        const innerData = response.data;
        
        // Check if innerData is the array directly (backend returned array)
        if (Array.isArray(innerData)) {
          usersList = innerData;
        } 
        // Check if innerData has a data property (backend returned { data: [...] })
        else if (innerData && typeof innerData === 'object' && innerData.data !== undefined) {
          if (Array.isArray(innerData.data)) {
            usersList = innerData.data;
          }
        }
        // Check for paginated results
        else if (innerData && typeof innerData === 'object' && innerData.results !== undefined) {
          if (Array.isArray(innerData.results)) {
            usersList = innerData.results;
          }
        }
        // Check if innerData is null or empty
        else if (innerData === null || innerData === undefined) {
          usersList = [];
        }
        // If innerData is an object but no array found, try to find any array-like structure
        else if (innerData && typeof innerData === 'object') {
          for (const key in innerData) {
            if (Array.isArray(innerData[key])) {
              usersList = innerData[key];
              break;
            }
          }
        }
      } else {
        usersList = [];
      }
      
      setUsers(usersList);
      // Also set filteredUsers immediately (filtering useEffect will update it if needed)
      setFilteredUsers(usersList);
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading users:', error);
      }
      setError(error.message || 'Failed to load users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  useEffect(() => {
    console.log('🔍 Filtering users...', {
      totalUsers: users.length,
      searchTerm,
      statusFilter,
      usersIsArray: Array.isArray(users),
      firstUser: users[0]
    });
    
    // If users is empty or not an array, don't filter
    if (!Array.isArray(users) || users.length === 0) {
      console.warn('⚠️ Filtering skipped - users is empty or not an array');
      setFilteredUsers([]);
      return;
    }
    
    let filtered = [...users]; // Create a copy to avoid mutation

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length, 'users');
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user =>
        statusFilter === "active" ? user.is_active : !user.is_active
      );
      console.log('🔍 After status filter:', filtered.length, 'users');
    }

    console.log('✅ Setting filteredUsers to:', filtered.length, 'users');
    console.log('✅ Filtered users sample:', filtered.slice(0, 2));
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Actions
  const handleView = async (user) => {
    try {
      // Fetch fresh user data
      const response = await adminService.getUserById(user.id);
      console.log('User details response:', response);
      // Extract data from response
      const userData = response?.data || response;
      console.log('User details:', userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

  const handleEdit = async (user, updatedData) => {
    try {
      const response = await adminService.updateUser(user.id, updatedData);
      // Extract data from response
      const updatedUser = response?.data || response;
      await loadUsers(); // Reload users after update
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.username || user.email}?`)) {
      return;
    }
    
    try {
      await adminService.deleteUser(user.id);
      await loadUsers(); // Reload users after deletion
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleCreate = async (userData) => {
    try {
      const response = await adminService.createUser(userData);
      // Extract data from response
      const newUser = response?.data || response;
      await loadUsers(); // Reload users after creation
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  return {
    users: filteredUsers, // Return filtered users for display
    currentUsers,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers: filteredUsers.length,
    handleView,
    handleEdit,
    handleDelete,
    handleCreate,
    refetch: loadUsers
  };
};

