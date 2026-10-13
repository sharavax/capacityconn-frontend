import React, { useState, useEffect } from 'react';
import { getLearningResources, createLearningResource, deleteLearningResource } from '../services/api';

export default function LearningResourcesModule({ currentRole }) {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newResource, setNewResource] = useState({
    title: '',
    category: 'Data Structures',
    resourceType: 'NOTES',
    description: '',
    contentOrUrl: '',
    tags: '',
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const res = await getLearningResources();
      setResources(res.data || []);
    } catch (err) {
      console.error('Failed to load study resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createLearningResource(newResource);
      setShowAddModal(false);
      setNewResource({
        title: '',
        category: 'Data Structures',
        resourceType: 'NOTES',
        description: '',
        contentOrUrl: '',
        tags: '',
      });
      fetchResources();
    } catch (err) {
      console.error('Failed to upload resource:', err);
      alert('Error creating study resource.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study resource?')) return;
    try {
      await deleteLearningResource(id);
      fetchResources();
    } catch (err) {
      console.error('Failed to delete resource:', err);
      alert('Error deleting resource.');
    }
  };

  const filtered = resources.filter((r) => {
    const matchCat = filterCategory === 'ALL' || r.category === filterCategory;
    const matchSearch =
      (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.tags && r.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const getResourceTypeIcon = (type) => {
    switch (type) {
      case 'VIDEO':
        return <i className="bi bi-play-circle-fill text-danger me-1"></i>;
      case 'LAB_MANUAL':
        return <i className="bi bi-laptop text-primary me-1"></i>;
      case 'QUESTION_BANK':
        return <i className="bi bi-patch-question-fill text-danger me-1"></i>;
      case 'NOTES':
        return <i className="bi bi-book-half text-primary me-1"></i>;
      default:
        return <i className="bi bi-file-earmark-text text-secondary me-1"></i>;
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <span className="p-2 rounded-3 text-white" style={{ background: 'var(--blue-dark)' }}>
              <i className="bi bi-folder-fill fs-6"></i>
            </span>
            B.Tech Study Materials, Lab Manuals & Question Banks
          </h4>
          <p className="text-muted small mb-0">
            Course lecture notes, practical laboratory handouts, viva question banks, and reference guides.
          </p>
        </div>

        {currentRole !== 'EMPLOYEE' && (
          <button
            className="btn btn-blue-primary d-flex align-items-center gap-2 py-2 small"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-cloud-upload"></i>
            Upload Study Material
          </button>
        )}
      </div>

      {/* Filter & Search */}
      <div className="row g-2 mb-4 align-items-center">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search by topic, unit name, or exam keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6 d-flex gap-1 overflow-auto">
          {['ALL', 'Data Structures', 'Database Systems', 'Operating Systems', 'Data Science & AI', 'Software Engineering'].map(
            (cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${
                  filterCategory === cat ? 'btn-dark' : 'btn-outline-secondary'
                } rounded-pill px-3 fw-semibold text-nowrap`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading study materials...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <p className="text-muted mb-0">No study resources found matching your filter.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((item) => (
            <div key={item.id} className="col-md-6">
              <div className="card h-100 border rounded-3 p-3 shadow-sm hover-shadow" style={{ borderLeft: '3px solid var(--blue-primary)' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-light text-dark border d-flex align-items-center">
                    {getResourceTypeIcon(item.resourceType)}
                    {item.resourceType}
                  </span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    {item.category}
                  </span>
                </div>

                <h6 className="fw-bold text-dark mb-1">{item.title}</h6>
                <p className="text-muted small mb-3 flex-grow-1" style={{ minHeight: '44px' }}>
                  {item.description}
                </p>

                {item.tags && (
                  <div className="mb-3">
                    {item.tags.split(',').map((t, i) => (
                      <span key={i} className="badge bg-light text-secondary border me-1 small">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <a
                    href={item.contentOrUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                  >
                    <i className="bi bi-download me-1"></i> Open Handout
                  </a>

                  {currentRole !== 'EMPLOYEE' && (
                    <button
                      className="btn btn-sm btn-outline-danger rounded-circle p-1 px-2"
                      onClick={() => handleDelete(item.id)}
                      title="Delete resource"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold">Upload B.Tech Course Material</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Resource Title</label>
                    <input
                      type="text"
                      className="form-control rounded-2"
                      required
                      placeholder="e.g. Operating Systems Lab Manual (POSIX Threads & IPC)"
                      value={newResource.title}
                      onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Subject</label>
                      <select
                        className="form-select rounded-2"
                        value={newResource.category}
                        onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                      >
                        <option value="Data Structures">Data Structures</option>
                        <option value="Database Systems">Database Systems</option>
                        <option value="Operating Systems">Operating Systems</option>
                        <option value="Data Science & AI">Data Science & AI</option>
                        <option value="Software Engineering">Software Engineering</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Material Type</label>
                      <select
                        className="form-select rounded-2"
                        value={newResource.resourceType}
                        onChange={(e) =>
                          setNewResource({ ...newResource, resourceType: e.target.value })
                        }
                      >
                        <option value="NOTES">LECTURE NOTES</option>
                        <option value="LAB_MANUAL">LAB MANUAL</option>
                        <option value="QUESTION_BANK">VIVA QUESTION BANK</option>
                        <option value="VIDEO">VIDEO LECTURE</option>
                        <option value="DOCUMENT">PROJECT RUBRIC</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea
                      rows="2"
                      className="form-control rounded-2"
                      placeholder="Brief overview of units and concepts covered..."
                      value={newResource.description}
                      onChange={(e) =>
                        setNewResource({ ...newResource, description: e.target.value })
                      }
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Download URL / Document Link</label>
                    <input
                      type="text"
                      className="form-control rounded-2"
                      placeholder="https://..."
                      value={newResource.contentOrUrl}
                      onChange={(e) =>
                        setNewResource({ ...newResource, contentOrUrl: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Tags (comma separated)</label>
                    <input
                      type="text"
                      className="form-control rounded-2"
                      placeholder="e.g. OS, Linux, Pthreads, Semaphores"
                      value={newResource.tags}
                      onChange={(e) => setNewResource({ ...newResource, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-2"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-blue-primary">
                    Upload Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
