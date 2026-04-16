const fs = require('fs');

const code = `'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { partnerService } from '@/features/partner/services/partnerService';
import { format } from 'date-fns';
import { Search, Bell, MessageSquare, HelpCircle, ChevronDown, Calendar, Car, DollarSign, MapPin, SlidersHorizontal, ArrowUpRight, Send, ArrowRight } from 'lucide-react';
import { getVehicleImageUrl } from '@/utils/imageUtils';

export default function CarSharingInbox({ partnerData }) {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [discoverCars, setDiscoverCars] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await partnerService.getCarShareRequests();
      const data = response.data?.results || response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
      
      if (selectedRequest) {
        const updated = data.find(r => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    } catch (error) {
      console.error(error);
      addToast('Failed to load sharing requests', 'error');
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
    if (activeTab === 'discover') fetchDiscoverableCars();
  }, [activeTab]);

  const fetchMessages = async () => {
    if (!selectedRequest?.id) return;
    try {
      setMessagesLoading(true);
      const response = await partnerService.getCarShareMessages(selectedRequest.id);
      setMessages(response.data?.results || response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequest) {
      fetchMessages();
    }
  }, [selectedRequest?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
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

  const handleRequestSubRent = async (car) => {
    try {
      setActionLoading(true);
      await partnerService.createCarShareRequest({
         public_id: car.public_id,
         start_date: new Date().toISOString().split('T')[0],
         end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
         total_price: car.price_per_day || car.price || 0,
         notes: 'Fast sub-rent request from marketplace.'
      });
      addToast('Sub-rent request sent! View it in Outgoing tab.', 'success');
      setActiveTab('outgoing');
      fetchRequests();
    } catch (error) {
      console.error(error);
      addToast('Failed to request sub-rent', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const myPartnerId = partnerData?.id;
  const incomingRequests = requests.filter(req => req.owner?.id === myPartnerId);
  const outgoingRequests = requests.filter(req => req.requester?.id === myPartnerId);
  const displayedRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[600px] w-full bg-[#F8FAFC]">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Fleet Marketplace</h1>
          <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 w-[350px] border border-gray-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C25E20]/20 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search vehicles, agents, or locations..." 
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="px-8 py-3 bg-white flex gap-6 text-[13px] font-extrabold tracking-wide uppercase border-b border-gray-100 shadow-sm shrink-0 items-center relative z-10 text-gray-500">
         <button onClick={() => setActiveTab('discover')} className={\`pb-1 border-b-[3px] transition-all \${activeTab === 'discover' ? 'border-[#C25E20] text-[#C25E20]' : 'border-transparent hover:text-gray-800'}\`}>Fleet Marketplace</button>
         <button onClick={() => setActiveTab('incoming')} className={\`pb-1 border-b-[3px] transition-all \${activeTab === 'incoming' ? 'border-[#C25E20] text-[#C25E20]' : 'border-transparent hover:text-gray-800'}\`}>Incoming Requests \${incomingRequests.length > 0 ? \`(\${incomingRequests.length})\` : ''}</button>
         <button onClick={() => setActiveTab('outgoing')} className={\`pb-1 border-b-[3px] transition-all \${activeTab === 'outgoing' ? 'border-[#C25E20] text-[#C25E20]' : 'border-transparent hover:text-gray-800'}\`}>Outgoing SubRents \${outgoingRequests.length > 0 ? \`(\${outgoingRequests.length})\` : ''}</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        <div className="flex-1 flex flex-col px-8 py-6 overflow-y-auto custom-scrollbar">
          {activeTab === 'discover' ? (
            <>
              {/* Header Title Section */}
              <div className="flex justify-between items-start mb-8">
                <div className="max-w-2xl">
                  <h2 className="text-[42px] leading-tight font-extrabold text-[#0D1528] tracking-tight mb-2">
                    Scale your fleet with <br/>
                    <em className="text-[#C25E20] not-italic italic">Kinetic Partners.</em>
                  </h2>
                  <p className="text-gray-500 font-medium text-base mt-2 max-w-lg">
                    Browse real-time available inventory from premium Marrakech agents and sub-rent instantly to meet your client demands.
                  </p>
                </div>
              </div>

              {discoverLoading ? (
                 <div className="py-20 text-center text-gray-500">Loading premium fleet...</div>
              ) : discoverCars.length === 0 ? (
                 <div className="py-20 text-center text-gray-500 bg-white rounded-3xl border border-gray-200 border-dashed">No vehicles currently available for B2B sub-renting.</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
                  {discoverCars.map((car, idx) => (
                    <div key={car.id} className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all group flex flex-col p-[6px]">
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{car.make} {car.model}</h3>
                           <div className="text-right">
                              <span className="text-2xl font-extrabold text-[#C25E20]">\${parseFloat(car.price_per_day || car.price).toLocaleString()}</span>
                              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-[-2px] -mr-1">MAD PER DAY</span>
                           </div>
                        </div>
                        <div className="text-[13px] text-gray-500 font-semibold mb-6">
                           {car.year} • {idx % 2 === 0 ? 'Sport Performance' : 'Luxury SUV'}
                        </div>
                        
                        <button 
                           onClick={() => handleRequestSubRent(car)}
                           disabled={actionLoading}
                           className="w-full mt-4 bg-[#111827] hover:bg-[#1E293B] text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm tracking-wide"
                        >
                           Request Sub-Rent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="max-w-4xl mx-auto w-full">
               <h2 className="text-2xl font-bold mb-6 text-gray-900">{activeTab === 'incoming' ? 'Incoming Requests' : 'Outgoing Rentals'}</h2>
               {loading ? (
                  <div className="p-10 text-center">Loading...</div>
               ) : displayedRequests.length === 0 ? (
                  <div className="p-16 text-center bg-white border border-gray-200 border-dashed rounded-3xl text-gray-500 font-medium">No requests in this folder yet.</div>
               ) : (
                  <div className="flex flex-col gap-4">
                     {displayedRequests.map(req => {
                        const partnerProfile = activeTab === 'incoming' ? req.requester : req.owner;
                        const vehicle = req.listing;
                        const isSel = selectedRequest?.id === req.id;
                        return (
                           <div 
                              key={req.id} 
                              onClick={() => setSelectedRequest(req)}
                              className={\`p-5 bg-white border rounded-2xl cursor-pointer transition-all flex items-center justify-between \${isSel ? 'border-[#C25E20] shadow-md ring-1 ring-[#C25E20]/10' : 'border-gray-200 shadow-sm hover:shadow-md'}\`}
                           >
                              <div className="flex items-center gap-4">
                                 <div>
                                    <h4 className="font-bold text-lg text-gray-900">{vehicle?.make} {vehicle?.model} <span className="ml-2 text-sm text-gray-500 font-medium">From {partnerProfile?.business_name || 'Agency'}</span></h4>
                                 </div>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/features/partner/components/CarSharingInbox.js', code);
console.log('Success generating file');
const fs = require('fs');
fs.writeFileSync('src/features/partner/components/CarSharingInbox.js', `import React from 'react';\n\nexport default function CarSharingInbox() {\n  return (\n    <div>Rebuilding cleanly</div>\n  );\n}\n`);
console.log("Success");