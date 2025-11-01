"use client";

import { useState } from "react";
import { useUsers, useAdminAuth } from "../hooks";
import { 
  UsersSidebar, 
  UsersFilters, 
  UsersTable, 
  UsersHeader, 
  UserModal, 
  LoadingSpinner,
  AdminLayout
} from "../components";
import { useExport } from "../hooks";

export default function AdminUsersPage() {
  const { checking, handleSignOut } = useAdminAuth();
  const { exportUsers, loading: exportLoading } = useExport();
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');

  const {
    users,
    currentUsers,
    loading: usersLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers,
    handleView,
    handleEdit,
    handleDelete,
    handleCreate
  } = useUsers();

  const handleViewUser = async (user) => {
    try {
      // Fetch fresh user data
      const userData = await handleView(user);
      setSelectedUser(userData);
      setModalMode('view');
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback to the user object from the list
      setSelectedUser(user);
      setModalMode('view');
      setModalOpen(true);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveUser = async (userId, updatedData) => {
    try {
      await handleEdit({ id: userId }, updatedData);
      setModalOpen(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleExport = async () => {
    const success = await exportUsers();
    if (success) {
      alert('Users exported successfully!');
    } else {
      alert('Failed to export users. Check console for details.');
    }
  };

  return (
    <>
      <AdminLayout
        sidebar={<UsersSidebar onSignOut={handleSignOut} />}
        loading={checking}
      >
          {/* Header */}
          <UsersHeader 
            totalUsers={totalUsers} 
            onExport={handleExport} 
            exportLoading={exportLoading} 
          />

        {/* Filters */}
        <UsersFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Table */}
        <UsersTable
          users={users}
          loading={usersLoading}
          onView={handleViewUser}
          onEdit={handleEditUser}
          onDelete={handleDelete}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          usersPerPage={10}
        />
      </AdminLayout>

      {/* User Modal */}
      <UserModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
      />
    </>
  );
}
