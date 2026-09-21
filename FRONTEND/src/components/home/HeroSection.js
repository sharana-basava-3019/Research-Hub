import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const HeroSection = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="hp-hero">
      {/* Text side */}
      <div className="hp-hero-text">
        <div className="hp-hero-badge">
          <i className="bi bi-mortarboard-fill" />
          Academic Research Platform
        </div>

        <h1 className="hp-hero-title">
          {user
            ? <>Welcome back, <span>{user.firstName || user.name?.split(' ')[0] || 'Researcher'}</span></>
            : <>Your Workspace for <span>Academic Research</span></>}
        </h1>

        <p className="hp-hero-subtitle">
          {user
            ? 'Continue your research workflow — manage projects, verify papers, and collaborate with peers across institutions.'
            : 'A clean, information-rich research hub for scholars to discover literature, share datasets, track peer verifications, and build collaborative projects.'}
        </p>

        <div className="hp-hero-actions">
          {user ? (
            <>
              <button
                className="hp-btn-primary"
                onClick={() => navigate('/projects/create')}
              >
                <i className="bi bi-plus-lg" />
                New Project
              </button>
              <button
                className="hp-btn-outline"
                onClick={() => navigate('/projects')}
              >
                <i className="bi bi-compass" />
                Explore Projects
              </button>
              <button
                className="hp-btn-outline"
                onClick={() => navigate('/dashboard')}
              >
                <i className="bi bi-layout-sidebar-inset" />
                Open Dashboard
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="hp-btn-primary">
                <i className="bi bi-arrow-right-short" />
                Get Started
              </Link>
              <Link to="/projects" className="hp-btn-outline">
                <i className="bi bi-compass" />
                Explore Projects
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Illustration side */}
      <div className="hp-hero-visual">
        <div className="hp-hero-illustration">
          <i className="bi bi-journal-bookmark-fill" />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
