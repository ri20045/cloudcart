import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Audio', 'Accessories', 'Computers', 'Wearables'];

export default function ProductsPage({ onSelectProduct, onToast }) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getProducts({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setProducts(data.products || []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            color: '#bfdbfe',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
          }}
        >
          AWS API Gateway • Lambda • DynamoDB
        </span>
        <h1 style={{ color: '#ffffff', fontSize: '2rem', lineHeight: 1.2 }}>
          Serverless E-Commerce & Order Management
        </h1>
        <p style={{ color: '#cbd5e1', maxWidth: '640px', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          Explore high-performance tech essentials backed by AWS Lambda stateless compute and Amazon DynamoDB on-demand persistence.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search products by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--slate-400)',
              }}
            >
              🔍
            </span>
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="card"
              style={{
                height: '380px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                opacity: 0.7,
              }}
            >
              <div style={{ height: '200px', backgroundColor: 'var(--slate-200)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ height: '16px', width: '40%', backgroundColor: 'var(--slate-200)' }} />
                <div style={{ height: '20px', width: '80%', backgroundColor: 'var(--slate-200)' }} />
                <div style={{ height: '14px', width: '95%', backgroundColor: 'var(--slate-200)' }} />
              </div>
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
          <h3 style={{ color: '#9f1239', marginBottom: '0.5rem' }}>Could Not Connect to Backend</h3>
          <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {errorMessage}
          </p>
          <button onClick={fetchProducts} className="btn btn-primary btn-sm">
            Retry Connection
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !errorMessage && products.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              onSelect={onSelectProduct}
              onToast={onToast}
            />
          ))}
        </div>
      )}

      {/* No products found */}
      {!isLoading && !errorMessage && products.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No products matched your query"
          description="Try selecting another category or searching with different keywords."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedCategory('All');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}
