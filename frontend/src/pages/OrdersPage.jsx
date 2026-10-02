import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import EmptyState from '../components/EmptyState';
import OrderStatusBadge from '../components/OrderStatusBadge';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage({ onToast, onSelectOrder }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to retrieve orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await api.updateOrderStatus(orderId, newStatus);
      const updatedOrder = response.order;

      // Update state locally
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: updatedOrder.status, updatedAt: updatedOrder.updatedAt } : o))
      );

      if (onToast) {
        onToast(`Order ${orderId} updated to ${newStatus}`);
      }
    } catch (err) {
      if (onToast) {
        onToast(`Failed to update status: ${err.message}`, 'error');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Order Management</h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Real-time serverless orders stored in Amazon DynamoDB. Test lifecycle transitions via PATCH API.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchOrders} className="btn btn-secondary btn-sm" disabled={isLoading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Input */}
      {orders.length > 0 && (
        <div style={{ marginBottom: '1.5rem', maxWidth: '380px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Order ID or Customer..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card"
              style={{ padding: '1.5rem', backgroundColor: '#ffffff', opacity: 0.6 }}
            >
              <div style={{ height: '20px', width: '30%', backgroundColor: 'var(--slate-200)', marginBottom: '0.75rem' }} />
              <div style={{ height: '16px', width: '50%', backgroundColor: 'var(--slate-200)' }} />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && errorMessage && (
        <div
          style={{
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '2rem auto',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ color: '#9f1239', marginBottom: '0.5rem' }}>Failed to Load Orders</h3>
          <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {errorMessage}
          </p>
          <button onClick={fetchOrders} className="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && !errorMessage && filteredOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredOrders.map((order) => {
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Unknown date';

            return (
              <div
                key={order.orderId}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Header row: ID, Date, Status */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--slate-100)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        color: 'var(--slate-900)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      onClick={() => onSelectOrder && onSelectOrder(order)}
                    >
                      {order.orderId}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--slate-400)' }}>•</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                      {dateStr}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <OrderStatusBadge status={order.status} />

                    {/* PATCH Status Transition Control */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        disabled={updatingId === order.orderId}
                        className="form-select"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          height: 'auto',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600,
                        }}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            Update: {st}
                          </option>
                        ))}
                      </select>
                      {updatingId === order.orderId && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)' }}>⏳</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Row: Customer info & Items Preview */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {/* Customer and Shipping */}
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: '0.35rem' }}>
                      Customer & Shipping
                    </h4>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                      {order.customer?.name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                      {order.customer?.email}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
                      {order.customer?.address}, {order.customer?.city}, {order.customer?.postalCode}
                    </div>
                  </div>

                  {/* Order Items Snapshot */}
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: '0.35rem' }}>
                      Order Items ({order.items?.length || 0})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8125rem',
                            color: 'var(--slate-700)',
                          }}
                        >
                          <span>
                            {item.quantity} × {item.name}
                          </span>
                          <span style={{ fontWeight: 600 }}>
                            ${Number(item.subtotal || item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer: Financial Totals */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--slate-100)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--slate-500)', fontSize: '0.8125rem' }}>
                    <span>Subtotal: ${Number(order.subtotal).toFixed(2)}</span>
                    <span>Tax (8%): ${Number(order.tax).toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>Total:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      ${Number(order.total).toFixed(2)}
                    </span>
                    <button
                      onClick={() => onSelectOrder && onSelectOrder(order)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Details &gt;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty orders state */}
      {!isLoading && !errorMessage && filteredOrders.length === 0 && (
        <EmptyState
          icon="📦"
          title={filterQuery ? 'No matching orders found' : 'No orders recorded yet'}
          description={
            filterQuery
              ? `No orders matching query "${filterQuery}".`
              : 'Add some products from the catalog and place your first order!'
          }
        />
      )}
    </div>
  );
}
