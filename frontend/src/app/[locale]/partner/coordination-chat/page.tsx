"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  CheckCheck,
  Clock,
  Car
} from "lucide-react";

// Mock data for contacts/conversations
const CONTACTS = [
  {
    id: "c1",
    name: "Elite Auto Group",
    avatar: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=100&q=80",
    lastMessage: "The Model 3 is ready for pickup.",
    time: "10:23 AM",
    unread: 2,
    online: true,
    vehicle: "Tesla Model 3",
  },
  {
    id: "c2",
    name: "Luxury Rentals",
    avatar: "https://images.unsplash.com/photo-1503376713214-ddfb9cfd22a5?w=100&q=80",
    lastMessage: "Perfect, I'll send the client details shortly.",
    time: "Yesterday",
    unread: 0,
    online: false,
    vehicle: "Porsche Macan",
  },
  {
    id: "c3",
    name: "Premium Fleet",
    avatar: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=100&q=80",
    lastMessage: "Is the G63 available next weekend?",
    time: "Tuesday",
    unread: 0,
    online: true,
    vehicle: null,
  }
];

// Mock data for messages
const INITIAL_MESSAGES = [
  {
    id: "m1",
    senderId: "c1",
    text: "Hi there! I saw you requested the Model 3 for tomorrow.",
    time: "10:15 AM",
    isSelf: false,
  },
  {
    id: "m2",
    senderId: "self",
    text: "Yes! Can you confirm it's fully charged and cleaned?",
    time: "10:18 AM",
    isSelf: true,
  },
  {
    id: "m3",
    senderId: "c1",
    text: "Absolutely. The Model 3 is ready for pickup.",
    time: "10:23 AM",
    isSelf: false,
  }
];

export default function PartnerCoordinationChat() {
  const t = useTranslations();
  const [activeContact, setActiveContact] = useState(CONTACTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  
  const filteredContacts = CONTACTS.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.vehicle && contact.vehicle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMessage = {
      id: `m${Date.now()}`,
      senderId: "self",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
    
    // Simulate reply after 1.5s
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `m${Date.now() + 1}`,
        senderId: activeContact.id,
        text: "Got it! Thanks for letting me know.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false,
      }]);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-neutral-900 border-t border-neutral-800 text-neutral-100 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar Contacts List */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-xl flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-400 mb-4">
            Partner Chat
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search partners, vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-800/80 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-neutral-200 placeholder:text-neutral-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
          {filteredContacts.map((contact) => (
            <motion.button
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${
                activeContact.id === contact.id
                  ? "bg-neutral-800 border border-neutral-700 shadow-sm"
                  : "hover:bg-neutral-800/50 border border-transparent"
              }`}
            >
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                />
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-neutral-900 rounded-full"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-medium text-neutral-200 truncate pr-2">
                    {contact.name}
                  </h3>
                  <span className="text-xs text-neutral-500 whitespace-nowrap">
                    {contact.time}
                  </span>
                </div>
                
                {contact.vehicle && (
                  <div className="flex items-center gap-1.5 text-xs text-[#F97316] mb-1">
                    <Car className="h-3 w-3" />
                    <span className="font-medium truncate">{contact.vehicle}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <p className={`text-sm truncate ${contact.unread > 0 ? "text-neutral-200 font-medium" : "text-neutral-500"}`}>
                    {contact.lastMessage}
                  </p>
                  {contact.unread > 0 && (
                    <span className="ml-2 bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-[0_0_8px_rgba(249,115,22,0.4)]">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#111] relative overflow-hidden">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-xl flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeContact.avatar}
                alt={activeContact.name}
                className="w-10 h-10 rounded-full object-cover border border-neutral-700"
              />
              {activeContact.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-neutral-900 rounded-full"></span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100">{activeContact.name}</h3>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                {activeContact.online ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-green-500 relative"><span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span></span> Online now</>
                ) : (
                  <><Clock className="h-3 w-3" /> Last seen {activeContact.time}</>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button className="p-2 text-neutral-400 hover:text-[#F97316] hover:bg-orange-500/10 rounded-full transition-colors">
              <Phone className="h-5 w-5" />
            </button>
            <button className="p-2 text-neutral-400 hover:text-[#F97316] hover:bg-orange-500/10 rounded-full transition-colors">
              <Video className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-neutral-800 mx-1"></div>
            <button className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-full transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Info Banner if negotiating vehicle */}
        {activeContact.vehicle && (
          <div className="bg-neutral-800/60 border-b border-neutral-800 backdrop-blur-md px-6 py-2.5 flex items-center justify-between z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#F97316]">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">Current Inquiry</p>
                <p className="text-xs text-neutral-400">{activeContact.vehicle} • Reqeusted for tomorrow</p>
              </div>
            </div>
            <button className="text-xs font-medium text-[#F97316] hover:underline px-3 py-1.5 bg-orange-500/10 rounded-lg">
              View Details
            </button>
          </div>
        )}

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative">
          <div className="flex justify-center mb-8">
            <span className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full text-xs font-medium border border-neutral-700">
              Today
            </span>
          </div>

          <AnimatePresence>
            {messages.map((message) => {
              const isSelf = message.isSelf;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex flex-col gap-1 max-w-[70%] ${isSelf ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2">
                      {!isSelf && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={activeContact.avatar} 
                          alt="avatar" 
                          className="w-6 h-6 rounded-full object-cover mb-1 border border-neutral-700" 
                        />
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isSelf
                            ? "bg-[#F97316] text-white rounded-br-sm shadow-[0_4px_12px_rgba(249,115,22,0.2)] font-medium"
                            : "bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-bl-sm"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-1 mt-0.5">
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {message.time}
                      </span>
                      {isSelf && (
                        <CheckCheck className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 z-10">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 bg-neutral-800 rounded-2xl border border-neutral-700 p-2 focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-[#F97316]/50 transition-all shadow-sm"
          >
            <button 
              type="button"
              className="p-3 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded-xl transition-colors flex-shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message..."
              className="flex-1 max-h-32 min-h-11 bg-transparent text-neutral-200 placeholder:text-neutral-500 text-sm py-3 px-2 resize-none focus:outline-none scrollbar-hide"
              rows={1}
            />
            
            <button 
              type="button"
              className="p-3 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded-xl transition-colors flex-shrink-0"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={!messageText.trim()}
              className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                messageText.trim()
                  ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                  : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
              }`}
            >
              <Send className="h-5 w-5 ml-0.5" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-neutral-500 font-medium">Press <span className="font-mono bg-neutral-800 px-1 rounded mx-0.5">Enter</span> to send • <span className="font-mono bg-neutral-800 px-1 rounded mx-0.5">Shift+Enter</span> for new line</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
