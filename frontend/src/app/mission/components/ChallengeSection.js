'use client';

import { animations } from '@/hooks/useScrollAnimation';

export default function ChallengeSection({ challengeVisible }) {
  return (
    <section 
      className="py-20 bg-white"
      style={animations.fadeInUp(challengeVisible, { duration: '0.9s' })}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">The challenge</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Traditional car ownership is becoming increasingly unsustainable. With rising costs, 
              environmental concerns, and urban congestion, we need innovative solutions that 
              prioritize people and communities over individual car ownership.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Cities around the world are struggling with air pollution, traffic congestion, and 
              the enormous space requirements of parking. Meanwhile, many people can't afford to 
              own a car but still need reliable transportation.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-300 group">
                <div className="text-2xl font-bold text-red-600 group-hover:scale-110 transition-transform duration-300">95%</div>
                <div className="text-sm text-gray-600">Cars sit unused daily</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-300 group">
                <div className="text-2xl font-bold text-red-600 group-hover:scale-110 transition-transform duration-300">30%</div>
                <div className="text-sm text-gray-600">Urban space for parking</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="/public/step1.webp" 
              alt="Urban traffic challenge" 
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

