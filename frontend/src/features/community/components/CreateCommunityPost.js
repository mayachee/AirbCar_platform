'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { API_BASE_URL } from '@/constants';
import {
  Home,
  Compass,
  PenSquare,
  Car,
  Settings,
  CloudUpload,
  MapPin,
  Eye,
  MessageCircle,
  Bookmark,
  Star,
  TrendingUp,
  X,
  ChevronRight,
  ChevronDown,
  Loader2,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

function authHeaders(token, json = true) {
  const h = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  h['Accept'] = 'application/json';
  return h;
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function CommunitySidebar({ user, t }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const navItems = [
    { key: 'home', icon: Home, href: '/' },
    { key: 'explore', icon: Compass, href: '/search' },
    { key: 'create_post', icon: PenSquare, href: '/community/create' },
    { key: 'my_rentals', icon: Car, href: '/bookings' },
    { key: 'settings', icon: Settings, href: '/account' },
  ];

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : t('guest');

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)]">
      <div className="bg-kc-surface-container-lowest rounded-xl shadow-[0_4px_32px_rgba(0,0,0,0.04)] p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-kc-primary to-kc-primary-container flex items-center justify-center text-kc-on-primary font-semibold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-kc-on-surface truncate">{displayName}</p>
            <p className="text-[10px] font-medium tracking-widest text-kc-on-surface-variant uppercase">
              {t('sidebar_member_tag')}
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ key, icon: Icon, href }) => {
            const isActive = pathname.includes(href) && href !== '/';
            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-kc-primary-container/15 text-kc-primary'
                    : 'text-kc-on-surface-variant hover:bg-kc-surface-container-low'
                }`}
              >
                <Icon size={18} />
                <span>{t(`sidebar_${key}`)}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/search"
          className="mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-gradient-to-br from-kc-primary to-kc-primary-container text-kc-on-primary font-semibold text-sm shadow-[0_4px_16px_rgba(157,67,0,0.25)] hover:shadow-[0_6px_24px_rgba(157,67,0,0.35)] transition-shadow"
        >
          <Car size={16} />
          {t('sidebar_book_now')}
        </Link>
      </div>
    </aside>
  );
}

// ── Tag Chip ───────────────────────────────────────────────────────────────
function TagChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
        selected
          ? 'bg-kc-primary text-kc-on-primary'
          : 'bg-kc-surface-container-low text-kc-on-surface-variant hover:bg-kc-surface-container'
      }`}
    >
      {label}
    </button>
  );
}

