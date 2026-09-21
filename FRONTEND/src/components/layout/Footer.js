import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--color-surface-2)',
      borderTop: '1px solid var(--color-border)',
      padding: '48px 0 24px',
      color: 'var(--color-text-2)',
      fontSize: '0.875rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div className="flex items-center space-x-2 mb-2">
              <span style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'var(--color-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.75rem'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </span>
              <span style={{ fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                RESEARCH-HUB
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-small, 0.84375rem)', color: 'var(--color-text-3)', lineHeight: 1.6, margin: 0 }}>
              An open collaboration and verification platform designed for academic researchers, professors, and students.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h6 style={{ fontSize: 'var(--font-label, 0.875rem)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: 12 }}>
              Platform
            </h6>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><Link to="/" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>Home</Link></li>
              <li><Link to="/projects" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>Browse Projects</Link></li>
              <li><Link to="/dashboard" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>Dashboard</Link></li>
              <li><Link to="/plagiarism" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>Plagiarism Checker</Link></li>
            </ul>
          </div>

          {/* Academic Features */}
          <div>
            <h6 style={{ fontSize: 'var(--font-label, 0.875rem)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: 12 }}>
              Collaboration
            </h6>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><Link to="/collaborations" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>Active Collaborations</Link></li>
              <li><Link to="/verification-requests" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>Professor Verification</Link></li>
              <li><Link to="/projects/create" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>Publish Research</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 'var(--font-small, 0.84375rem)',
          color: 'var(--color-text-3)'
        }}>
          <div>
            &copy; {currentYear} RESEARCH-HUB. Built for academic research collaboration.
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/projects" style={{ color: 'var(--color-text-3)' }}>Explore Catalog</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
