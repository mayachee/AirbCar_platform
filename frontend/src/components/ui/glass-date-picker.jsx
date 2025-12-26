'use client'

import React from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GlassDatePicker({ 
  selected, 
  onChange, 
  placeholder, 
  icon: Icon, 
  showTimeSelect, 
  showTimeSelectOnly,
  dateFormat, 
  minDate, 
  className,
  error,
  ...props 
}) {
  return (
    <div className="relative w-full group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 z-10 pointer-events-none">
        {Icon ? <Icon className="w-4 h-4" /> : (showTimeSelectOnly ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />)}
      </div>
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder}
        showTimeSelect={showTimeSelect}
        showTimeSelectOnly={showTimeSelectOnly}
        dateFormat={dateFormat || (showTimeSelectOnly ? "h:mm aa" : "MM/dd/yyyy")}
        minDate={minDate}
        className={cn(
          "w-full pl-10 pr-4 py-3 rounded-lg transition-all",
          "bg-white/10 hover:bg-white/15",
          "border border-white/25 hover:border-white/35",
          "text-white placeholder:text-white/50",
          "backdrop-blur-xl backdrop-saturate-150",
          "focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-400/50 ring-1 ring-red-400/50",
          className
        )}
        calendarClassName="!bg-[#0f172a] !border !border-white/10 !text-white !font-sans !rounded-xl !shadow-2xl !p-2 glass-datepicker-calendar"
        dayClassName={() => "!text-white hover:!bg-orange-500 !rounded-md transition-colors"}
        timeClassName={() => "!text-white hover:!bg-orange-500/20 !rounded-md"}
        wrapperClassName="w-full"
        popperClassName="!z-50"
        {...props}
      />
      <style jsx global>{`
        .glass-datepicker-calendar .react-datepicker__header {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .glass-datepicker-calendar .react-datepicker__current-month,
        .glass-datepicker-calendar .react-datepicker__day-name,
        .glass-datepicker-calendar .react-datepicker-time__header {
          color: white !important;
        }
        .glass-datepicker-calendar .react-datepicker__day--selected,
        .glass-datepicker-calendar .react-datepicker__day--keyboard-selected {
          background-color: #f97316 !important; /* orange-500 */
          color: white !important;
        }
        .glass-datepicker-calendar .react-datepicker__time-container {
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .glass-datepicker-calendar .react-datepicker__time-container .react-datepicker__time {
          background-color: #0f172a !important;
        }
        .glass-datepicker-calendar .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
          color: white !important;
        }
        .glass-datepicker-calendar .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
          background-color: rgba(249, 115, 22, 0.2) !important;
        }
        .glass-datepicker-calendar .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
          background-color: #f97316 !important;
        }
        .glass-datepicker-calendar .react-datepicker__day--disabled {
          color: rgba(255, 255, 255, 0.2) !important;
        }
      `}</style>
    </div>
  )
}
