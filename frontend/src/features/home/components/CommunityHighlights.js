'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

const mockPosts = [
  {
    id: 1,
    type: 'trip',
    author: {
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
    },
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600&h=800',
    caption: 'Amazing road trip through the Atlas Mountains with our rented Range Rover! 🏔️🚙',
    likes: 124,
    comments: 18,
    tags: ['#AtlasMountains', '#RoadTrip'],
    span: 'col-span-1 row-span-2',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 2,
    type: 'partner',
    author: {
      name: 'Elite Auto Casa',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150&h=150',
      isPartner: true,
    },
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600&h=400',
    caption: 'Just added this beauty to our fleet. The new Mercedes C-Class is ready for your next business trip. 🌟',
    likes: 342,
    comments: 45,
    tags: ['#LuxuryRentals', '#Mercedes'],
    span: 'col-span-1 row-span-1',
    aspect: 'aspect-video',
  },
  {
    id: 3,
    type: 'trip',
    author: {
      name: 'Marcus Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
    },
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600&h=600',
    caption: 'Coastal drive from Tangier to Chefchaouen. The scenery is absolutely breathtaking! 🌊',
    likes: 89,
    comments: 5,
    tags: ['#CoastalDrive', '#Morocco'],
    span: 'col-span-1 row-span-1',
    aspect: 'aspect-square',
  },
  {
    id: 4,
    type: 'partner',
    author: {
      name: 'Marrakech Motors',
      avatar: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=150&h=150',
      isPartner: true,
    },
    image: 'https://images.unsplash.com/photo-1503376766629-a1fc144c20fc?auto=format&fit=crop&q=80&w=600&h=800',
    caption: 'Weekend special on all premium SUVs! Book now and get 20% off. Perfect for family getaways. 🚗💨',
    likes: 256,
    comments: 32,
    tags: ['#SpecialOffer', '#SUV'],
    span: 'col-span-1 row-span-2',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 5,
    type: 'trip',
    author: {
      name: 'Elena Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150',
    },
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=600&h=400',
    caption: 'Evening drive through the city lights. 🌃',
    likes: 412,
    comments: 28,
    tags: ['#CityLights', '#NightDrive'],
    span: 'col-span-1 row-span-1',
    aspect: 'aspect-[4/3]',
  },
  {
    id: 6,
    type: 'trip',
    author: {
      name: 'David Smith',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
    },
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=600&h=400',
    caption: 'Desert dunes adventure in our 4x4. An unforgettable experience! 🐪🏜️',
    likes: 567,
    comments: 89,
    tags: ['#DesertAdventure', '#4x4'],
    span: 'col-span-1 row-span-1',
    aspect: 'aspect-square',
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function CommunityHighlights() {
  const t = useTranslations('home');

  return (
    <section className="py-20 bg-gray-50 dark:bg-zinc-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-sm font-bold tracking-wider text-primary uppercase mb-3">
              Airbcar Social
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Community Highlights
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See what our community of drivers and premium partners are up to. Real trips, real luxury.
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
        >
          {mockPosts.map((post) => (
            <motion.div
              key={post.id}
              variants={itemVariants}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-800"
            >
              {/* Image Container */}
              <div className="relative w-full">
                {/* Fallback intrinsic aspect ratio in case image loads slow */}
                <div className={`${post.aspect} relative w-full overflow-hidden`}>
                  <Image
                    src={post.image}
                    alt={post.caption}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  
                  {/* Glassmorphism gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                  
                  {/* Floating Action Chips */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold shadow-lg">
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                      <span>{post.likes}</span>
                    </div>
                  </div>
                </div>

                {/* Content Overlay that sits on bottom of image */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-md">
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm flex items-center gap-1">
                        {post.author.name}
                        {post.author.isPartner && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px]" title="Verified Partner">✓</span>
                        )}
                      </p>
                      <p className="text-white/80 text-xs">
                        {post.type === 'partner' ? 'Partner Update' : 'Trip Post'}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-white/95 text-sm line-clamp-2 leading-relaxed font-medium drop-shadow-sm">
                    {post.caption}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs font-medium text-white/90 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Interaction Bar (below image) */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-700/50 flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-zinc-800">
                <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
