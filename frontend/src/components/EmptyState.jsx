import React from 'react';

export default function EmptyState({ icon, title, description, actionText, onAction }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--slate-300)',
        maxWidth: '480px',
        margin: '2rem auto',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--slate-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: 'var(--slate-500)',
          fontSize: '1.5rem',
        }}
      >
        {icon || '📦'}
      </div>
      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--slate-800)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginBottom: '1.5rem' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
}
