'use client';

export default function LoadingSpinner({ size = 'lg', fullScreen = false }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-32 w-32'
  };

  const containerClass = fullScreen 
    ? 'min-h-screen flex items-center justify-center' 
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className={`animate-spin rounded-none border-b-2 border-orange-500 ${sizeClasses[size]}`}></div>
    </div>
  );
}

