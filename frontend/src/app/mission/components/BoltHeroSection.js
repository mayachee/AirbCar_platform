'use client';

import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

const cards = [
  { 
    id: 1,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/x-x-kfmUTWbUP9Y-unsplash.jpg", 
    alt: "Premium Fleet", 
    angle: -12, 
    x: '-38%', 
    y: '-28%',
    zIndex: 10,
    scale: 0.95
  },
  { 
    id: 2,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/marina_malkova-nIOK_GnEGeU-unsplash.jpg", 
    alt: "Our Partners", 
    angle: 15, 
    x: '35%',
    y: '-32%',
    zIndex: 20,
    scale: 0.85
  },
  { 
    id: 3,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/danijel-skabic--GNdBb4WkDU-unsplash.jpg", 
    alt: "Comfort", 
    angle: -5, 
    x: '-8%',
    y: '5%',
    zIndex: 40,
    scale: 1.1
  },
  { 
    id: 4,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/helena-lopes-e3OUQGT9bWU-unsplash.jpg", 
    alt: "Community", 
    angle: 20, 
    x: '42%',
    y: '15%',
    zIndex: 15,
    scale: 0.9
  },
  { 
    id: 5,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/x-x-kfmUTWbUP9Y-unsplash.jpg", 
    alt: "Performance", 
    angle: -25, 
    x: '-42%',
    y: '25%',
    zIndex: 5,
    scale: 1.05
  },
   { 
    id: 6,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/martin-katler-h9g8CdsDG7Q-unsplash.jpg", 
    alt: "Adventure", 
    angle: 8, 
    x: '18%',
    y: '35%',
    zIndex: 35,
    scale: 0.9
  },
  { 
    id: 7,
    src: "https://ik.imagekit.io/szcfr7vth/New%20folder/marina_malkova-nIOK_GnEGeU-unsplash.jpg", 
    alt: "Future", 
    angle: -10, 
    x: '-22%',
    y: '-38%',
    zIndex: 1,
    scale: 0.8
  }
];

export default function BoltHeroSection() {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
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
      className="relative min-h-[120vh] flex flex-col items-center justify-start pt-32 overflow-hidden"
    >
      {/* Background Text Layer */}
      <div className="absolute  inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
        <motion.div style={{ y: yText }} className="text-center">
            <h1 className="text-[13vw] leading-[0.8] font-bold text-white tracking-tight">
              FEEL AT HOME<br/>
              WHATEVER<br/>
              YOU GO
            </h1>
        </motion.div>
      </div>

      {/* Main Cluster */}
      <div className="relative z-[-10] w-full h-[600px] flex items-center justify-center mt-10 md:mt-0 perspective-1000">
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
  // 1. Mouse Parallax (pixel offset)
  const mouseXOffset = useTransform(mouseX, [-0.5, 0.5], [-25, 25]);
  const mouseYOffset = useTransform(mouseY, [-0.5, 0.5], [-25, 25]);

  // 2. Scroll Parallax Vertical (pixel offset)
  // Higher zIndex = closer to camera = moves more
  const dist = card.zIndex * 8 + 50; // Increased movement for more dramatic effect
  const scrollYOffset = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  
  // 3. Scroll Parallax Horizontal (spread effect)
  // Cards on left move left, cards on right move right
  const isLeft = String(card.x).startsWith('-');
  const spread = isMobile ? 30 : 80; // Reduce spread on mobile
  const scrollXOffset = useTransform(scrollYProgress, [0, 1], [0, isLeft ? -spread : spread]);

  // 4. Combine all into CSS calc
  // We utilize the useTransform hook to combine multiple motion values
  // Squeeze width on mobile to fit screen
  const xPosition = useTransform(
    [mouseXOffset, scrollXOffset],
    ([m, s]) => isMobile 
      ? `calc(${card.x} * 0.6 + ${m + s}px)`
      : `calc(${card.x} + ${m + s}px)`
  );

  const yPosition = useTransform(
    [mouseYOffset, scrollYOffset],
    ([m, s]) => `calc(${card.y} + ${m + s}px)`
  );

  return (
    <motion.div
      style={{
        zIndex: card.zIndex,
        position: 'absolute',
        top: '50%',
        left: '50%',
        x: xPosition, 
        y: yPosition,
      }}
      initial={{ 
        opacity: 0, 
        scale: 0,
        rotate: card.angle + (index % 2 === 0 ? 10 : -10)
      }}
      animate={{ 
        opacity: 1, 
        scale: card.scale * (isMobile ? 0.85 : 1),
        rotate: card.angle,
        transition: {
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
          delay: index * 0.08
        }
      }}
      whileHover={{ 
        scale: card.scale * (isMobile ? 1 : 1.15), 
        rotate: 0, 
        zIndex: 100,
        transition: { duration: 0.3 }
      }}
      className="absolute w-32 h-44 md:w-56 md:h-80 p-1 shadow-xl origin-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
    >
      <div className="relative w-full h-full overflow-hidden">
        <Image 
          src={card.src} 
          alt={card.alt} 
          fill 
          sizes="(max-width: 768px) 128px, 224px"
          className="object-cover"
        />
      </div>
    </motion.div>
  );
}
