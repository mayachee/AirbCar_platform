export const calculateTotalPrice = (price, duration, securityDepositValue = 5000) => {
  const safePrice = Number(price) || 0
  const safeDuration = Math.max(1, Number(duration) || 1)
  const securityDeposit = Number.isFinite(Number(securityDepositValue)) ? Number(securityDepositValue) : 5000
  const basePrice = safePrice * safeDuration
  const serviceFee = 25
  return {
    basePrice,
    serviceFee,
    securityDeposit,
    total: basePrice + serviceFee + securityDeposit
  }
}

export const formatPrice = (amount) => {
  return amount.toLocaleString('en-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace('MAD', '').trim() + ' MAD'
}
