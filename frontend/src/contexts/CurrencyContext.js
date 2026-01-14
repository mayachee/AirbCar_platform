'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import currencyJs from 'currency.js'

const CurrencyContext = createContext({
  currency: 'MAD',
  setCurrency: () => {},
  formatPrice: (price) => price,
})

const DEFAULT_RATES = {
  MAD: 1,
  EUR: 0.092,
  USD: 0.1
}

export const CURRENCIES = {
  MAD: { code: 'MAD', symbol: 'DH', label: 'MAD' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro' },
  USD: { code: 'USD', symbol: '$', label: 'Dollar' },
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('MAD')
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('airbcar_currency')
    if (stored && CURRENCIES[stored]) {
      setCurrency(stored)
    }

    // Fetch live exchange rates
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/MAD')
        const data = await response.json()
        
        if (data && data.rates) {
          setRates(prevRates => ({
            ...prevRates,
            MAD: 1, // Always 1
            EUR: data.rates.EUR || prevRates.EUR,
            USD: data.rates.USD || prevRates.USD,
          }))
        }
      } catch (error) {
        console.error('Failed to fetch currency rates:', error)
      }
    }
    
    fetchRates()
  }, [])

  const handleSetCurrency = (newCurrency) => {
    if (CURRENCIES[newCurrency]) {
      setCurrency(newCurrency)
      localStorage.setItem('airbcar_currency', newCurrency)
    }
  }

  const formatPrice = (priceInMad) => {
    const safePrice = Number(priceInMad) || 0
    const { code, symbol } = CURRENCIES[currency]
    const rate = rates[currency] || 1
    
    // Configure currency.js based on the selected currency
    const options = {
        symbol: code === 'MAD' ? ` ${symbol}` : symbol,
        separator: ',',
        decimal: '.',
        precision: code === 'MAD' ? 0 : 2, 
        pattern: code === 'MAD' ? '#!' : '!#', // MAD: 100 DH, USD: $100
    }

    return currencyJs(safePrice).multiply(rate).format(options)
  }
  
  // Create the currencies list with current rates (for UI)
  const currenciesList = Object.keys(CURRENCIES).map(code => ({
    ...CURRENCIES[code],
    rate: rates[code]
  }))

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency: handleSetCurrency,
      formatPrice,
      currencies: currenciesList
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
