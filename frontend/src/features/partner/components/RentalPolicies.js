'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

export default function RentalPolicies({ partnerData, onUpdate }) {
  const [activeSection, setActiveSection] = useState('general');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newPolicy, setNewPolicy] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  const sections = [
    { id: 'general', title: 'General Terms', icon: '📋' },
    { id: 'booking', title: 'Booking & Cancellation', icon: '📅' },
    { id: 'insurance', title: 'Insurance & Protection', icon: '🛡️' },
    { id: 'vehicle', title: 'Vehicle Usage', icon: '🚗' },
    { id: 'payment', title: 'Payment & Fees', icon: '💳' },
    { id: 'support', title: 'Support & Contact', icon: '📞' }
  ];

  // Fetch partner's policies on mount
  useEffect(() => {
    fetchPartnerPolicies();
  }, [partnerData]);

  const fetchPartnerPolicies = async () => {
    try {
      setLoading(true);
      // Get policies from partnerData or use mock data if not available
      if (partnerData?.policies) {
        setPolicies(partnerData.policies);
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
          isActive: true
        }
      ]);
      setNewPolicy({ title: '', description: '' });
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
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">

      {/* Current Policies */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading policies...
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No policies found. Add your first policy below.
          </div>
        ) : (
          policies.map((policy) => (
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

      {/* Add New Policy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add New Policy
        </h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
