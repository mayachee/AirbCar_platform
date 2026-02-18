'use client';

import { motion, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';

export default function AboutUsSection() {
  const t = useTranslations('mission_about');
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const imageVariants = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // Custom easing for smooth feel
    }
  }
};
  return (
    <section ref={ref} className="relative py-20 sm:py-24 md:py-32 bg-orange-600 overflow-hidden">

      {/* Background Pattern - optional subtle texture */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
        {/* Feature Image */}
        <motion.div
          variants={imageVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          whileHover="hover"
          className="relative group w-screen ml-[calc(50%-50vw)] -mx-[50vw]"
          style={{ willChange: 'transform, filter' }}
        >
          {/* Image container */}
          <motion.div 
            className="relative overflow-hidden shadow-2xl"
            transition={{ duration: 0.4 }}
          >
            {/* Gradient overlay for depth */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent pointer-events-none"
              initial={{ opacity: 0.5 }}
              whileHover={{ opacity: 0.3 }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        </motion.div>

          <motion.div 
            className="relative z-10 my-16 space-y-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
          >
            {t('headline')}
          </motion.h2>

              <motion.p 
                className="text-lg sm:text-xl text-orange-50/90 max-w-3xl mx-auto leading-relaxed font-medium"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {t('description')}
              </motion.p>
          
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block pt-4"
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/search')}
                  className="relative h-14 bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 text-lg font-bold shadow-xl hover:bg-white/10 hover:text-orange-600 transition-all flex items-center gap-3 group overflow-hidden rounded-xl"
                >
                  <span className="relative z-10">{t('button')}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
                </Button>
              </motion.div>
            </motion.div>
            {/* Feature Image */}
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              whileHover="hover"
              className="relative group w-screen ml-[calc(50%-50vw)] -mx-[50vw]"
              style={{ willChange: 'transform, filter' }}
            >
              {/* Image container */}
              <motion.div 
                className="relative overflow-hidden shadow-2xl"
                transition={{ duration: 0.4 }}
              >
              
                {/* Gradient overlay for depth */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent pointer-events-none"
                  initial={{ opacity: 0.5 }}
                  whileHover={{ opacity: 0.3 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </motion.div>
        </div>
      </div>
    </section>
  );
}

