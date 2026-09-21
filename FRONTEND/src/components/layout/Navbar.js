import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const res = await api.get('/notifications/unread/count');
          setUnreadCount(res.data?.data?.count || 0);
        } catch {
          // Ignore
        }
      };
      fetchUnread();

      const socket = getSocket();
      if (socket) {
        const handleNewNotification = (notification) => {
          setUnreadCount((prev) => prev + 1);
          toast.info(`🔔 ${notification.title}: ${notification.message}`, {
            onClick: () => navigate(notification.link || '/notifications')
          });
        };

        const handleCollabUpdate = () => {
          toast.info(`🤝 Collaboration update received!`);
        };

        socket.on('new_notification', handleNewNotification);
        socket.on('collaboration_update', handleCollabUpdate);

        return () => {
          socket.off('new_notification', handleNewNotification);
          socket.off('collaboration_update', handleCollabUpdate);
        };
      }
    } else {
      setUnreadCount(0);
    }
  }, [user, navigate]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const displayName = user ? (user.firstName || user.name || 'Account') : '';
  const avatarUrl = user?.profilePicture || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=EEF2FF&color=4F46E5`;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="flex items-center justify-between py-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2 text-decoration-none">
            <span style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--color-accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            <span className="text-2xl font-bold text-dark" style={{ letterSpacing: '-0.02em', lineHeight: 1 }}>
              RESEARCH<span className="text-primary">-HUB</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="rh-nav-desktop">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/projects" 
              className={`nav-link ${isActive('/projects') ? 'active' : ''}`}
            >
              Projects
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/collaborations" 
                  className={`nav-link ${isActive('/collaborations') ? 'active' : ''}`}
                >
                  Collaborations
                </Link>
                {user.designation === 'Professor' && (
                  <Link 
                    to="/verification-requests" 
                    className={`nav-link ${isActive('/verification-requests') ? 'active' : ''}`}
                  >
                    <i className="bi bi-patch-check me-1" />
                    Verify
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <i className="bi bi-shield-lock me-1" />
                    Admin
                  </Link>
                )}

                {/* Real-time Notification Bell */}
                <Link
                  to="/notifications"
                  className="nav-link relative"
                  title="Notifications"
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  <i className="bi bi-bell" style={{ fontSize: '1.05rem' }} />
                  {unreadCount > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: 'var(--color-danger)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        borderRadius: 999,
                        minWidth: 16,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px'
                      }}
                      className="animate-pulse"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                
                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="nav-link flex items-center space-x-2"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-expanded={isDropdownOpen}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <img 
                      src={avatarUrl} 
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=EEF2FF&color=4F46E5`;
                      }}
                    />
                    <span className="font-medium text-sm">{displayName}</span>
                    <i className="bi bi-chevron-down text-xs text-muted" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 100,
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 'var(--font-label, 0.875rem)', fontWeight: 600, color: 'var(--color-text)' }}>{displayName}</div>
                        <div style={{ fontSize: 'var(--font-small, 0.84375rem)', color: 'var(--color-text-3)' }}>{user.email}</div>
                      </div>
                      <Link 
                        to="/profile" 
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <i className="bi bi-person mr-2" /> Profile
                      </Link>
                      <Link 
                        to="/projects/create" 
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <i className="bi bi-plus-circle mr-2" /> New Project
                      </Link>
                      <Link 
                        to="/plagiarism" 
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <i className="bi bi-shield-check mr-2" /> Plagiarism Check
                      </Link>
                      <Link 
                        to="/settings" 
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <i className="bi bi-gear mr-2" /> Settings
                      </Link>
                      <hr className="my-1" style={{ margin: '4px 0', borderTop: '1px solid var(--color-border)' }} />
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        <i className="bi bi-box-arrow-right mr-2" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ms-2">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="rh-nav-mobile-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >
            <i className={`bi ${isMenuOpen ? 'bi-x-lg' : 'bi-list'}`} />
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="rh-nav-mobile-drawer">
            <div className="flex flex-col space-y-1">
              <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <i className="bi bi-house me-2" /> Home
              </Link>
              <Link to="/projects" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <i className="bi bi-grid me-2" /> Projects
              </Link>
              
              {user ? (
                <>
                  <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <i className="bi bi-speedometer2 me-2" /> Dashboard
                  </Link>
                  <Link to="/collaborations" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <i className="bi bi-people me-2" /> Collaborations
                  </Link>
                  <Link to="/notifications" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <i className="bi bi-bell me-2" /> Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                  <Link to="/projects/create" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <i className="bi bi-plus-circle me-2" /> New Project
                  </Link>
                  <Link to="/plagiarism" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <i className="bi bi-shield-check me-2" /> Plagiarism Checker
                  </Link>
                  <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <i className="bi bi-person me-2" /> Profile
                  </Link>
                  <Link to="/settings" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <i className="bi bi-gear me-2" /> Settings
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                      <i className="bi bi-shield-lock me-2" /> Admin Panel
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="text-left text-red-600 px-3 py-2 text-sm mt-2 font-medium"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <i className="bi bi-box-arrow-right me-2" /> Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-3 border-t border-gray-100 mt-2">
                  <Link to="/login" className="btn btn-outline-primary btn-sm w-full" onClick={() => setIsMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm w-full" onClick={() => setIsMenuOpen(false)}>
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
