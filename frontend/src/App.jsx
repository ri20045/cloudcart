import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import ProductModal from './components/ProductModal';
import Toast from './components/Toast';
import { CartProvider } from './context/CartContext';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('products'); // 'products' | 'orders' | 'order-detail'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setCurrentPage('order-detail');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page !== 'order-detail') {
      setSelectedOrder(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <CartProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Navigation */}
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />

        {/* Main Content Pages */}
        <main style={{ flex: 1 }}>
          {currentPage === 'products' && (
            <ProductsPage
              onSelectProduct={handleSelectProduct}
              onToast={showToast}
            />
          )}

          {currentPage === 'orders' && (
            <OrdersPage
              onToast={showToast}
              onSelectOrder={handleSelectOrder}
            />
          )}

          {currentPage === 'order-detail' && (
            <OrderDetailPage
              order={selectedOrder}
              onBack={() => handleNavigate('orders')}
              onToast={showToast}
            />
          )}
        </main>

        {/* Modals & Overlays */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onToast={showToast}
          />
        )}

        <CartDrawer
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={(order) => {
            showToast(`Order ${order.orderId} placed successfully!`);
          }}
          onNavigateOrders={() => handleNavigate('orders')}
        />

        {/* Global Toast Notifications */}
        <Toast toasts={toasts} onDismiss={dismissToast} />

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            padding: '2.5rem 0',
            marginTop: 'auto',
          }}
        >
          <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--slate-900)' }}>CloudCart</span>
                <span className="navbar-badge-pill">Production Architecture MVP</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                Serverless E-Commerce Platform built with React, Vite, AWS Lambda (Python), API Gateway & DynamoDB.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                Backend: Stateless Python Lambda
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                Storage: Amazon DynamoDB
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></span>
                Hosting: Vercel Ready
              </span>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
