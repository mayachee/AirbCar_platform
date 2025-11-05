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
      const usersData = await adminService.getUsers().catch(err => {
        // Handle timeout and network errors gracefully
        if (err?.isTimeoutError || err?.isNetworkError) {
          console.warn('Users API timeout/network error, using empty list');
          return { results: [], data: [] };
        }
        throw err; // Re-throw other errors
      });
      
      // Handle different response structures
      let usersList = [];
      
      if (Array.isArray(usersData)) {
        usersList = usersData;
      } else if (usersData?.data) {
        usersList = Array.isArray(usersData.data) ? usersData.data : 
                   (usersData.data.results || []);
      } else if (usersData?.results) {
        usersList = Array.isArray(usersData.results) ? usersData.results : [];
      } else if (usersData) {
        const responseData = usersData?.data || usersData?.result || usersData;
        usersList = Array.isArray(responseData) ? responseData : [];
      }
      
      // Ensure we always set an array
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error('Error loading users:', err);
      // Don't set error for timeout/network errors - just use empty array
      if (!err?.isTimeoutError && !err?.isNetworkError) {
        setError(err.message);
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

