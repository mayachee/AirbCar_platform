import { useRouter } from 'next/navigation'

export default function EmptyState({ filter }) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
      <p className="text-gray-500 mb-4">
        {filter === 'all' 
          ? "You haven't made any bookings yet." 
          : `No ${filter} bookings to show.`
        }
      </p>
      <button
        onClick={() => router.push('/search')}
        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
      >
        Find a Car
      </button>
    </div>
  )
}










