'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/features/admin';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      console.log('Loading users...');
      const usersData = await adminService.getUsers();
      console.log('Users data received:', usersData);
      
      // Handle both paginated and direct array responses
      let usersList = [];
      if (usersData && usersData.results) {
        usersList = usersData.results;
      } else if (usersData && Array.isArray(usersData)) {
        usersList = usersData;
      }
      
      console.log('Processed users list:', usersList);
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user =>
        statusFilter === "active" ? user.is_active : !user.is_active
      );
    }

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
      const userData = await adminService.getUserById(user.id);
      console.log('User details:', userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

  const handleEdit = async (user, updatedData) => {
    try {
      const updatedUser = await adminService.updateUser(user.id, updatedData);
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
      const newUser = await adminService.createUser(userData);
      await loadUsers(); // Reload users after creation
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  return {
    users: filteredUsers,
    currentUsers,
    loading,
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

