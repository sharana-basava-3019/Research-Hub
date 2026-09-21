import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const ACRONYMS = new Set(['AI', 'ML', 'NLP', 'CRISPR', 'MCA', 'ECE', 'CSE', 'IT', 'PHD', 'IOT', 'DNA', 'RNA']);

export const formatBadgeText = (text = '') => {
  if (!text) return '-';
  const trimmed = text.trim();
  if (trimmed === '-' || trimmed === '—') {
    return '-';
  }
  if (ACRONYMS.has(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getExpertise = (user) => {
  let list = [];
  if (Array.isArray(user.expertise) && user.expertise.length > 0) {
    list = user.expertise;
  } else if (Array.isArray(user.researchInterests) && user.researchInterests.length > 0) {
    list = user.researchInterests;
  } else if (Array.isArray(user.skills) && user.skills.length > 0) {
    list = user.skills;
  } else if (user.researchArea) {
    list = [user.researchArea];
  }

  const valid = list
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(item => item.length > 0);

  if (valid.length > 0) {
    return valid.slice(0, 2);
  }
  return ['-'];
};

const ActiveResearchers = () => {
  const navigate = useNavigate();
  const [researchers, setResearchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/auth/active-researchers?limit=8');
        const data = res.data?.data?.users || res.data?.users || res.data || [];
        setResearchers(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch {
        setResearchers([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="hp-section-row">
          <div><h2>Active Researchers</h2></div>
        </div>
        <div className="hp-researchers-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="hp-researcher-card" style={{ opacity: 0.5 }}>
              <div className="hp-researcher-avatar" style={{ width: 56, height: 56 }} />
              <div style={{ height: 14, width: 100, background: 'var(--hp-border)', borderRadius: 4 }} />
              <div style={{ height: 11, width: 72, background: 'var(--hp-border)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (researchers.length === 0) {
    return (
      <div>
        <div className="hp-section-row">
          <div>
            <h2>Active Researchers</h2>
            <p>Connect with fellow researchers</p>
          </div>
        </div>
        <div className="hp-researchers-grid">
          <div className="hp-empty" style={{ gridColumn: '1/-1' }}>
            <div className="hp-empty-icon"><i className="bi bi-people" /></div>
            <p>No active researcher profiles found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="hp-section-row">
        <div>
          <h2>Active Researchers</h2>
          <p>Collaborate with scholars across institutions</p>
        </div>
        <Link to="/projects" className="hp-view-all">
          Browse Projects <i className="bi bi-arrow-right" />
        </Link>
      </div>

      <div className="hp-researchers-grid">
        {researchers.map((user) => {
          const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Researcher';
          const expertise = getExpertise(user);
          const projectCount = user.projects?.length ?? user.projectCount ?? 0;

          return (
            <div className="hp-researcher-card" key={user._id || user.id}>
              <div className="hp-researcher-avatar">
                {user.avatar || user.profileImage || user.profilePicture
                  ? <img
                      src={user.avatar || user.profileImage || user.profilePicture}
                      alt={name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EEF2FF&color=4F46E5`; }}
                    />
                  : getInitials(name)
                }
              </div>

              <p className="hp-researcher-name" title={name}>{name}</p>
              <p className="hp-researcher-dept" title={user.department || user.university || user.institution || user.designation || 'Researcher'}>
                {user.department || user.university || user.institution || user.designation || 'Researcher'}
              </p>

              <div className="hp-researcher-tags">
                {expertise.map((tag, idx) => (
                  <span className="hp-researcher-tag" key={`${tag}-${idx}`}>{formatBadgeText(tag)}</span>
                ))}
              </div>

              <span className="hp-researcher-projects">
                <i className="bi bi-folder2" /> {projectCount} project{projectCount !== 1 ? 's' : ''}
              </span>

              <button
                className="hp-researcher-connect"
                onClick={() => navigate('/send-collaboration-request', { state: { targetUser: user } })}
              >
                <i className="bi bi-person-plus" />
                Collaborate
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveResearchers;
