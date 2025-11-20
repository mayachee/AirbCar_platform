'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
    >
      <ArrowLeft className="h-5 w-5" />
      <span>Back</span>
    </button>
  );
}

