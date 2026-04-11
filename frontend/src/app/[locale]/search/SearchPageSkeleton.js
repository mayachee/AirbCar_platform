import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      <Header />

      {/* Search Header Skeleton */}
      <section className="pt-28 pb-6 md:pt-32 md:pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Title skeleton */}
            <div className="mb-6">
              <div className="h-10 w-56 bg-[var(--surface-2)] rounded-xl animate-pulse" />
              <div className="h-5 w-72 bg-[var(--surface-1)] rounded-lg animate-pulse mt-3" />
            </div>

            {/* Search form skeleton */}
            <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-5 shadow-ambient">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-[var(--surface-1)] rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chip bar skeleton */}
      <div className="bg-[var(--surface-base)] shadow-ambient-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto py-3 flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-20 bg-[var(--surface-1)] rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar Skeleton */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-36">
                <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-5 shadow-ambient">
                  <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="h-6 w-24 bg-[var(--surface-2)] rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
                        <div className="h-10 w-full bg-[var(--surface-1)] rounded-xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Grid Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-[var(--surface-container-lowest)] rounded-xl overflow-hidden shadow-ambient">
                    <div className="animate-pulse">
                      <div className="w-full h-52 bg-[var(--surface-2)]" />
                      <div className="p-5">
                        <div className="h-5 bg-[var(--surface-2)] rounded w-3/4 mb-2" />
                        <div className="h-4 bg-[var(--surface-1)] rounded w-1/2 mb-4" />
                        <div className="flex gap-2 mb-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-6 w-16 bg-[var(--surface-1)] rounded-full" />
                          ))}
                        </div>
                        <div className="flex justify-between items-end pt-4 bg-[var(--surface-1)] -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
                          <div className="h-8 w-24 bg-[var(--surface-2)] rounded" />
                          <div className="h-10 w-28 bg-[var(--color-orange-500)]/20 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
