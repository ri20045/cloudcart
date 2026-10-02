import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import EmptyState from './EmptyState';

export default function CartDrawer({ onOpenCheckout }) {
  const {
    items,
    totalItems,
    subtotal,
    tax,
    total,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <div className="overlay" onClick={closeCart} role="dialog" aria-modal="true">
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.125rem' }}>Shopping Cart</h2>
            <span className="navbar-badge-pill">{totalItems} items</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate-500)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear
              </button>
            )}
            <button
              onClick={closeCart}
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
              aria-label="Close cart drawer"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Drawer Body: Items or Empty */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <EmptyState
              icon="🛒"
              title="Your cart is empty"
              description="Looks like you haven't added any products to your cart yet."
              actionText="Explore Catalog"
              onAction={closeCart}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map(({ product, quantity }) => {
                const price = Number(product.price) || 0;
                const itemTotal = price * quantity;

                return (
                  <div
                    key={product.productId}
                    style={{
                      display: 'flex',
                      gap: '0.875rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--slate-100)',
                    }}
                  >
                    {/* Thumbnail */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{
                        width: '4rem',
                        height: '4rem',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--slate-100)',
                        flexShrink: 0,
                      }}
                    />

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--slate-800)',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '180px',
                          }}
                        >
                          {product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(product.productId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            padding: '0 0.25rem',
                            fontSize: '1rem',
                          }}
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          &times;
                        </button>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '0.25rem 0' }}>
                        ${price.toFixed(2)} each
                      </div>

                      {/* Quantity Controls & Item Total */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid var(--slate-200)',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(product.productId, quantity - 1)}
                            style={{
                              padding: '0.2rem 0.5rem',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600 }}>
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.productId, quantity + 1)}
                            disabled={quantity >= (product.stock || 999)}
                            style={{
                              padding: '0.2rem 0.5rem',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            +
                          </button>
                        </div>

                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                          ${itemTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                <span>Estimated Sales Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: 'var(--slate-900)',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--slate-200)',
                }}
              >
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                closeCart();
                onOpenCheckout();
              }}
              className="btn btn-primary btn-block"
              style={{ padding: '0.75rem 1rem', fontSize: '0.9375rem' }}
            >
              Proceed to Checkout (${total.toFixed(2)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
