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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
             <></>
          )}
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/features/partner/components/CarSharingInbox.js', code);
console.log('Success generating file');
