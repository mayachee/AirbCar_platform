'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogTrigger,
  AnimatedDialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { 
  Car, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  Users,
  Leaf,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function MissionDialog({ children }) {
  const [open, setOpen] = useState(false);

  const features = [
    {
      icon: Car,
      title: 'Sustainable Mobility',
      description: 'Reducing carbon footprint through shared transportation.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Building a network of trusted drivers and passengers.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Leaf,
      title: 'Eco-Friendly',
      description: 'Making cities cleaner and more livable for everyone.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: TrendingUp,
      title: 'Growing Impact',
      description: 'Expanding our reach across cities worldwide.',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="primary" 
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Learn More About Our Mission
          </Button>
        )}
      </DialogTrigger>
      <AnimatedDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-green-50/30 border-0 shadow-2xl p-0">
        {/* Header Section with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative p-8 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-3xl font-bold text-white">
                  Our Mission
                </DialogTitle>
                <DialogDescription className="text-green-100 text-lg mt-2">
                  Making cities for people, not cars
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <motion.div
            animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full blur-xl"
          />
          <motion.div
            animate={{ y: [0, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="absolute bottom-4 left-8 w-16 h-16 bg-white/10 rounded-full blur-xl"
          />
        </motion.div>

        {/* Content */}
        <div className="p-6">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
          {/* Mission Statement */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-6 w-6 text-green-600" />
              Our Vision
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg">
              At Airbcar, we believe in creating a future where mobility is sustainable, 
              accessible, and community-driven. We're transforming how people move through 
              cities by providing innovative transportation solutions that reduce environmental 
              impact while connecting communities.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative p-6 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300" 
                       style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                    className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-4"
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Key Achievements */}
          <motion.div variants={fadeInUp} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Our Commitment
            </h3>
            <ul className="space-y-3">
              {[
                'Reducing carbon emissions through shared mobility',
                'Creating economic opportunities for drivers',
                'Building safer, more connected communities',
                'Expanding access to affordable transportation',
              ].map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.6 }}
                  className="flex items-start gap-3 text-gray-700"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <DialogFooter className="w-full sm:justify-end gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setOpen(false)}
                className="border-2 border-gray-300 hover:border-gray-400"
              >
                Close
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={() => {
                    setOpen(false);
                    // You can add navigation logic here
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                >
                  Join Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
          </motion.div>
        </div>
      </AnimatedDialogContent>
    </Dialog>
  );
}

