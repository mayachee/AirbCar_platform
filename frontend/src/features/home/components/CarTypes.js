import Link from "next/link";
import { motion } from "framer-motion";

export default function CarTypes() {
  const carTypes = [
    {
      name: "Economy",
      title: "Budget Friendly",
      doors: "4 door",
      people: 4,
      bags: 3,
      price: 250,
      image: "https://ik.imagekit.io/szcfr7vth/kkkk.jpg"
    },
    {
      name: "Compact",
      title: "City Compact",
      doors: "4 door",
      people: 4,
      bags: 2,
      price: 350,
      image: "https://ik.imagekit.io/szcfr7vth/a0b5790230f74f0490b80a370f89805b.jpg"
    },
    {
      name: "Intermediate",
      title: "Comfort Cruiser",
      doors: "4 door",
      people: 5,
      bags: 4,
      price: 170,
      image: "https://ik.imagekit.io/szcfr7vth/2024-hyundai-sonata-n-line-102-66c61790321ef.avif"
    },
    {
      name: "Mini",
      title: "Easy Mini",
      doors: "4 door",
      people: 4,
      bags: 1,
      price: 203,
      image: "https://ik.imagekit.io/szcfr7vth/martin-katler-_0aPqIvfVko-unsplash.jpg"
    },
    {
      name: "Full-size",
      title: "Roomy Full Size",
      doors: "4 door",
      people: 5,
      bags: 4,
      price: 257,
      image: "https://ik.imagekit.io/szcfr7vth/lrds20mydynamicnd210519002.jpg"
    },
    {
      name: "Premium",
      title: "Premium Comfort",
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
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-b border-gray-200 pb-6 md:pb-8 mb-8 md:mb-10 flex items-end justify-between gap-8"
        >
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-gray-500">Car categories</p>
            <h2 className="mt-3 text-4xl md:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight">
              Find your perfect ride
            </h2>
            <p className="mt-4 md:hidden text-sm text-gray-600 leading-relaxed">
              Pick a size that fits your trip. Compare capacity and typical daily price.
            </p>
          </div>
          <p className="hidden md:block max-w-md text-sm text-gray-600 leading-relaxed">
            Pick a size that fits your trip. Compare capacity and typical daily price.
          </p>
        </motion.div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 md:auto-rows-[240px]">
          {carTypes.map((car, index) => {
            const displayName = car.title ?? car.name;
            return (
              <motion.div
                key={car.name}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${getEditorialSpanClass(index)} h-full`}
              >
              <Link
                href={`/search?type=${encodeURIComponent(car.name)}`}
                aria-label={`Browse ${displayName} cars`}
                className={`group relative block h-full rounded-2xl border border-gray-200 bg-white overflow-hidden transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20`}
              >
                <div className="relative h-[320px] sm:h-[380px] md:h-full overflow-hidden">
                  <img
                    src={car.image}
                    alt={displayName}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                    {displayName}
                  </h3>

                  <span
                    className="mt-3 inline-flex text-sm font-semibold text-white/95 underline underline-offset-4 decoration-white/40 group-hover:text-white group-hover:decoration-white py-2"
                    aria-hidden="true"
                  >
                    Select
                  </span>
                </div>
              </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Big-Type List */}
        <div className="mt-14 md:mt-20 border-t border-gray-200 pt-8 md:pt-10">
          <p className="text-[11px] tracking-[0.22em] uppercase text-gray-500">All types</p>
          <div className="mt-6">
            {carTypes.map((car, index) => {
              const displayName = car.title ?? car.name;
              return (
                <motion.div
                  key={`${car.name}-row`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                <Link
                  href={`/search?type=${encodeURIComponent(car.name)}`}
                  aria-label={`Browse ${displayName} cars`}
                  className="group relative block py-3 md:py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20"
                >
                  <div className="flex items-center sm:items-start justify-between gap-4 sm:gap-6">
                    <span className="min-w-0 text-2xl sm:text-5xl md:text-7xl font-black text-gray-900 leading-[0.9] tracking-tight truncate transition-colors duration-200 group-hover:text-orange-500 group-hover:underline group-hover:underline-offset-8 decoration-orange-300 z-[20]">
                      {displayName}
                    </span>
                    <span className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-gray-500 whitespace-nowrap shrink-0 transition-colors duration-200 group-hover:text-orange-700">
                      {car.price} € / day
                    </span>
                  </div>

                  <div className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 md:block opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <div className="h-100 w-full overflow-hidden rounded-xl border border-gray-200 bg-white ">
                      <img
                        src={car.image}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
