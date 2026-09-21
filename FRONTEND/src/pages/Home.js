import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import '../styles/HomeDesign.css';

import HeroSection       from '../components/home/HeroSection';
import QuickActions      from '../components/home/QuickActions';
import TrendingTopics    from '../components/home/TrendingTopics';
import FeaturedProjects  from '../components/home/FeaturedProjects';
import ActiveResearchers from '../components/home/ActiveResearchers';
import ActivityFeed      from '../components/home/ActivityFeed';
import PlagiarismInsight from '../components/home/PlagiarismInsight';
import PlatformStats     from '../components/home/PlatformStats';

const MOCK_PROJECTS = [
  {
    _id: 'home-mock1',
    title: 'Machine Learning in Medicine',
    category: 'Artificial Intelligence',
    keywords: ['ML', 'Healthcare', 'Diagnosis'],
    status: 'active',
    collaborators: [],
  },
  {
    _id: 'home-mock2',
    title: 'Climate Change Modeling',
    category: 'Environmental Science',
    keywords: ['Climate', 'Prediction', 'Modeling'],
    status: 'recruiting',
    collaborators: [],
  },
  {
    _id: 'home-mock3',
    title: 'Blockchain Technology Research',
    category: 'Computer Science',
    keywords: ['Blockchain', 'Security', 'Scalability'],
    status: 'active',
    collaborators: [],
  },
];

const Home = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats]       = useState({ users: 0, projects: 0, collaborations: 0, documents: 0 });

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects?limit=6');
      const data = res.data?.data?.projects || res.data?.projects || res.data || [];
      setProjects(Array.isArray(data) ? data : MOCK_PROJECTS);
    } catch {
      setProjects(MOCK_PROJECTS);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/platform-stats');
      const d = res.data?.data || res.data || {};
      setStats({
        users:          d.totalUsers          || d.users          || 0,
        projects:       d.totalProjects       || d.projects       || 0,
        collaborations: d.totalCollaborations || d.collaborations || 0,
        documents:      d.totalDocuments      || d.documents      || 0,
      });
    } catch {
      /* keep zeros — PlatformStats handles gracefully */
    }
  };

  return (
    <div className="hp-page">
      <div className="hp-container">

        {/* Section 1: Hero */}
        <div className="hp-section" style={{ paddingBottom: 0 }}>
          <HeroSection user={user} />
        </div>

        {/* Section 2: Platform Statistics (Social Proof) */}
        <div className="hp-section" style={{ paddingTop: 0, paddingBottom: 24 }}>
          <PlatformStats stats={stats} />
        </div>

        <div className="hp-divider" />

        {/* Section 3: Quick Actions */}
        <div className="hp-section">
          <QuickActions user={user} />
        </div>

        <div className="hp-divider" />

        {/* Section 4: Trending Topics */}
        <div className="hp-section">
          <TrendingTopics />
        </div>

        <div className="hp-divider" />

        {/* Section 5: Featured Projects */}
        <div className="hp-section">
          <FeaturedProjects projects={projects} />
        </div>

        <div className="hp-divider" />

        {/* Section 6: Active Researchers */}
        <div className="hp-section">
          <ActiveResearchers />
        </div>

        <div className="hp-divider" />

        {/* Section 7: Activity Feed */}
        <div className="hp-section">
          <ActivityFeed maxItems={8} />
        </div>

        <div className="hp-divider" />

        {/* Section 8: Plagiarism Insight */}
        <div className="hp-section">
          <PlagiarismInsight />
        </div>

      </div>
    </div>
  );
};

export default Home;