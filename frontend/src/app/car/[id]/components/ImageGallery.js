import { getAllVehicleImages, fixImageUrl } from '@/utils/imageUtils';

export default function ImageGallery({ vehicle, currentImageIndex, onNextImage, onPrevImage, onSelectImage, onShowFullGallery }) {
  // Get all images using the utility function to fix URLs
  const allImages = getAllVehicleImages(vehicle);
  const hasImages = allImages.length > 0 && allImages[0] !== '/carsymbol.jpg';
  const safeIndex = Math.min(currentImageIndex, allImages.length - 1);
  const currentImage = allImages[safeIndex] || allImages[0] || '/carsymbol.jpg';

  return (
    <div className="mb-8">
      <div className="relative">
        <div className="aspect-w-16 aspect-h-10 rounded-xl overflow-hidden">
          <img
            src={fixImageUrl(currentImage)}
            alt={`${vehicle?.name || 'Vehicle'} - Image ${safeIndex + 1}`}
            className="w-full h-96 object-cover"
            loading="lazy"
            onError={(e) => {
              console.log('Image failed to load:', currentImage);
              e.target.src = '/carsymbol.jpg';
            }}
          />
        </div>
        
        {/* Navigation Buttons - Only show if there are multiple images */}
        {hasImages && images.length > 1 && (
          <>
            <button
              onClick={onPrevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter - Only show if there are multiple images */}
        {hasImages && allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {safeIndex + 1} / {allImages.length}
          </div>
        )}

        {/* View All Photos Button - Only show if there are multiple images */}
        {hasImages && allImages.length > 1 && (
          <button
            onClick={onShowFullGallery}
            className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            View all photos
          </button>
        )}
      </div>

      {/* Thumbnail Strip - Only show if there are images */}
      {hasImages && (
        <div className="mt-4 grid grid-cols-6 gap-2">
          {allImages.slice(0, 6).map((image, index) => (
            <button
              key={index}
              onClick={() => onSelectImage(index)}
              className={`aspect-square rounded-lg overflow-hidden ${
                safeIndex === index ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              <img
                src={fixImageUrl(image) || '/carsymbol.jpg'}
                alt={`${vehicle?.name || 'Vehicle'} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/carsymbol.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

