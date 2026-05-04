'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  X, Search, Loader2, Send, Car, ArrowLeft, AlertCircle, MapPin,
} from 'lucide-react';
import { partnerService } from '@/features/partner/services/partnerService';

function getPrice(listing) {
  return (
    listing?.b2b_price_per_day ??
    listing?.b2b_price ??
    listing?.price_per_day ??
    ''
  );
}

function getImage(listing) {
  return (
    listing?.images?.[0]?.url ||
    listing?.images?.[0]?.image ||
    (typeof listing?.images?.[0] === 'string' ? listing.images[0] : null)
  );
}

function getPartnerName(listing) {
  const partner = listing?.partner || {};
  return (
    partner.business_name ||
    partner.businessName ||
    listing?.partner_name ||
    'Partner agency'
  );
}

function extractApiError(err, fallback) {
  const data = err?.data;
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.message === 'string') return data.message;
    // DRF field-level errors: { fieldName: "..." } or { fieldName: ["...", ...] }
    for (const value of Object.values(data)) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
  }
  return err?.message || fallback;
}

function ListingPicker({ prefillPartnerId, prefillPartnerName, excludePartnerId, onPick, onClose, t }) {
  const [search, setSearch] = useState('');

  const offers = useQuery({
    queryKey: ['compose', 'b2b-listings', prefillPartnerId || 'all', excludePartnerId || 'self'],
    queryFn: () =>
      partnerService.getB2BListings({
        partner_id: prefillPartnerId || undefined,
        // Only exclude self when no specific partner is targeted; if a
        // partner is prefilled the API filter pins to that partner anyway.
        exclude_partner: !prefillPartnerId && excludePartnerId ? excludePartnerId : undefined,
      }),
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const raw =
      offers.data?.data?.data ||
      offers.data?.data ||
      offers.data?.results ||
      [];
    if (!Array.isArray(raw)) return [];
    if (!search.trim()) return raw;
    const q = search.toLowerCase();
    return raw.filter((l) => {
      const label = `${l.make || ''} ${l.model || ''} ${l.year || ''}`.toLowerCase();
      const partner = getPartnerName(l).toLowerCase();
      return label.includes(q) || partner.includes(q);
    });
  }, [offers.data, search]);

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {t('compose_title')}
          </h2>
          {prefillPartnerName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {t('compose_filtered_to', { partner: prefillPartnerName })}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('compose_search_listings')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {offers.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : offers.isError ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{t('compose_load_error')}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
            <Car className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>{t('compose_no_listings')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((listing) => {
              const image = getImage(listing);
              const price = getPrice(listing);
              const label = [listing.make, listing.model, listing.year].filter(Boolean).join(' ');
              const partnerName = getPartnerName(listing);
              const disabled = !listing.public_id;
              return (
                <li key={listing.id}>
                  <button
                    type="button"
                    onClick={() => !disabled && onPick(listing)}
                    disabled={disabled}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {label || 'Vehicle'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {partnerName}
                      </p>
                      {listing.location && (
                        <p className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {listing.location}
                        </p>
                      )}
                    </div>
                    {price ? (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-orange-600">{price} MAD</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">/day</p>
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function RequestForm({ listing, onBack, onCreated, onClose, t }) {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [price, setPrice] = useState(getPrice(listing) || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: (data) => partnerService.createCarShareRequest(data),
    onSuccess: (response) => {
      const created = response?.data?.data || response?.data || null;
      onCreated?.(created);
    },
    onError: (err) => {
      setError(extractApiError(err, t('compose_error_generic')));
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (create.isPending) return;
    setError('');
    if (!listing?.public_id) {
      setError(t('compose_error_missing_public_id'));
      return;
    }
    if (!start || !end || end < start) {
      setError(t('compose_error_dates'));
      return;
    }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError(t('compose_error_price'));
      return;
    }
    create.mutate({
      public_id: listing.public_id,
      start_date: start,
      end_date: end,
      total_price: numericPrice,
      notes: message || undefined,
    });
  };

  const label = [listing.make, listing.model, listing.year].filter(Boolean).join(' ');
  const partnerName = getPartnerName(listing);

  return (
    <>
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {label || 'Vehicle'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{partnerName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <form onSubmit={submit} className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('compose_start')}
            </span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('compose_end')}
            </span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('compose_offer_mad')}
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('compose_first_message')}
          </span>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('compose_first_message_placeholder')}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>

      <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <button
          type="button"
          onClick={onClose}
          disabled={create.isPending}
          className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
        >
          {t('compose_cancel')}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={create.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {create.isPending ? t('compose_sending') : t('compose_send')}
        </button>
      </div>
    </>
  );
}

export default function ComposeRequestModal({
  isOpen,
  onClose,
  onCreated,
  prefillPartnerId = null,
  prefillPartnerName = null,
  prefillListing = null,
  excludePartnerId = null,
}) {
  const t = useTranslations('partner');
  const [listing, setListing] = useState(prefillListing || null);

  useEffect(() => {
    if (isOpen) {
      setListing(prefillListing || null);
    }
  }, [isOpen, prefillListing]);

  if (!isOpen) return null;

  const handleCreated = (created) => {
    onCreated?.(created);
    setListing(null);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden"
        >
          {!listing ? (
            <ListingPicker
              prefillPartnerId={prefillPartnerId}
              prefillPartnerName={prefillPartnerName}
              excludePartnerId={excludePartnerId}
              onPick={setListing}
              onClose={onClose}
              t={t}
            />
          ) : (
            <RequestForm
              listing={listing}
              onBack={() => setListing(null)}
              onCreated={handleCreated}
              onClose={onClose}
              t={t}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
