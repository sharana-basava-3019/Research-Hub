import React, { useState, useEffect } from 'react';

/**
 * RevokeCollaborationModal
 * Minimalist pop-up confirmation dialog for:
 * 1. Project Owner removing members or revoking invitations (mode='revoke')
 * 2. Collaborators exiting/leaving a project collaboration with a reason (mode='exit')
 */
const RevokeCollaborationModal = ({
  isOpen,
  onClose,
  onConfirm,
  collaboration,
  mode = 'revoke', // 'revoke' | 'exit'
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isExitMode = mode === 'exit';

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  // Reset reason when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen || !collaboration) return null;

  const projectTitle = collaboration.project?.title || 'this project';
  const isAccepted = collaboration.status === 'Accepted';
  const targetUser = collaboration.receiver || collaboration.sender;
  const targetName = targetUser
    ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.name || 'this collaborator'
    : 'this collaborator';

  const handleConfirm = (e) => {
    e.preventDefault();
    onConfirm(reason.trim());
  };

  const accentColor = isExitMode ? '#ea580c' : '#ef4444';
  const accentHover = isExitMode ? '#c2410c' : '#dc2626';
  const badgeBg = isExitMode ? '#fff7ed' : '#fef2f2';
  const badgeBorder = isExitMode ? '#ffedd5' : '#fee2e2';

  return (
    <div
      className="rh-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1090,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'rhModalFade 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes rhModalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rhModalPop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .rh-minimal-input:focus {
          background-color: #ffffff !important;
          border-color: ${accentColor} !important;
          box-shadow: 0 0 0 3px ${isExitMode ? 'rgba(234, 88, 12, 0.12)' : 'rgba(239, 68, 68, 0.12)'} !important;
          outline: none !important;
        }
        .rh-btn-ghost:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .rh-btn-action:hover {
          background-color: ${accentHover} !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${isExitMode ? 'rgba(234, 88, 12, 0.25)' : 'rgba(239, 68, 68, 0.25)'} !important;
        }
        .rh-btn-action:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Centered Minimalist Pop-up Card */}
      <div
        className="rh-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '24px',
          animation: 'rhModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top-Right Minimal Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            fontSize: '1.1rem'
          }}
          className="rh-btn-ghost"
        >
          <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} />
        </button>

        {/* Minimalist Warning Icon Badge */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: badgeBg,
            border: `1px solid ${badgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            fontSize: '1.2rem',
            marginBottom: '16px'
          }}
        >
          <i className={isExitMode ? 'bi bi-box-arrow-right' : 'bi bi-person-x-fill'} />
        </div>

        {/* Header & Subtitle */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: '600',
            color: '#0f172a',
            marginBottom: '6px',
            letterSpacing: '-0.015em'
          }}
        >
          {isExitMode
            ? 'Exit Collaboration'
            : isAccepted
            ? 'Remove Collaborator'
            : 'Revoke Invitation'}
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            lineHeight: 1.5,
            marginBottom: '20px'
          }}
        >
          {isExitMode ? (
            <>
              Are you sure you want to exit from collaboration on <span style={{ color: '#0f172a', fontWeight: '500' }}>“{projectTitle}”</span>? You will be removed from the project team and forfeit collaborator access.
            </>
          ) : isAccepted ? (
            <>
              Are you sure you want to remove <span style={{ color: '#0f172a', fontWeight: '600' }}>{targetName}</span> from <span style={{ color: '#0f172a', fontWeight: '500' }}>“{projectTitle}”</span>? They will lose access to project files and collaborator permissions.
            </>
          ) : (
            <>
              Are you sure you want to revoke the pending invitation sent to <span style={{ color: '#0f172a', fontWeight: '600' }}>{targetName}</span> for <span style={{ color: '#0f172a', fontWeight: '500' }}>“{projectTitle}”</span>?
            </>
          )}
        </p>

        {/* Form Body */}
        <form onSubmit={handleConfirm}>
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}
            >
              <label
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  color: '#334155',
                  margin: 0
                }}
              >
                {isExitMode ? 'Reason for Exiting' : 'Reason'}
              </label>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Optional</span>
            </div>

            <textarea
              className="rh-minimal-input"
              rows="3"
              placeholder={
                isExitMode
                  ? 'Briefly let the project owner know why you are leaving...'
                  : 'Provide a brief reason for removal...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={300}
              disabled={loading}
              style={{
                width: '100%',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.875rem',
                color: '#0f172a',
                backgroundColor: isFocused ? '#ffffff' : '#f8fafc',
                border: '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
                resize: 'none',
                lineHeight: 1.45,
                boxSizing: 'border-box'
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginTop: '4px'
              }}
            >
              <span>
                {isExitMode
                  ? 'Project lead will receive this message'
                  : 'User will receive this note'}
              </span>
              <span>{reason.length}/300</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <button
              type="button"
              className="rh-btn-ghost"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: '1',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rh-btn-action"
              disabled={loading}
              style={{
                flex: '1.4',
                height: '40px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: accentColor,
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: `0 1px 2px ${isExitMode ? 'rgba(234, 88, 12, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                    style={{ width: '14px', height: '14px', borderWidth: '2px' }}
                  />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <i className={isExitMode ? 'bi bi-box-arrow-right' : 'bi bi-person-x'} style={{ fontSize: '1rem' }} />
                  <span>
                    {isExitMode
                      ? 'Exit Collaboration'
                      : isAccepted
                      ? 'Remove Member'
                      : 'Revoke Invite'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RevokeCollaborationModal;
