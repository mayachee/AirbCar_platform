import { getAllVehicleImages, fixImageUrl } from '@/utils/imageUtils';

export default function FullGalleryModal({ vehicle, currentImageIndex, onClose, onSelectImage }) {
  // Get all images using the utility function to fix URLs
  const allImages = getAllVehicleImages(vehicle);
  const hasImages = allImages.length > 0 && allImages[0] !== '/carsymbol.jpg';
  const safeIndex = Math.min(currentImageIndex, allImages.length - 1);
  const currentImage = fixImageUrl(allImages[safeIndex] || allImages[0] || '/carsymbol.jpg');

  if (!hasImages) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full z-10"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        <img
          src={currentImage}
          alt={`${vehicle?.name || 'Vehicle'} - Image ${safeIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.target.src = '/carsymbol.jpg';
          }}
        />
      </div>
      {allImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelectImage(index)}
              className={`w-3 h-3 rounded-full ${
                safeIndex === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

