const fs = require('fs');

const code = \'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { partnerService } from '@/features/partner/services/partnerService';
import { format } from 'date-fns';
import { Search, Bell, MessageSquare, HelpCircle, ChevronDown, Calendar, Car, DollarSign, MapPin, SlidersHorizontal, ArrowUpRight, CheckCircle2, ChevronRight, Send, ArrowRight } from 'lucide-react';
import { getVehicleImageUrl } from '@/utils/imageUtils';

export default function CarSharingInbox({ partnerData }) {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'incoming', 'outgoing'
  const [discoverCars, setDiscoverCars] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Chat state
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
      
      {/* Top Navigation / Search area strictly mimicking the screenshot */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Fleet Marketplace</h1>
          <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 w-[350px] border border-gray-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search vehicles, agents, or locations..." 
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-5">
           <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
           </button>
           <button className="text-gray-500 hover:text-gray-900 transition-colors"><MessageSquare className="w-5 h-5" /></button>
           <button className="text-gray-500 hover:text-gray-900 transition-colors"><HelpCircle className="w-5 h-5" /></button>
           <div className="flex items-center gap-2 pl-3 border-l border-gray-200 cursor-pointer">
              <img src="/api/placeholder/40/40" className="w-8 h-8 rounded-full border border-gray-300" alt="profile" />
              <ChevronDown className="w-4 h-4 text-gray-500" />
           </div>
        </div>
      </div>

      {/* Integrated Tab Nav - Since the original screenshot had a sidebar, we'll put our tabs up here discreetly */}
      <div className="px-8 py-3 bg-white flex gap-6 text-sm font-semibold border-b border-gray-100 shadow-sm shrink-0 items-center justify-center relative z-10">
         <button onClick={() => setActiveTab('discover')} className={\pb-1 border-b-[3px] transition-all \\}>Discover fleet</button>
         <button onClick={() => setActiveTab('incoming')} className={\pb-1 border-b-[3px] transition-all \\}>Incoming requests ({incomingRequests.length})</button>
         <button onClick={() => setActiveTab('outgoing')} className={\pb-1 border-b-[3px] transition-all \\}>Outgoing rentals ({outgoingRequests.length})</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Content Area (col-span-8 equivalent) */}
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

                {/* Demand Signals Widget */}
                <div className="bg-[#EEF2FF] border border-blue-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm w-[380px]">
                  <div className="bg-[#FFEDD5] text-[#EA580C] p-2.5 rounded-full shrink-0 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 stroke-[3px]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-1">Demand Signals</h4>
                    <p className="font-extrabold text-gray-900 text-[15px] mb-0.5">High Demand in <span className="text-[#C25E20]">Casablanca</span></p>
                    <p className="text-xs text-gray-500 font-medium tracking-tight">LSUV & Executive sedans needed</p>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap gap-3 mb-8 text-[13px] font-bold">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <div className="flex items-center gap-3">
                     <span className="flex flex-col"><span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-[-2px]">From</span> Oct 12, 2026</span>
                     <ArrowRight className="w-3 h-3 text-orange-400" />
                     <span className="flex flex-col"><span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-[-2px]">To</span> Oct 15, 2026</span>
                  </div>
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Car className="w-4 h-4 text-gray-400 mr-2" /> Vehicle Class <ChevronDown className="w-3 h-3 ml-2 text-gray-400" />
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" /> Daily Rate <ChevronDown className="w-3 h-3 ml-2 text-gray-400" />
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" /> City <ChevronDown className="w-3 h-3 ml-2 text-gray-400" />
                </div>
                <div className="flex items-center bg-[#1E293B] text-white rounded-xl px-5 py-2.5 shadow-sm font-semibold hover:bg-[#0F172A] cursor-pointer ml-auto transition-colors">
                  <SlidersHorizontal className="w-4 h-4 mr-2" /> More Filters
                </div>
              </div>

              {/* Grid of Cars */}
              {discoverLoading ? (
                 <div className="py-20 text-center text-gray-500">Loading premium fleet...</div>
              ) : discoverCars.length === 0 ? (
                 <div className="py-20 text-center text-gray-500 bg-white rounded-3xl border border-gray-200 border-dashed">No vehicles currently available for B2B sub-renting.</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
                  {discoverCars.map((car, idx) => (
                    <div key={car.id} className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all group flex flex-col p-[6px]">
                      {/* Image Frame */}
                      <div className="relative w-full h-[220px] rounded-t-3xl rounded-b-xl overflow-hidden bg-gray-100">
                        {car.images?.[0] ? (
                          <img src={getVehicleImageUrl(car.images[0].image || car.images[0])} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Car" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-800"><Car className="w-12 h-12" /></div>
                        )}
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                        {/* Badge top left */}
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <span className="text-[10px] font-extrabold tracking-widest text-[#1E293B] uppercase">{car.partner_name || 'AGENCY'}</span>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{car.make} {car.model}</h3>
                           <div className="text-right">
                              <span className="text-2xl font-extrabold text-[#C25E20]"></span>
                              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-[-2px] -mr-1">MAD PER DAY</span>
                           </div>
                        </div>
                        <div className="text-[13px] text-gray-500 font-semibold mb-6">
                           {car.year} • {idx % 2 === 0 ? 'Sport Performance' : 'Luxury SUV'}
                        </div>
                        
                        <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-emerald-600 bg-emerald-100 rounded-sm p-[2px]" />
                              <span className="text-[13px] font-bold text-gray-800">{idx % 2 === 0 ? '70/30' : '65/35'} Revenue Split</span>
                              <span className="ml-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">AVAILABLE NOW</span>
                           </div>
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
            // Requests View (Incoming/Outgoing)
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
                              className={\p-5 bg-white border rounded-2xl cursor-pointer transition-all flex items-center justify-between \\}
                           >
                              <div className="flex items-center gap-4">
                                 <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                    {vehicle?.images?.[0] && <img src={getVehicleImageUrl(vehicle.images[0].image || vehicle.images[0])} className="w-full h-full object-cover" />}
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-lg text-gray-900">{vehicle?.make} {vehicle?.model} <span className="ml-2 text-sm text-gray-500 font-medium">From {partnerProfile?.business_name || 'Agency'}</span></h4>
                                    <p className="text-sm font-semibold text-gray-500 mt-1">
                                       {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d')} • <span className="text-[#C25E20]"></span>
                                    </p>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <span className={\px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg \\}>
                                    {req.status}
                                 </span>
                                 <span className="text-xs text-gray-400 font-semibold">Select to view chat</span>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Live Partner Chat */}
        <div className="w-[360px] bg-white border-l border-gray-100 flex flex-col shrink-0 relative shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur z-10">
              <div>
                 <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Live Partner Chat</h2>
                 <p className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase mt-0.5">Fleet Handovers</p>
              </div>
              <button className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full transition-colors">
                 <Search className="w-4 h-4" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] flex flex-col gap-5 custom-scrollbar">
              {!selectedRequest ? (
                 <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm text-gray-300">
                       <MessageSquare className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Select a request</h3>
                    <p className="text-sm text-gray-500 font-medium">Choose an incoming or outgoing request to view the chat and handover logs.</p>
                 </div>
              ) : messagesLoading ? (
                 <div className="text-center p-8 text-gray-400 font-medium text-sm">Loading chat...</div>
              ) : messages.length === 0 ? (
                 <div className="text-center p-8 text-gray-400 font-medium text-sm bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">No messages yet. Start chatting!</div>
              ) : (
                 <div className="flex flex-col gap-6 w-full">
                    {messages.map((msg, i) => {
                       const isMe = msg.sender === partnerData?.id || msg.sender?.id === partnerData?.id;
                       return (
                          <div key={i} className={\lex gap-3 \\}>
                             {!isMe && <img src="/api/placeholder/32/32" className="w-8 h-8 rounded-full shadow-sm shrink-0 border border-gray-200" alt="avatar" />}
                             <div className={\lex flex-col \ max-w-[85%]\}>
                                {!isMe && <span className="text-[11px] font-bold text-gray-800 mb-1 ml-1">{msg.sender?.first_name || 'Partner'} <span className="text-gray-400 font-medium ml-1">Agency</span></span>}
                                <div className={\p-4 text-[13px] leading-relaxed shadow-sm font-medium \\}>
                                   {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold tracking-wide mt-1.5 mx-1">{format(new Date(msg.created_at || Date.now()), 'h:mm a')}</span>
                             </div>
                             {isMe && <img src="/api/placeholder/32/32" className="w-8 h-8 rounded-full shadow-sm shrink-0 border border-[#E56A20]/20" alt="avatar" />}
                          </div>
                       )
                    })}
                 </div>
              )}
           </div>

           {/* Message Input strictly like the mockup */}
           <div className="p-5 bg-white border-t border-gray-100 relative">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                 <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!selectedRequest}
                    placeholder={selectedRequest ? "Type a message to partners..." : "Select a request to chat"}
                    className="w-full bg-[#F4F7FA] text-[13px] font-medium text-gray-700 rounded-xl py-3.5 pl-4 pr-12 outline-none focus:ring-2 focus:ring-[#C25E20]/20 focus:bg-white transition-all placeholder-gray-400 disabled:opacity-50"
                 />
                 <button 
                    type="submit" 
                    disabled={!selectedRequest || !newMessage.trim()}
                    className="absolute right-2 p-2 bg-[#E56A20] text-white rounded-lg hover:bg-[#C25E20] disabled:bg-gray-300 disabled:text-white transition-colors flex items-center justify-center shadow-sm"
                 >
                    <Send className="w-4 h-4 ml-0.5" />
                 </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
}
\;

fs.writeFileSync('src/features/partner/components/CarSharingInbox.js', code);
console.log('Successfully wrote exact template translation!');
