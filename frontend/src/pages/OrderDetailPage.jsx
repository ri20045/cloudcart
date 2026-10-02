import React, { useState } from 'react';
import { api } from '../api/client';
import OrderStatusBadge from '../components/OrderStatusBadge';

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage({ order, onBack, onToast }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!currentOrder) return null;

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const response = await api.updateOrderStatus(currentOrder.orderId, newStatus);
      const updated = response.order;
      setCurrentOrder(updated);
      if (onToast) {
        onToast(`Order status updated to ${newStatus}`);
      }
    } catch (err) {
      if (onToast) {
        onToast(`Failed to update status: ${err.message}`, 'error');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStepIndex = STATUS_STEPS.indexOf(currentOrder.status);
  const isCancelled = currentOrder.status === 'CANCELLED';

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem', maxWidth: '900px' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <span>&larr;</span> Back to Orders
      </button>

      {/* Main Order Card */}
      <div className="card" style={{ padding: '2rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--slate-200)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                {currentOrder.orderId}
              </h1>
              <OrderStatusBadge status={currentOrder.status} />
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
              Placed on {new Date(currentOrder.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Quick status updater */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', fontWeight: 600 }}>
              Update Lifecycle:
            </span>
            <select
              value={currentOrder.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8125rem', fontWeight: 600 }}
            >
              {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Lifecycle Stepper */}
        {!isCancelled ? (
          <div style={{ margin: '2rem 0', padding: '1rem 0', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', minWidth: '400px' }}>
              {/* Connecting line */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '2rem',
                  right: '2rem',
                  height: '3px',
                  backgroundColor: 'var(--slate-200)',
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '2rem',
                  width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 88}%`,
                  height: '3px',
                  backgroundColor: 'var(--primary-600)',
                  zIndex: 2,
                  transition: 'width 300ms ease',
                }}
              />

              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step}
                    style={{
                      position: 'relative',
                      zIndex: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? 'var(--primary-600)' : '#ffffff',
                        border: `2px solid ${isPassed ? 'var(--primary-600)' : 'var(--slate-300)'}`,
                        color: isPassed ? '#ffffff' : 'var(--slate-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--primary-600)' : 'var(--slate-500)',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              margin: '1.5rem 0',
              padding: '1rem',
              backgroundColor: '#ffe4e6',
              borderRadius: 'var(--radius-md)',
              color: '#9f1239',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            This order has been CANCELLED.
          </div>
        )}

        {/* Customer and Shipping Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            margin: '2rem 0',
            padding: '1.25rem',
            backgroundColor: 'var(--slate-50)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>
              Customer Information
            </h4>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-900)' }}>
              {currentOrder.customer?.name}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>
              {currentOrder.customer?.email}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>
              Shipping Destination
            </h4>
            <div style={{ fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {currentOrder.customer?.address}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {currentOrder.customer?.city}, {currentOrder.customer?.postalCode}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              {currentOrder.customer?.country}
            </div>
          </div>
        </div>

        {/* Order Items List */}
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Purchased Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {currentOrder.items?.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--slate-100)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      backgroundColor: 'var(--slate-100)',
                    }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--slate-900)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                    {item.quantity} × ${Number(item.price).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                ${Number(item.subtotal || item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div
          style={{
            maxWidth: '320px',
            marginLeft: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--slate-200)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
            <span>Subtotal</span>
            <span>${Number(currentOrder.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
            <span>Estimated Sales Tax (8%)</span>
            <span>${Number(currentOrder.tax).toFixed(2)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--slate-900)',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--slate-200)',
            }}
          >
            <span>Total</span>
            <span>${Number(currentOrder.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Interview Feature: DynamoDB Document Viewer */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--slate-200)' }}>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="btn btn-secondary btn-sm"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
          >
            {showRawJson ? 'Hide DynamoDB Record' : 'Inspect DynamoDB Document (JSON)'}
          </button>

          {showRawJson && (
            <div
              style={{
                marginTop: '1rem',
                backgroundColor: 'var(--slate-900)',
                color: '#38bdf8',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
              }}
            >
              <pre>{JSON.stringify(currentOrder, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
