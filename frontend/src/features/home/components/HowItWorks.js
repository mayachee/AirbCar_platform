import Link from 'next/link';

export default function HowItWorks() {
  const steps = [
    {
      step: 'Step 1',
      title: "Enter your location and see what's available, you'll get a great price on every type of car rental.",
      image: 'https://ik.imagekit.io/szcfr7vth/72c58263-9d32-4e95-9b10-c6b6173fe321.avif',
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
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-16">
          <p className="text-[11px] tracking-[0.22em] uppercase text-gray-500">How It Works</p>
          <div className="mt-4 flex items-end justify-between gap-8">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight">
              Three steps.
            </h2>
            <p className="hidden md:block max-w-md text-sm text-gray-600 leading-relaxed">
              Search, compare, then book. Fast and transparent.
            </p>
          </div>
        </div>

        <div className="space-y-14 md:space-y-20">
          {steps.map((step, index) => {
            const reverseOnDesktop = index % 2 === 1;

            return (
              <article
                key={step.number}
                className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
              >
                <div className={reverseOnDesktop ? 'lg:order-2' : ''}>
                  <div className="border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="relative w-full aspect-[4/3]">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/carsymbol.jpg';
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className={reverseOnDesktop ? 'lg:order-1' : ''}>
                  <div className="flex items-baseline justify-between gap-6">
                    <p className="text-[10px] tracking-[0.22em] uppercase text-gray-500">
                      {step.step}
                    </p>
                    <p className="text-lg md:text-2xl font-black text-gray-300 leading-none">
                      {step.number}
                    </p>
                  </div>

                  <h3 className="mt-3 text-4xl md:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight transition-colors duration-200 group-hover:text-orange-700">
                    {step.title}
                  </h3>

                  <div className="mt-8">
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase text-gray-900"
                      aria-label={`${step.cta} - ${step.title}`}
                    >
                      <span className="text-lg leading-none">→</span>
                      <span className="border-b border-gray-300 pb-1">{step.cta}</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
