'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Checkbox from '@radix-ui/react-checkbox';
import { ArrowRight, Handshake, CheckCircle2, Clock, Shield, Users, TrendingUp, Zap, Wrench, Rocket } from 'lucide-react';
import { registerPartner } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';

export default function PartnerRegistrationForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [agree, setAgree] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const isPartner = user && (user.is_partner === true || user.role === 'partner');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!companyName.trim() || !taxId.trim()) {
      setError('Please provide company name and tax ID.');
      return;
    }
    setSubmitting(true);
    try {
      await registerPartner({
        company_name: companyName,
        tax_id: taxId,
        phone,
        city,
        fleet_size: fleetSize,
        agree_on_terms: agree
      });
      setSuccess('Registration submitted. Redirecting to dashboard...');
      setTimeout(() => router.push('/partner/dashboard'), 1200);
    } catch (err) {
      setError(err?.message || 'Failed to register partner.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="partner-form" className="bg-white scroll-mt-16 border-t">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-12">
        <motion.div 
          className="mb-12 text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Become a Partner</h2>
          <p className="text-lg text-gray-600">List your vehicles, manage bookings, and grow revenue with Airbcar.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Registration Form */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-10 shadow-lg">
              <div className="mb-6">
                <div className="p-3 bg-orange-100 rounded-xl w-fit mb-4">
                  <Handshake className="w-7 h-7 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Register your business</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Company name</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Atlas Cars SARL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Tax ID / License</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. ICE/IF/RC"
                  />
                </div>
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox.Root
                    className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-gray-300 bg-white data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 mt-0.5 transition-all"
                    checked={agree}
                    onCheckedChange={setAgree}
                    id="terms"
                  >
                    <Checkbox.Indicator className="text-white">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                    I agree to the
                    <Link href="/terms" className="text-orange-600 hover:text-orange-700 font-medium mx-1">Terms</Link>
                    and
                    <Link href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium mx-1">Privacy Policy</Link>
                  </label>
                </div>
                {error && (
                  <motion.div 
                    className="p-3 rounded-lg bg-red-50 border border-red-200"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    className="p-3 rounded-lg bg-green-50 border border-green-200"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-sm text-green-700 font-medium">{success}</p>
                  </motion.div>
                )}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-600 text-white rounded-xl py-3.5 font-semibold hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 mt-6"
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Submitting...
                    </span>
                  ) : (
                    <>
                      Register and continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">Prefer WhatsApp? <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer" className="text-orange-600 hover:text-orange-700 font-medium">Chat with us</a></p>
                  {isPartner && (
                    <p className="text-xs text-gray-500 mt-2">Already a partner? <Link href="/partner/dashboard" className="text-orange-600 hover:text-orange-700 font-medium">Open dashboard</Link></p>
                  )}
                </div>
              </form>
            </div>
            
            {/* Additional Info Below Form */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">Quick Setup</h4>
                      <p className="text-xs text-gray-600">Get approved in 24-48 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Shield className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">Secure & Safe</h4>
                      <p className="text-xs text-gray-600">Your data is protected</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">Dedicated Support</h4>
                      <p className="text-xs text-gray-600">24/7 assistance available</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Benefits Sidebar */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                <div className="mb-6">
                  <div className="p-3 bg-orange-100 rounded-xl w-fit mb-3">
                    <Rocket className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Why partner with us</h3>
                </div>
                <div className="space-y-5">
                  <motion.div 
                    className="group flex gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0 transition-colors group-hover:bg-orange-200">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">More demand</h4>
                      <p className="text-sm text-gray-600">Tap into Airbcar's growing customer base across Morocco.</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="group flex gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0 transition-colors group-hover:bg-orange-200">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Faster payouts</h4>
                      <p className="text-sm text-gray-600">Instant transfers post-booking, transparent fee structure.</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="group flex gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0 transition-colors group-hover:bg-orange-200">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Pro tools</h4>
                      <p className="text-sm text-gray-600">Smart pricing, calendars, analytics and fleet management.</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