// ── Thumbnail Preview ──────────────────────────────────────────────────────
function ThumbnailPreview({ file, onRemove }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!src) return null;

  return (
    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-kc-surface-container-low group">
      <img src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-kc-on-surface/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CreateCommunityPost() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('community');
  const fileInputRef = useRef(null);

  // Determine if user is a partner
  const isPartner = !!user && (
    user.is_partner === true ||
    user.is_partner === 'true' ||
    user.is_partner === 1 ||
    (user.role && user.role.toLowerCase() === 'partner')
  );

  // Form state
  const [caption, setCaption] = useState('');
  const [selectedTag, setSelectedTag] = useState(isPartner ? 'update' : 'travel_tip');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  // Booking selection state (for trip posts — customers only)
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsDropdownOpen, setBookingsDropdownOpen] = useState(false);

  // Partner profile state
  const [partnerProfile, setPartnerProfile] = useState(null);

  // Post type tags — customers get travel_tip, partners get agency_update + promotion + new_car
  const tags = isPartner
    ? [
        { key: 'update', label: t('tag_agency_update') },
        { key: 'promotion', label: t('tag_promotion') },
        { key: 'new_car', label: t('tag_new_car') },
      ]
    : [
        { key: 'travel_tip', label: t('tag_travel_tip') },
      ];

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // ── Load completed bookings (customers) or partner profile ──────────────
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    if (isPartner) {
      // Fetch partner profile to get partner ID
      fetch(`${API_BASE_URL}/partners/me/`, { headers: authHeaders(token) })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setPartnerProfile(data);
        })
        .catch(() => {});
    } else {
      // Fetch user's bookings, filter for completed ones without existing trip posts
      setLoadingBookings(true);
      fetch(`${API_BASE_URL}/bookings/`, { headers: authHeaders(token) })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.results || data?.data || [];
          const completed = list.filter(
            (b) => b.status === 'completed' && !b.trip_post
          );
          setCompletedBookings(completed);
          // Auto-select if only one
          if (completed.length === 1) setSelectedBooking(completed[0]);
        })
        .catch(() => {})
        .finally(() => setLoadingBookings(false));
    }
  }, [user, isPartner]);

  // ── File handling ───────────────────────────────────────────────────────
  const addFiles = useCallback((incoming) => {
    const imageFiles = Array.from(incoming).filter((f) =>
      f.type.startsWith('image/')
    );
    setFiles((prev) => [...prev, ...imageFiles].slice(0, 10));
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Upload images to Supabase via backend ──────────────────────────────
  async function uploadImages(token) {
    if (files.length === 0) return [];

    const urls = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(t('upload_progress', { current: i + 1, total: files.length }));
      const formData = new FormData();
      formData.append('image', files[i]);

      const res = await fetch(`${API_BASE_URL}/api/community/upload-image/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to upload image ${i + 1}`);
      }

      const data = await res.json();
      urls.push(data.url);
    }

    setUploadProgress('');
    return urls;
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!caption.trim()) {
      setError(t('error_caption_required'));
      return;
    }

    // Customers must select a completed booking
    if (!isPartner && !selectedBooking) {
      setError(t('error_booking_required'));
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      // Step 1: Upload images to Supabase
      const imageUrls = await uploadImages(token);

      // Step 2: Create the post
      if (isPartner && partnerProfile) {
        // Partner post → POST /partners/<id>/posts/
        const partnerId = partnerProfile.id;
        const body = {
          content: caption.trim(),
          post_type: selectedTag || 'update',
          image_url: imageUrls[0] || null, // PartnerPost supports single image_url
        };

        const res = await fetch(`${API_BASE_URL}/partners/${partnerId}/posts/`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || data?.detail || t('error_submit_failed'));
        }
      } else {
        // Trip post → POST /trips/
        const body = {
          booking: selectedBooking.id,
          caption: caption.trim(),
          images: imageUrls,
        };

        const res = await fetch(`${API_BASE_URL}/trips/`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || data?.detail || t('error_submit_failed'));
        }
      }

      // Redirect to feed after successful post
      router.push('/search');
    } catch (err) {
      setError(err.message || t('error_submit_failed'));
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  const locationDisplay = selectedBooking
    ? `${selectedBooking.pickup_location || selectedBooking.location || ''}`
    : '';

  // ── Loading / auth guard ────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kc-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kc-primary" />
      </div>
    );
  }

  if (!user) return null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-kc-surface">
      <Header />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <CommunitySidebar user={user} t={t} />

        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-kc-on-surface tracking-tight">
              {t('page_title')}
            </h1>
            <p className="mt-2 text-base text-kc-on-surface-variant max-w-xl">
              {t('page_subtitle')}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 rounded-xl bg-kc-error-container/30 p-4">
              <p className="text-sm text-kc-error font-medium">{error}</p>
            </div>
          )}

          {/* Upload progress banner */}
          {uploadProgress && (
            <div className="mb-6 rounded-xl bg-kc-surface-container-low p-4 flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-kc-primary" />
              <p className="text-sm text-kc-on-surface font-medium">{uploadProgress}</p>
            </div>
          )}

          {/* Two-column form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Media upload */}
            <div className="bg-kc-surface-container-lowest rounded-xl shadow-[0_4px_32px_rgba(0,0,0,0.04)] p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 rounded-xl py-16 px-6 cursor-pointer transition-colors ${
                  isDragging
                    ? 'bg-kc-primary-container/10'
                    : 'bg-kc-surface-container-low hover:bg-kc-surface-container'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-kc-surface-container flex items-center justify-center">
                  <CloudUpload size={28} className="text-kc-on-surface-variant" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-kc-on-surface">{t('upload_title')}</p>
                  <p className="text-xs text-kc-on-surface-variant mt-1">{t('upload_hint')}</p>
                </div>
                <button
                  type="button"
                  className="px-5 py-2 rounded-md bg-kc-surface-container-lowest text-sm font-medium text-kc-on-surface-variant shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {t('upload_browse')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {files.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {files.map((file, idx) => (
                    <ThumbnailPreview
                      key={`${file.name}-${idx}`}
                      file={file}
                      onRemove={() => removeFile(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right — Post details */}
            <div className="bg-kc-surface-container-lowest rounded-xl shadow-[0_4px_32px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-5">
              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {tags.map(({ key, label }) => (
                  <TagChip
                    key={key}
                    label={label}
                    selected={selectedTag === key}
                    onClick={() => setSelectedTag(key)}
                  />
                ))}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[10px] font-semibold tracking-widest text-kc-on-surface-variant uppercase mb-2">
                  {t('label_caption')}
                </label>
                <textarea
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t('caption_placeholder')}
                  maxLength={2000}
                  className="w-full rounded-md bg-kc-surface-container-low px-4 py-3 text-sm text-kc-on-surface placeholder:text-kc-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-kc-primary/30 resize-none"
                />
                <p className="text-[10px] text-kc-on-surface-variant mt-1 text-right">
                  {caption.length}/2000
                </p>
              </div>

              {/* Booking selector (customers only) */}
              {!isPartner && (
                <div>
                  <label className="block text-[10px] font-semibold tracking-widest text-kc-on-surface-variant uppercase mb-2">
                    {t('label_trip_vehicle')}
                  </label>
                  {loadingBookings ? (
                    <div className="flex items-center gap-2 rounded-md bg-kc-surface-container-low px-4 py-3">
                      <Loader2 size={16} className="animate-spin text-kc-on-surface-variant" />
                      <span className="text-sm text-kc-on-surface-variant">{t('loading_bookings')}</span>
                    </div>
                  ) : completedBookings.length === 0 ? (
                    <div className="rounded-md bg-kc-surface-container-low px-4 py-3">
                      <p className="text-sm text-kc-on-surface-variant">{t('no_completed_bookings')}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBookingsDropdownOpen(!bookingsDropdownOpen)}
                        className="w-full flex items-center justify-between gap-3 rounded-md bg-kc-surface-container-low px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Car size={16} className="text-kc-on-surface-variant shrink-0" />
                          <span className="text-sm text-kc-on-surface truncate">
                            {selectedBooking
                              ? (selectedBooking.listing_name || selectedBooking.vehicle_name || `Booking #${selectedBooking.id}`)
                              : t('select_booking')}
                          </span>
                        </div>
                        <ChevronDown size={16} className={`text-kc-on-surface-variant transition-transform ${bookingsDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {bookingsDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-kc-surface-container-lowest rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-10 max-h-48 overflow-y-auto">
                          {completedBookings.map((booking) => (
                            <button
                              key={booking.id}
                              type="button"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-kc-surface-container-low transition-colors ${
                                selectedBooking?.id === booking.id ? 'bg-kc-primary-container/10 text-kc-primary' : 'text-kc-on-surface'
                              }`}
                            >
                              <p className="font-medium">
                                {booking.listing_name || booking.vehicle_name || `Booking #${booking.id}`}
                              </p>
                              <p className="text-xs text-kc-on-surface-variant mt-0.5">
                                {booking.pickup_location || booking.location || ''}
                                {booking.start_date ? ` \u2022 ${new Date(booking.start_date).toLocaleDateString()}` : ''}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Location display (auto-filled from booking for customers) */}
              {!isPartner && selectedBooking && locationDisplay && (
                <div>
                  <label className="block text-[10px] font-semibold tracking-widest text-kc-on-surface-variant uppercase mb-2">
                    {t('label_location')}
                  </label>
                  <div className="flex items-center gap-3 rounded-md bg-kc-surface-container-low px-4 py-3">
                    <MapPin size={16} className="text-kc-on-surface-variant shrink-0" />
                    <span className="text-sm text-kc-on-surface">{locationDisplay}</span>
                  </div>
                </div>
              )}

              {/* Action row */}
              <div className="flex items-center justify-between mt-auto pt-4">
                <div className="flex items-center gap-4 text-kc-on-surface-variant">
                  <Eye size={18} />
                  <MessageCircle size={18} />
                  <Bookmark size={18} />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-kc-on-surface-variant hover:text-kc-on-surface transition-colors"
                  >
                    {t('btn_draft')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-md bg-gradient-to-br from-kc-primary to-kc-primary-container text-kc-on-primary text-sm font-semibold shadow-[0_4px_16px_rgba(157,67,0,0.25)] hover:shadow-[0_6px_24px_rgba(157,67,0,0.35)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? t('btn_posting') : t('btn_post')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-kc-surface-container-lowest rounded-xl shadow-[0_4px_32px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-kc-primary" />
                <span className="text-[10px] font-semibold tracking-widest text-kc-primary uppercase">
                  {t('trending_label')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-kc-on-surface mb-1">{t('trending_title')}</h3>
              <p className="text-sm text-kc-on-surface-variant mb-4">{t('trending_description')}</p>
              <Link
                href="/search"
                className="inline-flex items-center gap-1 text-sm font-semibold text-kc-primary hover:text-kc-primary-container transition-colors"
              >
                {t('trending_cta')}
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-kc-on-surface to-kc-primary rounded-xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] p-6 text-kc-on-primary">
              <div className="w-10 h-10 rounded-full bg-kc-primary-container/20 flex items-center justify-center mb-4">
                <Star size={20} className="text-kc-primary-container" />
              </div>
              <h3 className="text-lg font-bold mb-1">{t('challenge_title')}</h3>
              <p className="text-sm text-kc-on-primary/80">{t('challenge_description')}</p>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
