import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidMoroccanPhone(phone) {
  if (!phone) return false
  // Remove spaces, dashes, and plus signs for validation
  const cleaned = phone.replace(/[\s\-+]/g, '')
  // Moroccan phone numbers:
  // - +212 followed by 9 digits (mobile: 6 or 7 followed by 8 digits) = 12 digits total
  // - 212 followed by 9 digits (mobile: 6 or 7 followed by 8 digits) = 12 digits total
  // - 0 followed by 9 digits (mobile: 6 or 7 followed by 8 digits) = 10 digits total
  // Mobile numbers start with 6 or 7
  // Accept formats: +212 6XX-XXXXXX, 212 6XX-XXXXXX, 06XX-XXXXXX, 06XXXXXXXX
  const moroccanRegex = /^(?:(?:\+212|212)[\s\-]?)?(?:0[\s\-]?)?(?:6|7)[\d\s\-]{8}$/
  return moroccanRegex.test(phone)
}