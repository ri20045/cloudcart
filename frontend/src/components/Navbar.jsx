import React from 'react';
import { useCart } from '../context/CartContext';

export default function Navbar({ currentPage, onNavigate }) {
  const { totalItems, openCart } = useCart();

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo / Brand */}
          <div
            onClick={() => onNavigate('products')}
            className="navbar-brand"
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 4px rgba(37,99,235,0.3)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/>
                <circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="navbar-brand-title">CloudCart</span>
                <span className="navbar-badge-pill">Serverless MVP</span>
              </div>
            </div>
          </div>

          {/* Nav Links & Actions */}
          <div className="navbar-links">
            <button
              onClick={() => onNavigate('products')}
              className={`nav-link ${currentPage === 'products' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
              <span>Catalog</span>
            </button>

            <button
              onClick={() => onNavigate('orders')}
              className={`nav-link ${currentPage === 'orders' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" x2="8" y1="13" y2="13"/>
                <line x1="16" x2="8" y1="17" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Orders</span>
            </button>

            {/* Shopping Cart Trigger */}
            <button onClick={openCart} className="cart-button" aria-label="Open Shopping Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/>
                <circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="cart-count-badge">{totalItems}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
