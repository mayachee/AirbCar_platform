import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function InfoSection() {
  const t = useTranslations('home');

  return (
    <section className="relative w-full h-[55vh] md:h-[80vh] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('/info-background.png')" }}
      />

      {/* Warm editorial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-base)]/80 via-[var(--surface-base)]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-base)] via-transparent to-[var(--surface-base)]/30" />

      {/* Content — asymmetric margins for editorial feel */}
      <div className="relative h-full flex items-end justify-start px-4 sm:px-8 md:px-12 lg:px-20 py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl w-full"
        >
          <Link href="/mission" className="group block">
            <h2 className="display-lg sm:text-4xl md:text-5xl lg:text-7xl text-[var(--text-primary)] leading-[0.95]">
              {t('info_heading_line1')}
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-orange-600)] to-[var(--color-orange-500)]">
                {t('info_heading_line2')}
              </span>
            </h2>
            <div className="mt-8 inline-flex items-center gap-3 btn-brand px-8 py-3.5 text-sm tracking-wide group-hover:gap-5 transition-all duration-300">
              <span>Discover our mission</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
