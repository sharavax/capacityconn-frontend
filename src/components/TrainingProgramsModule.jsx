import React, { useState, useEffect } from 'react';
import {
  getTrainingPrograms,
  createTrainingProgram,
  updateTrainingProgram,
  deleteTrainingProgram,
} from '../services/api';

export default function TrainingProgramsModule({ currentRole, onEnrollClick }) {
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await getTrainingPrograms();
      setPrograms(response.data || []);
    } catch (err) {
      console.error('Error fetching course syllabus:', err);
      setErrorMessage(
        err.response?.data?.message ||
          'Failed to load course syllabus plans from backend server (Port 8081).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setFormData({
      title: '',
      description: '',
      duration: '14 weeks',
      startDate: '2026-11-01',
      endDate: '2027-02-15',
      status: 'ACTIVE',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (program) => {
    setEditingProgram(program);
    setFormData({
      title: program.title || '',
      description: program.description || '',
      duration: program.duration || '',
      startDate: program.startDate || '',
      endDate: program.endDate || '',
      status: program.status || 'ACTIVE',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProgram(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Course title is required';
    if (!formData.duration.trim()) errors.duration = 'Duration / Semester credit is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date cannot be earlier than start date';
    }
    if (!formData.status) errors.status = 'Status is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProgram) {
        await updateTrainingProgram(editingProgram.id, formData);
      } else {
        await createTrainingProgram(formData);
      }
      handleCloseModal();
      await fetchPrograms();
    } catch (err) {
      console.error('Error saving course plan:', err);
      if (err.response?.data?.validationErrors) {
        setFormErrors(err.response.data.validationErrors);
      } else {
        alert(err.response?.data?.message || 'Failed to save course syllabus.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this B.Tech course syllabus plan? This action removes it from student catalogs.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteTrainingProgram(id);
      await fetchPrograms();
    } catch (err) {
      console.error('Error deleting course:', err);
      alert(err.response?.data?.message || 'Failed to delete course syllabus.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPrograms = programs.filter((p) => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesSearch =
      (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return <span className="badge badge-status badge-status-active"><i className="bi bi-play-circle me-1"></i>Active Semester</span>;
      case 'UPCOMING':
        return <span className="badge badge-status badge-status-upcoming"><i className="bi bi-calendar2-week me-1"></i>Upcoming Term</span>;
      case 'COMPLETED':
        return <span className="badge badge-status badge-status-completed"><i className="bi bi-check-all me-1"></i>Term Completed</span>;
      case 'DRAFT':
        return <span className="badge badge-status badge-status-draft"><i className="bi bi-file-earmark-text me-1"></i>Curriculum Draft</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      {/* Header & Actions */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <span className="p-2 rounded-3 text-white" style={{ background: 'var(--blue-primary)' }}>
              <i className="bi bi-journal-bookmark-fill fs-6"></i>
            </span>
            B.Tech Syllabus & Course Management
          </h4>
          <p className="text-muted small mb-0">
            Official B.Tech curriculum plans, semester module outlines, and credit-bearing course offerings.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {currentRole !== 'EMPLOYEE' && (
            <button
              id="btn-add-course"
              className="btn btn-blue-primary d-flex align-items-center gap-2"
              onClick={handleOpenCreateModal}
            >
              <i className="bi bi-plus-lg"></i>
              Add Course Plan
            </button>
          )}
          <button
            className="btn btn-outline-secondary rounded-2"
            onClick={fetchPrograms}
            title="Reload from MySQL"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="row g-2 mb-3 align-items-center">
        <div className="col-md-7">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search by course code, syllabus topic, or lab module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="col-md-5 d-flex gap-1 overflow-auto">
          {['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'DRAFT'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${
                filterStatus === st ? 'btn-dark' : 'btn-outline-secondary'
              } rounded-pill px-3 fw-semibold text-nowrap`}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'ALL' ? 'All Courses' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between rounded-3 py-2" role="alert">
          <div className="d-flex align-items-center gap-2 small">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
            <div>{errorMessage}</div>
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={fetchPrograms}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading syllabus...</span>
          </div>
          <p className="text-muted mt-2 small">Fetching B.Tech syllabus plans from database...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        /* Empty State */
        <div className="text-center py-5 bg-light rounded-4 my-2 border border-dashed">
          <div className="mb-2 text-muted">
            <i className="bi bi-book fs-1 text-secondary"></i>
          </div>
          <h6 className="fw-bold text-dark">No Course Plans Matching Filter</h6>
          <p className="text-muted small mb-3">
            {searchQuery || filterStatus !== 'ALL'
              ? 'Try modifying your search or filter options.'
              : 'The B.Tech syllabus catalog is currently empty.'}
          </p>
          {currentRole !== 'EMPLOYEE' && (
            <button className="btn btn-blue-primary btn-sm" onClick={handleOpenCreateModal}>
              <i className="bi bi-plus-lg me-1"></i> Add First Course
            </button>
          )}
        </div>
      ) : (
        /* Course Syllabus Table */
        <div className="table-responsive">
          <table className="academic-table table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Course Title & Syllabus Outlines</th>
                <th>Duration / Credits</th>
                <th>Semester Period</th>
                <th>Status</th>
                <th className="text-end" style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((program) => (
                <tr key={program.id}>
                  <td className="fw-bold text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                    #{program.id}
                  </td>
                  <td>
                    <div className="fw-bold text-dark d-flex align-items-center gap-2">
                      {program.title}
                    </div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: '440px' }}>
                      {program.description || 'No detailed syllabus outline provided.'}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1">
                      <i className="bi bi-clock-history me-1 text-primary"></i>
                      {program.duration}
                    </span>
                  </td>
                  <td>
                    <div className="small text-secondary">
                      <div><i className="bi bi-calendar-event me-1 text-primary"></i>{program.startDate}</div>
                      <div className="text-muted"><i className="bi bi-arrow-right me-1"></i>{program.endDate}</div>
                    </div>
                  </td>
                  <td>{getStatusBadge(program.status)}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {currentRole === 'EMPLOYEE' ? (
                        <button
                          className="btn btn-outline-primary rounded-2 px-3 fw-semibold"
                          onClick={() => onEnrollClick && onEnrollClick(program)}
                          title="Enroll into this semester course"
                        >
                          <i className="bi bi-bookmark-plus me-1"></i> Enroll
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-outline-secondary rounded-2 me-1"
                            onClick={() => handleOpenEditModal(program)}
                            title="Edit course syllabus"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger rounded-2"
                            onClick={() => handleDelete(program.id)}
                            disabled={deletingId === program.id}
                            title="Remove course"
                          >
                            {deletingId === program.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="bi bi-trash3"></i>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Create / Edit */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <span className={`p-1 px-2 rounded-2 text-white ${editingProgram ? 'bg-primary' : 'bg-danger'}`}>
                    <i className={`bi ${editingProgram ? 'bi-pencil-square' : 'bi-plus-lg'} small`}></i>
                  </span>
                  {editingProgram ? 'Edit B.Tech Course Syllabus' : 'Add New B.Tech Course Syllabus'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Course Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control rounded-2 ${formErrors.title ? 'is-invalid' : ''}`}
                      placeholder="e.g. Data Structures & Algorithms (CS301)"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    {formErrors.title && <div className="invalid-feedback">{formErrors.title}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">Syllabus Outline & Lab Modules</label>
                    <textarea
                      rows="3"
                      className="form-control rounded-2"
                      placeholder="Enter course outcomes, unit breakdown (Units I to V), lab assignments..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark small">
                        Duration / Credits <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control rounded-2 ${formErrors.duration ? 'is-invalid' : ''}`}
                        placeholder="e.g. 14 weeks (4 Credits)"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                      {formErrors.duration && <div className="invalid-feedback">{formErrors.duration}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark small">
                        Term Status <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select rounded-2"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="ACTIVE">ACTIVE (Running Semester)</option>
                        <option value="UPCOMING">UPCOMING (Next Semester)</option>
                        <option value="COMPLETED">COMPLETED (Previous Semester)</option>
                        <option value="DRAFT">DRAFT (Board of Studies Review)</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark small">
                        Semester Start Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control rounded-2 ${formErrors.startDate ? 'is-invalid' : ''}`}
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                      {formErrors.startDate && <div className="invalid-feedback">{formErrors.startDate}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark small">
                        Semester End Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control rounded-2 ${formErrors.endDate ? 'is-invalid' : ''}`}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                      {formErrors.endDate && <div className="invalid-feedback">{formErrors.endDate}</div>}
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-2 px-4"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-blue-primary px-4"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : editingProgram ? (
                      'Update Course Plan'
                    ) : (
                      'Save Course Plan'
                    )}
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
