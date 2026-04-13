'use client';

import { Search } from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';
import { useTranslations } from 'next-intl';

export default function BookingFilters({ searchTerm, statusFilter, sortBy, onSearchChange, onStatusChange, onSortChange }) {
  const t = useTranslations('account');
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('bf_search_placeholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      <SelectField
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        options={[
          { value: 'all', label: t('bf_all_status') },
          { value: 'pending', label: t('bf_pending') },
          { value: 'accepted', label: t('bf_accepted') },
          { value: 'confirmed', label: t('bf_confirmed') },
          { value: 'completed', label: t('bf_completed') },
          { value: 'cancelled', label: t('bf_cancelled') },
          { value: 'rejected', label: t('bf_rejected') },
        ]}
        className="px-4 py-2 rounded-none"
      />
      <SelectField
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        options={[
          { value: 'date', label: t('bf_sort_date') },
          { value: 'price', label: t('bf_sort_price') },
          { value: 'status', label: t('bf_sort_status') },
        ]}
        className="px-4 py-2 rounded-none"
      />
    </div>
  );
}

