import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductModal({ product, onClose, onToast }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0;
  const price = Number(product.price) || 0;

  const handleAdd = () => {
    addToCart(product, quantity);
    if (onToast) {
      onToast(`Added ${quantity} × "${product.name}" to cart`);
    }
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--slate-100)',
            border: 'none',
            borderRadius: '50%',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--slate-600)',
            fontSize: '1.25rem',
            zIndex: 10,
          }}
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Modal Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {/* Image */}
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: 'var(--slate-100)',
              height: '280px',
            }}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)' }}>
                {product.category}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#f59e0b', fontWeight: 600 }}>
                ★ {product.rating || '4.8'}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
              {product.name}
            </h2>

            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {product.description}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Price</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                ${price.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8125rem', color: isOutOfStock ? '#e11d48' : '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
                {isOutOfStock ? 'Currently Out of Stock' : `${stock} units available`}
              </div>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--slate-300)', borderRadius: 'var(--radius-sm)' }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="btn btn-primary btn-block"
              style={{ marginTop: 'auto' }}
            >
              {isOutOfStock ? 'Out of Stock' : `Add to Cart • $${(price * quantity).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
