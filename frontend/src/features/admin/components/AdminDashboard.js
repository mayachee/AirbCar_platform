'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData, usePartners, useBookings, useListings } from '@/features/admin';
import AdminStats from '@/features/admin/components/AdminStats';
import AdminCharts from '@/features/admin/components/AdminCharts';
import UsersTable from '@/features/admin/components/UsersTable';
import AdminBookingsManagement from '@/features/admin/components/AdminBookingsManagement';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const router = useRouter();
  
  const {
    users,
    partners: partnersData,
    bookings: bookingsData,
    listings: listingsData,
    stats,
    chartData,
    loadingData,
    refetch
  } = useAdminData();

  // Use specific hooks for each section
  const partnersHook = usePartners();
  const bookingsHook = useBookings();
  const listingsHook = useListings();
  // const analyticsHook = useAnalytics(); // Commented out until backend endpoints are ready
  
  // Mock analytics data for now
  const analyticsHook = { 
    revenue: null, 
    loading: false, 
    analytics: null,
    stats: null
  };

  // Check admin status and redirect if not admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, loading, router]);

  const checkAdminStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch(`${apiUrl}/api/verify-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // Check if user is admin (staff or superuser)
        const isUserAdmin = userData.is_staff === true || 
                           userData.is_superuser === true ||
                           userData.is_admin === true;
        
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          router.push('/');
        }
      } else {
        router.push("/auth/signin");
      }
    } catch (error) {
      // Handle "Failed to fetch" and other network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        console.warn('Backend is unavailable. Allowing access for offline development.');
        // For development, allow access when backend is down
        // In production, you might want to redirect to signin
        setIsAdmin(true); // Temporarily allow access for offline development
        // router.push("/auth/signin"); // Uncomment this for production
      } else {
        console.error('Error checking admin status:', error);
        router.push("/auth/signin");
      }
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'partners', label: 'Partners', icon: '🤝' },
    { id: 'cars', label: 'Cars', icon: '🚗' },
    { id: 'bookings', label: 'Bookings', icon: '📋' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
  ];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {currentView === 'dashboard' && (
          <div>
            <AdminStats stats={stats} />
            <AdminCharts chartData={chartData} />
          </div>
        )}

        {currentView === 'users' && (
          <UsersTable users={users} loading={loadingData} />
        )}

        {currentView === 'partners' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Partners Management</h3>
            {partnersHook.loading ? (
              <p className="text-gray-600">Loading partners...</p>
            ) : partnersHook.partners.length > 0 ? (
              <div>
                <p className="text-gray-600 mb-4">Total Partners: {partnersHook.partners.length}</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {partnersHook.partners.map((partner) => (
                        <tr key={partner.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{partner.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{partner.email || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              partner.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {partner.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => partnersHook.approvePartner(partner.id)}
                              className="text-green-600 hover:text-green-900 mr-2"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => partnersHook.rejectPartner(partner.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No partners found.</p>
            )}
          </div>
        )}

        {currentView === 'cars' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cars Management</h3>
            {listingsHook.loading ? (
              <p className="text-gray-600">Loading listings...</p>
            ) : listingsHook.listings.length > 0 ? (
              <div>
                <p className="text-gray-600 mb-4">Total Listings: {listingsHook.listings.length}</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {listingsHook.listings.slice(0, 5).map((listing) => (
                        <tr key={listing.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{listing.vehicle_name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{listing.location || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${listing.price_per_day || '0'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              listing.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {listing.available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No listings found.</p>
            )}
          </div>
        )}

        {currentView === 'bookings' && (
          <AdminBookingsManagement />
        )}

        {currentView === 'earnings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</h3>
            {analyticsHook.loading ? (
              <p className="text-gray-600">Loading analytics...</p>
            ) : analyticsHook.revenue ? (
              <div>
                <p className="text-gray-600 mb-4">Revenue Data Available</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">${analyticsHook.revenue.total || '0'}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Pending Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${analyticsHook.revenue.pending || '0'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No revenue data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
