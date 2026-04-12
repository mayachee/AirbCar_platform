'use client';

import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bolt,
  BriefcaseBusiness,
  CalendarRange,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleDollarSign,
  ShieldCheck,
  Users,
} from 'lucide-react';

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerChildren = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function RevealSection({ children, className = '', ...props }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={reveal}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default function PartnerLandingPage() {
  const smoothPhysics = { stiffness: 90, damping: 24, mass: 0.35 };
  const { scrollYProgress } = useScroll();
  const bgLayerARaw = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const bgLayerBRaw = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const bgLayerCRaw = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroVisualYRaw = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const processYRaw = useTransform(scrollYProgress, [0, 1], [0, -28]);

  const bgLayerA = useSpring(bgLayerARaw, smoothPhysics);
  const bgLayerB = useSpring(bgLayerBRaw, smoothPhysics);
  const bgLayerC = useSpring(bgLayerCRaw, smoothPhysics);
  const heroVisualY = useSpring(heroVisualYRaw, smoothPhysics);
  const processY = useSpring(processYRaw, smoothPhysics);

  const heroRotateXRaw = useTransform(scrollYProgress, [0, 0.6], [6, -2]);
  const heroRotateYRaw = useTransform(scrollYProgress, [0, 0.6], [-5, 3]);
  const heroScaleRaw = useTransform(scrollYProgress, [0, 0.6], [1.02, 1]);
  const cardFrontYRaw = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const cardRearYRaw = useTransform(scrollYProgress, [0, 1], [0, -12]);

  const heroRotateX = useSpring(heroRotateXRaw, smoothPhysics);
  const heroRotateY = useSpring(heroRotateYRaw, smoothPhysics);
  const heroScale = useSpring(heroScaleRaw, smoothPhysics);
  const cardFrontY = useSpring(cardFrontYRaw, smoothPhysics);
  const cardRearY = useSpring(cardRearYRaw, smoothPhysics);

  const hero = useTranslations('partner_hero');
  const benefits = useTranslations('partner_benefits');
  const how = useTranslations('partner_how_it_works');
  const requirements = useTranslations('partner_requirements');
  const cta = useTranslations('partner_cta');
  const faqs = useTranslations('partner_faqs');

  const heroMetrics = [
    { value: hero('stat_1_value'), label: hero('stat_1_label'), tone: 'text-orange-300' },
    { value: hero('stat_2_value'), label: hero('stat_2_label'), tone: 'text-cyan-300' },
    { value: hero('stat_3_value'), label: hero('stat_3_label'), tone: 'text-emerald-300' },
  ];

  const operatingBenefits = [
    {
      title: benefits('benefit_1_title'),
      text: benefits('benefit_1_desc'),
      icon: CircleDollarSign,
      accent: 'from-orange-500/30 to-orange-200/0',
    },
    {
      title: benefits('benefit_2_title'),
      text: benefits('benefit_2_desc'),
      icon: ChartNoAxesCombined,
      accent: 'from-cyan-500/30 to-cyan-200/0',
    },
    {
      title: benefits('benefit_3_title'),
      text: benefits('benefit_3_desc'),
      icon: ShieldCheck,
      accent: 'from-emerald-500/30 to-emerald-200/0',
    },
  ];

  const operatingFlow = [
    {
      title: how('step_1_title'),
      text: how('step_1_desc'),
      tag: how('step_1_accent'),
      icon: BriefcaseBusiness,
    },
    {
      title: how('step_2_title'),
      text: how('step_2_desc'),
      tag: how('step_2_accent'),
      icon: Users,
    },
    {
      title: how('step_3_title'),
      text: how('step_3_desc'),
      tag: how('step_3_accent'),
      icon: Bolt,
    },
    {
      title: how('step_4_title'),
      text: how('step_4_desc'),
      tag: how('step_4_accent'),
      icon: BadgeCheck,
    },
    {
      title: how('step_5_title'),
      text: how('step_5_desc'),
      tag: how('step_5_accent'),
      icon: CalendarRange,
    },
  ];

  const requirementGroups = [
    {
      title: requirements('business_title'),
      items: [
        requirements('business_item_1'),
        requirements('business_item_2'),
        requirements('business_item_3'),
        requirements('business_item_4'),
      ],
    },
    {
      title: requirements('vehicle_title'),
      items: [
        requirements('vehicle_item_1'),
        requirements('vehicle_item_2'),
        requirements('vehicle_item_3'),
        requirements('vehicle_item_4'),
      ],
    },
  ];

  const faqCards = [
    { q: faqs('faq_1_q'), a: faqs('faq_1_a') },
    { q: faqs('faq_2_q'), a: faqs('faq_2_a') },
    { q: faqs('faq_3_q'), a: faqs('faq_3_a') },
    { q: faqs('faq_4_q'), a: faqs('faq_4_a') },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03061a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          style={{ y: bgLayerA }}
          className="absolute -left-72 -top-72 h-[840px] w-[840px] rounded-full bg-orange-600/20 blur-[180px]"
        />
        <motion.div
          style={{ y: bgLayerB }}
          className="absolute right-[-300px] top-[10%] h-[760px] w-[760px] rounded-full bg-cyan-500/12 blur-[190px]"
        />
        <motion.div
          style={{ y: bgLayerC }}
          className="absolute bottom-[-290px] left-[10%] h-[700px] w-[700px] rounded-full bg-fuchsia-500/8 blur-[220px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:38px_38px]" />
      </div>

      <Header />
      <main className="relative z-10 flex-1">
        <section className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-16 pt-28 md:gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pt-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="space-y-8 lg:space-y-9"
          >
            <motion.span
              variants={reveal}
              className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300 backdrop-blur"
            >
              <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_14px_#fb923c]" />
              {hero('badge')}
            </motion.span>

            <motion.h1
              variants={reveal}
              className="max-w-4xl text-5xl font-black italic leading-[0.84] tracking-[-0.03em] sm:text-6xl md:text-7xl lg:text-8xl"
            >
              <span className="block text-white/95">{hero('heading')}</span>
              <span className="block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-100 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(249,115,22,0.35)]">
                {hero('heading_highlight')}
              </span>
            </motion.h1>

            <motion.p
              variants={reveal}
              className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg"
            >
              {hero('description')}
            </motion.p>

            <motion.div variants={reveal} className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth/signup?role=partner"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_38px_rgba(249,115,22,0.32)] transition-all hover:-translate-y-0.5"
              >
                {hero('cta_primary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#process"
                className="inline-flex items-center justify-center rounded-2xl bg-white/8 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-white/14"
              >
                {hero('cta_secondary')}
              </a>
            </motion.div>

            <motion.div variants={reveal} className="grid gap-3 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-white/7 p-5 backdrop-blur-xl">
                  <p className={`text-3xl font-black italic ${metric.tone}`}>{metric.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-300">{metric.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <RevealSection
            className="relative [perspective:1400px]"
            style={{ y: heroVisualY }}
          >
            <motion.div
              style={{
                rotateX: heroRotateX,
                rotateY: heroRotateY,
                scale: heroScale,
                transformStyle: 'preserve-3d',
              }}
              className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 backdrop-blur-xl will-change-transform"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(34,211,238,0.3),transparent_42%)]" />
              <img
                src="/bg_image.png"
                alt={hero('image_alt')}
                className="relative z-10 h-[460px] w-full rounded-[1.8rem] object-cover object-center [transform:translateZ(26px)]"
              />
            </motion.div>
            <motion.div
              style={{ y: cardFrontY }}
              className="absolute -bottom-7 -left-4 rounded-2xl bg-[#0d1736]/85 px-5 py-4 backdrop-blur-xl sm:-left-7"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{hero('card_1_label')}</p>
              <p className="mt-1 text-2xl font-black italic text-white">{hero('card_1_amount')}</p>
            </motion.div>
            <motion.div
              style={{ y: cardRearY }}
              className="absolute -right-2 top-6 rounded-2xl bg-[#0d1736]/85 px-5 py-4 text-sm font-semibold text-cyan-200 backdrop-blur-xl sm:-right-6"
            >
              {hero('card_2_text')}
            </motion.div>
          </RevealSection>
        </section>

        <RevealSection className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-300">{benefits('heading')}</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black italic tracking-[-0.02em] text-white md:text-6xl">
                {benefits('featured_heading')}
              </h2>
            </div>
            <p className="max-w-xl text-slate-300 md:text-lg">{benefits('description')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {operatingBenefits.map(({ title, text, icon: Icon, accent }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-[2rem] bg-white/7 p-7 backdrop-blur-xl transition hover:-translate-y-1"
              >
                <div className={`absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${accent} blur-3xl`} />
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-orange-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tight text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection id="process" className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-10" style={{ y: processY }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-300">{how('badge')}</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-black italic tracking-[-0.02em] text-white md:text-6xl">{how('heading')}</h2>
          <p className="mt-4 max-w-3xl text-slate-300 md:text-lg">{how('description')}</p>

          <div className="mt-10 space-y-4">
            {operatingFlow.map(({ title, text, tag, icon: Icon }, index) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-[1.8rem] bg-[#07112e]/85 p-7 backdrop-blur-xl"
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-2xl" />
                <div className="relative z-10 grid items-start gap-6 md:grid-cols-[auto_1fr_auto]">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">{tag}</p>
                    <h3 className="mt-2 text-2xl font-black italic tracking-tight text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">{text}</p>
                  </div>

                  <div className="hidden items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 md:inline-flex">
                    0{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-10">
          <h2 className="max-w-4xl text-4xl font-black italic tracking-[-0.02em] text-white md:text-6xl">
            {requirements('heading')}
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300 md:text-lg">{requirements('description')}</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {requirementGroups.map((group) => (
              <div key={group.title} className="rounded-[1.8rem] bg-white/7 p-8 backdrop-blur-xl">
                <h3 className="text-2xl font-black italic text-white">{group.title}</h3>
                <ul className="mt-6 space-y-4">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-300">{faqs('heading')}</p>
          <p className="mt-3 max-w-2xl text-slate-300">{faqs('description')}</p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {faqCards.map((faq) => (
              <details key={faq.q} className="group rounded-2xl bg-white/8 p-6 backdrop-blur-xl">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-xl font-extrabold italic text-white">
                  <span>{faq.q}</span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 leading-relaxed text-slate-300">{faq.a}</p>
              </details>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="mx-auto w-full max-w-7xl px-5 pb-24 pt-16 lg:px-10">
          <div className="relative overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-[#0d1738] via-[#0b183f] to-[#0a1128] p-8 md:p-14">
            <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />

            <p className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-300">{cta('label')}</p>
            <h2 className="relative z-10 mt-5 max-w-4xl text-5xl font-black italic leading-[0.86] tracking-[-0.03em] text-white md:text-7xl">
              {cta('heading')}
            </h2>
            <p className="relative z-10 mt-5 max-w-2xl text-slate-300 md:text-lg">{cta('description')}</p>

            <div className="relative z-10 mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth/signup?role=partner"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_38px_rgba(249,115,22,0.32)] transition-all hover:-translate-y-0.5"
              >
                {cta('button')}
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/14"
              >
                {cta('button_secondary')}
              </Link>
            </div>
          </div>
        </RevealSection>
      </main>

      <div className="h-24 bg-gradient-to-b from-transparent to-[#070f26]" />
      <Footer />
    </div>
  );
}
