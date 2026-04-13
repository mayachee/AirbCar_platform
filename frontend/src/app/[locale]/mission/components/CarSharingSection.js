'use client';

import { animations } from '@/hooks/useScrollAnimation';

export default function CarSharingSection({ challengeVisible }) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div 
            style={animations.glideIn(challengeVisible, 'left', { duration: '0.8s' })}
          >
            <div className="bg-white rounded-none p-8 shadow-lg">
              <img 
                src="/public/Background.jpg" 
                alt="People in a car" 
                className="w-full h-64 object-cover rounded-none mb-6"
              />
            </div>
          </div>
          <div 
            style={animations.glideIn(challengeVisible, 'right', { duration: '0.8s' })}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Shared mobility for a better tomorrow
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Every day, millions of cars sit unused while people struggle with expensive, 
              inefficient transportation. Our car sharing platform creates a more sustainable 
              way to move around cities, reducing congestion and carbon emissions.
            </p>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-none flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium">Sustainable transportation solution</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

