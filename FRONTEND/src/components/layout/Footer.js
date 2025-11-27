/**
 * Footer Component
 * Footer section (NiceSchool design)
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h5 className="text-xl font-bold mb-4 text-white">RESEARCH-HUB</h5>
            <p className="text-gray-400">
              A comprehensive platform for university research collaboration and analytics.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="bi bi-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="bi bi-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="bi bi-linkedin text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <i className="bi bi-github text-xl"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h6 className="text-lg font-semibold mb-4 text-white">Quick Links</h6>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-gray-400 hover:text-primary transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-gray-400 hover:text-primary transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h6 className="text-lg font-semibold mb-4 text-white">Resources</h6>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h6 className="text-lg font-semibold mb-4 text-white">Contact</h6>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <i className="bi bi-geo-alt-fill mr-2 mt-1"></i>
                <span>123 University Ave, City, Country</span>
              </li>
              <li className="flex items-center">
                <i className="bi bi-envelope-fill mr-2"></i>
                <a href="mailto:info@research-hub.edu" className="hover:text-primary">
                  info@research-hub.edu
                </a>
              </li>
              <li className="flex items-center">
                <i className="bi bi-telephone-fill mr-2"></i>
                <a href="tel:+1234567890" className="hover:text-primary">
                  +1 (234) 567-890
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>
            &copy; {currentYear} RESEARCH-HUB. All rights reserved. | {' '}
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link> | {' '}
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          </p>
          <p className="mt-2 text-sm">
            Built with <i className="bi bi-heart-fill text-red-500"></i> for academic research collaboration
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
