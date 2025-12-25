import Link from 'next/link';
import TipCard from './TipCard';

export default function InfoSection() {

  return (
    <section className="relative w-full h-[60vh] md:h-screen bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/info-background.png')" }}></div>
      
      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
      
      {/* Content */}
      <div className="relative h-full flex items-end justify-start px-4 sm:px-8 md:px-12 lg:px-20 py-12 sm:py-16 md:py-20">
        <div className="max-w-3xl w-full">
          <Link href="/mission" className="group block">
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-md">
              Connecting you to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 pb-1 transition-all duration-300 group-hover:opacity-90">
                the moments that matter
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="inline-block ml-3 w-8 h-8 sm:w-10 sm:h-10 text-orange-400 transition-transform duration-300 group-hover:translate-x-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </span>
            </h2>
          </Link>
        </div>
      </div>
    </section>
  );
}
