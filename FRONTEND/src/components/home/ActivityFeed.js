import React, { useEffect, useState } from 'react';

const FALLBACK_FEED = [
  { id: 1, icon: 'bi-folder-plus',   type: 'default', action: 'New project "Neural Networks in Healthcare" was created',      time: '2 min ago' },
  { id: 2, icon: 'bi-people',        type: 'success',  action: 'Dr. Sarah Chen joined the Climate Research collaboration',      time: '8 min ago' },
  { id: 3, icon: 'bi-shield-check',  type: 'success',  action: 'Plagiarism check completed — document scored 4% similarity',    time: '15 min ago' },
  { id: 4, icon: 'bi-cloud-upload',  type: 'default',  action: 'Research paper "Quantum Entanglement" uploaded by Prof. Kim',   time: '31 min ago' },
  { id: 5, icon: 'bi-chat-dots',     type: 'default',  action: 'New comment added to "Bioinformatics Data Pipeline" project',   time: '47 min ago' },
  { id: 6, icon: 'bi-exclamation-triangle', type: 'warning', action: 'High similarity flagged in submitted thesis draft',       time: '1 hr ago' },
  { id: 7, icon: 'bi-award',         type: 'success',  action: 'Project "Renewable Energy Storage" received 5 new followers',   time: '2 hr ago' },
  { id: 8, icon: 'bi-person-check',  type: 'success',  action: 'User verification approved for Dr. James Okonkwo',              time: '3 hr ago' },
];

const ActivityFeed = ({ maxItems = 8 }) => {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    // In production, replace with API call: api.get('/activity/recent?limit=8')
    setFeed(FALLBACK_FEED.slice(0, maxItems));
  }, [maxItems]);

  return (
    <div>
      <div className="hp-section-row">
        <div>
          <h2>Real-Time Activity</h2>
          <p>Recent actions across the platform</p>
        </div>
      </div>

      <div className="hp-feed-card">
        {feed.map((item) => (
          <div className="hp-feed-item" key={item.id}>
            <div className={`hp-feed-icon ${item.type || ''}`}>
              <i className={`bi ${item.icon}`} />
            </div>
            <div className="hp-feed-content">
              <p className="hp-feed-action">{item.action}</p>
              <p className="hp-feed-time">
                <i className="bi bi-clock" style={{ marginRight: 4, fontSize: '0.7rem' }} />
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
