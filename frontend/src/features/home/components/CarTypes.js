import Link from "next/link";
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslations } from 'next-intl';

export default function CarTypes() {
  const { formatPrice } = useCurrency();
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const carTypes = [
    { name: t('car_economy'), title: t('car_economy_title'), doors: "4 door", people: 4, bags: 3, price: 250, image: "https://ik.imagekit.io/szcfr7vth/kkkk.jpg" },
    { name: t('car_compact'), title: t('car_compact_title'), doors: "4 door", people: 4, bags: 2, price: 350, image: "https://ik.imagekit.io/szcfr7vth/a0b5790230f74f0490b80a370f89805b.jpg" },
    { name: t('car_intermediate'), title: t('car_intermediate_title'), doors: "4 door", people: 5, bags: 4, price: 170, image: "https://ik.imagekit.io/szcfr7vth/2024-hyundai-sonata-n-line-102-66c61790321ef.avif" },
    { name: t('car_mini'), title: t('car_mini_title'), doors: "4 door", people: 4, bags: 1, price: 203, image: "https://ik.imagekit.io/szcfr7vth/martin-katler-_0aPqIvfVko-unsplash.jpg" },
    { name: t('car_fullsize'), title: t('car_fullsize_title'), doors: "4 door", people: 5, bags: 4, price: 257, image: "https://ik.imagekit.io/szcfr7vth/lrds20mydynamicnd210519002.jpg" },
    { name: t('car_premium'), title: t('car_premium_title'), doors: "4 door", people: 5, bags: 2, price: 419, image: "https://ik.imagekit.io/szcfr7vth/norr-fotografie-PDC7LVOVQlc-unsplash.jpg" },
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
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-base) 100%)' }}>
      {/* Ambient glow */}
      <div className="glow-orange absolute top-1/3 -right-40 w-[500px] h-[500px] opacity-15" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-14"
        >
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="label-xs text-[var(--color-orange-500)] mb-3">
                {t('car_types_kicker')}
              </p>
              <h2 className="headline-lg sm:text-4xl md:text-6xl text-[var(--text-primary)] leading-[0.95]">
                {t('car_types_heading')}
              </h2>
              <p className="mt-4 md:hidden text-sm text-[var(--text-secondary)] leading-relaxed">
                {t('car_types_description')}
              </p>
            </div>
            <p className="hidden md:block max-w-sm text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('car_types_description')}
            </p>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-[var(--border-medium)] to-transparent" />
        </motion.div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 md:auto-rows-[240px]">
          {carTypes.map((car, index) => {
            const displayName = car.title ?? car.name;
            return (
              <motion.div
                key={car.name}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`${getEditorialSpanClass(index)} h-full`}
              >
                <Link
                  href={`/search?type=${encodeURIComponent(car.name)}`}
                  aria-label={`Browse ${displayName} cars`}
                  className="group relative block h-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transform hover:-translate-y-1.5 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-orange-500)]/40"
                >
                  <div className="relative h-[320px] sm:h-[380px] md:h-full overflow-hidden">
                    <img
                      src={car.image}
                      alt={displayName}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                      loading="lazy"
                      sizes="(min-width: 768px) 60vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-75" />
                    {/* High-end grain overlay */}
                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none transition-opacity duration-700 group-hover:opacity-[0.25]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />
                  </div>

                  <div className={`absolute inset-x-0 bottom-0 text-white flex flex-col justify-end transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-2 ${isHeroTile(index) ? 'p-6 md:p-10' : 'p-5 md:p-7'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/80 drop-shadow-md">
                        {car.doors} &middot; {car.people} pass &middot; {car.bags} bags
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-sm text-[var(--color-orange-500)] shadow-sm">
                        {formatPrice(car.price)} / day
                      </span>
                    </div>

                    <h3 className={`${isHeroTile(index) ? 'text-4xl sm:text-5xl md:text-7xl' : 'text-3xl sm:text-4xl md:text-5xl'} mt-1 font-black leading-[0.92] tracking-tighter drop-shadow-xl text-white group-hover:text-white transition-colors duration-300`}>
                      {displayName}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Big-Type List */}
        <div className="mt-16 md:mt-24 pt-8 md:pt-12">
          <p className="label-xs text-[var(--text-muted)]">{t('car_types_all_types')}</p>
          <div className="mt-6">
            {carTypes.map((car, index) => {
              const displayName = car.title ?? car.name;
              return (
                <motion.div
                  key={`${car.name}-row`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                >
                  <Link
                    href={`/search?type=${encodeURIComponent(car.name)}`}
                    aria-label={`Browse ${displayName} cars`}
                    className="group relative block py-4 md:py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-orange-500)]/30"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex items-center sm:items-start justify-between gap-4 sm:gap-6">
                      <span className="min-w-0 text-2xl sm:text-5xl md:text-7xl font-black text-[var(--text-primary)] leading-[0.9] tracking-tight truncate transition-colors duration-200 group-hover:text-[var(--color-orange-500)]">
                        {displayName}
                      </span>
                      <span className="label-xs text-[var(--text-muted)] whitespace-nowrap shrink-0 transition-colors duration-200 group-hover:text-[var(--color-orange-500)]">
                        {formatPrice(car.price)} / day
                      </span>
                    </div>

                    {/* Hover preview image */}
                    <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 z-10">
                      <div className="h-36 w-56 overflow-hidden rounded-xl shadow-ambient-lg">
                        <img src={car.image} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
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
