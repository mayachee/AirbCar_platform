import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      step: 'Step 1',
      title: "Enter your location and see what's available, you'll get a great price on every type of car rental.",
      image: 'https://ik.imagekit.io/szcfr7vth/Gemini_Generated_Image_n7ip3xn7ip3xn7ip.png',
      number: '01',
      href: '/search',
      cta: 'SEARCH NOW'
    },
    {
      step: 'Step 2',
      title: 'We check prices from multiple rental locations for you. Pick your car and book directly with the provider, with no hidden costs.',
      image: 'https://ik.imagekit.io/szcfr7vth/6037a39caf6d7ad747c91a3989608259.jpg',
      number: '02',
      href: '/search',
      cta: 'COMPARE NOW'
    },
    {
      step: 'Step 3',
      title: 'Compare prices, then book directly with the provider',
      image: 'https://ik.imagekit.io/szcfr7vth/ema_travel-by-car_rental_4096x2731.jpg',
      number: '03',
      href: '/search',
      cta: 'BOOK NOW'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-16"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase text-gray-500">How It Works</p>
          <div className="mt-4 flex items-end justify-between gap-8">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight">
              Three steps.
            </h2>
            <p className="hidden md:block max-w-md text-sm text-gray-600 leading-relaxed">
              Search, compare, then book. Fast and transparent.
            </p>
          </div>
        </motion.div>

        <div className="space-y-20 md:space-y-32">
          {steps.map((step, index) => {
            const reverseOnDesktop = index % 2 === 1;

            return (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className="group grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center"
              >
                <div className={reverseOnDesktop ? 'lg:order-2' : ''}>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-100 aspect-[4/3] transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/carsymbol.jpg';
                      }}
                    />
                  </div>
                </div>

                <div className={reverseOnDesktop ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-orange-600 font-bold text-sm tracking-widest uppercase">
                      {step.step}
                    </span>
                    <div className="h-px flex-1 bg-gray-200"></div>
                    <span className="text-6xl font-black text-gray-100 select-none">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-10 group-hover:text-orange-500 transition-colors duration-300">
                    {step.title}
                  </h3>

                  <div>
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-3 group/link"
                      aria-label={`${step.cta} - ${step.title}`}
                    >
                      <span className="text-sm font-bold tracking-widest uppercase text-gray-900 border-b-2 border-gray-200 pb-1 group-hover/link:border-orange-600 transition-all">
                        {step.cta}
                      </span>
                      <svg 
                        className="w-5 h-5 text-gray-900 transform transition-transform group-hover/link:translate-x-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
