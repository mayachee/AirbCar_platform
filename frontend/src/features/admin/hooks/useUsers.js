'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading users...');
      console.log('🔄 Using adminService.getUsers() - this calls apiClient.get("/users/")');
      
      let response;
      try {
        response = await adminService.getUsers();
        console.log('✅ API call successful');
      } catch (err) {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('⚠️ Users API timeout/network error:', err.message);
          setUsers([]);
          setLoading(false);
          return;
        }
        // Handle permission errors
        if (err?.message?.includes('403') || err?.message?.includes('permission') || err?.message?.includes('forbidden')) {
          console.error('❌ Permission denied: You do not have access to view users');
          setError('Permission denied: You do not have access to view users');
          setUsers([]);
          setLoading(false);
          return;
        }
        throw err; // Re-throw other errors
      }
      
      console.log('📦 Users response received:', response);
      console.log('📦 Response type:', typeof response);
      console.log('📦 Response is array?', Array.isArray(response));
      console.log('📦 Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      console.log('📦 Response.data type:', typeof response?.data);
      console.log('📦 Response.data is array?', Array.isArray(response?.data));
      console.log('📦 Response.data keys:', response?.data && typeof response?.data === 'object' ? Object.keys(response.data) : 'N/A');
      
      // Handle different response structures from apiClient
      // apiClient wraps response in { data: T, success: boolean }
      let usersList = [];
      
      if (!response) {
        console.warn('⚠️ No response received (likely network error)');
        setUsers([]);
        return;
      } else if (Array.isArray(response)) {
        // Direct array response
        usersList = response;
        console.log('✅ Extracted users from direct array response');
      } else if (response.data !== undefined) {
        // API client wraps response in { data: ... }
        const innerData = response.data;
        if (Array.isArray(innerData)) {
          usersList = innerData;
          console.log('✅ Extracted users from response.data array');
        } else if (innerData && typeof innerData === 'object' && innerData.data !== undefined) {
          // Nested structure: { data: { data: [...] } }
          if (Array.isArray(innerData.data)) {
            usersList = innerData.data;
            console.log('✅ Extracted users from response.data.data array');
          }
        } else if (innerData && typeof innerData === 'object' && innerData.results !== undefined) {
          // Paginated structure: { data: { results: [...] } }
          if (Array.isArray(innerData.results)) {
            usersList = innerData.results;
            console.log('✅ Extracted users from response.data.results array');
          }
        } else if (innerData && typeof innerData === 'object') {
          // Try to find any array property
          for (const key in innerData) {
            if (Array.isArray(innerData[key])) {
              usersList = innerData[key];
              console.log(`✅ Extracted users from response.data.${key} array`);
              break;
            }
          }
        }
      } else {
        console.warn('⚠️ Unexpected response structure - no data property');
        usersList = [];
      }
      
      console.log('✅ Processed users list:', usersList);
      console.log(`✅ Total users extracted: ${usersList.length}`);
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error('❌ Error loading users:', err);
      console.error('❌ Error details:', {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        isTimeoutError: err?.isTimeoutError,
        isNetworkError: err?.isNetworkError
      });
      if (!err?.isTimeoutError && !err?.isNetworkError) {
        setError(err.message || 'Failed to load users');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (userId, userData) => {
    try {
      await adminService.updateUser(userId, userData);
      // Optimistically update local state
      setUsers(prev => {
        const usersArray = Array.isArray(prev) ? prev : [];
        return usersArray.map(user => 
          user.id === userId 
            ? { ...user, ...userData }
            : user
        );
      });
      // Then reload to get fresh data
      await loadUsers();
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      return false;
    }
  };

  const deleteUser = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      await loadUsers();
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      return false;
    }
  };

  const createUser = async (userData) => {
    try {
      const created = await adminService.createUser(userData);
      await loadUsers();
      return created;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  const getUserById = async (userId) => {
    try {
      const response = await adminService.getUserById(userId);
      return response?.data || response?.result || response;
    } catch (err) {
      console.error('Error fetching user:', err);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    updateUser,
    deleteUser,
    createUser,
    getUserById,
    refetch: loadUsers
  };
};

