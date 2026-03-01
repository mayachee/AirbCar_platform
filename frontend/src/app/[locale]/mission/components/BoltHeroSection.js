'use client';

import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const cards = [
  {
    id: 1,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/x-x-kfmUTWbUP9Y-unsplash.jpg",
    alt: "Premium Fleet",
    desktop: { left: '5%', top: '20%' },
    mobile: { left: '-8%', top: '2%' },
    angle: -12,
    zIndex: 10,
    scale: 0.95
  },
  {
    id: 2,
    src: "https://ik.imagekit.io/szcfr7vth/Gemini_Generated_Image_n7ip3xn7ip3xn7ip.png",
    alt: "Our Partners",
    desktop: { right: '5%', top: '18%' },
    mobile: { right: '-8%', top: '5%' },
    angle: 15,
    zIndex: 20,
    scale: 0.85
  },
  {
    id: 3,
    src: "https://ik.imagekit.io/szcfr7vth/gettyimages-1359860570-612x612-Picsart-AiImageEnhancer.jpg",
    alt: "Comfort",
    desktop: { left: '50%', top: '35%', transform: 'translate(-50%, 0)' },
    mobile: { left: '50%', top: '15%', transform: 'translate(-50%, 0)' },
    angle: -5,
    zIndex: 40,
    scale: 1.1
  },
  {
    id: 4,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/helena-lopes-e3OUQGT9bWU-unsplash.jpg",
    alt: "Community",
    desktop: { left: '10%', bottom: '10%' },
    mobile: { left: '2%', bottom: '22%' },
    angle: 20,
    zIndex: 15,
    scale: 0.9
  },
  {
    id: 5,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/x-x-kfmUTWbUP9Y-unsplash.jpg",
    alt: "Performance",
    desktop: { right: '10%', bottom: '12%' },
    mobile: { right: '2%', bottom: '20%' },
    angle: -25,
    zIndex: 5,
    scale: 1.05
  }
];

export default function BoltHeroSection() {
  const t = useTranslations('mission');
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set((e.clientX - window.innerWidth / 2) / window.innerWidth);
      mouseY.set((e.clientY - window.innerHeight / 2) / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const yText = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] md:min-h-[120vh] flex flex-col items-center justify-start overflow-hidden"
    >
      {/* ── Cards layer (behind text on mobile) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none md:pointer-events-auto">
        {/* Dimming overlay on mobile so cards don't fight the heading */}
        <div className="absolute inset-0 bg-black/20 md:bg-transparent z-[1]" />
        <div className="absolute left-0 top-0 w-full h-full md:h-[600px] md:mt-0">
          {cards.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              index={index}
              mouseX={mouseX}
              mouseY={mouseY}
              scrollYProgress={scrollYProgress}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* ── Heading layer ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 py-20 md:py-32">
        <motion.div
          style={{ y: yText }}
          className="text-center pointer-events-none select-none"
        >
          <h1 className="text-[15vw] md:text-[13vw] leading-[0.85] font-black text-orange-500 tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {t('hero_heading')}
          </h1>
        </motion.div>
      </div>

      {/* ── Tagline footer ── */}
      <div className="absolute bottom-8 md:bottom-12 left-0 w-full z-50 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15"
        >
          <span className="block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-xs md:text-sm uppercase tracking-[0.15em] md:tracking-[0.25em] font-semibold text-orange-400">
            {t('hero_tagline')}
          </p>
        </motion.div>
      </div>

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 z-[5] opacity-[0.03] pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </section>
  );
}

function Card({ card, index, mouseX, mouseY, scrollYProgress, isMobile }) {
  const pos = isMobile ? card.mobile : card.desktop;
  const mobileScale = isMobile ? 0.55 : 1;

  const style = {
    zIndex: card.zIndex,
    position: 'absolute',
    ...pos,
    transform: pos.transform || undefined
  };

  return (
    <motion.div
      style={style}
      initial={{
        opacity: 0,
        scale: 0,
        rotate: card.angle + (index % 2 === 0 ? 10 : -10)
      }}
      animate={{
        opacity: isMobile ? 0.7 : 1,
        scale: card.scale * mobileScale,
        rotate: card.angle,
        transition: {
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
          delay: index * 0.08
        }
      }}
      whileHover={!isMobile ? {
        scale: card.scale * 1.15,
        rotate: 0,
        zIndex: 100,
        transition: { duration: 0.3 }
      } : undefined}
      className="w-48 h-72 md:w-[340px] md:h-[480px] p-0.5 shadow-2xl origin-center cursor-pointer rounded-3xl border-2 border-white/20 bg-white/5 backdrop-blur-sm"
    >
      <div className="relative w-full h-full overflow-hidden rounded-3xl">
        <Image
          src={card.src}
          alt={card.alt}
          fill
          sizes="(max-width: 768px) 192px, 480px"
          className="object-cover scale-105 transition-transform duration-500 hover:scale-110"
          style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
        />
        <div className="absolute inset-0 rounded-3xl border-2 border-white/20 pointer-events-none" />
      </div>
    </motion.div>
  );
}
