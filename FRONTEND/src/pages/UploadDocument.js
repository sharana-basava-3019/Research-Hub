import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FileUpload from '../components/FileUpload';
import { toast } from 'react-toastify';

const UploadDocument = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (user) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await api.get('/projects', { params: { owner: user._id, limit: 100 } });
      const list = res.data.data?.projects || res.data.data || [];
      setProjects(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your projects.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleUploadSuccess = () => {
    toast.success('File uploaded successfully!');
    if (selectedProject) {
      navigate(`/projects/${selectedProject._id}`);
    }
  };

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '760px' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
          >
            <i className="bi bi-arrow-left" /> Back
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            <i className="bi bi-cloud-upload" style={{ color: '#3b82f6', marginRight: '0.5rem' }} />
            Upload Document
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.4rem', marginBottom: 0 }}>
            Select one of your projects, then upload files to it.
          </p>
        </div>

        {/* Step 1 — Select Project */}
        <div className="card card-static" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <i className="bi bi-folder2-open text-primary" />
            <span style={{ marginLeft: '0.4rem' }}>Step 1 — Select a Project</span>
          </div>
          <div className="card-body">
            {loadingProjects ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <div className="spinner-border spinner-border-sm me-2" role="status" />
                Loading your projects…
              </div>
            ) : projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <i className="bi bi-folder-x" style={{ fontSize: '2rem', color: '#d1d5db', display: 'block', marginBottom: '0.5rem' }} />
                <p style={{ color: '#6b7280', marginBottom: '0.75rem' }}>You don't have any projects yet.</p>
                <button className="btn-primary" onClick={() => navigate('/projects/create')}>
                  <i className="bi bi-plus-circle me-1" /> Create a Project
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                {projects.map((project) => {
                  const isSelected = selectedProject?._id === project._id;
                  return (
                    <button
                      key={project._id}
                      onClick={() => setSelectedProject(isSelected ? null : project)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.85rem 1rem',
                        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '10px',
                        background: isSelected ? '#eff6ff' : '#f9fafb',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <i
                        className={`bi ${isSelected ? 'bi-folder2-open' : 'bi-folder2'}`}
                        style={{ fontSize: '1.2rem', color: isSelected ? '#3b82f6' : '#6b7280', flexShrink: 0 }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.title}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                          {project.researchArea || project.category || 'Research Project'} &nbsp;·&nbsp; {project.status || 'Active'}
                        </p>
                      </div>
                      {isSelected && (
                        <i className="bi bi-check-circle-fill" style={{ color: '#3b82f6', marginLeft: 'auto', flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Step 2 — Upload Files */}
        <div className="card card-static" style={{ marginBottom: '1.5rem', opacity: selectedProject ? 1 : 0.5, pointerEvents: selectedProject ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          <div className="card-header">
            <i className="bi bi-cloud-upload text-primary" />
            <span style={{ marginLeft: '0.4rem' }}>
              Step 2 — Upload Files
              {selectedProject && <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '0.4rem' }}>to <em>{selectedProject.title}</em></span>}
            </span>
          </div>
          <div className="card-body">
            {!selectedProject ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
                <i className="bi bi-arrow-up-circle" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                <p style={{ margin: 0 }}>Select a project above to enable file upload.</p>
              </div>
            ) : (
              <FileUpload
                projectId={selectedProject._id}
                onUploadSuccess={handleUploadSuccess}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UploadDocument;
