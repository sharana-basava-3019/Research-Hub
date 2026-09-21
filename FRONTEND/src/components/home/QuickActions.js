import React from 'react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  {
    icon: 'bi-folder-plus',
    label: 'Create Project',
    path: '/projects/create',
    authRequired: true,
  },
  {
    icon: 'bi-cloud-upload',
    label: 'Upload Document',
    path: '/upload',
    authRequired: true,
  },
  {
    icon: 'bi-shield-check',
    label: 'Check Plagiarism',
    path: '/plagiarism',
    authRequired: true,
  },
  {
    icon: 'bi-people',
    label: 'Join Collaboration',
    path: '/collaborations',
    authRequired: true,
  },
];

const QuickActions = ({ user }) => {
  const navigate = useNavigate();

  const handleClick = (action) => {
    if (action.authRequired && !user) {
      navigate('/login');
      return;
    }
    navigate(action.path);
  };

  return (
    <div>
      <div className="hp-section-row">
        <div>
          <h2>Quick Actions</h2>
          <p>Jump right into your next research task</p>
        </div>
      </div>

      <div className="hp-quick-grid">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            className="hp-quick-card"
            onClick={() => handleClick(action)}
            style={{ background: 'none', border: undefined }}
          >
            <div className="hp-quick-icon">
              <i className={`bi ${action.icon}`} />
            </div>
            <span className="hp-quick-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
