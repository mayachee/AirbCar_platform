'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { partnerService } from '@/features/partner/services/partnerService';
import { format } from 'date-fns';
import { RefreshCw, PlusCircle, Check, X, Clock, CalendarIcon, CarFront, FileText, DollarSign, Building, MessageSquare, ClipboardCheck, Info, ChevronLeft, Send } from 'lucide-react';
import { getVehicleImageUrl } from '@/utils/imageUtils';

export default function CarSharingInbox({ partnerData }) {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Overlay State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestTab, setRequestTab] = useState('details'); // 'details', 'chat', 'handover'
  
  // Form State
  const [formData, setFormData] = useState({
    public_id: '',
    start_date: '',
    end_date: '',
    total_price: '',
    notes: ''
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await partnerService.getCarShareRequests();
      // Handle the nested structure apiClient returns if necessary
      const data = response.data?.results || response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
      
      // Update selected request if it's currently open
      if (selectedRequest) {
        const updated = data.find(r => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    } catch (error) {
      console.error('Error fetching car share requests:', error);
      addToast('Failed to load car sharing requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(true);
      await partnerService.updateCarShareRequestStatus(id, status);
      addToast(`Request ${status} successfully`, 'success');
      fetchRequests();
    } catch (error) {
      console.error(`Error updating request to ${status}:`, error);
      addToast(error?.response?.data?.error || `Failed to ${status} request`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await partnerService.createCarShareRequest(formData);
      addToast('Car share request submitted successfully!', 'success');
      setIsFormOpen(false);
      setFormData({
        public_id: '',
        start_date: '',
        end_date: '',
        total_price: '',
        notes: ''
      });
      setActiveTab('outgoing');
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      const msg = error?.response?.data?.public_id?.[0] || error?.response?.data?.requester?.[0] || 'Failed to submit request';
      addToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // derived state
  const myPartnerId = partnerData?.id;
  const incomingRequests = requests.filter(req => req.owner?.id === myPartnerId);
  const outgoingRequests = requests.filter(req => req.requester?.id === myPartnerId);

  const displayedRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted': return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full flex items-center w-fit gap-1"><Check className="w-3 h-3" /> Accepted</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full flex items-center w-fit gap-1"><X className="w-3 h-3" /> Rejected</span>;
      case 'pending': return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full flex items-center w-fit gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default: return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full w-fit">{status}</span>;
    }
  };

  // -------------------------------------------------------------
  // OVERLAY RENDERING
  // -------------------------------------------------------------
  if (selectedRequest) {
    const req = selectedRequest;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setSelectedRequest(null)} 
            className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition-colors focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5"/>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Request Details
              {getStatusBadge(req.status)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {req.listing?.make} {req.listing?.model} ({req.listing?.year})
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button 
              onClick={() => setRequestTab('details')} 
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                requestTab === 'details' ? 'border-[#229ED9] text-[#229ED9] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Info className="w-4 h-4"/> Details
            </button>
            <button 
              onClick={() => setRequestTab('chat')} 
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                requestTab === 'chat' ? 'border-[#229ED9] text-[#229ED9] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-4 h-4"/> Chat 
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full ml-1">New</span>
            </button>
            <button 
              onClick={() => setRequestTab('handover')} 
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                requestTab === 'handover' ? 'border-[#229ED9] text-[#229ED9] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ClipboardCheck className="w-4 h-4"/> Handover
            </button>
          </div>

          <div className="p-6">
            {/* DETAILS TAB */}
            {requestTab === 'details' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-5">
                    <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" /> Booking Info
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-gray-500 mb-1">Total Price</span>
                        <span className="font-semibold text-lg text-gray-900">${req.total_price}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 mb-1">Duration</span>
                        <span className="font-medium text-gray-900">
                          {Math.max(1, Math.ceil((new Date(req.end_date) - new Date(req.start_date)) / (1000 * 60 * 60 * 24)))} Days
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500 mb-1">Start Date</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-gray-400"/> {format(new Date(req.start_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 mb-1">End Date</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-gray-400"/> {format(new Date(req.end_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-2 text-sm">Notes / Terms</span>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 min-h-[80px]">
                         {req.notes || <span className="text-gray-400 italic">No notes provided...</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-5">
                    <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-400" /> Parties Involved
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-100">
                       <div>
                          <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Owner</span>
                          <div className="flex items-center justify-between">
                             <span className="font-medium text-gray-900">{req.owner?.business_name}</span>
                             {myPartnerId === req.owner?.id && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">You</span>}
                          </div>
                       </div>
                       <div className="border-t border-gray-200"></div>
                       <div>
                          <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Requester</span>
                          <div className="flex items-center justify-between">
                             <span className="font-medium text-gray-900">{req.requester?.business_name}</span>
                             {myPartnerId === req.requester?.id && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">You</span>}
                          </div>
                       </div>
                       <div className="border-t border-gray-200"></div>
                       <div>
                          <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Vehicle Details</span>
                          <div className="flex items-center gap-2">
                             <CarFront className="w-4 h-4 text-gray-500" />
                             <span className="font-medium text-gray-900">{req.listing?.make} {req.listing?.model}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Actions below details if pending and user is owner */}
                {req.owner?.id === myPartnerId && req.status === 'pending' && (
                  <div className="flex flex-wrap gap-3 pt-6 border-t mt-6">
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'accepted')} 
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Accept Request
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'rejected')} 
                       disabled={actionLoading}
                      className="px-6 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {requestTab === 'chat' && (
              <div className="flex flex-col h-[400px] animate-in fade-in">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg border border-gray-200">
                  <div className="text-center text-xs text-gray-400 my-2">Today</div>
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-xl rounded-tl-none border border-gray-200 shadow-sm max-w-[80%]">
                      <p className="text-sm text-gray-800">Hi, is the car available for these dates?</p>
                      <span className="text-xs text-gray-400 mt-1.5 block">10:00 AM</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#229ED9] text-white p-3 rounded-xl rounded-tr-none shadow-sm max-w-[80%]">
                      <p className="text-sm">Yes, we can arrange that. Please bring the required documents.</p>
                      <span className="text-xs text-blue-100 mt-1.5 block">10:05 AM</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-t-0 border-gray-200 rounded-b-lg flex gap-2 bg-white">
                  <input type="text" placeholder="Type a message..." className="flex-1 p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#229ED9] text-sm" />
                  <button className="px-4 py-2 bg-[#229ED9] text-white rounded-lg hover:bg-[#1a8cc3] transition-colors flex items-center justify-center">
                    <Send className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )}

            {/* HANDOVER TAB */}
            {requestTab === 'handover' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-semibold mb-0.5">Vehicle Inspection</p>
                    <p className="text-blue-700/80">Log a new inspection before or after the rental period. This ensures both parties agree on the vehicle's condition, fuel level, and mileage.</p>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> New Inspection Record
                  </h3>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Inspection Type</label>
                        <select className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#229ED9] text-sm">
                          <option>Pre-Rental (Check-out)</option>
                          <option>Post-Rental (Check-in)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Mileage</label>
                        <input type="number" placeholder="e.g. 45000" className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#229ED9] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel Level</label>
                        <select className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#229ED9] text-sm">
                          <option>Full (100%)</option>
                          <option>3/4 (75%)</option>
                          <option>1/2 (50%)</option>
                          <option>1/4 (25%)</option>
                          <option>Empty (0%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition Notes</label>
                        <input type="text" placeholder="Any scratches or damages?" className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#229ED9] text-sm" />
                      </div>
                    </div>
                    <div className="pt-3 flex justify-end">
                      <button type="button" className="px-5 py-2 mt-2 bg-[#229ED9] text-white text-sm font-medium rounded-lg hover:bg-[#1a8cc3] transition-colors shadow-sm">
                        Submit Record
                      </button>
                    </div>
                  </form>
                </div>
                
                <div className="mt-8">
                   <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Past Inspections</h3>
                   <div className="text-gray-400 text-sm text-center py-8 bg-gray-50 border border-gray-200 rounded-lg border-dashed">
                      <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No inspections recorded for this request yet.
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // -------------------------------------------------------------
  // END OVERLAY RENDERING
  // -------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          ?? B2B Car Sharing
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={fetchRequests} 
            disabled={loading}
            className="p-2 text-gray-600 hover:text-[#229ED9] bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[#229ED9] hover:bg-[#1a8cc3] text-white text-sm font-medium rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {isFormOpen ? 'Cancel Request' : 'New Request'}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Create B2B Car Share Request</h3>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Car Public ID</label>
                <input 
                  type="text" 
                  name="public_id"
                  required
                  value={formData.public_id} 
                  onChange={handleFormChange}
                  placeholder="e.g. ABC1234"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#229ED9] focus:border-[#229ED9] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Agreed Total Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    name="total_price"
                    required
                    step="0.01"
                    min="0"
                    value={formData.total_price} 
                    onChange={handleFormChange}
                    placeholder="0.00"
                    className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#229ED9] focus:border-[#229ED9] outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Start Date</label>
                <input 
                  type="date" 
                  name="start_date"
                  required
                  value={formData.start_date} 
                  onChange={handleFormChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#229ED9] focus:border-[#229ED9] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">End Date</label>
                <input 
                  type="date" 
                  name="end_date"
                  required
                  value={formData.end_date} 
                  onChange={handleFormChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#229ED9] focus:border-[#229ED9] outline-none text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Notes / Terms</label>
                <textarea 
                  name="notes"
                  rows="3"
                  value={formData.notes} 
                  onChange={handleFormChange}
                  placeholder="Optional details or terms of the loan..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#229ED9] focus:border-[#229ED9] outline-none text-sm"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-[#229ED9] text-white rounded-lg hover:bg-[#1a8cc3] transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
                disabled={actionLoading}
              >
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'incoming' 
                ? 'border-b-2 border-[#229ED9] text-[#229ED9] bg-blue-50/30' 
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white'
            }`}
          >
            ?? Incoming Requests {incomingRequests.length > 0 && <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{incomingRequests.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'outgoing' 
                ? 'border-b-2 border-[#229ED9] text-[#229ED9] bg-blue-50/30' 
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white'
            }`}
          >
            ?? Outgoing Requests {outgoingRequests.length > 0 && <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{outgoingRequests.length}</span>}
          </button>
        </div>

        {/* List */}
        <div className="p-0">
          {loading && requests.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-gray-400" />
              <p>Loading requests...</p>
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <CarFront className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No {activeTab} requests</h3>
              <p className="text-sm">When agencies request vehicles or you make requests, they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedRequests.map(req => {
                const partnerProfile = activeTab === 'incoming' ? req.requester : req.owner;
                const vehicle = req.listing;
                
                return (
                  <div 
                    key={req.id} 
                    onClick={() => setSelectedRequest(req)}
                    className="p-5 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row gap-4 md:items-center cursor-pointer group"
                  >
                    {/* Vehicle Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                        {vehicle?.images?.[0] ? (
                          <img 
                            src={getVehicleImageUrl(vehicle.images[0].image || vehicle.images[0])} 
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <CarFront className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-[#229ED9] transition-colors">
                            {vehicle?.make || 'Unknown'} {vehicle?.model || 'Car'} <span className="text-gray-500 font-normal text-sm">({vehicle?.year || 'N/A'})</span>
                          </h4>
                          {getStatusBadge(req.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-gray-400" /> {activeTab === 'incoming' ? 'From:' : 'To:'} <span className="font-medium text-gray-800">{partnerProfile?.business_name || 'Agency'}</span></span>
                          <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5 text-gray-400" /> {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d, yy')}</span>
                          <span className="flex items-center gap-1 font-medium text-[#229ED9]"><DollarSign className="w-3.5 h-3.5" />{parseFloat(req.total_price).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 md:mt-0 text-sm">
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-gray-400 text-xs flex items-center gap-1 group-hover:text-blue-500 transition-colors">View details <ChevronLeft className="w-3 h-3 rotate-180" /></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
