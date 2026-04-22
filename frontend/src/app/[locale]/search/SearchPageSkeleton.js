export default function SearchPageSkeleton() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--surface-base)]">
      {/* Top bar */}
      <header
        className="flex-shrink-0 bg-[var(--surface-container-lowest)] shadow-ambient-sm"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="px-4 sm:px-6 h-16 flex items-center gap-4">
          <div className="w-8 h-8 bg-[var(--surface-2)] rounded-lg animate-pulse" />
          <div className="hidden sm:block h-5 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
          <div className="flex-1 max-w-3xl h-12 bg-[var(--surface-1)] rounded-xl animate-pulse" />
        </div>
      </header>

      {/* Filter rail */}
      <div
        className="flex-shrink-0 bg-[var(--surface-base)] shadow-ambient-sm"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="px-4 sm:px-6 py-2.5 flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-7 w-16 bg-[var(--surface-1)] rounded-full animate-pulse" />
          ))}
          <div className="ml-auto h-7 w-28 bg-[var(--surface-1)] rounded-full animate-pulse" />
        </div>
      </div>

      {/* Split main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — horizontal card skeletons */}
        <div className="w-full md:w-1/2 lg:w-[46%] xl:w-[42%] overflow-hidden p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex bg-[var(--surface-container-lowest)] rounded-2xl overflow-hidden shadow-ambient animate-pulse"
            >
              <div className="w-[42%] aspect-[4/3] bg-[var(--surface-2)]" />
              <div className="flex-1 p-4 space-y-2.5">
                <div className="h-4 bg-[var(--surface-2)] rounded w-3/4" />
                <div className="h-3 bg-[var(--surface-1)] rounded w-1/2" />
                <div className="flex gap-2 pt-1">
                  <div className="h-3 w-10 bg-[var(--surface-1)] rounded-full" />
                  <div className="h-3 w-10 bg-[var(--surface-1)] rounded-full" />
                  <div className="h-3 w-10 bg-[var(--surface-1)] rounded-full" />
                </div>
                <div className="flex justify-between items-end pt-3">
                  <div className="h-5 w-20 bg-[var(--surface-2)] rounded" />
                  <div className="h-4 w-16 bg-[var(--color-orange-500)]/20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right — map */}
        <div
          className="hidden md:block flex-1 bg-gradient-to-br from-emerald-50 via-[var(--surface-base)] to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 relative"
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(18,28,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(18,28,42,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {[
            { left: '25%', top: '20%' },
            { left: '55%', top: '35%' },
            { left: '40%', top: '60%' },
            { left: '70%', top: '45%' },
            { left: '20%', top: '70%' },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute animate-pulse -translate-x-1/2 -translate-y-full"
              style={pos}
            >
              <div className="h-6 w-14 bg-[var(--surface-container-lowest)] rounded-full shadow-ambient" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
