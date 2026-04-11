import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('home');
  const steps = [
    {
      step: t('step1_label'),
      title: t('step1_description'),
      image: 'https://ik.imagekit.io/szcfr7vth/Gemini_Generated_Image_n7ip3xn7ip3xn7ip.png',
      number: '01',
      href: '/search',
      cta: t('step1_cta'),
    },
    {
      step: t('step2_label'),
      title: t('step2_description'),
      image: 'https://ik.imagekit.io/szcfr7vth/6037a39caf6d7ad747c91a3989608259.jpg',
      number: '02',
      href: '/search',
      cta: t('step2_cta'),
    },
    {
      step: t('step3_label'),
      title: t('step3_description'),
      image: 'https://ik.imagekit.io/szcfr7vth/ema_travel-by-car_rental_4096x2731.jpg',
      number: '03',
      href: '/search',
      cta: t('step3_cta'),
    },
  ];

  return (
    <section className="relative py-20 md:py-28 surface-base overflow-hidden">
      <div className="glow-blue absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-20"
        >
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="label-xs text-[var(--color-orange-500)] mb-3">
                {t('how_it_works_kicker')}
              </p>
              <h2 className="headline-lg sm:text-4xl md:text-6xl text-[var(--text-primary)] leading-[0.95]">
                {t('how_it_works_heading')}
              </h2>
            </div>
            <p className="hidden md:block max-w-sm text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('how_it_works_description')}
            </p>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-[var(--border-medium)] to-transparent" />
        </motion.div>

        <div className="space-y-16 md:space-y-28">
          {steps.map((step, index) => {
            const reverseOnDesktop = index % 2 === 1;

            return (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center"
              >
                <div className={reverseOnDesktop ? 'lg:order-2' : ''}>
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] transition-all duration-500 shadow-ambient hover:shadow-ambient-lg">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { e.target.src = '/carsymbol.jpg'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121c2a]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>

                <div className={reverseOnDesktop ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="label-xs text-[var(--color-orange-500)]">
                      {step.step}
                    </span>
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                    <span className="text-5xl md:text-7xl font-black text-[var(--text-primary)]/[0.06] select-none leading-none">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight mb-8 group-hover:text-[var(--color-orange-500)] transition-colors duration-300">
                    {step.title}
                  </h3>

                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-3 group/link"
                    aria-label={`${step.cta} - ${step.title}`}
                  >
                    <span className="text-xs font-bold tracking-[0.15em] uppercase text-[var(--text-secondary)] pb-1 group-hover/link:text-[var(--color-orange-500)] transition-all duration-300" style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      {step.cta}
                    </span>
                    <svg
                      className="w-4 h-4 text-[var(--text-muted)] transition-all duration-300 group-hover/link:text-[var(--color-orange-500)] group-hover/link:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
