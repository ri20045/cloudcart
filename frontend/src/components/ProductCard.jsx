import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onSelect, onToast }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsAdding(true);
    addToCart(product, 1);
    if (onToast) {
      onToast(`Added "${product.name}" to cart!`);
    }
    setTimeout(() => setIsAdding(false), 400);
  };

  return (
    <div
      className="card"
      onClick={() => onSelect(product)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
      }}
    >
      {/* Product Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '68%',
          backgroundColor: 'var(--slate-100)',
          overflow: 'hidden',
        }}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 300ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        />
        {/* Category Pill */}
        <span
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            color: '#ffffff',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {product.category || 'General'}
        </span>

        {/* Stock pill */}
        <span
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            backgroundColor: isOutOfStock
              ? '#ffe4e6'
              : isLowStock
              ? '#fef3c7'
              : '#ecfdf5',
            color: isOutOfStock
              ? '#9f1239'
              : isLowStock
              ? '#92400e'
              : '#065f46',
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${
              isOutOfStock ? '#fecdd3' : isLowStock ? '#fde68a' : '#a7f3d0'
            }`,
          }}
        >
          {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${stock} left` : 'In Stock'}
        </span>
      </div>

      {/* Card Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
          <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>★</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-800)' }}>
            {product.rating || '4.8'}
          </span>
          {product.reviewCount && (
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              ({product.reviewCount})
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1rem',
            lineHeight: 1.35,
            marginBottom: '0.5rem',
            color: 'var(--slate-900)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </h3>

        {/* Description snippet */}
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--slate-500)',
            lineHeight: 1.4,
            marginBottom: '1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.description}
        </p>

        {/* Footer: Price & Add to Cart */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--slate-100)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'block' }}>
              Price
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="btn btn-primary btn-sm"
            style={{
              padding: '0.5rem 0.875rem',
            }}
          >
            {isOutOfStock ? (
              'Sold Out'
            ) : isAdding ? (
              'Added ✓'
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
