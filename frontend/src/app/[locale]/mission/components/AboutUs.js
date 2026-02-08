'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Users, Leaf } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'We prioritize the safety of our riders and drivers above all else, implementing rigorous standards and 24/7 support.'
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'Leveraging cutting-edge technology to create seamless, efficient, and delightful transportation experiences for everyone.'
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building a supportive network where drivers thrive and passengers feel at home, fostering trust and real connection.'
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Committed to a greener future by promoting shared rides and strictly integrating electric vehicle options.'
  }
];

export default function AboutUs() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
         <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-orange-500/30 rounded-full blur-[80px]" />
         <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full mx-auto text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            About Us
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-6">
            We are dedicated to revolutionizing mobility in Morocco and beyond. 
            Our mission is to provide safe, reliable, and accessible transportation for everyone, bridging the gap between convenience and quality.
          </p>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
             From bustling city centers to remote destinations, Airbcar connects people through a platform built on trust. 
             We aren't just a ride-hailing app; we are a movement towards smarter cities and empowered communities. 
             We believe in moving people forward giving time back to our riders and new opportunities to our drivers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-orange-500/50 hover:bg-slate-800/60 transition-all group"
                >
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform duration-300">
                        <item.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                        {item.description}
                    </p>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
