'use client';

export default function UsersHeader({ totalUsers, onExport, exportLoading }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600">Manage all registered users</p>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">
          {totalUsers} users total
        </span>
        {onExport && (
          <button
            onClick={onExport}
            disabled={exportLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        )}
      </div>
    </div>
  );
}

