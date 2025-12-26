export const calculateTotalPrice = (price, duration) => {
  const basePrice = price * duration
  const serviceFee = 25
  return {
    basePrice,
    serviceFee,
    total: basePrice + serviceFee
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
