'use client';

import AdminDashboard from '@/features/admin/components/AdminDashboard';
import { useAdminAuth } from '../hooks';

export default function AdminDashboardPage() {
  const { checking } = useAdminAuth();
  
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return <AdminDashboard />;
}