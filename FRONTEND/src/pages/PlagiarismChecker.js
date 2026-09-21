import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const statusConfig = {
  clear: { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Clear', icon: 'bi-shield-check' },
  low_similarity: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Low Similarity', icon: 'bi-shield-exclamation' },
  moderate_similarity: { color: '#f97316', bg: '#fff7ed', border: '#fed7aa', label: 'Moderate Similarity', icon: 'bi-shield-exclamation' },
  high_similarity: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'High Similarity', icon: 'bi-shield-x' },
};

const PlagiarismChecker = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    validateAndSet(selected);
  };

  const validateAndSet = (selected) => {
    if (!selected) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(selected.type)) {
      toast.error('Only PDF and DOCX files are supported.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10 MB.');
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files[0]);
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const response = await api.post('/plagiarism/check-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data.data);
      toast.success('Plagiarism check complete!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to check document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => { setFile(null); setResult(null); };

  const statusInfo = result ? (statusConfig[result.plagiarismCheck?.status] || statusConfig.clear) : null;

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
          <h1 style={{ fontSize: 'var(--font-h1)', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            <i className="bi bi-shield-check" style={{ color: '#4F46E5', marginRight: '0.5rem' }} />
            Plagiarism Checker
          </h1>
          <p style={{ color: '#6b7280', marginTop: '8px', marginBottom: 0, fontSize: 'var(--font-body)', lineHeight: 1.6 }}>
            Upload a PDF or DOCX file to check it against all documents in the research database.
          </p>
        </div>

        {/* Upload Card */}
        <div className="card card-static" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <i className="bi bi-cloud-upload text-primary" /> Upload Document
          </div>
          <div className="card-body">
            <form onSubmit={handleCheck}>
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && document.getElementById('plagiarism-file-input').click()}
                style={{
                  border: `2px dashed ${dragOver ? '#3b82f6' : file ? '#22c55e' : '#d1d5db'}`,
                  borderRadius: '12px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: file ? 'default' : 'pointer',
                  background: dragOver ? '#eff6ff' : file ? '#f0fdf4' : '#f9fafb',
                  transition: 'all 0.2s',
                  marginBottom: '1.25rem',
                }}
              >
                <input
                  id="plagiarism-file-input"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <div>
                    <i className="bi bi-file-earmark-check" style={{ fontSize: '2.5rem', color: '#22c55e' }} />
                    <p style={{ margin: '0.5rem 0 0.25rem', fontWeight: 600, color: '#111827' }}>{file.name}</p>
                    <p style={{ margin: 0, fontSize: 'var(--font-small)', color: '#6b7280' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={clearFile}
                      style={{ marginTop: '0.75rem', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 12px', fontSize: 'var(--font-btn)', cursor: 'pointer', color: '#6b7280' }}
                    >
                      <i className="bi bi-x" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <i className="bi bi-cloud-upload" style={{ fontSize: '2.5rem', color: '#9ca3af' }} />
                    <p style={{ margin: '0.5rem 0 0.25rem', fontWeight: 600, color: '#374151' }}>
                      Drag & drop or click to select
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--font-small)', color: '#9ca3af' }}>PDF or DOCX — max 10 MB</p>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-center mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !file}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Checking Document...</>
                  ) : (
                    <><i className="bi bi-search" /> Check for Plagiarism</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        {result && statusInfo && (
          <div className="card card-static" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <i className="bi bi-bar-chart text-primary" /> Results
            </div>
            <div className="card-body">

              {/* Status Banner */}
              <div style={{
                background: statusInfo.bg,
                border: `1px solid ${statusInfo.border}`,
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                <i className={`bi ${statusInfo.icon}`} style={{ fontSize: '2rem', color: statusInfo.color }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: statusInfo.color, fontSize: 'var(--font-h3)' }}>
                    {statusInfo.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--font-body)', color: '#374151' }}>
                    Similarity score: <strong>{result.plagiarismCheck?.similarityPercentage ?? 0}%</strong>
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Similarity', value: `${result.plagiarismCheck?.similarityPercentage ?? 0}%`, icon: 'bi-percent' },
                  { label: 'Documents Checked', value: result.report?.checkedAgainst ?? 0, icon: 'bi-files' },
                  { label: 'Matches Found', value: result.matches?.length ?? 0, icon: 'bi-search' },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                    <i className={`bi ${stat.icon}`} style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                    <p style={{ margin: '0.25rem 0 0', fontWeight: 700, fontSize: 'var(--font-h2)', color: '#111827' }}>{stat.value}</p>
                    <p style={{ margin: 0, fontSize: 'var(--font-small)', color: '#6b7280' }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Top Matches */}
              {result.matches && result.matches.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                    <i className="bi bi-list-ul me-1" /> Top Matching Documents
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.matches.slice(0, 5).map((match, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <i className="bi bi-file-earmark-text" style={{ color: '#6b7280', flexShrink: 0 }} />
                          <span style={{ fontSize: 'var(--font-body)', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {match.filename || match.title || `Document #${idx + 1}`}
                          </span>
                        </div>
                        <span style={{
                          flexShrink: 0,
                          marginLeft: '0.75rem',
                          fontSize: 'var(--font-label)',
                          fontWeight: 700,
                          color: match.similarity > 0.5 ? '#ef4444' : match.similarity > 0.25 ? '#f59e0b' : '#22c55e',
                          background: match.similarity > 0.5 ? '#fef2f2' : match.similarity > 0.25 ? '#fffbeb' : '#f0fdf4',
                          border: `1px solid ${match.similarity > 0.5 ? '#fecaca' : match.similarity > 0.25 ? '#fde68a' : '#bbf7d0'}`,
                          borderRadius: '999px',
                          padding: '2px 10px',
                        }}>
                          {((match.similarity ?? 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.matches?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280', fontSize: 'var(--font-body)' }}>
                  <i className="bi bi-check-circle" style={{ color: '#22c55e', fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }} />
                  No matching documents found in the database.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="card card-static" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: '0.5rem' }}>
              <i className="bi bi-info-circle me-1" /> How it works
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#374151', fontSize: 'var(--font-body)', lineHeight: 1.7 }}>
              <li>Your document text is extracted and cleaned.</li>
              <li>It is compared against all project documents in the database using TF-IDF and cosine similarity.</li>
              <li>A similarity score is returned along with the top matching documents.</li>
              <li>Scores above 70% are flagged as high similarity.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlagiarismChecker;
