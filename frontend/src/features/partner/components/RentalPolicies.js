'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Plus, Trash2, Edit2, CheckCircle, FileText, Calendar, Shield, Car, CreditCard, Phone, FileEdit } from 'lucide-react';

export default function RentalPolicies({ partnerData, onUpdate }) {
  const t = useTranslations('partner_dashboard');
  const [activeSection, setActiveSection] = useState('general');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newPolicy, setNewPolicy] = useState({ title: '', description: '', section: 'general' });
  const [editingId, setEditingId] = useState(null);

  const sections = [
    { 
      id: 'general', 
      title: t('general_terms'), 
      icon: FileText,
      description: t('general_rental_terms'),
      content: t('general_terms_content')
    },
    { 
      id: 'booking', 
      title: t('booking_cancellation'), 
      icon: Calendar,
      description: t('booking_policies'),
      content: t('booking_cancellation_content')
    },
    { 
      id: 'insurance', 
      title: t('insurance_protection'), 
      icon: Shield,
      description: t('insurance_coverage'),
      content: t('insurance_protection_content')
    },
    { 
      id: 'vehicle', 
      title: t('vehicle_usage'), 
      icon: Car,
      description: t('vehicle_usage_rules'),
      content: t('vehicle_usage_content')
    },
    { 
      id: 'payment', 
      title: t('payment_fees'), 
      icon: CreditCard,
      description: t('payment_methods'),
      content: t('payment_fees_content')
    },
    { 
      id: 'support', 
      title: t('support_contact'), 
      icon: Phone,
      description: t('customer_support'),
      content: t('support_contact_content')
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
    if (confirm(t('are_you_sure_delete'))) {
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
      alert(t('policies_saved'));
    } catch (error) {
      console.error('Error saving policies:', error);
      alert(t('error_saving_policies'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:sticky lg:top-24">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('policy_sections')}</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
