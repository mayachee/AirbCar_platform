'use client';

import { Shield, Star, Clock, Award } from 'lucide-react';

export default function TrustIndicators({ companyName }) {
  const indicators = [
    {
      icon: Shield,
      title: 'Verified Partner',
      description: 'Identity verified',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Star,
      title: 'Highly Rated',
      description: 'Top-rated service',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Clock,
      title: 'Quick Response',
      description: 'Fast communication',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Award,
      title: 'Trusted',
      description: 'Reliable service',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
      {indicators.map((indicator, index) => {
        const Icon = indicator.icon;
        return (
          <div
            key={index}
            className={`${indicator.bgColor} rounded-xl p-4 border border-gray-200`}
          >
            <Icon className={`h-6 w-6 ${indicator.color} mb-2`} />
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {indicator.title}
            </h3>
            <p className="text-xs text-gray-600">
              {indicator.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

