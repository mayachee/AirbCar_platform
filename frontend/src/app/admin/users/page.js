"use client";

import { useState, useEffect } from "react";
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
    error: usersError,
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
    handleCreate,
    refetch: refetchUsers
  } = useUsers();

  // Debug logging in page component
  console.log('📄 AdminUsersPage - users from hook:', users);
  console.log('📄 AdminUsersPage - users length:', Array.isArray(users) ? users.length : 'N/A');
  console.log('📄 AdminUsersPage - totalUsers:', totalUsers);
  console.log('📄 AdminUsersPage - loading:', usersLoading);
  console.log('📄 AdminUsersPage - error:', usersError);

  // DIRECT TEST: Fetch users directly to verify API works
  useEffect(() => {
    const testDirectFetch = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        console.log('🧪 DIRECT TEST: Fetching from', `${apiUrl}/users/`);
        const response = await fetch(`${apiUrl}/users/`, { headers });
        const data = await response.json();
        
        console.log('🧪 DIRECT TEST RESULT:', {
          status: response.status,
          ok: response.ok,
          dataType: typeof data,
          isArray: Array.isArray(data),
          keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A',
          dataLength: Array.isArray(data) ? data.length : (data?.results?.length || data?.data?.length || 'N/A'),
          firstItem: Array.isArray(data) ? data[0] : (data?.results?.[0] || data?.data?.[0] || 'N/A')
        });
        
        // Try to extract users
        let extractedUsers = [];
        if (Array.isArray(data)) {
          extractedUsers = data;
        } else if (data?.results && Array.isArray(data.results)) {
          extractedUsers = data.results;
        } else if (data?.data && Array.isArray(data.data)) {
          extractedUsers = data.data;
        }
        
        console.log('🧪 DIRECT TEST: Extracted', extractedUsers.length, 'users');
        if (extractedUsers.length > 0) {
          console.log('🧪 DIRECT TEST: First user:', extractedUsers[0]);
        }
      } catch (err) {
        console.error('🧪 DIRECT TEST ERROR:', err);
      }
    };
    
    // Run test after a short delay
    const timer = setTimeout(testDirectFetch, 1000);
    return () => clearTimeout(timer);
  }, []);

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

        {/* Error Message */}
        {usersError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error loading users:</p>
            <p>{usersError}</p>
            <p className="text-sm mt-2">Please check the browser console for more details.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        )}

        {/* Always show debug info */}
        <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded mb-4 text-xs">
          <strong>Debug Status:</strong>
          <span className="ml-2">Loading: {usersLoading ? 'Yes' : 'No'}</span>
          <span className="ml-2">Error: {usersError || 'None'}</span>
          <span className="ml-2">Total Users: {totalUsers}</span>
          <span className="ml-2">Users Array Length: {Array.isArray(users) ? users.length : 'N/A'}</span>
          <button
            onClick={() => {
              console.log('🔍 MANUAL DEBUG - Full users array:', users);
              console.log('🔍 MANUAL DEBUG - Users type:', typeof users);
              console.log('🔍 MANUAL DEBUG - Is array:', Array.isArray(users));
              alert(`Users in state: ${Array.isArray(users) ? users.length : 'Not an array'}\n\nCheck console for full details.`);
            }}
            className="ml-4 px-2 py-1 bg-gray-600 text-white rounded text-xs"
          >
            Log Users to Console
          </button>
        </div>

        {/* Debug Info - Show when no users and no error */}
        {!usersLoading && !usersError && totalUsers === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="font-semibold mb-2">⚠️ No users found in database</p>
            <p className="text-sm mb-2">This could mean:</p>
            <ul className="text-sm list-disc list-inside mb-3 space-y-1">
              <li>The database is empty (no users have registered yet)</li>
              <li>The API endpoint is not returning users correctly</li>
              <li>There's a connection issue with the backend</li>
            </ul>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => refetchUsers?.()}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
              >
                Refresh Users
              </button>
              <button
                onClick={async () => {
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const response = await fetch(`${apiUrl}/users/?page_size=10000`, { headers });
                    const data = await response.json();
                    
                    alert(`API Response:\n\nStatus: ${response.status}\n\nResponse Structure:\n${JSON.stringify(data, null, 2).substring(0, 2000)}${JSON.stringify(data, null, 2).length > 2000 ? '\n...(truncated)' : ''}\n\nCheck console for full response.`);
                    console.log('🔍 RAW API RESPONSE:', data);
                    console.log('🔍 Response type:', typeof data);
                    console.log('🔍 Is array:', Array.isArray(data));
                    if (data && typeof data === 'object') {
                      console.log('🔍 Response keys:', Object.keys(data));
                    }
                  } catch (err) {
                    alert(`Error: ${err.message}\n\nCheck console for details.`);
                    console.error('API test error:', err);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Show Raw API Response
              </button>
              <button
                onClick={() => {
                  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  window.open(`${apiUrl}/users/`, '_blank');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                Open API in Browser
              </button>
            </div>
            <p className="text-xs mt-2 text-yellow-600">
              Check browser console (F12) for detailed API response logs
            </p>
          </div>
        )}

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
