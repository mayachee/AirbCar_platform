'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { partnerService } from '@/features/partner/services/partnerService';
import { format } from 'date-fns';
import { RefreshCw, PlusCircle, Check, X, Clock, CalendarIcon, CarFront, FileText, DollarSign, Building, MessageSquare, ClipboardCheck, Info, ChevronLeft, Send, CheckCircle2 } from 'lucide-react';
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

  // Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Handover State
  const [inspections, setInspections] = useState([]);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    stage: 'pickup',
    mileage: '',
    fuel_level: '100',
    condition_notes: ''
  });

  // Form State
  // Pre-fill form state
  const [formData, setFormData] = useState({
    public_id: '',
    start_date: '',
    end_date: '',
    total_price: '',
    notes: ''
  });

  // Discover Marketplace State
  const [discoverCars, setDiscoverCars] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);

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

  const fetchDiscoverableCars = async () => {
    if (discoverCars.length > 0 || !partnerData?.id) return;
    try {
      setDiscoverLoading(true);
      // Fetch cars excluding own agency
      const response = await partnerService.getDiscoverableCars(partnerData.id);
      const data = response.data?.results || response.data || [];
      setDiscoverCars(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load eligible cars', 'error');
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverableCars();
    }
  }, [activeTab]);

  const fetchMessages = async () => {
    if (!selectedRequest?.id) return;
    try {
      setMessagesLoading(true);
      const response = await partnerService.getCarShareMessages(selectedRequest.id);
      setMessages(response.data?.results || response.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load messages', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedRequest?.id) return;

    try {
      const response = await partnerService.sendCarShareMessage(selectedRequest.id, { text: newMessage });
      const newMsgObj = response.data?.data || response.data;
      setMessages(prev => [...prev, newMsgObj]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
      addToast('Failed to send message', 'error');
    }
  };

  const fetchInspections = async () => {
    if (!selectedRequest?.id) return;
    try {
      setInspectionLoading(true);
      const response = await partnerService.getCarShareInspections(selectedRequest.id);
      setInspections(response.data?.results || response.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load inspections', 'error');
    } finally {
      setInspectionLoading(false);
    }
  };

  const handleSubmitInspection = async (e) => {
    if (e) e.preventDefault();
    if (!inspectionForm.mileage || !selectedRequest?.id) {
      addToast('Please enter mileage', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const response = await partnerService.createCarShareInspection(selectedRequest.id, inspectionForm);
      const newInspObj = response.data?.data || response.data;
      setInspections(prev => [...prev, newInspObj]);
      setInspectionForm({
        stage: 'pickup',
        mileage: '',
        fuel_level: '100',
        condition_notes: ''
      });
      addToast('Inspection logged successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to log inspection', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequest) {
      if (requestTab === 'chat') {
        fetchMessages();
      } else if (requestTab === 'handover') {
        fetchInspections();
      }
    }
  }, [selectedRequest?.id, requestTab]);

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
      setActiveTab('outgoing'); // Switch to 'outgoing' tab to see the new request
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
      case 'accepted': return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded-full flex items-center w-fit gap-1"><Check className="w-3 h-3" /> Accepted</span>;
      case 'rejected': return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 rounded-full flex items-center w-fit gap-1"><X className="w-3 h-3" /> Rejected</span>;
      case 'pending': return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 rounded-full flex items-center w-fit gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default: return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 rounded-full w-fit">{status}</span>;
    }
  };

  // -------------------------------------------------------------
  // 2-COLUMN LAYOUT RENDER
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px] w-full max-w-7xl mx-auto">
      
      {/* ---------------- LEFT COLUMN: LISTS ---------------- */}
      <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col border border-gray-200 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden shrink-0">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white z-10 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🤝 B2B Hub
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={fetchRequests} 
              disabled={loading}
              className="p-2.5 text-gray-600 hover:text-[#229ED9] bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-100 rounded-xl transition-all focus:outline-none shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setIsFormOpen(!isFormOpen); setSelectedRequest(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all shadow-sm focus:outline-none border ${
                isFormOpen 
                  ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' 
                  : 'bg-[#229ED9] text-white border-[#229ED9] hover:bg-[#1c84b8] hover:shadow-md'
              }`}
            >
              {isFormOpen ? <><X className="w-4 h-4" /> Close</> : <><PlusCircle className="w-4 h-4" /> New</>}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 shrink-0">
          <button
            onClick={() => { setActiveTab('incoming'); setIsFormOpen(false); }}
            className={`flex-1 py-3.5 text-sm font-semibold text-center transition-colors border-b-[3px] flex items-center justify-center gap-1.5 ${
              activeTab === 'incoming' && !isFormOpen
                ? 'border-[#229ED9] text-[#229ED9] bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Incoming {incomingRequests.length > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'incoming' && !isFormOpen ? 'bg-[#229ED9]/10 text-[#229ED9]' : 'bg-gray-200 text-gray-600'}`}>{incomingRequests.length}</span>}
          </button>
          <button
            onClick={() => { setActiveTab('outgoing'); setIsFormOpen(false); }}
            className={`flex-1 py-3.5 text-sm font-semibold text-center transition-colors border-b-[3px] flex items-center justify-center gap-1.5 ${
              activeTab === 'outgoing' && !isFormOpen
                ? 'border-[#229ED9] text-[#229ED9] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Outgoing {outgoingRequests.length > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'outgoing' && !isFormOpen ? 'bg-[#229ED9]/10 text-[#229ED9]' : 'bg-gray-200 text-gray-600'}`}>{outgoingRequests.length}</span>}
          </button>
          <button
            onClick={() => { setActiveTab('discover'); setIsFormOpen(false); setSelectedRequest(null); }}
            className={`flex-1 py-3.5 text-sm font-semibold text-center transition-colors border-b-[3px] flex items-center justify-center gap-1.5 ${
              activeTab === 'discover' && !isFormOpen
                ? 'border-[#229ED9] text-[#229ED9] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Discover {discoverCars.length > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'discover' && !isFormOpen ? 'bg-[#229ED9]/10 text-[#229ED9]' : 'bg-gray-200 text-gray-600'}`}>{discoverCars.length}</span>}
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar">
          {activeTab === 'discover' ? (
            discoverLoading ? (
               <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                 <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#229ED9]" />
                 <p className="text-sm font-medium">Finding available vehicles...</p>
               </div>
            ) : discoverCars.length === 0 ? (
               <div className="p-8 m-4 text-center text-gray-500 flex flex-col items-center bg-white border border-gray-200 border-dashed rounded-xl">
                 <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-3">
                   <CarFront className="w-6 h-6" />
                 </div>
                 <h3 className="text-sm font-bold text-gray-900 mb-1">No Cars Available</h3>
                 <p className="text-xs text-gray-500">Other agencies haven't listed cars yet.</p>
               </div>
            ) : (
               <div className="flex flex-col divide-y divide-gray-100">
                 {discoverCars.map(car => (
                   <div key={car.id} className="p-4 hover:bg-white transition-all bg-transparent flex gap-4 group cursor-default">
                     <div className="relative w-24 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 shadow-sm group-hover:shadow-md transition-all">
                        {car.images?.[0] ? (
                          <img src={getVehicleImageUrl(car.images[0].image || car.images[0])} className="w-full h-full object-cover" alt="Car" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                            <CarFront className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 flex justify-center">
                          <span className="text-[10px] font-bold text-white shadow-sm">{car.year}</span>
                        </div>
                     </div>
                     <div className="flex-1 flex flex-col min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-[#229ED9] transition-colors">{car.make} {car.model}</h4>
                        <div className="text-xs text-gray-500 mt-1 flex gap-1.5 items-center truncate">
                           <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" /> 
                           <span className="truncate">{car.partner_name || 'Agency'}</span>
                        </div>
                        <div className="mt-auto flex items-end justify-between pt-2">
                           <span className="font-bold text-[#229ED9] text-sm">${parseFloat(car.price_per_day || car.price).toLocaleString()}/d</span>
                           <button
                              onClick={() => {
                                 setFormData(prev => ({ ...prev, public_id: car.public_id || '' }));
                                 setIsFormOpen(true);
                                 setSelectedRequest(null);
                              }}
                              className="px-3.5 py-1.5 bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9] hover:text-white text-xs font-bold rounded-lg transition-colors border border-[#229ED9]/20 hover:border-[#229ED9] shadow-sm flex items-center gap-1"
                           >
                              <CalendarIcon className="w-3 h-3" /> Request
                           </button>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            )
          ) : loading && requests.length === 0 ? (
             <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                 <RefreshCw className="w-6 h-6 animate-spin mb-3 text-gray-400" />
                 <p className="text-sm font-medium">Loading requests...</p>
             </div>
          ) : displayedRequests.length === 0 ? (
             <div className="p-8 m-4 text-center text-gray-500 flex flex-col items-center bg-white border border-gray-200 border-dashed rounded-xl">
                 <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-3">
                   <FileText className="w-6 h-6" />
                 </div>
                 <h3 className="text-sm font-bold text-gray-900 mb-1">No {activeTab} requests</h3>
                 <p className="text-xs text-gray-500">They will appear here once created.</p>
             </div>
          ) : (
             <div className="flex flex-col">
               {displayedRequests.map(req => {
                 const partnerProfile = activeTab === 'incoming' ? req.requester : req.owner;
                 const vehicle = req.listing;
                 const isSelected = selectedRequest?.id === req.id && !isFormOpen;
                 
                 return (
                   <div 
                     key={req.id} 
                     onClick={() => { setSelectedRequest(req); setIsFormOpen(false); setRequestTab('details'); }}
                     className={`p-4 transition-all flex gap-4 cursor-pointer group border-b border-gray-100 ${
                        isSelected 
                          ? 'bg-blue-50/50 border-l-[4px] border-l-[#229ED9]' 
                          : 'border-l-[4px] border-l-transparent bg-white hover:bg-gray-50'
                     }`}
                   >
                     <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 shadow-sm relative">
                       {vehicle?.images?.[0] ? (
                         <img src={getVehicleImageUrl(vehicle.images[0].image || vehicle.images[0])} className="w-full h-full object-cover" alt="car" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-300"><CarFront className="w-6 h-6" /></div>
                       )}
                     </div>
                     
                     <div className="flex-1 min-w-0 flex flex-col">
                       <div className="flex items-start justify-between gap-2 mb-1">
                         <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-[#229ED9]' : 'text-gray-900 group-hover:text-[#229ED9]'}`}>
                           {vehicle?.make || 'Unknown'} {vehicle?.model || 'Car'}
                         </h4>
                         {getStatusBadge(req.status)}
                       </div>
                       <div className="text-xs flex flex-col gap-1.5 mt-0.5">
                         <span className="flex items-center gap-1.5 truncate text-gray-600 font-medium">
                           <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" /> 
                           <span className="truncate">{partnerProfile?.business_name || 'Agency'}</span>
                         </span>
                         <span className="flex items-center justify-between mt-0.5">
                            <span className="flex items-center gap-1 text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                              <CalendarIcon className="w-3 h-3 text-gray-400" /> {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d')}
                            </span>
                            <span className="font-bold text-[#229ED9]">${parseFloat(req.total_price).toLocaleString()}</span>
                         </span>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      </div>

      {/* ---------------- RIGHT COLUMN: MAIN CONTENT ---------------- */}
      <div className="flex-1 flex flex-col border border-gray-200 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden shrink-0 h-full relative">
         
         {isFormOpen ? (
            // FORM VIEW
            <div className="flex flex-col h-full bg-gray-50">
               <div className="p-5 md:p-6 border-b border-gray-200 shadow-sm z-10 flex justify-between items-center bg-white shrink-0">
                  <div>
                     <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg"><PlusCircle className="w-5 h-5 text-[#229ED9]" /></div>
                        New B2B Car Share Request
                     </h3>
                     <p className="text-sm text-gray-500 mt-1">Initiate a rental request to another agency.</p>
                  </div>
                  <button onClick={() => setIsFormOpen(false)} className="p-2 bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-all"><X className="w-5 h-5"/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                  <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
                     <form onSubmit={handleCreateRequest} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">Car Public ID</label>
                              <input 
                                 type="text" name="public_id" required value={formData.public_id} onChange={handleFormChange}
                                 placeholder="e.g. ABC1234"
                                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">Agreed Total Price (USD)</label>
                              <div className="relative">
                                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                 </div>
                                 <input 
                                    type="number" name="total_price" required step="0.01" min="0" value={formData.total_price} onChange={handleFormChange}
                                    placeholder="0.00"
                                    className="w-full pl-9 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">Start Date</label>
                              <input 
                                 type="date" name="start_date" required value={formData.start_date} onChange={handleFormChange}
                                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all text-gray-700"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">End Date</label>
                              <input 
                                 type="date" name="end_date" required value={formData.end_date} onChange={handleFormChange}
                                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all text-gray-700"
                              />
                           </div>
                           <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-800 mb-2">Notes / Terms</label>
                              <textarea 
                                 name="notes" rows="4" value={formData.notes} onChange={handleFormChange}
                                 placeholder="Add optional details, conditions, or terms for this request..."
                                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all resize-none"
                              ></textarea>
                           </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                           <button 
                              type="button" onClick={() => setIsFormOpen(false)} disabled={actionLoading}
                              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-bold"
                           >
                              Cancel
                           </button>
                           <button 
                              type="submit" disabled={actionLoading}
                              className="px-8 py-2.5 bg-[#229ED9] text-white rounded-xl hover:bg-[#1a8cc3] shadow-sm hover:shadow transition-all disabled:opacity-50 text-sm font-bold flex items-center gap-2"
                           >
                              {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                              Submit Request
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>

         ) : selectedRequest ? (
            
            // SELECTED REQUEST DETAILS MAP
            <div className="flex flex-col h-full bg-gray-50/20">
               {/* 1. Header */}
               <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 border-b border-gray-200 shrink-0 z-10 gap-4">
                  <div>
                     <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {selectedRequest.listing?.make} {selectedRequest.listing?.model} 
                        <span className="text-gray-500 font-medium text-lg">({selectedRequest.listing?.year})</span>
                        {getStatusBadge(selectedRequest.status)}
                     </h2>
                     <div className="flex flex-wrap gap-2 md:gap-4 text-sm text-gray-500 mt-2 font-medium">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">ID: {selectedRequest.id}</span>
                        <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 opacity-70"/> {activeTab === 'incoming' ? `From: ${selectedRequest.requester?.business_name}` : `To: ${selectedRequest.owner?.business_name}`}</span>
                     </div>
                  </div>
                  
                  {/* Actions for owner if pending */}
                  {selectedRequest.owner?.id === myPartnerId && selectedRequest.status === 'pending' && (
                     <div className="flex gap-2">
                        <button 
                           onClick={() => handleStatusUpdate(selectedRequest.id, 'accepted')} disabled={actionLoading}
                           className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                           <Check className="w-4 h-4" /> Accept
                        </button>
                        <button 
                           onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')} disabled={actionLoading}
                           className="px-5 py-2.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                           <X className="w-4 h-4" /> Reject
                        </button>
                     </div>
                  )}
               </div>

               {/* 2. Tabs inside selected request */}
               <div className="flex border-b border-gray-200 bg-gray-50/80 shrink-0 px-2">
                  <button onClick={() => setRequestTab('details')} className={`py-4 px-6 text-sm font-bold text-center transition-colors border-b-[3px] flex gap-2 items-center ${requestTab === 'details' ? 'border-[#229ED9] text-[#229ED9]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                     <FileText className="w-4 h-4" /> Details
                  </button>
                  <button onClick={() => setRequestTab('chat')} className={`py-4 px-6 text-sm font-bold text-center transition-colors border-b-[3px] flex gap-2 items-center relative ${requestTab === 'chat' ? 'border-[#229ED9] text-[#229ED9]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                     <MessageSquare className="w-4 h-4" /> Messages
                     {/* notification dot could go here */}
                  </button>
                  <button onClick={() => setRequestTab('handover')} className={`py-4 px-6 text-sm font-bold text-center transition-colors border-b-[3px] flex gap-2 items-center ${requestTab === 'handover' ? 'border-[#229ED9] text-[#229ED9]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                     <ClipboardCheck className="w-4 h-4" /> Handover Log
                  </button>
               </div>

               {/* 3. Content Area */}
               <div className="flex-1 relative overflow-hidden bg-gray-50/30">
                  
                  {/* DETAILS TAB */}
                  {requestTab === 'details' && (
                     <div className="absolute inset-0 overflow-y-auto px-6 py-8 md:p-10 custom-scrollbar animate-in fade-in slide-in-from-bottom-2">
                        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                           
                           {/* Left Info Column */}
                           <div className="lg:col-span-3 space-y-8">
                              <section>
                                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <Clock className="w-5 h-5 text-[#229ED9]" /> Booking Timeline
                                 </h3>
                                 <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm grid grid-cols-2 gap-6 relative overflow-hidden">
                                    <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gray-100 hidden md:block"></div>
                                    <div>
                                       <span className="text-sm font-medium text-gray-500 block mb-1 uppercase tracking-wider">Start Date</span>
                                       <div className="font-bold text-lg text-gray-900">{format(new Date(selectedRequest.start_date), 'MMMM d, yyyy')}</div>
                                    </div>
                                    <div>
                                       <span className="text-sm font-medium text-gray-500 block mb-1 uppercase tracking-wider">End Date</span>
                                       <div className="font-bold text-lg text-gray-900">{format(new Date(selectedRequest.end_date), 'MMMM d, yyyy')}</div>
                                    </div>
                                    <div className="col-span-2 pt-4 border-t border-gray-100 flex justify-between items-center bg-blue-50/50 -m-5 mt-0 p-5">
                                       <span className="text-sm font-bold text-gray-700">Total Duration</span>
                                       <span className="text-sm font-bold bg-[#229ED9]/10 text-[#229ED9] px-3 py-1 rounded-lg">
                                          {Math.max(1, Math.ceil((new Date(selectedRequest.end_date) - new Date(selectedRequest.start_date)) / (1000 * 60 * 60 * 24)))} Days
                                       </span>
                                    </div>
                                 </div>
                              </section>

                              <section>
                                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <DollarSign className="w-5 h-5 text-[#229ED9]" /> Financials
                                 </h3>
                                 <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                                    <div>
                                       <span className="text-sm font-medium text-gray-500 block mb-1 uppercase tracking-wider">Agreed Total Price</span>
                                       <span className="text-xs text-gray-400">Total payment from requester</span>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900 tracking-tight">
                                       ${parseFloat(selectedRequest.total_price).toLocaleString()}
                                    </div>
                                 </div>
                              </section>

                              <section>
                                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <Info className="w-5 h-5 text-[#229ED9]" /> Notes & Terms
                                 </h3>
                                 <div className="bg-yellow-50 text-yellow-800 rounded-2xl p-5 border border-yellow-100 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedRequest.notes ? selectedRequest.notes : <span className="text-yellow-600/70 italic block py-2">No notes or special conditions provided for this request.</span>}
                                 </div>
                              </section>
                           </div>

                           {/* Right Sidebar Column */}
                           <div className="lg:col-span-2 space-y-6">
                              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                 <div className="text-xs font-bold uppercase tracking-widest text-[#229ED9] mb-4 border-b border-gray-100 pb-2">Owner Profile</div>
                                 <div className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                       {selectedRequest.owner?.business_name?.charAt(0) || 'O'}
                                    </div>
                                    <div>
                                       <div className="font-bold text-gray-900">{selectedRequest.owner?.business_name}</div>
                                       {myPartnerId === selectedRequest.owner?.id && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase mt-1 inline-block">You</span>}
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                 <div className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4 border-b border-gray-100 pb-2">Requester Profile</div>
                                 <div className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                                       {selectedRequest.requester?.business_name?.charAt(0) || 'R'}
                                    </div>
                                    <div>
                                       <div className="font-bold text-gray-900">{selectedRequest.requester?.business_name}</div>
                                       {myPartnerId === selectedRequest.requester?.id && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded uppercase mt-1 inline-block">You</span>}
                                    </div>
                                 </div>
                              </div>
                           </div>

                        </div>
                     </div>
                  )}

                  {/* CHAT TAB */}
                  {requestTab === 'chat' && (
                     <div className="absolute inset-0 flex flex-col bg-[#F8FAFC]">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar flex flex-col">
                           <div className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 my-4 bg-gray-200/50 w-fit mx-auto px-4 py-1 rounded-full">Conversation Started</div>
                           
                           {messagesLoading ? (
                              <div className="flex justify-center flex-col items-center p-8 gap-3 my-auto">
                                 <RefreshCw className="w-6 h-6 animate-spin text-[#229ED9]" />
                                 <span className="text-sm font-medium text-gray-500">Loading messages...</span>
                              </div>
                           ) : messages.length === 0 ? (
                              <div className="text-center text-gray-400 text-sm mt-auto mb-auto flex flex-col items-center">
                                 <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                                 <p className="font-medium">No messages yet.</p>
                                 <p className="text-xs mt-1">Send a message to start the conversation.</p>
                              </div>
                           ) : (
                              messages.map((msg, idx) => {
                                 const isMe = msg.is_partner || msg.sender_role === 'partner';
                                 return (
                                    <div key={msg.id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                       <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                          <div className={`p-4 rounded-2xl text-sm shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] leading-relaxed ${isMe ? 'bg-[#229ED9] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                                             {msg.message}
                                          </div>
                                          <span className={`text-[10px] font-medium mt-1.5 px-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                                             {msg.created_at ? format(new Date(msg.created_at), 'MMM d, h:mm a') : 'Just now'}
                                          </span>
                                       </div>
                                    </div>
                                 );
                              })
                           )}
                        </div>
                        
                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 shrink-0 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
                           <div className="flex gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-[#229ED9]/50 focus-within:ring-2 focus-within:ring-[#229ED9]/20 transition-all">
                              <input 
                                 type="text" 
                                 placeholder="Type your message..."
                                 value={newMessage}
                                 onChange={(e) => setNewMessage(e.target.value)}
                                 className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm text-gray-700 placeholder-gray-400" 
                              />
                              <button type="submit" disabled={!newMessage.trim() || actionLoading} className="px-5 py-2.5 bg-[#229ED9] text-white rounded-xl hover:bg-[#1a8cc3] transition-transform active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100 shadow-sm disabled:cursor-not-allowed font-bold">
                                 <Send className="w-4 h-4"/>
                              </button>
                           </div>
                        </form>
                     </div>
                  )}

                  {/* HANDOVER TAB */}
                  {requestTab === 'handover' && (
                     <div className="absolute inset-0 overflow-y-auto px-6 py-8 md:p-10 custom-scrollbar animate-in fade-in slide-in-from-bottom-2">
                        <div className="max-w-3xl mx-auto space-y-8">
                           
                           <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
                              <div className="bg-blue-100 p-2 rounded-full shrink-0"><Info className="w-5 h-5 text-blue-600" /></div>
                              <div>
                                 <h4 className="font-bold text-gray-900 mb-1">Vehicle Inspection Protocol</h4>
                                 <p className="text-gray-600 text-sm leading-relaxed">It is crucial to log the vehicle's condition, exact mileage, and fuel level at both check-out and check-in to avoid disputes.</p>
                              </div>
                           </div>
                           
                           <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
                              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200">
                                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4 text-[#229ED9]" /> Record New Inspection
                                 </h3>
                              </div>
                              <form className="p-6 space-y-5" onSubmit={handleSubmitInspection}>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                       <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Stage</label>
                                       <select value={inspectionForm.stage} onChange={(e) => setInspectionForm({ ...inspectionForm, stage: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800">
                                          <option value="pickup">🚗 Pre-Rental (Check-out)</option>
                                          <option value="return">🏁 Post-Rental (Check-in)</option>
                                       </select>
                                    </div>
                                    <div>
                                       <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Current Mileage</label>
                                       <input type="number" placeholder="e.g. 45000" value={inspectionForm.mileage} onChange={(e) => setInspectionForm({ ...inspectionForm, mileage: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800" />
                                    </div>
                                    <div>
                                       <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Fuel Level</label>
                                       <select value={inspectionForm.fuel_level} onChange={(e) => setInspectionForm({ ...inspectionForm, fuel_level: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800">
                                          <option value="100">Full (100%)</option>
                                          <option value="75">3/4 (75%)</option>
                                          <option value="50">1/2 (50%)</option>
                                          <option value="25">1/4 (25%)</option>
                                          <option value="0">Empty (0%)</option>
                                       </select>
                                    </div>
                                    <div>
                                       <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Condition Notes</label>
                                       <input type="text" placeholder="Scratches, damages, cleanliness..." value={inspectionForm.condition_notes} onChange={(e) => setInspectionForm({ ...inspectionForm, condition_notes: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#229ED9]/50 focus:border-[#229ED9] focus:bg-white outline-none text-sm transition-all font-medium text-gray-800" />
                                    </div>
                                 </div>
                                 <div className="pt-2 flex justify-end">
                                    <button type="submit" disabled={actionLoading} className="px-6 py-2.5 bg-[#229ED9] disabled:opacity-50 text-white text-sm font-bold rounded-xl hover:bg-[#1a8cc3] transition-colors shadow-sm flex items-center gap-2">
                                       {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                       Save Record
                                    </button>
                                 </div>
                              </form>
                           </div>
                           
                           <div>
                              <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">History Line</h3>
                              {inspectionLoading ? (
                                 <div className="flex justify-center p-12 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                    <RefreshCw className="w-8 h-8 animate-spin text-gray-300" />
                                 </div>
                              ) : inspections.length === 0 ? (
                                 <div className="text-gray-500 text-sm text-center py-10 bg-white border border-gray-200 rounded-2xl shadow-sm border-dashed">
                                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-600" />
                                    <p className="font-medium">No inspections logged yet.</p>
                                 </div>
                              ) : (
                                 <div className="space-y-4">
                                    {inspections.map((insp, idx) => (
                                       <div key={insp.id || idx} className="p-5 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-[#229ED9]/30 transition-colors">
                                          <div className={`absolute top-0 left-0 w-1.5 h-full ${insp.stage === 'pickup' ? 'bg-[#229ED9]' : 'bg-green-500'}`}></div>
                                          <div className="flex justify-between items-center pl-2">
                                             <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${insp.stage === 'pickup' ? 'bg-[#229ED9]/10 text-[#229ED9]' : 'bg-green-100 text-green-700'}`}>
                                                {insp.stage === 'pickup' ? 'Pre-Rental' : 'Post-Rental'}
                                             </span>
                                             <span className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">{insp.created_at ? format(new Date(insp.created_at), 'MMM d, yy • h:mm a') : 'Now'}</span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-700 pl-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                             <div><span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Mileage</span> <span className="font-bold text-gray-900">{insp.mileage}</span></div>
                                             <div><span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Fuel</span> <span className="font-bold text-gray-900 capitalize">{insp.fuel_level?.toString().replace('_', ' ')}%</span></div>
                                             <div className="col-span-2"><span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Notes</span> <span>{insp.condition_notes || <span className="text-gray-400 italic font-medium">Clear</span>}</span></div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>

                        </div>
                     </div>
                  )}

               </div>
            </div>

         ) : (
            // EMPTY STATE (NO SELECTION)
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 text-center p-8 absolute inset-0">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6 relative">
                  <div className="absolute inset-0 bg-[#229ED9]/5 rounded-full animate-ping opacity-75"></div>
                  <MessageSquare className="w-10 h-10 text-[#229ED9]" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">B2B Workflow</h3>
               <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                  Select an active request from the list to view details, chat with the other agency, and manage handover inspections.
               </p>
               <button 
                  onClick={() => setActiveTab('discover')}
                  className="mt-6 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 hover:text-[#229ED9] hover:border-[#229ED9]/30 transition-all shadow-sm"
               >
                  Browse Available Cars
               </button>
            </div>
         )}
      </div>

    </div>
  );
}
