import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_TOPICS = [
  'Machine Learning',
  'Climate Change',
  'Quantum Computing',
  'Bioinformatics',
  'Neural Networks',
  'CRISPR Gene Editing',
  'Renewable Energy',
  'Computer Vision',
  'NLP & Language Models',
  'Blockchain',
  'Epidemiology',
  'Robotics',
  'Drug Discovery',
  'Dark Matter',
  'Graph Databases',
  'Federated Learning',
  'Nanomaterials',
  'Behavioral Economics',
];

const TrendingTopics = ({ topics = DEFAULT_TOPICS, onTopicClick }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  const handleClick = (topic) => {
    setActive(topic);
    if (onTopicClick) {
      onTopicClick(topic);
    } else {
      navigate(`/projects?search=${encodeURIComponent(topic)}`);
    }
  };

  return (
    <div>
      <div className="hp-section-row">
        <div>
          <h2>Trending Topics</h2>
          <p>Explore the most active research areas on the platform</p>
        </div>
      </div>

      <div className="hp-topics-grid">
        {topics.map((topic) => (
          <button
            key={topic}
            className="hp-topic-pill"
            onClick={() => handleClick(topic)}
            style={{
              background: active === topic ? 'var(--hp-primary)' : undefined,
              color: active === topic ? '#fff' : undefined,
              borderColor: active === topic ? 'var(--hp-primary)' : undefined,
              fontFamily: 'var(--hp-font)',
            }}
          >
            <span className="hp-topic-dot" />
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
