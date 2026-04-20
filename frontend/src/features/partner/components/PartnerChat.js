'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { partnerService } from '@/features/partner/services/partnerService';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Search, Send, MessageSquare, ArrowLeft, Car, Clock,
  CheckCircle2, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';

// --- Helpers ---

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function getAvatarUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'P')}`;
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

function getOtherPartner(request, currentPartnerId) {
  if (!request) return null;
  if (request.requester?.id === currentPartnerId) return request.owner;
  return request.requester;
}

function getVehicleLabel(request) {
  const listing = request?.listing;
  if (!listing) return 'Vehicle';
  return [listing.make, listing.model, listing.year].filter(Boolean).join(' ');
}

// --- Sub-components ---

function ConversationItem({ request, currentPartnerId, isSelected, lastMessage, onClick }) {
  const other = getOtherPartner(request, currentPartnerId);
  const vehicle = getVehicleLabel(request);
  const statusClass = STATUS_COLORS[request.status] || STATUS_COLORS.pending;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all duration-150 border ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
          : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-200 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAvatarUrl(other?.business_name)}
          alt=""
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {other?.business_name || 'Partner'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
              {formatMessageTime(lastMessage?.created_at || request.updated_at)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <Car className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{vehicle}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {lastMessage?.text || 'No messages yet'}
            </p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${statusClass}`}>
              {request.status}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function ChatHeader({ request, currentPartnerId, onBack }) {
  const other = getOtherPartner(request, currentPartnerId);
  const vehicle = getVehicleLabel(request);
  const statusClass = STATUS_COLORS[request?.status] || STATUS_COLORS.pending;
  const t = useTranslations('partner');

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <button
        onClick={onBack}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getAvatarUrl(other?.business_name)}
        alt=""
        className="w-10 h-10 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {other?.business_name || 'Partner'}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate">{t('chat_vehicle_context')}: {vehicle}</span>
          <span className={`px-1.5 py-0.5 rounded-full font-medium ${statusClass}`}>
            {request?.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getAvatarUrl(message.sender?.business_name)}
            alt=""
            className="w-7 h-7 rounded-full flex-shrink-0"
          />
        )}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          <p className={`text-[10px] mt-1 ${
            isOwn ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
          }`}>
            {message.created_at ? format(new Date(message.created_at), 'HH:mm') : ''}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function MessageInput({ value, onChange, onSend, disabled }) {
  const t = useTranslations('partner');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t('chat_type_message')}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{subtitle}</p>
    </div>
  );
}

// --- Main Component ---

export default function PartnerChat({ partnerData }) {
  const t = useTranslations('partner');
  const currentPartnerId = partnerData?.id;

  // State
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [lastMessages, setLastMessages] = useState({});

  const messagesEndRef = useRef(null);
  const pollConversationsRef = useRef(null);
  const pollMessagesRef = useRef(null);

  // Selected request object
  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId]
  );

  // Filtered conversations
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter((r) => {
      const other = getOtherPartner(r, currentPartnerId);
      const vehicle = getVehicleLabel(r);
      return (
        other?.business_name?.toLowerCase().includes(q) ||
        vehicle.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery, currentPartnerId]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // --- Data fetching ---

  const endpointAvailable = useRef(true);

  const fetchRequests = useCallback(async () => {
    if (!endpointAvailable.current) return;
    try {
      const response = await partnerService.getCarShareRequests();
      const data = response.data?.results || response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.response?.status === 404 || err?.status === 404) {
        console.warn('Car share endpoint not available yet — disabling polling.');
        endpointAvailable.current = false;
        clearInterval(pollConversationsRef.current);
      } else {
        console.error('Failed to fetch car share requests:', err);
      }
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const fetchMessages = useCallback(async (requestId) => {
    if (!requestId) return;
    try {
      const response = await partnerService.getCarShareMessages(requestId);
      const data = response.data?.results || response.data?.data || response.data || [];
      const msgs = Array.isArray(data) ? data : [];
      setMessages(msgs);
      // Track last message for conversation list preview
      if (msgs.length > 0) {
        setLastMessages((prev) => ({ ...prev, [requestId]: msgs[msgs.length - 1] }));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Load messages when selection changes
  useEffect(() => {
    if (selectedId) {
      setLoadingMessages(true);
      setMessages([]);
      fetchMessages(selectedId);
    }
  }, [selectedId, fetchMessages]);

  // Poll conversations every 30s
  useEffect(() => {
    pollConversationsRef.current = setInterval(fetchRequests, 30000);
    return () => clearInterval(pollConversationsRef.current);
  }, [fetchRequests]);

  // Poll active messages every 10s
  useEffect(() => {
    if (!selectedId) return;
    pollMessagesRef.current = setInterval(() => fetchMessages(selectedId), 10000);
    return () => clearInterval(pollMessagesRef.current);
  }, [selectedId, fetchMessages]);

  // --- Actions ---

  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || !selectedId || sending) return;

    // Optimistic update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text,
      sender: { id: currentPartnerId, business_name: partnerData?.business_name },
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setLastMessages((prev) => ({ ...prev, [selectedId]: optimisticMsg }));
    setNewMessage('');
    setSending(true);

    try {
      const response = await partnerService.sendCarShareMessage(selectedId, { text });
      const confirmed = response.data?.data || response.data;
      // Replace optimistic message with confirmed one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? { ...confirmed } : m))
      );
      setLastMessages((prev) => ({ ...prev, [selectedId]: confirmed }));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedId, sending, currentPartnerId, partnerData?.business_name]);

  const handleSelectConversation = useCallback((id) => {
    setSelectedId(id);
    setShowMobileChat(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowMobileChat(false);
  }, []);

  // --- Render ---

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}
    >
      <div className="flex h-full">
        {/* Left panel: Conversation list */}
        <div
          className={`w-full lg:w-[340px] lg:min-w-[340px] border-r border-gray-200 dark:border-gray-700 flex flex-col ${
            showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {t('chat_title')}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('chat_search_placeholder')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={searchQuery ? 'No results' : t('chat_no_conversations').split('.')[0]}
                subtitle={searchQuery ? 'Try a different search' : t('chat_no_conversations')}
              />
            ) : (
              filteredRequests.map((request) => (
                <ConversationItem
                  key={request.id}
                  request={request}
                  currentPartnerId={currentPartnerId}
                  isSelected={selectedId === request.id}
                  lastMessage={lastMessages[request.id]}
                  onClick={() => handleSelectConversation(request.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel: Chat area */}
        <div
          className={`flex-1 flex flex-col ${
            !showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {!selectedRequest ? (
            <EmptyState
              icon={MessageSquare}
              title={t('chat_select_conversation')}
              subtitle=""
            />
          ) : (
            <>
              <ChatHeader
                request={selectedRequest}
                currentPartnerId={currentPartnerId}
                onBack={handleBackToList}
              />

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={Send}
                    title={t('chat_no_messages')}
                    subtitle=""
                  />
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender?.id === currentPartnerId}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <MessageInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={handleSend}
                disabled={!selectedId}
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
