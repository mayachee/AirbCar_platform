'use client';

import { animations } from '@/hooks/useScrollAnimation';

export default function KeyFactsSection({ factsVisible }) {
  return (
    <section 
      className="py-20 bg-white"
      style={animations.rotateIn(factsVisible, { duration: '1s' })}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Key facts of our impact</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img 
              src="/public/car-rental-tips.jpg" 
              alt="Car sharing impact" 
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <div className="text-3xl font-bold">Making a difference</div>
              <div className="text-lg opacity-90">One shared ride at a time</div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 text-lg">Every shared car removes 15 private vehicles from roads</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 text-lg">65% reduction in carbon emissions per user</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 text-lg">Saves users an average of $4,000 annually</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 text-lg">Available 24/7 in major Moroccan cities</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 text-lg">Over 95% customer satisfaction rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

