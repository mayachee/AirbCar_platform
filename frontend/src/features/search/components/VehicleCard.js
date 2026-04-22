'use client';

import { useTranslations } from 'next-intl';
import { showPricePerDay } from '@/features/search';
import { getVehicleImageUrl } from '@/utils/imageUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

export default function VehicleCard({ car, onViewDetails, onToggleFavorite, isFavorite: propIsFavorite, favoritesLoading: propFavoritesLoading }) {
  const { formatPrice } = useCurrency();
  const t = useTranslations('search');

  const { isFavorite: contextIsFavorite, toggleFavorite } = useFavoritesContext();
  const isFav = contextIsFavorite(car?.id) || propIsFavorite;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!car?.id) return;
    toggleFavorite(car.id);
    if (onToggleFavorite) onToggleFavorite(car.id);
  };

  const imageUrl = getVehicleImageUrl(car);
  const rating = car.rating || 0;

  return (
    <div className="bg-[var(--surface-container-lowest)] rounded-xl overflow-hidden group shadow-ambient hover:shadow-ambient-lg transition-all duration-300">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={imageUrl}
          alt={car.name}
          className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { if (e.target.src !== '/carsymbol.jpg') e.target.src = '/carsymbol.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--text-primary)]/60 to-transparent" />

        {/* Verified badge */}
        {car.verified && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--color-kc-tertiary)]/90 backdrop-blur-sm text-white shadow-ambient-sm">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('verified_agency')}
            </span>
          </div>
        )}

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={propFavoritesLoading}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 ${
            isFav
              ? 'bg-[var(--color-kc-error)]/90 text-white shadow-ambient-sm'
              : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'
          } ${propFavoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Instant booking badge */}
        {car.instant_booking && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--color-orange-500)]/90 backdrop-blur-sm text-white">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('instant_booking')}
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5">
        {/* Title & location */}
        <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight line-clamp-1 mb-1.5">
          {car.name}
        </h3>
        <div className="flex items-center text-[var(--text-secondary)] text-xs mb-4">
          <svg className="w-3.5 h-3.5 mr-1 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{car.location}</span>
        </div>

        {/* Specs row — secondary_container chips */}
        <div className="flex items-center gap-2 mb-4">
          <span className="label-xs px-2.5 py-1 rounded-full bg-[var(--surface-1)] text-[var(--text-secondary)]">
            {car.seats} seats
          </span>
          <span className="label-xs px-2.5 py-1 rounded-full bg-[var(--surface-1)] text-[var(--text-secondary)]">
            {car.transmission}
          </span>
          <span className="label-xs px-2.5 py-1 rounded-full bg-[var(--surface-1)] text-[var(--text-secondary)]">
            {car.fuel}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-amber-400' : 'text-[var(--surface-3)]'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">{rating.toFixed(1)}</span>
          <span className="text-[10px] text-[var(--text-muted)]">({car.reviews || 0})</span>
        </div>

        {/* Price & CTA — separated by tonal shift, not border */}
        <div className="flex items-end justify-between pt-4 bg-[var(--surface-1)] -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
          <div>
            {car.totalPrice ? (
              <>
                <p className="text-2xl font-black text-[var(--text-primary)] leading-none">{formatPrice(car.totalPrice)}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  {car.rentalDuration} {t(car.rentalDuration > 1 ? 'days' : 'day')} &middot; {formatPrice(car.price_per_day)}{t('per_day')}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-[var(--text-primary)] leading-none">{formatPrice(car.price_per_day)}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{showPricePerDay(car.price_per_day)}</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onViewDetails(car); }}
            className="btn-brand px-5 py-2.5 text-xs tracking-wide"
          >
            {t('view_details')}
          </button>
        </div>
      </div>
    </div>
  );
}
