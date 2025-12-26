'use client';

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-white/10 overflow-hidden">
          <div className="animate-pulse">
            {/* Image skeleton */}
            <div className="w-full h-48 bg-white/10"></div>
            
            {/* Content skeleton */}
            <div className="p-6">
              {/* Header skeleton (Title + Price) */}
              <div className="flex justify-between items-start mb-5 pb-4 border-b border-white/10">
                <div className="w-2/3">
                  <div className="h-6 bg-white/10 rounded w-full mb-2"></div>
                  <div className="h-4 bg-white/5 rounded w-2/3"></div>
                </div>
                <div className="w-1/4">
                  <div className="h-8 bg-white/10 rounded w-full"></div>
                </div>
              </div>
              
              {/* Features skeleton */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-white/5 rounded w-full"></div>
                ))}
              </div>
              
              {/* Footer/Button skeleton */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="h-8 w-8 bg-white/10 rounded-full"></div>
                <div className="h-10 bg-orange-500/20 rounded-xl w-32"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
