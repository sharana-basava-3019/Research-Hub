import React, { useEffect, useRef, useState } from 'react';

const STAT_META = [
  { key: 'projects',       label: 'Total Projects',    icon: 'bi-folder2-open', fallback: 0 },
  { key: 'users',          label: 'Researchers',       icon: 'bi-people',       fallback: 0 },
  { key: 'documents',      label: 'Documents',         icon: 'bi-file-earmark-text', fallback: 0 },
  { key: 'collaborations', label: 'Collaborations',    icon: 'bi-diagram-3',    fallback: 0 },
];

const useCountUp = (target, duration = 1400, active = true) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active || target === 0) {
      setCount(target);
      return;
    }
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active]);

  return count;
};

const fmt = (n) => {
  if (n === null || n === undefined) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};

const StatCard = ({ meta, value, animate }) => {
  const count = useCountUp(value || meta.fallback, 1400, animate);
  return (
    <div className="hp-stat-card">
      <div className="hp-stat-icon-box">
        <i className={`bi ${meta.icon}`} />
      </div>
      <div>
        <p className="hp-stat-number">{fmt(count)}</p>
        <p className="hp-stat-label">{meta.label}</p>
      </div>
    </div>
  );
};

const PlatformStats = ({ stats = {} }) => {
  const [animate, setAnimate] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimate(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef}>
      <div className="hp-section-row">
        <div>
          <h2>Platform Statistics</h2>
          <p>Numbers that drive the research community</p>
        </div>
      </div>

      <div className="hp-stats-grid">
        {STAT_META.map((meta) => (
          <StatCard
            key={meta.key}
            meta={meta}
            value={stats[meta.key] ?? 0}
            animate={animate}
          />
        ))}
      </div>
    </div>
  );
};

export default PlatformStats;
