import React, { useState } from 'react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import OrderStatusBadge from './OrderStatusBadge';

export default function CheckoutModal({ isOpen, onClose, onOrderPlaced, onNavigateOrders }) {
  const { items, subtotal, tax, total, clearCart } = useCart();

  const [customer, setCustomer] = useState({
    name: 'Sarah Connor',
    email: 'sarah.connor@example.com',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    postalCode: '97477',
    country: 'US',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick validations
    if (!customer.name.trim() || customer.name.trim().length < 2) {
      setErrorMessage('Please enter a valid customer name (at least 2 characters).');
      return;
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!customer.address.trim() || !customer.city.trim() || !customer.postalCode.trim()) {
      setErrorMessage('Please complete all shipping address fields.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          address: customer.address.trim(),
          city: customer.city.trim(),
          postalCode: customer.postalCode.trim(),
          country: customer.country.trim() || 'US',
        },
        items: items.map(({ product, quantity }) => ({
          productId: product.productId,
          quantity,
        })),
      };

      const newOrder = await api.createOrder(payload);

      // Order created successfully
      clearCart();
      setCreatedOrder(newOrder);
      if (onOrderPlaced) {
        onOrderPlaced(newOrder);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndNavigate = () => {
    setCreatedOrder(null);
    onClose();
    if (onNavigateOrders) {
      onNavigateOrders();
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: createdOrder ? '520px' : '640px' }}>
        {/* Order Success State */}
        {createdOrder ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 1.25rem',
              }}
            >
              ✓
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
              Order Confirmed!
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '1.5rem' }}>
              Your order has been recorded in DynamoDB with real-time status tracking.
            </p>

            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Order ID</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                  {createdOrder.orderId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Status</span>
                <OrderStatusBadge status={createdOrder.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Customer</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{createdOrder.customer?.name}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--slate-200)',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Total Billed</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                  ${Number(createdOrder.total).toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleFinishAndNavigate} className="btn btn-primary btn-block">
                View Orders & Status
              </button>
              <button
                onClick={() => {
                  setCreatedOrder(null);
                  onClose();
                }}
                className="btn btn-secondary btn-block"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-900)' }}>Checkout & Review</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                  Provide shipping details to create an order
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--slate-100)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '1.75rem',
                  height: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--slate-600)',
                  fontSize: '1.125rem',
                }}
                aria-label="Close checkout"
              >
                &times;
              </button>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div
                style={{
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  color: '#9f1239',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Shipping Form */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
                    Shipping Address
                  </h4>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customer-name">Full Name *</label>
                    <input
                      id="customer-name"
                      name="name"
                      type="text"
                      className="form-input"
                      value={customer.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customer-email">Email Address *</label>
                    <input
                      id="customer-email"
                      name="email"
                      type="email"
                      className="form-input"
                      value={customer.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customer-address">Street Address *</label>
                    <input
                      id="customer-address"
                      name="address"
                      type="text"
                      className="form-input"
                      value={customer.address}
                      onChange={handleChange}
                      placeholder="123 Cloud Avenue"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="customer-city">City *</label>
                      <input
                        id="customer-city"
                        name="city"
                        type="text"
                        className="form-input"
                        value={customer.city}
                        onChange={handleChange}
                        placeholder="Seattle"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="customer-postal">Postal Code *</label>
                      <input
                        id="customer-postal"
                        name="postalCode"
                        type="text"
                        className="form-input"
                        value={customer.postalCode}
                        onChange={handleChange}
                        placeholder="98101"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Order Summary Box */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
                    Order Summary ({items.length} items)
                  </h4>

                  <div
                    style={{
                      backgroundColor: 'var(--slate-50)',
                      border: '1px solid var(--slate-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      marginBottom: '1rem',
                    }}
                  >
                    {items.map(({ product, quantity }) => (
                      <div
                        key={product.productId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8125rem',
                          marginBottom: '0.5rem',
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ color: 'var(--slate-700)', paddingRight: '0.5rem' }}>
                          {quantity} × {product.name}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--slate-900)', flexShrink: 0 }}>
                          ${(Number(product.price) * quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-600)' }}>
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-600)' }}>
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        fontSize: '1.125rem',
                        color: 'var(--slate-900)',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--slate-200)',
                      }}
                    >
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--slate-200)', paddingTop: '1.25rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="btn btn-primary"
                  style={{ minWidth: '160px' }}
                >
                  {isSubmitting ? 'Placing Order...' : `Place Order • $${total.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
