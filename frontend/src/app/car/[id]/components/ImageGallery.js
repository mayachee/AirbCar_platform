export default function ImageGallery({ vehicle, currentImageIndex, onNextImage, onPrevImage, onSelectImage, onShowFullGallery }) {
  return (
    <div className="mb-8">
      <div className="relative">
        <div className="aspect-w-16 aspect-h-10 rounded-xl overflow-hidden">
          <img
            src={vehicle.images[currentImageIndex] || '/carsymbol.jpg'}
            alt={`${vehicle.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-96 object-cover"
            loading="lazy"
            onError={(e) => {
              console.log('Image failed to load:', vehicle.images[currentImageIndex]);
              e.target.src = '/carsymbol.jpg';
            }}
          />
        </div>
        
        {/* Navigation Buttons */}
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

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {currentImageIndex + 1} / {vehicle.images.length}
        </div>

        {/* View All Photos Button */}
        <button
          onClick={onShowFullGallery}
          className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
        >
          View all photos
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="mt-4 grid grid-cols-6 gap-2">
        {vehicle.images.slice(0, 6).map((image, index) => (
          <button
            key={index}
            onClick={() => onSelectImage(index)}
            className={`aspect-square rounded-lg overflow-hidden ${
              currentImageIndex === index ? 'ring-2 ring-orange-500' : ''
            }`}
          >
            <img
              src={image || '/carsymbol.jpg'}
              alt={`${vehicle.name} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/carsymbol.jpg';
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

