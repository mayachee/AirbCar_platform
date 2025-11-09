'use client';

import { motion } from 'framer-motion';
import {
  UploadCloud,
  Users,
  CheckCircle2,
  Zap,
  BarChart3
} from 'lucide-react';

const steps = [
  {
    title: 'Configure your fleet in minutes',
    description:
      'Create your account, bulk import vehicles, and tailor pricing policies in the same flow. The Quick Actions panel, bulk operations, and Add Vehicle modal let you set availability, extras, and cancellation rules without leaving the dashboard.',
    image: '/parthner_images/imgi_5_bike_setup.png',
    accent: 'Upload & Configure',
    icon: UploadCloud
  },
  {
    title: 'Customers book on Airbcar.com',
    description:
      'Your fleet gains instant exposure to thousands of renters browsing every month. Live availability syncs with the Booking Calendar, so every listing reflects the latest schedule while secure pre-payments follow your configured rules.',
    image: '/parthner_images/imgi_6_customer_reservation.png',
    accent: 'Get Discovered',
    icon: Users
  },
  {
    title: 'Own every booking decision',
    description:
      'Notification Center alerts and the Upcoming Bookings view keep you updated in real time. Accept, reject, or reschedule requests directly from Booking Management while processing states and automated messages keep riders informed.',
    image: '/parthner_images/imgi_7_online_booking.png',
    accent: 'Control & Automate',
    icon: CheckCircle2
  },
  {
    title: 'Instant confirmation & operations',
    description:
      'Approve a trip and we trigger vouchers, reminders, and payment status updates immediately. Vehicle Availability Calendar, verification checks, and policy safeguards activate automatically so your team just shows up prepared.',
    image: '/parthner_images/imgi_8_voucher-2.png',
    accent: 'We Handle The Rest',
    icon: Zap
  },
  {
    title: 'Keep scaling with insights',
    description:
      'Advanced Analytics, earnings dashboards, review metrics, and smart forecasting surface the trends that matter. Pair them with Recent Activity feeds and customer profiles to uncover growth opportunities and keep riders coming back.',
    image: '/parthner_images/imgi_9_dashboard.png',
    accent: 'Scale With Insights',
    icon: BarChart3
  }
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' }
  }
};

export default function PartnerHowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-gray-50 scroll-mt-16">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-orange-100/40 to-transparent pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-sm font-semibold text-orange-700">
            How It Works
          </span>
          <h2 className="mt-6 text-3xl md:text-4xl font-bold text-gray-900">
            Simply put, we are a vehicles rental search engine.
          </h2>
          <p className="mt-4 text-base md:text-lg text-gray-600">
            Upload your vehicles once and keep complete control. Airbcar showcases your fleet to
            thousands of renters, handles secure pre-payments, and automates confirmations while you
            focus on the ride experience.
          </p>
        </div>

        <motion.div
          className="space-y-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {steps.map(({ title, description, image, accent, icon: Icon }, index) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className={`relative flex flex-col gap-8 rounded-3xl border border-orange-100/80 bg-white/90 p-8 shadow-lg shadow-orange-100/40 ring-1 ring-transparent transition hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200/60 md:gap-12 lg:grid lg:grid-cols-[1fr_1fr] lg:items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className="order-2 lg:order-1 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-semibold">
                      {index + 1}
                    </span>
                    <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                      {accent}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="absolute -inset-4 hidden rounded-3xl bg-orange-100/50 blur-2xl md:block" />
                  <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


