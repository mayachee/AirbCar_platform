'use client';

import { useState, useEffect } from 'react';

export default function CustomerReviewsManagement({ vehicles }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock reviews data - replace with real API call
    const mockReviews = [
      {
        id: 1,
        vehicleId: 1,
        vehicleName: 'Toyota Camry 2023',
        customerName: 'John Doe',
        rating: 5,
        comment: 'Excellent car, very clean and comfortable. Highly recommended!',
        date: '2024-01-15',
        status: 'published'
      },
      {
        id: 2,
        vehicleId: 2,
        vehicleName: 'Honda Civic 2022',
        customerName: 'Sarah Johnson',
        rating: 4,
        comment: 'Good car overall, minor issue with the AC but otherwise great.',
        date: '2024-01-10',
        status: 'published'
      },
      {
        id: 3,
        vehicleId: 1,
        vehicleName: 'Toyota Camry 2023',
        customerName: 'Mike Wilson',
        rating: 5,
        comment: 'Perfect rental experience. Will definitely book again!',
        date: '2024-01-08',
        status: 'pending'
      }
    ];
    
    setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, []);

  const handleReviewAction = (reviewId, action) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: action }
          : review
      )
    );
  };

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⭐</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">4.7</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📝</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⏳</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {reviews.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Reviews</h3>
        
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{review.customerName}</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{review.vehicleName}</p>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Rating:</span>
                    <span className="text-yellow-500">{getRatingStars(review.rating)}</span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </div>
              </div>
              
              {review.status === 'pending' && (
                <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleReviewAction(review.id, 'published')}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewAction(review.id, 'rejected')}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
