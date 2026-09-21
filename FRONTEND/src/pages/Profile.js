import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { isValidUrl } from '../utils/validation';

const DEFAULT_SOCIAL_LINKS = {
  twitter: '',
  linkedin: '',
  github: '',
  orcid: '',
  researchGate: '',
  googleScholar: ''
};

const getInitialFormData = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  institution: user?.institution || '',
  department: user?.department || '',
  researchInterests: Array.isArray(user?.researchInterests) ? [...user.researchInterests] : [],
  bio: user?.bio || '',
  profilePicture: user?.profilePicture || '',
  website: user?.website || user?.socialLinks?.website || '',
  publications: Array.isArray(user?.publications) ? user.publications.map(p => ({ ...p })) : [],
  socialLinks: {
    twitter: user?.socialLinks?.twitter || user?.twitter || '',
    linkedin: user?.socialLinks?.linkedin || user?.linkedIn || '',
    github: user?.socialLinks?.github || user?.github || '',
    orcid: user?.socialLinks?.orcid || user?.orcid || '',
    researchGate: user?.socialLinks?.researchGate || user?.researchGate || '',
    googleScholar: user?.socialLinks?.googleScholar || user?.googleScholar || ''
  }
});

const Profile = () => {
  const { user, loadUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const suggestionsRef = useRef(null);
  
  // Form data state with safe default structure
  const [formData, setFormData] = useState(() => getInitialFormData(user));

  const [newInterest, setNewInterest] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  // Comprehensive list of research interest suggestions
  const researchInterestSuggestions = [
    'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Data Mining',
    'Natural Language Processing', 'Computer Vision', 'Robotics', 'Neural Networks',
    'Big Data Analytics', 'Cloud Computing', 'Cybersecurity', 'Blockchain',
    'Internet of Things', 'Quantum Computing', 'Bioinformatics', 'Computational Biology',
    'Software Engineering', 'Human-Computer Interaction', 'Augmented Reality',
    'Virtual Reality', 'Computer Graphics', 'Distributed Systems', 'Edge Computing',
    'Reinforcement Learning', 'Transfer Learning', 'Generative AI', 'Explainable AI',
    'Ethics in AI', 'Federated Learning', 'Image Processing', 'Speech Recognition',
    'Sentiment Analysis', 'Recommender Systems', 'Knowledge Graphs', 'Graph Neural Networks',
    'Time Series Analysis', 'Anomaly Detection', 'Predictive Analytics', 'Data Visualization',
    'Database Systems', 'Information Retrieval', 'Web Technologies', 'Mobile Computing',
    'Wireless Networks', 'Network Security', 'Cryptography', 'Digital Forensics',
    'Embedded Systems', 'Real-Time Systems', 'Operating Systems', 'Compiler Design',
    'Algorithm Design', 'Optimization', 'Parallel Computing', 'High Performance Computing',
    'Computational Neuroscience', 'Medical Imaging', 'Healthcare Informatics', 'Precision Medicine',
    'Genomics', 'Proteomics', 'Drug Discovery', 'Clinical Decision Support',
    'Energy Systems', 'Smart Grids', 'Renewable Energy', 'Sustainability',
    'Climate Modeling', 'Environmental Informatics', 'Urban Computing', 'Transportation Systems',
    'Financial Technology', 'Algorithmic Trading', 'Risk Management', 'Fraud Detection',
    'Social Network Analysis', 'Computational Social Science', 'Digital Humanities',
    'Educational Technology', 'Learning Analytics', 'Adaptive Learning'
  ];
  
  const [newPublication, setNewPublication] = useState({
    title: '',
    authors: '',
    journal: '',
    year: '',
    url: ''
  });

  // Sync formData whenever user data loads/updates
  useEffect(() => {
    if (user) {
      setFormData(getInitialFormData(user));
    }
  }, [user]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialLinkChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...(prev?.socialLinks || DEFAULT_SOCIAL_LINKS),
        [field]: value
      }
    }));
  };

  const handleInterestInputChange = (e) => {
    const value = e.target.value;
    setNewInterest(value);
    
    if (value.trim()) {
      // Filter suggestions based on input
      const currentInterests = formData?.researchInterests || [];
      const filtered = researchInterestSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        !currentInterests.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    const currentInterests = formData?.researchInterests || [];
    if (!currentInterests.includes(suggestion)) {
      setFormData(prev => ({
        ...prev,
        researchInterests: [...(prev?.researchInterests || []), suggestion]
      }));
    }
    setNewInterest('');
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  const addResearchInterest = () => {
    const currentInterests = formData?.researchInterests || [];
    if (newInterest.trim() && !currentInterests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        researchInterests: [...(prev?.researchInterests || []), newInterest.trim()]
      }));
      setNewInterest('');
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    } else if (currentInterests.includes(newInterest.trim())) {
      toast.info('This interest is already added');
    }
  };

  const removeResearchInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      researchInterests: (prev?.researchInterests || []).filter(i => i !== interest)
    }));
  };

  const addPublication = () => {
    if (newPublication.title && newPublication.year) {
      setFormData(prev => ({
        ...prev,
        publications: [...(prev?.publications || []), { ...newPublication }]
      }));
      setNewPublication({ title: '', authors: '', journal: '', year: '', url: '' });
    } else {
      toast.error('Title and year are required');
    }
  };

  const removePublication = (index) => {
    setFormData(prev => ({
      ...prev,
      publications: (prev?.publications || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Validate URLs before submission
    if (formData.website && !isValidUrl(formData.website)) {
      toast.error('Invalid website URL. Please use http:// or https://');
      setLoading(false);
      return;
    }
    
    const socialLinksToValidate = [
      { name: 'Twitter', value: formData?.socialLinks?.twitter },
      { name: 'LinkedIn', value: formData?.socialLinks?.linkedin },
      { name: 'GitHub', value: formData?.socialLinks?.github },
      { name: 'ORCID', value: formData?.socialLinks?.orcid },
      { name: 'ResearchGate', value: formData?.socialLinks?.researchGate },
      { name: 'Google Scholar', value: formData?.socialLinks?.googleScholar }
    ];
    
    for (const link of socialLinksToValidate) {
      if (link.value && !isValidUrl(link.value)) {
        toast.error(`Invalid ${link.name} URL. Please use http:// or https://`);
        setLoading(false);
        return;
      }
    }
    
    // Validate publication URLs
    if (formData.publications && formData.publications.length > 0) {
      for (let i = 0; i < formData.publications.length; i++) {
        const pub = formData.publications[i];
        if (pub.url && !isValidUrl(pub.url)) {
          toast.error(`Invalid publication URL at position ${i + 1}. Please use http:// or https://`);
          setLoading(false);
          return;
        }
      }
    }
    
    setLoading(true);

    try {
      await api.put('/auth/updateprofile', formData);
      await loadUser();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Safe cancelEdit: restores full original profile data with socialLinks intact
  const cancelEdit = () => {
    setIsEditing(false);
    setFormData(getInitialFormData(user));
  };

  return (
    <div className="container section">
      {/* Profile Header */}
      <div className="card card-static mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
            <div className="flex-shrink-0">
              <div className="ds-avatar ds-avatar-xl" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
            <div className="flex-1">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="ds-page-title mb-1">{user?.firstName} {user?.lastName}</h1>
                  <p style={{ color: 'var(--color-accent)', fontWeight: 500, marginBottom: '8px' }}>@{user?.username}</p>
                  <p style={{ color: 'var(--color-text-2)', marginBottom: '4px' }}>
                    <i className="bi bi-building me-2"></i>{user?.institution}
                  </p>
                  {user?.department && (
                    <p style={{ color: 'var(--color-text-2)', marginBottom: '4px' }}>
                      <i className="bi bi-mortarboard me-2"></i>{user?.department}
                    </p>
                  )}
                  <p style={{ color: 'var(--color-text-2)', marginBottom: 0 }}>
                    <i className="bi bi-envelope me-2"></i>{user?.email}
                  </p>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                    <i className="bi bi-pencil me-2"></i>Edit Profile
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
                      <i className="bi bi-check-lg me-1"></i>{loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={cancelEdit} className="btn btn-outline-secondary" disabled={loading}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {user?.bio && !isEditing && (
                <p style={{ color: 'var(--color-text-2)', marginTop: '8px' }}>{user.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card card-static">
        <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="d-flex justify-content-between align-items-center">
            <ul className="nav nav-tabs" style={{ border: 'none', marginBottom: '-1px' }}>
              <li className="nav-item">
                <button className={`nav-link${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link${activeTab === 'research' ? ' active' : ''}`} onClick={() => setActiveTab('research')}>Research Interests</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link${activeTab === 'publications' ? ' active' : ''}`} onClick={() => setActiveTab('publications')}>Publications</button>
              </li>
            </ul>
          </div>
        </div>

        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData?.firstName || ''}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData?.lastName || ''}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData?.email || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                      <label className="form-label">Institution</label>
                      <input
                        type="text"
                        name="institution"
                        value={formData?.institution || ''}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData?.department || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea
                      name="bio"
                      value={formData?.bio || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      rows="4"
                      placeholder="Tell us about yourself and your research..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData?.website || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="https://your-website.com"
                    />
                  </div>

                  {/* Social Links Section */}
                  <div className="card mb-4 bg-light">
                    <div className="card-body">
                      <h5 className="card-title mb-3">
                        <i className="bi bi-share me-2"></i>
                        Social & Professional Links
                      </h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="bi bi-twitter text-info me-1"></i>
                            Twitter
                          </label>
                          <input
                            type="url"
                            name="socialLinks.twitter"
                            value={formData?.socialLinks?.twitter || ''}
                            onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                            className="form-control"
                            placeholder="https://twitter.com/username"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="bi bi-linkedin text-primary me-1"></i>
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            name="socialLinks.linkedin"
                            value={formData?.socialLinks?.linkedin || ''}
                            onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                            className="form-control"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="bi bi-github me-1"></i>
                            GitHub
                          </label>
                          <input
                            type="url"
                            name="socialLinks.github"
                            value={formData?.socialLinks?.github || ''}
                            onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                            className="form-control"
                            placeholder="https://github.com/username"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="bi bi-mortarboard me-1"></i>
                            ORCID
                          </label>
                          <input
                            type="url"
                            name="socialLinks.orcid"
                            value={formData?.socialLinks?.orcid || ''}
                            onChange={(e) => handleSocialLinkChange('orcid', e.target.value)}
                            className="form-control"
                            placeholder="https://orcid.org/0000-0000-0000-0000"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="bi bi-search me-1"></i>
                            ResearchGate
                          </label>
                          <input
                            type="url"
                            name="socialLinks.researchGate"
                            value={formData?.socialLinks?.researchGate || ''}
                            onChange={(e) => handleSocialLinkChange('researchGate', e.target.value)}
                            className="form-control"
                            placeholder="https://researchgate.net/profile/username"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            <i className="bi bi-google me-1"></i>
                            Google Scholar
                          </label>
                          <input
                            type="url"
                            name="socialLinks.googleScholar"
                            value={formData?.socialLinks?.googleScholar || ''}
                            onChange={(e) => handleSocialLinkChange('googleScholar', e.target.value)}
                            className="form-control"
                            placeholder="https://scholar.google.com/citations?user=ID"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn btn-outline-primary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-label)', fontWeight: 600, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Institution</p>
                    <p style={{ color: 'var(--ds-text-primary)' }}>{user?.institution || 'Not specified'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-label)', fontWeight: 600, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Department</p>
                    <p style={{ color: 'var(--ds-text-primary)' }}>{user?.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-label)', fontWeight: 600, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Bio</p>
                    <p style={{ color: 'var(--ds-text-primary)' }}>{user?.bio || 'No bio added yet'}</p>
                  </div>
                  {user?.website && (
                    <div>
                      <p style={{ fontSize: 'var(--font-label)', fontWeight: 600, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Website</p>
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="ds-btn-link">{user.website}</a>
                    </div>
                  )}
                  {/* Social & Professional Links */}
                  {(() => {
                    const links = {
                      twitter: user?.socialLinks?.twitter || user?.twitter,
                      linkedin: user?.socialLinks?.linkedin || user?.linkedIn,
                      github: user?.socialLinks?.github || user?.github,
                      orcid: user?.socialLinks?.orcid || user?.orcid,
                      researchGate: user?.socialLinks?.researchGate || user?.researchGate,
                      googleScholar: user?.socialLinks?.googleScholar || user?.googleScholar
                    };
                    const hasLinks = Object.values(links).some(link => Boolean(link && link.trim()));
                    if (!hasLinks) return null;

                    return (
                      <div>
                        <p style={{ fontSize: 'var(--font-label)', fontWeight: 600, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Professional Links</p>
                        <div className="d-flex flex-wrap gap-2">
                          {links.twitter && (<a href={links.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary" title="Twitter"><i className="bi bi-twitter"></i></a>)}
                          {links.linkedin && (<a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary" title="LinkedIn"><i className="bi bi-linkedin"></i></a>)}
                          {links.github && (<a href={links.github} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary" title="GitHub"><i className="bi bi-github"></i></a>)}
                          {links.orcid && (<a href={links.orcid} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary" title="ORCID"><i className="bi bi-mortarboard"></i></a>)}
                          {links.researchGate && (<a href={links.researchGate} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary" title="ResearchGate"><i className="bi bi-search"></i></a>)}
                          {links.googleScholar && (<a href={links.googleScholar} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary" title="Google Scholar"><i className="bi bi-google"></i></a>)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Research Interests Tab */}
          {activeTab === 'research' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Research Interests</h3>
              
              {isEditing && (
                <div className="mb-4">
                  <label className="form-label mb-2">
                    <i className="bi bi-search mr-2"></i>
                    Search and Add Research Interests
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1" ref={suggestionsRef}>
                        <input
                          type="text"
                          value={newInterest}
                          onChange={handleInterestInputChange}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (filteredSuggestions.length > 0) {
                                selectSuggestion(filteredSuggestions[0]);
                              } else {
                                addResearchInterest();
                              }
                            }
                          }}
                          onFocus={() => newInterest.trim() && setShowSuggestions(true)}
                          className="form-control"
                          placeholder="Type to search interests (e.g., Machine Learning, AI, Data Science...)"
                        />
                        
                        {/* Autocomplete Suggestions Dropdown */}
                        {showSuggestions && filteredSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-card shadow-lg max-h-60 overflow-y-auto">
                            {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectSuggestion(suggestion)}
                                className="w-full text-left px-4 py-2 hover:bg-primary-100 transition-colors duration-150 flex items-center gap-2"
                              >
                                <i className="bi bi-lightbulb text-primary"></i>
                                <span>{suggestion}</span>
                              </button>
                            ))}
                            {filteredSuggestions.length > 10 && (
                              <div className="px-4 py-2 text-sm text-gray-500 border-t">
                                + {filteredSuggestions.length - 10} more results
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* No results message */}
                        {showSuggestions && newInterest.trim() && filteredSuggestions.length === 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-card shadow-lg p-3">
                            <p className="text-sm text-gray-600">
                              <i className="bi bi-info-circle mr-2"></i>
                              No matching suggestions. Press "Add Custom" to create your own interest.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={addResearchInterest}
                        className="btn btn-primary whitespace-nowrap"
                        disabled={!newInterest.trim()}
                      >
                        <i className="bi bi-plus-circle mr-1"></i>
                        Add Custom
                      </button>
                    </div>
                    
                    {/* Helper text */}
                    <p className="text-xs text-gray-500 mt-2">
                      <i className="bi bi-info-circle mr-1"></i>
                      Start typing to see suggestions, or add your own custom research interest
                    </p>
                  </div>
                </div>
              )}

              <div className="d-flex flex-wrap gap-2">
                {(formData?.researchInterests || []).length > 0 ? (
                  (formData?.researchInterests || []).map((interest, index) => (
                    <span key={index} className="ds-keyword-tag">
                      <i className="bi bi-tag-fill me-1"></i>
                      {interest}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeResearchInterest(interest)}
                          style={{ background: 'none', border: 'none', padding: '0 0 0 4px', cursor: 'pointer', color: 'inherit', lineHeight: 1 }}
                          title="Remove"
                        >
                          <i className="bi bi-x-circle-fill"></i>
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <div className="ds-empty" style={{ padding: '24px' }}>
                    <div className="ds-empty-icon" style={{ fontSize: '1.5rem', width: '40px', height: '40px' }}><i className="bi bi-lightbulb"></i></div>
                    <p>No research interests added yet. {isEditing && 'Start typing above to add some!'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Publications Tab */}
          {activeTab === 'publications' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Publications</h3>
              
              {isEditing && (
                <div className="mb-6 p-4 border border-gray-200 rounded-card">
                  <h4 className="font-semibold mb-3">Add New Publication</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newPublication.title}
                      onChange={(e) => setNewPublication({...newPublication, title: e.target.value})}
                      className="form-control"
                      placeholder="Publication Title *"
                    />
                    <input
                      type="text"
                      value={newPublication.authors}
                      onChange={(e) => setNewPublication({...newPublication, authors: e.target.value})}
                      className="form-control"
                      placeholder="Authors"
                    />
                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newPublication.journal}
                        onChange={(e) => setNewPublication({...newPublication, journal: e.target.value})}
                        className="form-control"
                        placeholder="Journal/Conference"
                      />
                      <input
                        type="number"
                        value={newPublication.year}
                        onChange={(e) => setNewPublication({...newPublication, year: e.target.value})}
                        className="form-control"
                        placeholder="Year *"
                        min="1900"
                        max="2100"
                      />
                    </div>
                    <input
                      type="url"
                      value={newPublication.url}
                      onChange={(e) => setNewPublication({...newPublication, url: e.target.value})}
                      className="form-control"
                      placeholder="URL (optional)"
                    />
                    <button
                      type="button"
                      onClick={addPublication}
                      className="btn btn-primary btn-sm"
                    >
                      Add Publication
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(formData?.publications || []).length > 0 ? (
                  (formData?.publications || []).map((pub, index) => (
                    <div key={index} className="card card-static">
                      <div className="card-body d-flex justify-content-between align-items-start">
                        <div className="flex-1">
                          <h4 style={{ fontWeight: 600, color: 'var(--ds-text-primary)', marginBottom: '6px' }}>{pub.title}</h4>
                          {pub.authors && <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', marginBottom: '4px' }}>{pub.authors}</p>}
                          <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', marginBottom: '8px' }}>
                            {pub.journal && <span>{pub.journal}, </span>}
                            <strong>{pub.year}</strong>
                          </p>
                          {pub.url && (
                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="ds-btn-link">
                              View Publication <i className="bi bi-box-arrow-up-right ms-1"></i>
                            </a>
                          )}
                        </div>
                        {isEditing && (
                          <button type="button" onClick={() => removePublication(index)} className="btn btn-outline-danger btn-sm ms-3">
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ds-empty" style={{ padding: '24px' }}>
                    <div className="ds-empty-icon" style={{ fontSize: '1.5rem', width: '40px', height: '40px' }}><i className="bi bi-journal-text"></i></div>
                    <p>No publications added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;