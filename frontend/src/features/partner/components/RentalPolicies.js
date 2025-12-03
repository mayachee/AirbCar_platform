'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, CheckCircle, FileText, Calendar, Shield, Car, CreditCard, Phone, FileEdit } from 'lucide-react';

export default function RentalPolicies({ partnerData, onUpdate }) {
  const [activeSection, setActiveSection] = useState('general');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newPolicy, setNewPolicy] = useState({ title: '', description: '', section: 'general' });
  const [editingId, setEditingId] = useState(null);

  const sections = [
    { 
      id: 'general', 
      title: 'General Terms', 
      icon: FileText,
      description: 'General rental terms and conditions that apply to all bookings.',
      content: `These are the fundamental terms and conditions that govern all vehicle rentals. This section covers basic rental requirements, age restrictions, driver qualifications, and general rules that customers must follow.

**Age Requirements**
All renters must be at least 21 years of age and possess a valid driver's license. Drivers under 25 may be subject to additional fees. The license must be valid for the entire rental period and must have been held for a minimum of one year.

**Driver Qualifications**
All drivers must present a valid, unexpired driver's license at the time of rental. International drivers must present a valid international driving permit along with their national license. The license must be in the same name as the credit card used for payment.

**Rental Period**
The rental period begins at the time specified in the rental agreement and ends when the vehicle is returned to the designated location. Late returns may result in additional charges. The minimum rental period is typically 24 hours.

**Vehicle Condition**
The vehicle will be provided in good working condition with a full tank of fuel. Renters are responsible for returning the vehicle in the same condition, normal wear and tear excepted. Any damage beyond normal wear and tear will be charged to the renter.

**Prohibited Uses**
The vehicle may not be used for any illegal purposes, racing, towing, off-road driving, or transporting passengers for hire. Smoking is strictly prohibited in all rental vehicles. Violation of these terms may result in immediate termination of the rental agreement and additional charges.`
    },
    { 
      id: 'booking', 
      title: 'Booking & Cancellation', 
      icon: Calendar,
      description: 'Policies regarding bookings, modifications, and cancellations.',
      content: `This section outlines your booking policies, including reservation requirements, modification rules, cancellation deadlines, refund policies, and any fees associated with changes or cancellations.

**Reservation Requirements**
All reservations must be confirmed with a valid credit card. A reservation does not guarantee vehicle availability, but we will make every effort to provide the vehicle class requested or a suitable alternative. Reservations can be made online, by phone, or in person at our rental location.

**Modification Policy**
Reservations can be modified up to 24 hours before the scheduled pickup time at no additional charge, subject to availability. Changes to rental dates, vehicle type, or pickup location may result in price adjustments. Modifications made less than 24 hours before pickup may incur a modification fee.

**Cancellation Policy**
Cancellations made more than 48 hours before the scheduled pickup time are free of charge. Cancellations made between 24-48 hours before pickup will incur a cancellation fee of 25% of the total rental cost. Cancellations made less than 24 hours before pickup or no-shows will be charged 50% of the total rental cost.

**Refund Policy**
Refunds for eligible cancellations will be processed to the original payment method within 5-10 business days. Refunds are only available for cancellations made within the specified timeframes. Early returns do not qualify for refunds unless otherwise specified in the rental agreement.

**No-Show Policy**
If you fail to pick up your reserved vehicle within 2 hours of the scheduled pickup time without prior notification, your reservation will be considered a no-show and may be cancelled. No-show fees apply as outlined in the cancellation policy.`
    },
    { 
      id: 'insurance', 
      title: 'Insurance & Protection', 
      icon: Shield,
      description: 'Insurance coverage options and protection plans available to renters.',
      content: `Details about insurance coverage, protection plans, deductibles, and what is covered under different insurance tiers. This helps customers understand their options and make informed decisions.

**Basic Coverage Included**
All rentals include basic third-party liability insurance as required by law. This covers damage to other vehicles and property, but does not cover damage to the rental vehicle itself. The minimum coverage amounts vary by location and local regulations.

**Collision Damage Waiver (CDW)**
CDW reduces your financial responsibility for damage to the rental vehicle. With CDW, you are responsible only for the deductible amount in case of damage. CDW does not cover damage to tires, wheels, glass, or undercarriage. CDW can be purchased at the time of rental or may be included in certain rate packages.

**Theft Protection**
Theft Protection covers you in the event the rental vehicle is stolen. This protection typically includes coverage for theft of the vehicle and may include coverage for personal belongings, though personal items are usually not covered. Theft Protection may have a deductible that applies in case of a claim.

**Personal Accident Insurance (PAI)**
PAI provides coverage for medical expenses and accidental death benefits for the renter and passengers in the event of an accident during the rental period. This is optional coverage that can be added to your rental agreement. Coverage amounts and terms vary by location.

**Personal Effects Coverage**
This optional coverage protects your personal belongings in the vehicle against theft or damage. Coverage limits apply, and certain high-value items may require additional coverage. Personal Effects Coverage does not cover cash, electronics, or items left in plain view.

**Exclusions and Limitations**
Insurance coverage does not apply to damage caused by prohibited uses, driving under the influence, unauthorized drivers, or violations of rental terms. Coverage may be voided if the vehicle is used for racing, off-road driving, or transporting illegal substances. Always review your policy details carefully.`
    },
    { 
      id: 'vehicle', 
      title: 'Vehicle Usage', 
      icon: Car,
      description: 'Rules and guidelines for vehicle usage during the rental period.',
      content: `Guidelines for proper vehicle usage, including mileage limits, fuel policies, prohibited uses, maintenance responsibilities, and what to do in case of mechanical issues or accidents.

**Mileage Limits**
Standard rentals include unlimited mileage within the rental country. Cross-border travel may require prior authorization and additional fees. Mileage restrictions may apply to certain vehicle categories or promotional rates. Excess mileage charges will apply if limits are exceeded.

**Fuel Policy**
Vehicles are provided with a full tank of fuel and must be returned with a full tank. If the vehicle is returned with less fuel, a refueling fee will be charged at a rate higher than local gas station prices. Pre-paid fuel options may be available at the time of rental.

**Maintenance Responsibilities**
Renters are responsible for maintaining proper fluid levels (oil, coolant, etc.) during the rental period. Regular maintenance items are the responsibility of the rental company. If warning lights appear, renters must contact us immediately and should not continue driving the vehicle.

**Mechanical Issues**
In case of mechanical problems or breakdowns, contact our 24/7 roadside assistance immediately. Do not attempt to repair the vehicle yourself. We will arrange for repairs or provide a replacement vehicle when possible. Renters are not responsible for mechanical failures due to normal wear and tear.

**Accident Procedures**
In the event of an accident, immediately contact local authorities and our emergency hotline. Do not admit fault or liability. Document the incident with photos and gather contact information from all parties involved. Follow all instructions provided by our claims department.

**Prohibited Activities**
The vehicle must not be used for racing, towing (unless equipped), off-road driving, transporting hazardous materials, or any illegal activities. Violations may result in immediate rental termination, loss of insurance coverage, and additional charges.`
    },
    { 
      id: 'payment', 
      title: 'Payment & Fees', 
      icon: CreditCard,
      description: 'Payment methods, accepted forms of payment, and applicable fees.',
      content: `Information about payment methods, deposit requirements, security deposits, additional fees (late return, cleaning, etc.), and payment processing policies.

**Accepted Payment Methods**
We accept major credit cards (Visa, MasterCard, American Express) and debit cards. Cash payments may be accepted at select locations with additional requirements. The credit card used for payment must be in the name of the primary renter and must be present at pickup.

**Security Deposit**
A security deposit (authorization hold) will be placed on your payment method at the time of rental. The amount varies by vehicle type and typically ranges from $200 to $500. The hold will be released within 5-10 business days after vehicle return, provided there are no damages or additional charges.

**Rental Charges**
Rental charges include the base daily rate, applicable taxes, and mandatory fees. Optional services such as GPS, child seats, or additional drivers will be charged separately. All charges are calculated and displayed at the time of booking confirmation.

**Additional Fees**
Late return fees apply if the vehicle is returned after the scheduled return time. Cleaning fees may be charged if the vehicle is returned excessively dirty or with smoke odor. Traffic violation fees and toll charges incurred during the rental period will be charged to the renter.

**Payment Processing**
Payment is processed at the time of vehicle pickup. For prepaid reservations, the amount charged may differ from the reservation total due to changes in rental duration, optional services, or damage assessments. All charges are subject to local taxes and fees.

**Refunds and Disputes**
Refunds for eligible cancellations or overcharges will be processed within 5-10 business days. Disputes regarding charges must be reported within 30 days of the rental end date. We will investigate and respond to all disputes in a timely manner.`
    },
    { 
      id: 'support', 
      title: 'Support & Contact', 
      icon: Phone,
      description: 'Customer support information and contact details.',
      content: `Contact information for customer support, emergency assistance, business hours, and how to reach your team for questions, issues, or assistance during the rental period.

**Customer Service Hours**
Our customer service team is available Monday through Friday from 8:00 AM to 8:00 PM, and Saturday-Sunday from 9:00 AM to 6:00 PM (local time). For urgent matters outside business hours, please use our 24/7 emergency hotline.

**24/7 Emergency Assistance**
For roadside assistance, accidents, or emergencies during your rental, call our 24/7 emergency hotline immediately. Our team will dispatch assistance, arrange for vehicle replacement if needed, and guide you through the necessary procedures. Keep this number with you at all times during your rental.

**General Inquiries**
For questions about reservations, modifications, billing, or general information, contact our customer service team during business hours. You can reach us by phone, email, or through our online chat service. Response times vary by contact method.

**Rental Location Contact**
Each rental location has its own contact information for local inquiries, pickup/return questions, and location-specific services. Contact details for your specific rental location will be provided in your booking confirmation.

**Online Support**
Access your reservation, make modifications, view rental history, and get answers to frequently asked questions through our online portal. Live chat support is available during business hours for immediate assistance with your account or reservation.

**Feedback and Complaints**
We value your feedback and strive to provide excellent service. If you have concerns or suggestions, please contact our customer relations department. We aim to respond to all inquiries within 48 hours and will work to resolve any issues promptly.`
    }
  ];

  // Fetch partner's policies on mount
  useEffect(() => {
    fetchPartnerPolicies();
  }, [partnerData]);

  // Update newPolicy section when activeSection changes
  useEffect(() => {
    setNewPolicy(prev => ({ ...prev, section: activeSection }));
  }, [activeSection]);

  const fetchPartnerPolicies = async () => {
    try {
      setLoading(true);
      // Get policies from partnerData or use mock data if not available
      if (partnerData?.policies) {
        // Ensure all policies have a section field, default to 'general' if missing
        const policiesWithSections = partnerData.policies.map(p => ({
          ...p,
          section: p.section || 'general'
        }));
        setPolicies(policiesWithSections);
      } else {
        // Use mock data as fallback
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = () => {
    if (newPolicy.title && newPolicy.description) {
      setPolicies([
        ...policies,
        {
          id: policies.length + 1,
          ...newPolicy,
          section: activeSection,
          isActive: true
        }
      ]);
      setNewPolicy({ title: '', description: '', section: activeSection });
    }
  };

  const handleEditPolicy = (id) => {
    setEditingId(id);
  };

  const handleSaveEdit = (id, updatedPolicy) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, ...updatedPolicy } : p));
    setEditingId(null);
  };

  const handleDeletePolicy = (id) => {
    if (confirm('Are you sure you want to delete this policy?')) {
      setPolicies(policies.filter(p => p.id !== id));
    }
  };

  const handleToggleActive = (id) => {
    setPolicies(policies.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleSaveAll = async () => {
    try {
      // Save policies through the onUpdate callback
      await onUpdate({ policies });
      alert('Rental policies saved successfully!');
    } catch (error) {
      console.error('Error saving policies:', error);
      alert('Error saving policies');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Rental Policies & Terms</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your rental policies and terms for your customers
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>Save All Policies</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Policy Sections</h3>
            <nav className="space-y-2">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      activeSection === section.id
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700 shadow-md font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
                    }`}
                  >
                    {IconComponent && <IconComponent className="h-5 w-5" />}
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            {/* Section Header */}
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-2">
                {(() => {
                  const activeSectionData = sections.find(s => s.id === activeSection);
                  const IconComponent = activeSectionData?.icon;
                  return IconComponent ? <IconComponent className="h-8 w-8 text-orange-600 dark:text-orange-400" /> : null;
                })()}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sections.find(s => s.id === activeSection)?.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-12">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>

            {/* Section Content */}
            <div className="mb-8 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-orange-100 dark:border-orange-800">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                  {sections.find(s => s.id === activeSection)?.content?.split('\n\n').map((paragraph, index) => {
                    // Check if paragraph starts with ** for bold headings
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      const heading = paragraph.replace(/\*\*/g, '');
                      return (
                        <h4 key={index} className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                          {heading}
                        </h4>
                      );
                    }
                    return (
                      <p key={index} className="text-base">
                        {paragraph.split('**').map((text, i) => 
                          i % 2 === 1 ? <strong key={i} className="font-semibold">{text}</strong> : text
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Current Policies */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Policies
              </h4>
              <div className="grid gap-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading policies...
                  </div>
                ) : policies.filter(p => p.section === activeSection).length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <FileEdit className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">No policies found for this section</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Click the button below to add your first policy</p>
                  </div>
                ) : (
                policies.filter(p => p.section === activeSection).map((policy) => (
                  <div
                    key={policy.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingId === policy.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={policy.title}
                              onChange={(e) => handleSaveEdit(policy.id, { title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Policy Title"
                            />
                            <textarea
                              value={policy.description}
                              onChange={(e) => handleSaveEdit(policy.id, { description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Policy Description"
                              rows={3}
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {policy.title}
                              </h3>
                              {policy.isActive && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full flex items-center space-x-1">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Active</span>
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                              {policy.description}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {!editingId && (
                          <>
                            <button
                              onClick={() => handleEditPolicy(policy.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(policy.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                policy.isActive
                                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {policy.isActive ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <CheckCircle className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeletePolicy(policy.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Add New Policy - Collapsible */}
            <details className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Policy to {sections.find(s => s.id === activeSection)?.title}</span>
                </h3>
                <span className="text-gray-400 dark:text-gray-500 text-sm">Click to expand</span>
              </summary>
              <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newPolicy.title}
                    onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Policy Title"
                  />
                  <textarea
                    value={newPolicy.description}
                    onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Policy Description"
                    rows={3}
                  />
                  <button
                    onClick={handleAddPolicy}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Policy</span>
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
