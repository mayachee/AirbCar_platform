'use client';

import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

const cards = [
  {
    id: 1,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/x-x-kfmUTWbUP9Y-unsplash.jpg",
    alt: "Premium Fleet",
    position: { left: '5%', top: '20%' },
    angle: -12,
    zIndex: 10,
    scale: 0.95
  },
  {
    id: 2,
    src: "https://ik.imagekit.io/szcfr7vth/Gemini_Generated_Image_n7ip3xn7ip3xn7ip.png",
    alt: "Our Partners",
    position: { right: '5%', top: '18%' },
    angle: 15,
    zIndex: 20,
    scale: 0.85
  },
  {
    id: 3,
    src: "https://ik.imagekit.io/szcfr7vth/gettyimages-1359860570-612x612-Picsart-AiImageEnhancer.jpg",
    alt: "Comfort",
    position: { left: '50%', top: '35%', transform: 'translate(-50%, 0)' },
    angle: -5,
    zIndex: 40,
    scale: 1.1
  },
  {
    id: 4,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/helena-lopes-e3OUQGT9bWU-unsplash.jpg",
    alt: "Community",
    position: { left: '10%', bottom: '10%' },
    angle: 20,
    zIndex: 15,
    scale: 0.9
  },
  {
    id: 5,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/x-x-kfmUTWbUP9Y-unsplash.jpg",
    alt: "Performance",
    position: { right: '10%', bottom: '12%' },
    angle: -25,
    zIndex: 5,
    scale: 1.05
  }
];

export default function BoltHeroSection() {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shuffledCards, setShuffledCards] = useState([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Shuffle cards on mount
  useEffect(() => {
    function shuffle(array) {
      const arr = array.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    setShuffledCards(shuffle(cards));
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY, innerWidth, innerHeight } = window;
      mouseX.set((clientX - innerWidth / 2) / innerWidth);
      mouseY.set((clientY - innerHeight / 2) / innerHeight);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const yText = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-[90vh] md:min-h-[120vh] flex flex-col items-center justify-start pt-20 md:pt-32 overflow-hidden"
    >
      {/* Background Text Layer */}
      <div className="absolute  inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
        <motion.div style={{ y: yText }} className="text-center">
            <h1 className="text-[13vw] leading-[0.8] font-bold text-orange-500 tracking-tight">
              FEEL AT HOME<br/>
              WHATEVER<br/>
              YOU GO
            </h1>
        </motion.div>
      </div>

      {/* Main Cluster */}
      <div className="absolute left-0 top-0 w-full h-[600px] z-[-10] mt-10 md:mt-0 perspective-1000 pointer-events-none">
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

       {/* Footer / Est */}
      <div className="absolute bottom-12 left-0 w-full flex items-center justify-center z-50 px-4 text-center">
         <div className="flex items-center gap-4 px-6 py-3">
            <p className="text-[10px] md:text-sm uppercase tracking-[0.15em] md:tracking-[0.25em] font-semibold text-orange-500">
              Airbcar is not just a ride, it's your comfort zone
            </p>
         </div>
      </div>

      {/* Texture */}
      <div className="absolute inset-0 z-[5] opacity-[0.03] pointer-events-none mix-blend-multiply" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </section>
  );
}

function Card({ card, index, mouseX, mouseY, scrollYProgress, isMobile }) {
  const style = {
    zIndex: card.zIndex,
    position: 'absolute',
    ...card.position,
    transform: card.position.transform || undefined
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
        opacity: 1,
        scale: card.scale * (isMobile ? 1 : 1),
        rotate: card.angle,
        transition: {
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
          delay: index * 0.08
        }
      }}
      whileHover={{
        scale: card.scale * (isMobile ? 1.05 : 1.15),
        rotate: 0,
        zIndex: 100,
        transition: { duration: 0.3 }
      }}
      className="w-64 h-96 md:w-[340px] md:h-[480px] p-0.5 shadow-2xl origin-center cursor-pointer rounded-3xl border-2 border-white/20 bg-white/5 backdrop-blur-sm"
    >
      <div className="relative w-full h-full overflow-hidden rounded-3xl">
        <Image
          src={card.src}
          alt={card.alt}
          fill
          sizes="(max-width: 768px) 256px, 480px"
          className="object-cover scale-105 transition-transform duration-500 hover:scale-110"
          style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
        />
        <div className="absolute inset-0 rounded-3xl border-2 border-white/20 pointer-events-none" />
      </div>
    </motion.div>
  );
}
