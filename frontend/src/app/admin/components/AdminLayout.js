'use client';

import LoadingSpinner from './LoadingSpinner';

export default function AdminLayout({ 
  children, 
  sidebar, 
  loading = false,
  onSignOut 
}) {
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex gap-10">
        {/* Sidebar */}
        {sidebar}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

