'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowRight, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function VehicleThread({ vehicle }) {
  const t = useTranslations('car_details')

  return (
    <div className="mt-16 w-full border-t border-border pt-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-serif tracking-tight text-foreground uppercase mb-2">
            Social Thread
          </h2>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest max-w-xl">
            Community discussion & agency updates for this vehicle.
          </p>
        </div>
        
        <Link 
          href={/social/post/vehicle/\} 
          className="group inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-kc-primary transition-colors flex-shrink-0"
        >
          Join Discussion
          <ArrowRight className="w-4 h-4 group-[hover]:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="bg-kc-surface-container border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-kc-primary-container text-kc-on-primary-container flex flex-col justify-center font-mono font-medium rounded-none items-center">
               <span className="text-[10px]">AUTH</span>
            </div>
            <div>
              <p className="font-sans font-semibold text-foreground">Agency Post</p>
              <p className="font-mono text-[10px] text-muted-foreground uppercase opacity-70">Official Dispatch</p>
            </div>
          </div>
          <p className="text-foreground leading-relaxed font-serif text-lg">
            We just added this magnificent {vehicle?.name || "vehicle"} to our fleet. Pristine condition, ready for the weekend. Bookings open now.
          </p>
        </div>

        <div className="flex flex-col justify-center items-center border-[0.5px] border-dashed border-border/50 p-8 text-center bg-background min-h-[200px]">
          <MessageSquare className="w-8 h-8 text-muted-foreground mb-4 opacity-50" strokeWidth={1} />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground max-w-[200px] leading-snug">
            Be the first to share your thoughts on this listing
          </p>
        </div>
      </div>
    </div>
  )
}
