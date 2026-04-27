'use client'

import { useEffect, useState } from 'react'
import { Calendar, Trash2, Plus, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { SelectField } from '@/components/ui/select-field'

/**
 * Per-vehicle blackout date manager.
 *
 * Lets a partner block off date ranges (vacation, maintenance, self-use)
 * during which a vehicle is unbookable. Hits the new
 * /listings/<id>/blackouts/ backend endpoints.
 */
export default function BlackoutDateManager({ vehicles = [] }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    vehicles?.[0]?.id ? String(vehicles[0].id) : ''
  )
  const [blackouts, setBlackouts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' })

  // Default to the first vehicle once vehicles arrive.
  useEffect(() => {
    if (!selectedVehicleId && vehicles?.[0]?.id) {
      setSelectedVehicleId(String(vehicles[0].id))
    }
  }, [vehicles, selectedVehicleId])

  // Fetch existing blackouts whenever the selected vehicle changes.
  useEffect(() => {
    if (!selectedVehicleId) {
      setBlackouts([])
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.get(`/listings/${selectedVehicleId}/blackouts/`)
        const list = response?.data?.data || response?.data || []
        if (!cancelled) setBlackouts(Array.isArray(list) ? list : [])
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load blackouts')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedVehicleId])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError(null)
    if (!selectedVehicleId) {
      setError('Pick a vehicle first.')
      return
    }
    if (!form.start_date || !form.end_date) {
      setError('Both start and end dates are required.')
      return
    }
    if (form.end_date < form.start_date) {
      setError('End date must be on or after start date.')
      return
    }
    setSubmitting(true)
    try {
      const response = await apiClient.post(
        `/listings/${selectedVehicleId}/blackouts/`,
        {
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason || undefined,
        },
      )
      const newRow = response?.data?.data || response?.data
      if (newRow?.id) {
        setBlackouts((prev) => [newRow, ...prev])
        setForm({ start_date: '', end_date: '', reason: '' })
      }
    } catch (err) {
      const fieldErrors = err?.data?.errors
      const messages = []
      if (fieldErrors && typeof fieldErrors === 'object') {
        for (const [field, msgs] of Object.entries(fieldErrors)) {
          messages.push(`${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
        }
      }
      setError(messages.join(' | ') || err?.data?.error || err?.message || 'Could not add blackout.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (blackoutId) => {
    if (!selectedVehicleId) return
    try {
      await apiClient.delete(`/listings/${selectedVehicleId}/blackouts/${blackoutId}/`)
      setBlackouts((prev) => prev.filter((b) => b.id !== blackoutId))
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not remove blackout.')
    }
  }

  const vehicleOptions = vehicles.map((v) => ({
    value: String(v.id),
    label: v.name || `${v.make || ''} ${v.model || ''}`.trim() || `Vehicle #${v.id}`,
  }))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Block dates
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mark days when a vehicle is unavailable (vacation, maintenance, self-use).
            Renters won't be able to book these dates.
          </p>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-gray-500">Add a vehicle first to manage its calendar.</p>
      ) : (
        <>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Vehicle
            </label>
            <SelectField
              name="vehicle"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              options={vehicleOptions}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg"
            />
          </div>

          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Start
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                End
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Maintenance, vacation…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg"
                maxLength={200}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Adding…' : 'Block'}
            </button>
          </form>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Blocked windows
            </h4>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : blackouts.length === 0 ? (
              <p className="text-sm text-gray-500">No dates blocked yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {blackouts.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {b.start_date} → {b.end_date}
                      </p>
                      {b.reason && (
                        <p className="text-xs text-gray-500">{b.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      title="Remove blackout"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
