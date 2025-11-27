/**
 * Navbar Component
 * Main navigation bar (NiceSchool design)
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <i className="bi bi-mortarboard-fill text-3xl text-primary"></i>
            <span className="text-2xl font-bold text-dark">
              RESEARCH<span className="text-primary">-HUB</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
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
            <Link 
              to="/events" 
              className={`nav-link ${isActive('/events') ? 'active' : ''}`}
            >
              Events
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
                <Link 
                  to="/analytics" 
                  className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
                >
                  Analytics
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <i className="bi bi-people-fill me-1"></i>
                    Manage Users
                  </Link>
                )}
                
                {/* User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 nav-link relative">
                    <img 
                      src={user.profilePicture || '/default-avatar.jpg'} 
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span>{user.firstName}</span>
                    <i className="bi bi-chevron-down text-sm"></i>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <i className="bi bi-person mr-2"></i> Profile
                    </Link>
                    <Link 
                      to="/notifications" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <i className="bi bi-bell mr-2"></i> Notifications
                    </Link>
                    <Link 
                      to="/projects/create" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <i className="bi bi-plus-circle mr-2"></i> New Project
                    </Link>
                    <Link 
                      to="/settings" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <i className="bi bi-gear mr-2"></i> Settings
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      <i className="bi bi-box-arrow-right mr-2"></i> Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-2xl text-dark"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/projects" className="nav-link">Projects</Link>
              <Link to="/events" className="nav-link">Events</Link>
              
              {user ? (
                <>
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/collaborations" className="nav-link">Collaborations</Link>
                  <Link to="/analytics" className="nav-link">Analytics</Link>
                  <Link to="/notifications" className="nav-link">Notifications</Link>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <Link to="/settings" className="nav-link">Settings</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="nav-link">
                      <i className="bi bi-people-fill me-1"></i>
                      Manage Users
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="text-left text-red-600 px-4 py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Login</Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
