export const formatCurrency = (amount, compact = false) => {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (value, digits = 1) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    completed: 'text-accent-700 bg-accent-50',
    processing: 'text-amber-700 bg-amber-50',
    failed: 'text-red-700 bg-red-50',
    active: 'text-accent-700 bg-accent-50',
    paused: 'text-amber-700 bg-amber-50',
    Hot: 'text-red-700 bg-red-50',
    Warm: 'text-amber-700 bg-amber-50',
    Engaged: 'text-primary-700 bg-primary-50',
    'At Risk': 'text-surface-600 bg-surface-100',
  };
  return colors[status] || 'text-surface-600 bg-surface-100';
};
