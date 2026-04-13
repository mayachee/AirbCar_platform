import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grid, Loader2, ImageOff } from 'lucide-react';
import { getAllVehicleImages, fixImageUrl } from '@/utils/imageUtils';

import { useTranslations } from 'next-intl'

export default function ImageGallery({ vehicle, currentImageIndex, onNextImage, onPrevImage, onSelectImage, onShowFullGallery }) {
  const t = useTranslations('car_details')
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const touchStartX = useRef(null);
  
  // Get all images using the utility function to fix URLs
  const allImages = getAllVehicleImages(vehicle);
  const hasImages = allImages.length > 0 && allImages[0] !== '/carsymbol.jpg';
  const safeIndex = Math.min(currentImageIndex, allImages.length - 1);
  const currentImage = allImages[safeIndex] || allImages[0] || '/carsymbol.jpg';
  
  // Calculate how many extra images are hidden
  const maxThumbnails = 6;
  const extraImagesCount = Math.max(0, allImages.length - maxThumbnails);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback((e) => {
    e.target.src = '/carsymbol.jpg';
    setIsImageLoading(false);
    setImageError(true);
  }, []);

  // Reset loading state when image changes
  const handleImageChange = useCallback((direction) => {
    setIsImageLoading(true);
    setImageError(false);
    direction === 'next' ? onNextImage() : onPrevImage();
  }, [onNextImage, onPrevImage]);

  // Swipe support for mobile
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? handleImageChange('next') : handleImageChange('prev');
    }
    touchStartX.current = null;
  }, [handleImageChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') handleImageChange('prev');
    if (e.key === 'ArrowRight') handleImageChange('next');
  }, [handleImageChange]);

  return (
    <div className="mb-8 group">
      <div
        className="relative bg-gray-900 rounded-none overflow-hidden shadow-lg"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Image gallery"
        aria-roledescription="carousel"
      >
        <div className="relative h-[280px] sm:h-[380px] md:h-[500px]">
          {/* Loading skeleton */}
          {isImageLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 animate-pulse">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {/* Error state */}
          {imageError && (
            <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-none flex items-center gap-1">
              <ImageOff className="w-3 h-3" />
              <span>Image unavailable</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              src={fixImageUrl(currentImage)}
              alt={`${vehicle?.make || ''} ${vehicle?.model || 'Vehicle'} - Image ${safeIndex + 1} of ${allImages.length}`}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          </AnimatePresence>

          {/* Gradient overlays for better button visibility */}
          {hasImages && allImages.length > 1 && (
            <>
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </div>
        
        {/* Navigation Buttons */}
        {hasImages && allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleImageChange('prev'); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2.5 rounded-none shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleImageChange('next'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2.5 rounded-none shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasImages && allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-none text-sm font-medium tabular-nums">
            {safeIndex + 1} / {allImages.length}
          </div>
        )}

        {/* View All Photos Button */}
        {hasImages && allImages.length > 1 && (
          <button
            onClick={onShowFullGallery}
            className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-none text-sm font-medium hover:bg-white active:scale-95 transition-all flex items-center gap-2 shadow-md"
          >
            <Grid className="w-4 h-4" />
            {t('view_all_photos', { fallback: 'View all photos' })}
          </button>
        )}

        {/* Dot Indicators (mobile-friendly, max 8) */}
        {hasImages && allImages.length > 1 && allImages.length <= 8 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={() => onSelectImage(i)}
                className={`rounded-none transition-all ${
                  i === safeIndex
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasImages && allImages.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {allImages.slice(0, maxThumbnails).map((image, index) => {
            const isLastThumbnail = index === maxThumbnails - 1;
            const showOverlay = isLastThumbnail && extraImagesCount > 0;

            return (
              <button
                key={index}
                onClick={() => {
                  if (showOverlay) {
                    onShowFullGallery();
                  } else {
                    setIsImageLoading(true);
                    setImageError(false);
                    onSelectImage(index);
                  }
                }}
                className={`relative aspect-[4/3] rounded-none overflow-hidden transition-all ${
                  safeIndex === index
                    ? 'ring-2 ring-orange-500 ring-offset-2 scale-[1.02]'
                    : 'hover:opacity-80 hover:ring-1 hover:ring-gray-300'
                }`}
                aria-label={showOverlay ? `View ${extraImagesCount} more photos` : `View image ${index + 1}`}
                aria-current={safeIndex === index ? 'true' : undefined}
              >
                <img
                  src={fixImageUrl(image) || '/carsymbol.jpg'}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                  onError={(e) => {
                    e.target.src = '/carsymbol.jpg';
                  }}
                />
                
                {/* Overlay for the last thumbnail if there are more images */}
                {showOverlay && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer hover:bg-black/70 transition-colors">
                    <span className="text-xl font-bold">+{extraImagesCount}</span>
                    <span className="text-[10px] font-medium tracking-wide uppercase hidden sm:block">See all</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  )
}

