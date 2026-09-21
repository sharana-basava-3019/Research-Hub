import React from 'react';
import { Link } from 'react-router-dom';

const CIRCUMFERENCE = 2 * Math.PI * 32; // radius = 32

const INSIGHT_CARDS = [
  {
    key:      'clear',
    label:    'Clear',
    sublabel: '0% – 10% similarity',
    percent:  5,
    ringCls:  'hp-plag-ring-clear',
    statusCls:'hp-plag-status-clear',
    fill:     '#16A34A',
  },
  {
    key:      'low',
    label:    'Low Risk',
    sublabel: '11% – 30% similarity',
    percent:  22,
    ringCls:  'hp-plag-ring-low',
    statusCls:'hp-plag-status-low',
    fill:     '#D97706',
  },
  {
    key:      'moderate',
    label:    'Moderate',
    sublabel: '31% – 60% similarity',
    percent:  45,
    ringCls:  'hp-plag-ring-mod',
    statusCls:'hp-plag-status-mod',
    fill:     '#EA580C',
  },
  {
    key:      'high',
    label:    'High Risk',
    sublabel: '61%+ similarity',
    percent:  70,
    ringCls:  'hp-plag-ring-high',
    statusCls:'hp-plag-status-high',
    fill:     '#DC2626',
  },
];

const Ring = ({ percent, fill }) => {
  const dashArray = (percent / 100) * CIRCUMFERENCE;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle
        className="hp-plag-ring-track"
        cx="38" cy="38" r="32"
      />
      <circle
        className="hp-plag-ring-fill"
        cx="38" cy="38" r="32"
        stroke={fill}
        strokeDasharray={`${dashArray} ${CIRCUMFERENCE}`}
        strokeLinecap="round"
        transform="rotate(-90 38 38)"
      />
    </svg>
  );
};

const PlagiarismInsight = () => (
  <div>
    <div className="hp-section-row">
      <div>
        <h2>Plagiarism Insight</h2>
        <p>Verification sensitivity tiers and similarity baselines</p>
      </div>
      <Link to="/plagiarism" className="hp-view-all">
        Run check <i className="bi bi-arrow-right" />
      </Link>
    </div>

    <div className="hp-plagiarism-grid">
      {INSIGHT_CARDS.map((card) => (
        <div className="hp-plag-card" key={card.key}>
          <div className="hp-plag-ring">
            <Ring percent={card.percent} fill={card.fill} />
            <div className="hp-plag-ring-center">{card.percent}%</div>
          </div>

          <p className="hp-plag-label">{card.label}</p>
          <p className="hp-plag-sublabel">{card.sublabel}</p>

          <span className={`hp-plag-status ${card.statusCls}`}>
            <span className="hp-status-dot" />
            {card.label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default PlagiarismInsight;
