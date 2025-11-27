/**
 * 404 Not Found Page
 */

import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-bold text-primary mb-4">404</div>
        <h1 className="text-4xl font-bold text-dark mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          <i className="bi bi-house-door mr-2"></i>
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
