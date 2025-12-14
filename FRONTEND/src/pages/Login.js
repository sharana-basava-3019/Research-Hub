import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-gray-600 mt-3">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="max-w-md w-full">
        <div className="card shadow-lg border-0">
          <div className="card-header text-center border-0 pb-0">
            <div className="mb-4">
              <i className="bi bi-mortarboard-fill text-6xl text-accent-color mb-3"></i>
            </div>
            <h2 className="text-3xl font-bold text-dark mb-2">Welcome Back</h2>
            <p className="text-gray-600">Login to your RESEARCH-HUB account</p>
          </div>

          <div className="card-body px-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group mb-4">
                <label className="form-label d-block mb-2" htmlFor="email">
                  <i className="bi bi-envelope me-2"></i>Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  className="form-control form-control-lg"
                  placeholder="your.email@university.edu"
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label d-block mb-2" htmlFor="password">
                  <i className="bi bi-lock me-2"></i>Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  className="form-control form-control-lg"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rememberMe" />
                  <label className="form-check-label small text-muted" htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                <a href="#" className="small text-primary text-decoration-none hover-underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="btn-niceschool-primary w-100 py-3 mb-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-muted mb-3">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary fw-medium text-decoration-none">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
