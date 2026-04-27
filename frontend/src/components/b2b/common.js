'use client'

import { Clock, CheckCircle2, XCircle, Repeat, AlertCircle } from 'lucide-react'

/**
 * Formats a number as MAD currency for display in B2B pages.
 * Accepts strings (Decimal serialized by Django) and numbers; returns
 * "—" when the value is missing.
 */
export function formatMad(value, suffix = '/day') {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return `${formatted} MAD${suffix ? ` ${suffix}` : ''}`
}

/**
 * Maps CarShareRequest.status (and a couple of borrower-tracker pseudo-statuses
 * like "counter-offer") to a colored pill spec.
 */
export function statusBadgeProps(status) {
  switch (status) {
    case 'pending':
      return { label: 'Pending', icon: Clock, bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' }
    case 'counter':
    case 'counter-offer':
      return { label: 'Counter-offer', icon: Repeat, bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' }
    case 'accepted':
      return { label: 'Accepted', icon: CheckCircle2, bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
    case 'rejected':
    case 'declined':
      return { label: 'Declined', icon: XCircle, bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    case 'active':
      return { label: 'Active', icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' }
    case 'completed':
      return { label: 'Completed', icon: CheckCircle2, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    case 'cancelled':
      return { label: 'Cancelled', icon: XCircle, bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' }
    default:
      return { label: status || 'Unknown', icon: AlertCircle, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
  }
}

export function StatusBadge({ status, className = '' }) {
  const { label, icon: Icon, bg, text, border } = statusBadgeProps(status)
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

/**
 * Round avatar with an agency's initial. Falls back to a neutral colour
 * when the agency colour isn't known. Designed for inter-agency rows
 * where logos are usually absent.
 */
export function AgencyAvatar({ name = '', logoUrl, size = 32, color }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  const dimension = `${size}px`
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white shadow-sm"
        style={{ width: dimension, height: dimension }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shadow-sm"
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: color || stringToColor(name),
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  )
}

/**
 * Deterministic, soft palette derived from the agency name so each agency
 * gets a stable colour for avatars + map pins without an explicit field.
 */
export function stringToColor(seed = '') {
  const palette = [
    '#c0392b', // brick (Moroccan red)
    '#1a7a1a', // mint
    '#2563eb', // blue
    '#9333ea', // violet
    '#d97706', // amber
    '#0d9488', // teal
    '#db2777', // pink
    '#475569', // slate
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return palette[Math.abs(hash) % palette.length]
}

/** "Casablanca" → { lat, lng }. Used by the V5 fleet map. */
export const MOROCCO_CITY_COORDS = {
  casablanca: [33.5731, -7.5898],
  rabat: [34.0209, -6.8416],
  marrakech: [31.6295, -7.9811],
  tangier: [35.7595, -5.834],
  tanger: [35.7595, -5.834],
  tetouan: [35.5785, -5.3684],
  fes: [34.0181, -5.0078],
  agadir: [30.4278, -9.5981],
  meknes: [33.8935, -5.5547],
  oujda: [34.6814, -1.9086],
  ['el jadida']: [33.2316, -8.5007],
  essaouira: [31.5125, -9.7702],
  ouarzazate: [30.9335, -6.937],
  martil: [35.617, -5.273],
  ['m\'diq']: [35.685, -5.317],
  mdiq: [35.685, -5.317],
}

export function lookupCityCoords(rawLocation) {
  if (!rawLocation) return null
  const normalised = String(rawLocation)
    .toLowerCase()
    .trim()
    .replace(/[,;].*$/, '')
    .trim()
  return MOROCCO_CITY_COORDS[normalised] || null
}
