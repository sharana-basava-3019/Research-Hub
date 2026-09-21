import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

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
      navigate(from, { replace: true });
    }
  };

  if (authLoading || user) {
    return (
      <div className="auth-page">
        <div className="ds-loading">
          <div className="ds-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="max-w-md w-full">
        <div className="card shadow-sm">
          <div className="card-header text-center pb-0" style={{ background: 'transparent' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--color-accent-bg)',
              color: 'var(--color-accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              marginBottom: 16
            }}>
              <i className="bi bi-mortarboard-fill" />
            </div>
            <h2>Welcome back</h2>
            <p>Sign in to your RESEARCH-HUB account</p>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="name@university.edu"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rememberMe" />
                  <label className="form-check-label text-sm text-muted" htmlFor="rememberMe">
                    Remember for 30 days
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                style={{ padding: '0.625rem 1rem', fontSize: '0.9375rem' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-sm text-muted" style={{ margin: 0 }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ fontWeight: 600 }}>
                  Create an account
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
