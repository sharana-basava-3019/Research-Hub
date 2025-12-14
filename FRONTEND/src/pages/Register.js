import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/NiceSchoolGlobal.css';

const Register = () => {
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
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    const usernameRegex = /^[a-z0-9_.]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error('Username can only contain lowercase letters, numbers, dots, and underscores');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        ...formData,
        researchInterests: formData.researchInterests.split(',').map(interest => interest.trim())
      });

      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Creating your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="max-w-2xl w-100">
        <div className="card shadow-lg border-0">
          <div className="card-header text-center border-0 pb-0">
            <div className="mb-4">
              <i className="bi bi-person-plus-fill text-6xl text-accent-color mb-3"></i>
            </div>
            <h2 className="text-3xl font-bold text-dark mb-2">Create Account</h2>
            <p className="text-gray-600">Join RESEARCH-HUB community</p>
          </div>

          <div className="card-body px-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control form-control-lg"
                  placeholder="your.email@university.edu"
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-control form-control-lg"
                  placeholder="Choose a unique username (lowercase, numbers, dots, underscores)"
                  pattern="[a-z0-9_.]+"
                  minLength="3"
                  maxLength="30"
                  required
                />
                <small className="text-muted">
                  Username must be 3-30 characters and can only contain lowercase letters, numbers, dots, and underscores
                </small>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      minLength="6"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="form-control form-control-lg"
                  placeholder="e.g., Stanford University"
                  required
                />
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Designation</label>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                    >
                      <option>Admin</option>
                      <option>Professor</option>
                      <option>Researcher</option>
                      <option>Student</option>
                      <option>Guest</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Research Interests (comma-separated)</label>
                <input
                  type="text"
                  name="researchInterests"
                  value={formData.researchInterests}
                  onChange={handleChange}
                  className="form-control form-control-lg"
                  placeholder="e.g., Machine Learning, AI, Data Science"
                />
              </div>

              <div className="d-grid gap-2 mt-4">
                <button
                  type="submit"
                  className="btn-niceschool-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-4">
              <p className="text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary fw-medium text-decoration-none">
                  Login here
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