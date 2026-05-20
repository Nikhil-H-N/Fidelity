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
    completed: 'text-accent-600 bg-accent-50',
    processing: 'text-amber-600 bg-amber-50',
    failed: 'text-red-600 bg-red-50',
    active: 'text-accent-600 bg-accent-50',
    paused: 'text-amber-600 bg-amber-50',
    Hot: 'text-red-600 bg-red-50',
    Warm: 'text-amber-600 bg-amber-50',
    Engaged: 'text-primary-600 bg-primary-50',
    'At Risk': 'text-surface-600 bg-surface-100',
  };
  return colors[status] || 'text-surface-600 bg-surface-100';
};

export const getRiskColor = (risk) => {
  const colors = {
    Low: 'text-accent-600',
    Moderate: 'text-amber-600',
    High: 'text-orange-600',
    'Very High': 'text-red-600',
    'Moderate-High': 'text-orange-500',
  };
  return colors[risk] || 'text-surface-600';
};
