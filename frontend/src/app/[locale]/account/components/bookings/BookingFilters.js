'use client';

import { Search } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';

export default function BookingFilters({ searchTerm, statusFilter, sortBy, onSearchChange, onStatusChange, onSortChange }) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by vehicle, location, or booking ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      <SelectField
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        options={[
          { value: 'all', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        className="px-4 py-2 rounded-lg"
      />
      <SelectField
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        options={[
          { value: 'date', label: 'Sort by Date' },
          { value: 'price', label: 'Sort by Price' },
          { value: 'status', label: 'Sort by Status' },
        ]}
        className="px-4 py-2 rounded-lg"
      />
    </div>
  );
}

