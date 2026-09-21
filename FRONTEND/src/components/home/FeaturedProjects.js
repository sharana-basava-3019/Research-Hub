import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatBadgeText } from './ActiveResearchers';

const statusConfig = {
  active:      { label: 'Active',      cls: 'hp-status-active' },
  recruiting:  { label: 'Recruiting',  cls: 'hp-status-recruiting' },
  completed:   { label: 'Completed',   cls: 'hp-status-active' },
  'in progress': { label: 'In Progress', cls: 'hp-status-active' },
  planning:    { label: 'Planning',    cls: 'hp-status-recruiting' },
  default:     { label: 'Ongoing',     cls: 'hp-status-active' },
};

const getStatus = (project) => {
  const key = (project.status || '').toLowerCase();
  return statusConfig[key] || statusConfig.default;
};

const getKeywords = (project) => {
  if (Array.isArray(project.keywords)) return project.keywords.slice(0, 3).map(formatBadgeText);
  if (typeof project.keywords === 'string')
    return project.keywords.split(',').map((k) => formatBadgeText(k.trim())).filter(Boolean).slice(0, 3);
  return [];
};

const FeaturedProjects = ({ projects = [] }) => {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div>
        <div className="hp-section-row">
          <div>
            <h2>Featured Projects</h2>
            <p>Highlighted research from the community</p>
          </div>
        </div>
        <div className="hp-projects-grid">
          <div className="hp-empty" style={{ gridColumn: '1 / -1' }}>
            <div className="hp-empty-icon"><i className="bi bi-folder2-open" /></div>
            <p>No projects to display yet.</p>
            <button className="hp-btn-primary" onClick={() => navigate('/projects/create')}>
              <i className="bi bi-plus-lg" />
              Create First Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="hp-section-row">
        <div>
          <h2>Featured Projects</h2>
          <p>Highlighted research initiatives from the scholarly community</p>
        </div>
        <Link to="/projects" className="hp-view-all">
          View all <i className="bi bi-arrow-right" />
        </Link>
      </div>

      <div className="hp-projects-grid">
        {projects.slice(0, 6).map((project) => {
          const status = getStatus(project);
          const keywords = getKeywords(project);
          const collabs = project.collaborators?.length ?? project.collaboratorCount ?? 0;

          return (
            <div className="hp-project-card" key={project._id || project.id}>
              <div className="hp-project-area">
                <i className="bi bi-folder" />
                {project.category || project.researchArea || 'Research'}
              </div>

              <h3 className="hp-project-title">{project.title}</h3>

              {keywords.length > 0 && (
                <div className="hp-project-keywords">
                  {keywords.map((kw) => (
                    <span className="hp-keyword-tag" key={kw}>{kw}</span>
                  ))}
                </div>
              )}

              <div className="hp-project-meta">
                <span className="hp-project-meta-item">
                  <i className="bi bi-people" />
                  {collabs} collaborator{collabs !== 1 ? 's' : ''}
                </span>
                <span className={`hp-status-badge ${status.cls}`}>
                  <span className="hp-status-dot" />
                  {status.label}
                </span>
              </div>

              <button
                className="hp-btn-link"
                onClick={() => navigate(`/projects/${project._id || project.id}`)}
              >
                View Details <i className="bi bi-arrow-right" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedProjects;
