'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

// Mock data to match the high-end editorial feed
const MOCK_FEED = [
  {
    id: 1,
    type: 'partner_post',
    author: 'Lumina Motors',
    authorId: 101,
    content: 'The new aerodynamic silhouette redefines modern travel. Available for exclusive bookings starting this weekend.',
    image: 'https://images.unsplash.com/photo-1621532938830-1c6fcabdfdb4?auto=format&fit=crop&w=1200&q=80',
    timestamp: '2026-04-12T08:00:00Z',
    tags: ['EXCLUSIVES', 'FLEET UPDATE']
  },
  {
    id: 2,
    type: 'trip_post',
    author: 'Elena Rostova',
    authorId: 204,
    content: 'Traversing the Alpine passes in open air. The machine becomes an extension of the will.',
    image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1200&q=80',
    timestamp: '2026-04-11T14:30:00Z',
    tags: ['JOURNAL', 'ALPINE']
  },
  {
    id: 3,
    type: 'listing',
    author: 'Apex Fleet',
    authorId: 105,
    content: 'Now accepting reservations: 2026 Ghost Zenith Collection.',
    image: null,
    timestamp: '2026-04-10T09:15:00Z',
    tags: ['ACQUISITION', 'BESPOKE']
  }
];

export default function CommunityFeedPage() {
  // Commenting out useTranslations in case 'Community' namespace doesn't exist yet, 
  // but keeping the hook call ready for real i18n
  // const t = useTranslations('Community');
  
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetch from /api/feed/
    const fetchFeed = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setFeed(MOCK_FEED);
      setLoading(false);
    };
    
    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="bg-background text-foreground min-h-screen flex items-center justify-center p-8">
        <div className="font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Retrieving Dispatch...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col items-center">
      {/* Editorial Header */}
      <header className="w-full border-b border-border py-16 md:py-32 px-6 md:px-12 flex flex-col items-center justify-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-5xl md:text-8xl uppercase tracking-tight max-w-5xl"
        >
          Dispatch
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 md:mt-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground max-w-md mx-auto leading-relaxed"
        >
          Curated journals, fleet updates, and community dispatches from across the global network.
        </motion.p>
      </header>

      {/* Main Feed Container */}
      <main className="w-full max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-24 flex flex-col gap-12 md:gap-24">
        {feed.map((post, index) => (
          <motion.article 
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col border border-border p-6 md:p-8 rounded-none bg-background text-foreground"
          >
            {/* Post Meta */}
            <header className="flex justify-between items-start mb-8 md:mb-12">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
                  {post.author}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(post.timestamp).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex gap-2 text-right flex-wrap justify-end max-w-[50%]">
                {post.tags?.map(tag => (
                  <span key={tag} className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            {/* Post Content */}
            <div className="flex flex-col gap-8 md:gap-12 text-foreground">
              <p className="font-serif text-xl md:text-3xl leading-relaxed md:leading-relaxed">
                {post.content}
              </p>
              
              {post.image && (
                <div className="w-full aspect-[4/3] md:aspect-[16/9] relative border border-border overflow-hidden rounded-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt="Post media"
                    className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700 ease-out"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Post Actions */}
            <footer className="mt-10 md:mt-16 pt-6 border-t border-border flex justify-between items-center">
              <button className="font-mono text-[10px] uppercase tracking-widest hover:opacity-50 transition-opacity">
                Acknowledge
              </button>
              <button className="font-mono text-[10px] uppercase tracking-widest hover:opacity-50 transition-opacity">
                Share Dispatch
              </button>
            </footer>
          </motion.article>
        ))}
        
        {/* End of Feed */}
        <div className="py-16 md:py-24 flex justify-center border-t border-border mt-8">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            End of Current Dispatches
          </span>
        </div>
      </main>
    </div>
  );
}
