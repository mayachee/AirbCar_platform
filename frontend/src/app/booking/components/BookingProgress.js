'use client'

import { useState, useEffect } from 'react'

export default function BookingProgress({ currentStep }) {
  const [animatedSteps, setAnimatedSteps] = useState([false, false, false])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedSteps([true, false, false])
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => setAnimatedSteps([true, true, false]), 200)
    } else if (currentStep === 3) {
      setTimeout(() => setAnimatedSteps([true, true, true]), 400)
    }
  }, [currentStep])

  const steps = [
    { number: 1, label: 'Review Details', isActive: currentStep === 1, isCompleted: currentStep > 1 },
    { number: 2, label: 'Confirm Booking', isActive: currentStep === 2, isCompleted: currentStep > 2 },
    { number: 3, label: 'Complete', isActive: currentStep === 3, isCompleted: currentStep > 3 }
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex items-center flex-col">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-500 ${
                  step.isCompleted
                    ? 'bg-green-500 text-white shadow-lg'
                    : step.isActive
                    ? 'bg-orange-500 text-white scale-110 shadow-lg'
                    : 'bg-gray-300 text-gray-600'
                }`}
                style={{
                  animation: step.isActive && animatedSteps[index]
                    ? 'pulse 0.5s ease-in-out'
                    : 'none'
                }}
              >
                {step.isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium hidden sm:block transition-colors duration-300 ${
                  step.isActive ? 'text-orange-600 font-bold' : step.isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-4">
                <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 ease-out ${
                      currentStep > index + 1 ? 'w-full' : 'w-0'
                    }`}
                    style={{
                      animation: currentStep > index + 1 ? 'shimmer 1.5s ease-in-out infinite' : 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>
    </div>
  )
}

