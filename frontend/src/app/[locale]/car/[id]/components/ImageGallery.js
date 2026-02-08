import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import { getAllVehicleImages, fixImageUrl } from '@/utils/imageUtils';

export default function ImageGallery({ vehicle, currentImageIndex, onNextImage, onPrevImage, onSelectImage, onShowFullGallery }) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  // Get all images using the utility function to fix URLs
  const allImages = getAllVehicleImages(vehicle);
  const hasImages = allImages.length > 0 && allImages[0] !== '/carsymbol.jpg';
  const safeIndex = Math.min(currentImageIndex, allImages.length - 1);
  const currentImage = allImages[safeIndex] || allImages[0] || '/carsymbol.jpg';
  
  // Calculate how many extra images are hidden
  const maxThumbnails = 6;
  const extraImagesCount = Math.max(0, allImages.length - maxThumbnails);

  return (
    <div className="mb-8 group">
      <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="aspect-w-16 aspect-h-10 relative h-[250px] md:h-[500px]">
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentImage}
                    src={fixImageUrl(currentImage)}
                    alt={`${vehicle?.name || 'Vehicle'} - Image ${safeIndex + 1}`}
                    className="object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onLoad={() => setIsImageLoading(false)}
                    onError={(e) => {
                        console.log('Image failed to load:', currentImage);
                        e.target.src = '/carsymbol.jpg';
                        setIsImageLoading(false);
                    }}
                />
            </AnimatePresence>
        </div>
        
        {/* Navigation Buttons */}
        {hasImages && allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNextImage(); }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasImages && allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium">
            {safeIndex + 1} / {allImages.length}
          </div>
        )}

        {/* View All Photos Button */}
        {hasImages && allImages.length > 1 && (
          <button
            onClick={onShowFullGallery}
            className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
          >
            <Grid className="w-4 h-4" />
            View all photos
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasImages && (
        <div className="mt-4 grid grid-cols-6 gap-2">
          {allImages.slice(0, maxThumbnails).map((image, index) => {
            const isLastThumbnail = index === maxThumbnails - 1;
            const showOverlay = isLastThumbnail && extraImagesCount > 0;

            return (
                <button
                key={index}
                onClick={() => isLastThumbnail && extraImagesCount > 0 ? onShowFullGallery() : onSelectImage(index)}
                className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    safeIndex === index ? 'ring-2 ring-orange-500 ring-offset-2' : 'hover:opacity-80'
                }`}
                aria-label={showOverlay ? `View ${extraImagesCount} more photos` : `View image ${index + 1}`}
                >
                <img
                    src={fixImageUrl(image) || '/carsymbol.jpg'}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = '/carsymbol.jpg';
                    }}
                />
                
                {/* Overlay for the last thumbnail if there are more images */}
                {showOverlay && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-1 cursor-pointer hover:bg-black/70 transition-colors">
                        <span className="text-xl font-bold">+{extraImagesCount}</span>
                        <span className="text-xs text-center hidden sm:block">See all</span>
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

