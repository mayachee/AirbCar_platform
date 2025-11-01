'use client';

import { animations } from '@/hooks/useScrollAnimation';

export default function ImpactSection({ impactVisible }) {
  return (
    <section 
      className="py-20 bg-white"
      style={animations.slideAndScale(impactVisible, { duration: '0.9s' })}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">The impact</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our mission goes beyond just providing cars. We're creating a movement towards 
              sustainable urban mobility that benefits individuals, communities, and the environment.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Reduced traffic congestion in urban areas</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Lower carbon emissions per capita</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">More affordable transportation options</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Increased space for community development</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img 
                src="/public/step2.webp" 
                alt="Green transportation" 
                className="w-full h-48 object-cover rounded-xl shadow-lg"
              />
              <div className="bg-green-50 p-4 rounded-xl hover:bg-green-100 transition-colors duration-300 group">
                <div className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">85%</div>
                <div className="text-sm text-gray-600">Reduction in personal vehicle need</div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="bg-blue-50 p-4 rounded-xl hover:bg-blue-100 transition-colors duration-300 group">
                <div className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">60%</div>
                <div className="text-sm text-gray-600">Cost savings vs car ownership</div>
              </div>
              <img 
                src="/public/step3.png" 
                alt="Community impact" 
                className="w-full h-48 object-cover rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

