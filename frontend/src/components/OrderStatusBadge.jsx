import React from 'react';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    className: 'badge-pending',
    dotColor: '#d97706',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'badge-processing',
    dotColor: '#0284c7',
  },
  SHIPPED: {
    label: 'Shipped',
    className: 'badge-shipped',
    dotColor: '#4f46e5',
  },
  DELIVERED: {
    label: 'Delivered',
    className: 'badge-delivered',
    dotColor: '#059669',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'badge-cancelled',
    dotColor: '#e11d48',
  },
};

export default function OrderStatusBadge({ status }) {
  const normStatus = (status || 'PENDING').toUpperCase();
  const config = STATUS_CONFIG[normStatus] || STATUS_CONFIG.PENDING;

  return (
    <span className={`badge ${config.className}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          display: 'inline-block',
        }}
      />
      {config.label}
    </span>
  );
}
