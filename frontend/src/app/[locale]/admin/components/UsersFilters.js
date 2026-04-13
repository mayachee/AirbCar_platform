'use client';

import { Search, Filter } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

export default function UsersFilters({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) {
  return (
    <div className="bg-white rounded-none shadow mb-6 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name, username, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <SelectField
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Users' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ]}
            className="px-3 py-2 rounded-none focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

