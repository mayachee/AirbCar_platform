export const calculateTotalPrice = (price, duration) => {
  const basePrice = price * duration
  const serviceFee = 25
  const securityDeposit = 5000
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
