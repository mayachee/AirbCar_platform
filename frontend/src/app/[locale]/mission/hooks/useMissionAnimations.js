'use client';

import { useMemo } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

/**
 * Centralized hook for managing all animation states in the mission page
 * This reduces the main page component complexity and makes animations easier to manage
 */
export const useMissionAnimations = () => {
  const heroAnimation = useScrollAnimation({ delay: 100 });
  const carSharingAnimation = useScrollAnimation({ delay: 200 });
  const challengeAnimation = useScrollAnimation({ delay: 200 });
  const solutionAnimation = useScrollAnimation({ delay: 150 });
  const impactAnimation = useScrollAnimation({ delay: 100 });
  const whyUsAnimation = useScrollAnimation({ delay: 200 });
  const factsAnimation = useScrollAnimation({ delay: 150 });
  const testimonialsAnimation = useScrollAnimation({ delay: 100 });

  return useMemo(() => ({
    heroVisible: heroAnimation[1],
    carSharingVisible: carSharingAnimation[1],
    challengeVisible: challengeAnimation[1],
    solutionVisible: solutionAnimation[1],
    impactVisible: impactAnimation[1],
    whyUsVisible: whyUsAnimation[1],
    factsVisible: factsAnimation[1],
    testimonialsVisible: testimonialsAnimation[1]
  }), [
    heroAnimation,
    carSharingAnimation,
    challengeAnimation,
    solutionAnimation,
    impactAnimation,
    whyUsAnimation,
    factsAnimation,
    testimonialsAnimation
  ]);
};

