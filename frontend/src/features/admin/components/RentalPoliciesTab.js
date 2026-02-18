'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Calendar, Shield, Car, CreditCard, Phone } from 'lucide-react';

export default function RentalPoliciesTab() {
  const t = useTranslations('partner_dashboard');
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', title: t('general_terms'), icon: FileText },
    { id: 'booking', title: t('booking_cancellation'), icon: Calendar },
    { id: 'insurance', title: t('insurance_protection'), icon: Shield },
    { id: 'vehicle', title: t('vehicle_usage'), icon: Car },
    { id: 'payment', title: t('payment_fees'), icon: CreditCard },
    { id: 'support', title: t('support_contact'), icon: Phone }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <FileText className="h-5 w-5" />
        <span>{t('rental_policies')}</span>
      </h3>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('policy_sections')}</h3>
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {activeSection === 'general' && (
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('general_terms')}</h4>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">Age Requirements</p>
                    <p className="text-gray-600">Renters must be at least 21 years old and have a valid driver's license for a minimum of 2 years. Some vehicles may require drivers to be 25 or older.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">License Requirements</p>
                    <p className="text-gray-600">A valid, unexpired driver's license from your country of residence is required. International drivers may need an International Driving Permit (IDP) depending on the rental location.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Credit Card Requirements</p>
                    <p className="text-gray-600">A valid credit card in the renter's name is required for security deposit and payment. Debit cards may be accepted with additional verification.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Rental Duration</p>
                    <p className="text-gray-600">Minimum rental periods may apply and vary by vehicle. Maximum rental duration is typically 30 days, with options for extensions subject to availability.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'booking' && (
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('booking_cancellation')}</h4>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">Booking Confirmation</p>
                    <p className="text-gray-600">All bookings are subject to confirmation by the vehicle owner. You will receive an email confirmation once your booking is approved.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Cancellation Policy</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Free cancellation up to 24 hours before pickup time for a full refund</li>
                      <li>50% refund if cancelled between 24-12 hours before pickup</li>
                      <li>No refund for cancellations less than 12 hours before pickup</li>
                      <li>Owner-initiated cancellations result in a full refund plus compensation</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Modification Policy</p>
                    <p className="text-gray-600">Booking modifications are subject to availability and may incur additional fees. Contact the vehicle owner to request changes at least 48 hours before the rental start date.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">No-Show Policy</p>
                    <p className="text-gray-600">Failure to show up for pickup without prior cancellation will result in forfeiture of the entire rental fee.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'insurance' && (
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('insurance_protection')}</h4>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">Basic Coverage</p>
                    <p className="text-gray-600">All rentals include basic liability insurance as required by law. This coverage provides protection for third-party damages up to the minimum legal requirements.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Damage Protection</p>
                    <p className="text-gray-600">Optional damage protection plans are available to reduce your financial responsibility in case of accidents or damages to the rental vehicle. Plans vary by coverage level and deductible amount.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Personal Insurance</p>
                    <p className="text-gray-600">You may use your personal auto insurance if it provides rental car coverage. Please verify coverage with your insurance provider before renting.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Accident Procedure</p>
                    <p className="text-gray-600">In case of an accident, immediately contact local authorities, document the incident with photos, and notify both the vehicle owner and our platform support team within 24 hours.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'vehicle' && (
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('vehicle_usage')}</h4>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">Authorized Drivers</p>
                    <p className="text-gray-600">Only drivers listed on the rental agreement are authorized to operate the vehicle. Additional drivers may be added for an extra fee and must meet the same age and license requirements.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Prohibited Uses</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Off-road driving or driving on unpaved roads</li>
                      <li>Towing or pushing other vehicles</li>
                      <li>Commercial use without explicit permission</li>
                      <li>Transporting illegal substances or materials</li>
                      <li>Driving under the influence of alcohol or drugs</li>
                      <li>Racing, speed contests, or other competitive events</li>
                      <li>Using the vehicle for any illegal activity</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Mileage Limits</p>
                    <p className="text-gray-600">Standard rentals include 200 miles per day. Additional mileage charges apply for excess miles at a rate specified in the rental agreement. Unlimited mileage options may be available for select vehicles.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Geographic Restrictions</p>
                    <p className="text-gray-600">Vehicles may have geographic restrictions. Unauthorized travel outside permitted areas may result in additional fees or policy violations.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'payment' && (
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('payment_fees')}</h4>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">Payment Methods</p>
                    <p className="text-gray-600">We accept major credit cards (Visa, Mastercard, American Express) and debit cards. Payment is processed at the time of booking confirmation.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Security Deposit</p>
                    <p className="text-gray-600">A security deposit will be authorized on your payment method at pickup. The deposit amount varies by vehicle and is fully refundable upon return if no damages occur. Funds are typically released within 5-7 business days after rental completion.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Additional Fees</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Late return fee: $50 per hour (after 1-hour grace period)</li>
                      <li>Cleaning fee: $50-150 if vehicle requires excessive cleaning</li>
                      <li>Smoking fee: $250 if smoking is detected</li>
                      <li>Fuel refill fee: Market rate + $10 service charge if not returned with same fuel level</li>
                      <li>Traffic violation fees: All fines and penalties are the renter's responsibility</li>
                      <li>Damage repair costs: Actual repair costs for any damages beyond normal wear</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Refund Policy</p>
                    <p className="text-gray-600">Refunds for cancellations are processed within 5-10 business days to the original payment method. Platform commission fees are non-refundable.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'support' && (
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('support_contact')}</h4>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">24/7 Roadside Assistance</p>
                    <p className="text-gray-600">Our emergency support team is available 24/7 to assist with breakdowns, accidents, or any urgent issues during your rental period. Contact information is provided in your booking confirmation.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Customer Support</p>
                    <p className="text-gray-600">For booking inquiries, modifications, or general questions, contact our support team via email, phone, or live chat during business hours (Monday-Friday, 9 AM - 6 PM EST).</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Dispute Resolution</p>
                    <p className="text-gray-600">If you have concerns about your rental experience, contact us within 48 hours of rental completion. We'll work to resolve any issues fairly and promptly based on evidence and platform policies.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Contact Information</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Email: support@airbcar.com</li>
                      <li>Phone: 1-800-AIRBCAR (24/7 emergency line)</li>
                      <li>Live Chat: Available on our website during business hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

