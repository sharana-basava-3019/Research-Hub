import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.isEmailVerified || dismissed) {
    return null;
  }

  const resendVerificationEmail = async () => {
    try {
      setSending(true);
      await api.post('/auth/resend-verification');
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="alert alert-warning alert-dismissible fade show mb-0" role="alert" style={{ borderRadius: 0 }}>
      <div className="container d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <span>
            <strong>Email verification required.</strong> Please verify your email address to access all features.
          </span>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={resendVerificationEmail}
            disabled={sending}
          >
            {sending ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Sending...
              </>
            ) : (
              <>
                <i className="bi bi-envelope me-1"></i>
                Resend Email
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-close"
            onClick={() => setDismissed(true)}
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
