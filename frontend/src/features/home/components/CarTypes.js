import Link from "next/link";

export default function CarTypes() {
  const carTypes = [
    {
      name: "Economy", 
      doors: "4 door",
      people: 4,
      bags: 3,
      price: 250,
      image: "https://ik.imagekit.io/szcfr7vth/kkkk.jpg"
    },
    {
      name: "Compact",
      doors: "4 door",
      people: 4,
      bags: 2,
      price: 350,
      image: "https://ik.imagekit.io/szcfr7vth/a0b5790230f74f0490b80a370f89805b.jpg"
    },
    {
      name: "Intermediate",
      doors: "4 door", 
      people: 5,
      bags: 4,
      price: 170,
      image: "https://ik.imagekit.io/szcfr7vth/2024-hyundai-sonata-n-line-102-66c61790321ef.avif"
    },
    {
      name: "Mini",
      doors: "4 door",
      people: 4,
      bags: 1, 
      price: 203,
      image: "https://ik.imagekit.io/szcfr7vth/martin-katler-_0aPqIvfVko-unsplash.jpg"
    },
    {
      name: "Full-size",
      doors: "4 door",
      people: 5,
      bags: 4,
      price: 257,
      image: "https://ik.imagekit.io/szcfr7vth/lrds20mydynamicnd210519002.jpg"
    },
    {
      name: "Premium",
      doors: "4 door",
      people: 5,
      bags: 2,
      price: 419,
      image: "https://ik.imagekit.io/szcfr7vth/norr-fotografie-PDC7LVOVQlc-unsplash.jpg"
    }
  ];

  const getEditorialSpanClass = (index) => {
    if (index === 0) return 'md:col-span-7 md:row-span-2';
    if (index === 1) return 'md:col-span-5';
    if (index === 2) return 'md:col-span-5';
    if (index === 3) return 'md:col-span-6';
    if (index === 4) return 'md:col-span-6';
    if (index === 5) return 'md:col-span-12 md:row-span-2';
    return '';
  };

  const isHeroTile = (index) => index === 0 || index === 5;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-6 md:pb-8 mb-8 md:mb-10 flex items-end justify-between gap-8">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-gray-500">Car Types</p>
            <h2 className="mt-3 text-4xl md:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight">
              Browse by type
            </h2>
            <p className="mt-4 md:hidden text-sm text-gray-600 leading-relaxed">
              Pick a size that fits your trip. Compare capacity and typical daily price.
            </p>
          </div>
          <p className="hidden md:block max-w-md text-sm text-gray-600 leading-relaxed">
            Pick a size that fits your trip. Compare capacity and typical daily price.
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 md:auto-rows-[240px]">
          {carTypes.map((car, index) => (
            <article
              key={car.name}
              className={`group relative border border-gray-200 bg-white overflow-hidden transition-colors hover:border-gray-400 focus-within:border-gray-500 ${getEditorialSpanClass(index)}`}
            >
              <div className="relative h-[320px] sm:h-[380px] md:h-full overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  sizes="(min-width: 768px) 60vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              </div>

              {/* Poster overlay */}
              <div className={`absolute inset-x-0 bottom-0 text-white ${isHeroTile(index) ? 'p-6 md:p-8' : 'p-4 md:p-5'}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[11px] tracking-[0.22em] uppercase text-white/70">
                    {car.doors} • {car.people} people • {car.bags} bags
                  </p>
                  <span className="text-[11px] tracking-[0.22em] uppercase text-white/70 whitespace-nowrap shrink-0">
                    {car.price} € / day
                  </span>
                </div>

                <h3
                  className={`${isHeroTile(index) ? 'text-3xl sm:text-4xl md:text-6xl' : 'text-2xl sm:text-3xl md:text-4xl'} mt-3 font-black leading-[0.92] tracking-tight drop-shadow-sm`}
                >
                  {car.name}
                </h3>

                <Link
                  href={`/search?type=${encodeURIComponent(car.name)}`}
                  className="mt-3 inline-flex text-sm font-semibold text-white/95 underline underline-offset-4 decoration-white/40 hover:text-white hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black py-2"
                  aria-label={`Select ${car.name}`}
                >
                  Select
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Big-Type List */}
        <div className="mt-14 md:mt-20 border-t border-gray-200 pt-8 md:pt-10">
          <h3 className="text-3xl md:text-5xl font-black text-gray-900 leading-[0.95] tracking-tight">All types</h3>
          <div className="mt-6">
            {carTypes.map((car) => (
              <div
                key={`${car.name}-row`}
                className="group flex items-baseline justify-between gap-6 border-b border-gray-100 py-4"
              >
                <span className="min-w-0 text-3xl md:text-6xl font-black text-gray-900 leading-none tracking-tight group-hover:underline group-hover:underline-offset-8 decoration-gray-300 truncate">
                  {car.name}
                </span>
                <span className="text-[11px] tracking-[0.22em] uppercase text-gray-500 whitespace-nowrap shrink-0">
                  {car.price} € / day
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
