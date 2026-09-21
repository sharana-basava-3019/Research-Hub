import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';

/**
 * RevocationAlertBanner
 * Displays a top-bar warning headline whenever the logged-in user has
 * active/unread collaboration revocation notifications.
 */
const RevocationAlertBanner = () => {
  const { user } = useAuth();
  const [revocations, setRevocations] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const fetchRevocations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?limit=20');
      const notifications = res.data?.data?.notifications || [];
      const unreadRevocations = notifications.filter(
        (n) => (n.type === 'COLLABORATION_REVOKED' || n.type === 'COLLABORATOR_REMOVED') && !n.isRead
      );
      setRevocations(unreadRevocations);
    } catch (err) {
      // Silently catch in banner to not disrupt app
    }
  }, [user]);

  useEffect(() => {
    fetchRevocations();

    const socket = getSocket();
    if (!socket) return;

    // Listen to real-time socket events
    const handleCollaborationUpdate = (data) => {
      if (data?.type === 'COLLABORATION_REVOKED' || data?.type === 'COLLABORATOR_REMOVED') {
        fetchRevocations();
      }
    };

    const handleNewNotification = (notification) => {
      if (notification?.type === 'COLLABORATION_REVOKED' || notification?.type === 'COLLABORATOR_REMOVED') {
        fetchRevocations();
      }
    };

    socket.on('collaboration_update', handleCollaborationUpdate);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('collaboration_update', handleCollaborationUpdate);
      socket.off('new_notification', handleNewNotification);
    };
  }, [fetchRevocations]);

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setDismissedIds((prev) => new Set([...prev, id]));
      setRevocations((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setDismissedIds((prev) => new Set([...prev, id]));
    }
  };

  const activeAlerts = revocations.filter((n) => !dismissedIds.has(n._id));

  if (!user || activeAlerts.length === 0) return null;

  // Show the latest unread revocation alert
  const currentAlert = activeAlerts[0];

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#fef2f2',
        borderBottom: '2px solid #ef4444',
        color: '#991b1b',
        padding: '12px 20px',
        position: 'relative',
        zIndex: 990,
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.12)'
      }}
    >
      <div className="container d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-start gap-2.5">
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              fontSize: '1rem',
              flexShrink: 0,
              marginTop: '2px'
            }}
          >
            <i className="bi bi-exclamation-octagon-fill" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-danger text-white px-2 py-0.5" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                REVOKED / REMOVED
              </span>
              <strong style={{ fontSize: '0.92rem', color: '#7f1d1d' }}>
                {currentAlert.title}
              </strong>
            </div>
            <p className="mb-0 mt-0.5" style={{ fontSize: '0.86rem', color: '#991b1b', lineHeight: 1.45 }}>
              {currentAlert.message}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0 align-self-end align-self-md-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-danger fw-semibold"
            style={{ borderRadius: '6px', fontSize: '0.8rem', minHeight: '32px' }}
            onClick={() => handleAcknowledge(currentAlert._id)}
          >
            <i className="bi bi-check2-circle me-1" />
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevocationAlertBanner;
