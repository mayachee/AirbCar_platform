import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { LoadingSkeleton } from '@/features/search';

export default function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#0F172A] to-[#0B0F19] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      {/* Hero Section Skeleton */}
      <section className="relative pt-32 pb-12 md:pt-60 md:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto relative z-20">
            {/* Title Skeleton */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center -z-10">
              <div className="h-24 md:h-32 bg-white/5 rounded-3xl w-3/4 mx-auto blur-sm"></div>
            </div>

            {/* Search Form Skeleton */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-white/10 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Skeleton */}
      <main className="min-h-screen relative z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Results Header Skeleton */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse"></div>
              <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse"></div>
              <div className="h-10 w-40 bg-white/10 rounded-lg animate-pulse"></div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar Skeleton */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-8">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <div className="h-6 w-24 bg-white/10 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 w-20 bg-white/10 rounded animate-pulse"></div>
                        <div className="h-10 w-full bg-white/5 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Grid Skeleton */}
            <div className="flex-1 min-w-0">
              <LoadingSkeleton count={6} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
