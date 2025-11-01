export default function FullGalleryModal({ vehicle, currentImageIndex, onClose, onSelectImage }) {
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
          src={vehicle.images[currentImageIndex] || '/carsymbol.jpg'}
          alt={`${vehicle.name} - Image ${currentImageIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.target.src = '/carsymbol.jpg';
          }}
        />
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {vehicle.images.map((_, index) => (
          <button
            key={index}
            onClick={() => onSelectImage(index)}
            className={`w-3 h-3 rounded-full ${
              currentImageIndex === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

