'use client';

import { useState } from 'react';
import { UserRound, Eye, Edit, Trash2 } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

export default function UsersTable({ 
  users, 
  loading, 
  onView, 
  onEdit, 
  onDelete,
  currentPage,
  setCurrentPage,
  totalPages,
  usersPerPage
}) {
  const [showAll, setShowAll] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(usersPerPage || 10);

  // Debug logging
  console.log('📊 UsersTable RENDER - users prop:', users);
  console.log('📊 UsersTable RENDER - users type:', typeof users);
  console.log('📊 UsersTable RENDER - isArray:', Array.isArray(users));
  console.log('📊 UsersTable RENDER - users length:', Array.isArray(users) ? users.length : 'N/A');
  console.log('📊 UsersTable RENDER - loading:', loading);
  if (Array.isArray(users) && users.length > 0) {
    console.log('📊 UsersTable RENDER - First user:', users[0]);
    console.log('📊 UsersTable RENDER - User IDs:', users.slice(0, 5).map(u => u.id || u.email));
  } else {
    console.warn('⚠️ UsersTable RENDER - NO USERS RECEIVED!');
    console.warn('⚠️ UsersTable RENDER - users value:', users);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  // Ensure users is always an array
  const usersList = Array.isArray(users) ? users : [];
  
  // CRITICAL DEBUG: Log what we're about to display
  console.log('📊 UsersTable - usersList length:', usersList.length);
  console.log('📊 UsersTable - displayUsers will be:', showAll ? usersList.length : Math.min(itemsPerPage, usersList.length));
  
  // If showAll is true, display all users, otherwise paginate
  const displayUsers = showAll ? usersList : usersList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const indexOfFirstUser = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const indexOfLastUser = showAll ? usersList.length : indexOfFirstUser + itemsPerPage;
  const displayTotalPages = showAll ? 1 : Math.ceil(usersList.length / itemsPerPage);
  
  console.log('📊 UsersTable - displayUsers length:', displayUsers.length);
  console.log('📊 UsersTable - displayUsers sample:', displayUsers.slice(0, 2));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Debug Info Banner - Always show for debugging */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs">
        <strong>🔍 Debug Info:</strong> 
        <span className="ml-2">Received {usersList.length} users</span> | 
        <span className="ml-2">Displaying {displayUsers.length} users</span> | 
        <span className="ml-2">Show All: {showAll ? 'Yes' : 'No'}</span> | 
        <span className="ml-2">Page: {currentPage}/{displayTotalPages}</span>
        {usersList.length === 0 && (
          <span className="ml-2 text-red-600 font-bold">⚠️ NO USERS IN TABLE!</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayUsers && displayUsers.length > 0 ? (
              displayUsers.map((user, index) => (
                <tr key={user?.id || user?.pk || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserRound className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user?.first_name && user?.last_name
                            ? `${user?.first_name} ${user?.last_name}`
                            : user?.username || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user?.username || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user?.email || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user?.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user?.is_superuser ? 'Super Admin' : 
                       user?.is_staff ? 'Staff' : 
                       user?.is_partner ? 'Partner' : 'User'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user?.date_joined 
                        ? new Date(user?.date_joined).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {onView && (
                        <button 
                          onClick={() => onView(user)} 
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(user)} 
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(user)} 
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="py-8">
                    <p className="text-gray-500 font-medium mb-2">No users found</p>
                    <p className="text-sm text-gray-400">
                      {usersList.length === 0 
                        ? "No users in database. Users will appear here once they register."
                        : "No users match your current filters. Try adjusting your search or filters."}
                    </p>
                    {usersList.length === 0 && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto text-left">
                        <p className="text-yellow-800 font-medium mb-2">Debug Info:</p>
                        <p className="text-yellow-700 text-xs mb-1">
                          Users prop type: {typeof users}
                        </p>
                        <p className="text-yellow-700 text-xs mb-1">
                          Is array: {Array.isArray(users) ? 'Yes' : 'No'}
                        </p>
                        <p className="text-yellow-700 text-xs mb-1">
                          Users list length: {usersList.length}
                        </p>
                        <details className="text-yellow-700 text-xs">
                          <summary className="cursor-pointer font-medium">Show raw users prop</summary>
                          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(users, null, 2)}
                          </pre>
                        </details>
                        <p className="text-yellow-600 text-xs mt-2">
                          Check browser console (F12) for API response details
                        </p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setShowAll(!showAll);
              if (!showAll) {
                setCurrentPage(1);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {showAll ? 'Show Paginated' : `Show All (${usersList.length})`}
          </button>
          {!showAll && (
            <SelectField
              value={String(itemsPerPage)}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: '10', label: '10 per page' },
                { value: '25', label: '25 per page' },
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' },
              ]}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
        
        {!showAll && displayTotalPages > 1 && (
          <div className="flex-1 flex items-center justify-between sm:justify-end">
            <div className="hidden sm:block mr-4">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                <span className="font-medium">{Math.min(indexOfLastUser, usersList.length)}</span> of{' '}
                <span className="font-medium">{usersList.length}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(Math.min(displayTotalPages, 10))].map((_, index) => {
                const page = index + 1;
                // Show first, last, current, and pages around current
                if (
                  page === 1 ||
                  page === displayTotalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, displayTotalPages))}
                disabled={currentPage === displayTotalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
        {showAll && (
          <div className="text-sm text-gray-700">
            Showing all <span className="font-medium">{usersList.length}</span> users
          </div>
        )}
      </div>
    </div>
  );
}

