'use client';

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
          {/* Image skeleton */}
          <div className="w-full h-48 bg-gray-200"></div>
          
          {/* Content skeleton */}
          <div className="p-6">
            {/* Title skeleton */}
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            
            {/* Location skeleton */}
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            
            {/* Price skeleton */}
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            
            {/* Features skeleton */}
            <div className="flex space-x-3 mb-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            
            {/* Button skeleton */}
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
