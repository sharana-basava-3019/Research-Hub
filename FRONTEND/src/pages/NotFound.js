import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="page-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="container" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          color: 'var(--color-text-3)',
          marginBottom: 20
        }}>
          <i className="bi bi-compass" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>404 — Page Not Found</h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-2)', marginBottom: 24, lineHeight: 1.6 }}>
          The requested research route or publication could not be located. It may have been relocated or archived.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link to="/" className="btn btn-primary btn-sm">
            <i className="bi bi-house me-1" />
            Home
          </Link>
          <Link to="/projects" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-search me-1" />
            Explore Projects
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
