import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { validatePassword, validateUsername } from '../utils/validation';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    designation: 'Student',
    researchInterests: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Please provide both first and last name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      toast.error(usernameValidation.message);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message);
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.institution.trim()) {
      toast.error('Please provide your institution or university');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        researchInterests: formData.researchInterests.split(',').map(interest => interest.trim()).filter(Boolean)
      };

      const result = await register(payload);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div className="card shadow-sm" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div className="card-header text-center pb-2 pt-4" style={{ background: 'transparent', borderBottom: 'none' }}>
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
              marginBottom: 12
            }}>
              <i className={step === 1 ? "bi bi-person-plus-fill" : "bi bi-mortarboard-fill"} />
            </div>
            <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Create an account
            </h2>
            <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-2)', margin: 0 }}>
              Join the scholarly network on RESEARCH-HUB
            </p>

            {/* 2-Step Progress Indicator */}
            <div className="mt-4 mb-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span style={{ fontSize: 'var(--font-label)', fontWeight: 600, color: step === 1 ? 'var(--color-accent)' : 'var(--color-text-2)' }}>
                  1. Account Details
                </span>
                <span style={{ fontSize: 'var(--font-label)', fontWeight: 600, color: step === 2 ? 'var(--color-accent)' : 'var(--color-text-3)' }}>
                  2. Academic Profile
                </span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--color-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: step === 1 ? '50%' : '100%',
                  height: '100%',
                  background: 'var(--color-accent)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          <div className="card-body px-4 pb-4 pt-2">
            {step === 1 ? (
              <form noValidate onSubmit={handleNextStep}>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="form-group mb-2">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        First Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Jane"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group mb-2">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Last Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="form-group mb-2">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="name@university.edu"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group mb-2">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Username <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="janedoe"
                        pattern="[a-z0-9_.]+"
                        minLength="3"
                        maxLength="30"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="form-group mb-3">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Min. 8 characters"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group mb-3">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Confirm Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mt-2"
                  style={{ padding: '0.625rem 1rem', fontSize: 'var(--font-btn)', fontWeight: 600 }}
                >
                  Continue to Academic Profile <i className="bi bi-arrow-right ms-1" />
                </button>
              </form>
            ) : (
              <form noValidate onSubmit={handleSubmit}>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="form-group mb-2">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Institution / University <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Oxford University"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group mb-2">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="form-group mb-3">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Designation
                      </label>
                      <select
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="Student">Student</option>
                        <option value="Researcher">Researcher</option>
                        <option value="Professor">Professor</option>
                        <option value="Admin">Admin</option>
                        <option value="Guest">Guest</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group mb-3">
                      <label className="form-label" style={{ marginBottom: 4 }}>
                        Research Interests
                      </label>
                      <input
                        type="text"
                        name="researchInterests"
                        value={formData.researchInterests}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. AI, Robotics"
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setStep(1)}
                    style={{ flex: 1, padding: '0.625rem 1rem' }}
                  >
                    <i className="bi bi-arrow-left me-1" /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '0.625rem 1rem', fontSize: 'var(--font-btn)', fontWeight: 600 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Creating Account...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center mt-4">
              <p className="text-sm text-muted" style={{ margin: 0, fontSize: 'var(--font-small)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-accent)', textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;