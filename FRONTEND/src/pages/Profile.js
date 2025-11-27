import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, loadUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const suggestionsRef = useRef(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    department: '',
    researchInterests: [],
    bio: '',
    profilePicture: '',
    website: '',
    publications: []
  });

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

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        institution: user.institution || '',
        department: user.department || '',
        researchInterests: user.researchInterests || [],
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
        website: user.website || '',
        publications: user.publications || []
      });
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

  const handleInterestInputChange = (e) => {
    const value = e.target.value;
    setNewInterest(value);
    
    if (value.trim()) {
      // Filter suggestions based on input
      const filtered = researchInterestSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        !formData.researchInterests.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    if (!formData.researchInterests.includes(suggestion)) {
      setFormData(prev => ({
        ...prev,
        researchInterests: [...prev.researchInterests, suggestion]
      }));
    }
    setNewInterest('');
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  const addResearchInterest = () => {
    if (newInterest.trim() && !formData.researchInterests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        researchInterests: [...prev.researchInterests, newInterest.trim()]
      }));
      setNewInterest('');
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    } else if (formData.researchInterests.includes(newInterest.trim())) {
      toast.info('This interest is already added');
    }
  };

  const removeResearchInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      researchInterests: prev.researchInterests.filter(i => i !== interest)
    }));
  };

  const addPublication = () => {
    if (newPublication.title && newPublication.year) {
      setFormData(prev => ({
        ...prev,
        publications: [...prev.publications, { ...newPublication }]
      }));
      setNewPublication({ title: '', authors: '', journal: '', year: '', url: '' });
    } else {
      toast.error('Title and year are required');
    }
  };

  const removePublication = (index) => {
    setFormData(prev => ({
      ...prev,
      publications: prev.publications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setLoading(true);

    try {
      await api.put(`/users/${user.id}`, formData);
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

  const cancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        institution: user.institution || '',
        department: user.department || '',
        researchInterests: user.researchInterests || [],
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
        website: user.website || '',
        publications: user.publications || []
      });
    }
  };

  return (
    <div className="bg-light min-h-screen py-8">
      <div className="container max-w-5xl">
        {/* Profile Header */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary text-5xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-dark mb-2">
                      {user?.firstName} {user?.lastName}
                    </h1>
                    <p className="text-lg text-primary mb-3" style={{ fontWeight: '500' }}>
                      @{user?.username}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <i className="bi bi-building mr-2"></i>
                      {user?.institution}
                    </p>
                    {user?.department && (
                      <p className="text-gray-600 mb-1">
                        <i className="bi bi-mortarboard mr-2"></i>
                        {user?.department}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <i className="bi bi-envelope mr-2"></i>
                      {user?.email}
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary"
                    >
                      <i className="bi bi-pencil mr-2"></i>
                      Edit Profile
                    </button>
                  )}
                </div>
                {user?.bio && !isEditing && (
                  <p className="text-gray-700 mt-4">{user.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center px-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('research')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'research'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Research Interests
                </button>
                <button
                  onClick={() => setActiveTab('publications')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'publications'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Publications
                </button>
              </div>
              
              {/* Edit/Save buttons visible on all tabs */}
              <div className="flex gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <i className="bi bi-pencil mr-2"></i>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="btn btn-primary btn-sm"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="btn btn-outline-primary btn-sm"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
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
                          value={formData.firstName}
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
                          value={formData.lastName}
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
                        value={formData.email}
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
                          value={formData.institution}
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
                          value={formData.department}
                          onChange={handleInputChange}
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
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
                        value={formData.website}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="https://your-website.com"
                      />
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
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Institution</h3>
                      <p className="text-gray-800">{user?.institution || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Department</h3>
                      <p className="text-gray-800">{user?.department || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Bio</h3>
                      <p className="text-gray-800">{user?.bio || 'No bio added yet'}</p>
                    </div>
                    {user?.website && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Website</h3>
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark"
                        >
                          {user.website}
                        </a>
                      </div>
                    )}
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

                <div className="flex flex-wrap gap-2">
                  {formData.researchInterests.length > 0 ? (
                    formData.researchInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary rounded-full text-sm"
                      >
                        <i className="bi bi-tag-fill"></i>
                        {interest}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeResearchInterest(interest)}
                            className="text-primary hover:text-red-600 transition-colors"
                            title="Remove this interest"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">
                      <i className="bi bi-lightbulb mr-2"></i>
                      No research interests added yet. {isEditing && 'Start typing above to add some!'}
                    </p>
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

                <div className="space-y-4">
                  {formData.publications.length > 0 ? (
                    formData.publications.map((pub, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-card">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-dark mb-2">{pub.title}</h4>
                            {pub.authors && (
                              <p className="text-sm text-gray-600 mb-1">{pub.authors}</p>
                            )}
                            <p className="text-sm text-gray-600 mb-2">
                              {pub.journal && <span>{pub.journal}, </span>}
                              <span className="font-semibold">{pub.year}</span>
                            </p>
                            {pub.url && (
                              <a
                                href={pub.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary-dark text-sm"
                              >
                                View Publication <i className="bi bi-box-arrow-up-right ml-1"></i>
                              </a>
                            )}
                          </div>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removePublication(index)}
                              className="text-danger hover:text-red-700 ml-4"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No publications added yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;