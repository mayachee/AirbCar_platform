'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

export default function PartnerPosts({ partner }) {
  const t = useTranslations('partner_public')
  
  // Extract posts, fallback to empty array
  const posts = partner?.recent_posts || []

  // Mock post if empty
  const displayPosts = posts.length > 0 ? posts : [
    {
      id: 'mock-1',
      created_at: new Date().toISOString(),
      content: 'Welcome to our new social dispatch. We will be sharing our latest fleet additions, high-end editorial shoots, and exclusive promotions here. Stay tuned for updates.',
      likes_count: 0
    }
  ]

  return (
    <div className="flex flex-col gap-12 mt-16 pt-12 border-t border-border text-foreground bg-background rounded-none">
      <h2 className="font-serif text-3xl md:text-5xl uppercase tracking-tight border-b border-border pb-6">
        Social Dispatch
      </h2>

      <div className="grid grid-cols-1 gap-12">
        {displayPosts.map((post, index) => (
          <motion.div 
            key={post.id || index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex flex-col gap-6 border border-border p-6 md:p-10 bg-background rounded-none"
          >
            {/* Header: Date / Likes info */}
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {new Date(post.created_at || Date.now()).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {post.likes_count || 0} LIKES
              </span>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none text-foreground font-serif text-lg leading-relaxed md:text-xl">
              {post.content}
            </div>

            {/* Optional Image */}
            {post.image_url && (
              <div className="relative w-full aspect-video border border-border overflow-hidden mt-4">
                <Image 
                  src={post.image_url} 
                  alt="Post image" 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            )}
            
            {/* If it is the mock post, add a subtle note */}
            {post.id === 'mock-1' && posts.length === 0 && (
              <div className="mt-4 pt-4 border-t border-border border-dashed">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                  -- NO RECENT DISPATCHES --
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}