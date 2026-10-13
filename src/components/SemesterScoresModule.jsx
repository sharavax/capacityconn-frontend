import React, { useState, useEffect } from 'react';
import {
  getStudentScoresReport,
  getAllSemesterScores,
  updateSemesterScore,
  createSemesterScore,
  getUsers,
  getTrainingPrograms,
} from '../services/api';

export default function SemesterScoresModule({ currentUser, currentRole }) {
  const [scoresList, setScoresList] = useState([]);
  const [reportSummary, setReportSummary] = useState({ sgpa: 0.0, totalCredits: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  // Edit / Add Modal (Faculty & Admin only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    internal1: 18.0,
    internal2: 18.0,
    assignmentScore: 9.0,
    endSemScore: 42.0,
    credits: 4,
  });

  const [addFormData, setAddFormData] = useState({
    userId: '',
    courseId: '',
    semester: 'Semester 6',
    internal1: 17.0,
    internal2: 17.5,
    assignmentScore: 9.0,
    endSemScore: 40.0,
    credits: 4,
  });

  const isStudent = currentRole === 'EMPLOYEE';
  const isFacultyOrAdmin = currentRole === 'TRAINER' || currentRole === 'ADMIN';

  useEffect(() => {
    loadData();
  }, [currentUser, currentRole]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isFacultyOrAdmin) {
        const [usersRes, coursesRes, allScoresRes] = await Promise.all([
          getUsers(),
          getTrainingPrograms(),
          getAllSemesterScores(),
        ]);
        const studentUsers = (usersRes.data || []).filter((u) => u.role === 'EMPLOYEE');
        setStudents(studentUsers);
        setCourses(coursesRes.data || []);
        setScoresList(allScoresRes.data || []);
      } else {
        const studentId = currentUser?.id || 3;
        const res = await getStudentScoresReport(studentId);
        setScoresList(res.data?.scores || []);
        setReportSummary({
          sgpa: res.data?.sgpa || 0.0,
          totalCredits: res.data?.totalCredits || 0,
        });
      }
    } catch (err) {
      console.error('Error loading semester scores:', err);
      setErrorMessage('Could not load semester score reports.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentFilterChange = async (studentId) => {
    setSelectedStudentId(studentId);
    setIsLoading(true);
    try {
      if (!studentId || studentId === 'ALL') {
        const res = await getAllSemesterScores();
        setScoresList(res.data || []);
      } else {
        const res = await getStudentScoresReport(studentId);
        setScoresList(res.data?.scores || []);
        setReportSummary({
          sgpa: res.data?.sgpa || 0.0,
          totalCredits: res.data?.totalCredits || 0,
        });
      }
    } catch (err) {
      console.error('Error filtering scores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (scoreItem) => {
    setEditingScore(scoreItem);
    setEditFormData({
      internal1: scoreItem.internal1,
      internal2: scoreItem.internal2,
      assignmentScore: scoreItem.assignmentScore,
      endSemScore: scoreItem.endSemScore,
      credits: scoreItem.credits,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingScore) return;
    setIsSubmitting(true);
    try {
      await updateSemesterScore(editingScore.id, editFormData);
      setShowEditModal(false);
      if (selectedStudentId && selectedStudentId !== 'ALL') {
        const res = await getStudentScoresReport(selectedStudentId);
        setScoresList(res.data?.scores || []);
        setReportSummary({
          sgpa: res.data?.sgpa || 0.0,
          totalCredits: res.data?.totalCredits || 0,
        });
      } else {
        const res = await getAllSemesterScores();
        setScoresList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to update scores:', err);
      alert('Error updating score record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateScore = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSemesterScore(addFormData);
      setShowAddModal(false);
      const res = await getAllSemesterScores();
      setScoresList(res.data || []);
    } catch (err) {
      console.error('Failed to create score entry:', err);
      alert('Error recording semester score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'O':
      case 'A+':
        return <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold px-2">{grade} (Outstanding)</span>;
      case 'A':
      case 'B+':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold px-2">{grade} (Very Good)</span>;
      case 'B':
      case 'C':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-bold px-2">{grade} (Satisfactory)</span>;
      default:
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold px-2">{grade} (Arrear)</span>;
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <span className="p-2 rounded-3 text-white" style={{ background: 'var(--red-accent)' }}>
              <i className="bi bi-file-earmark-spreadsheet-fill fs-6"></i>
            </span>
            {isStudent ? 'Semester Grade Sheet & Assessment Scores' : 'Student Semester Gradebook'}
          </h4>
          <p className="text-muted small mb-0">
            {isStudent
              ? 'Continuous internal assessments (CIE), lab mini-projects, end-semester grades, and SGPA report.'
              : 'Faculty portal for recording internal assessment marks, end-sem theory scores, and course credits.'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isFacultyOrAdmin && (
            <button
              className="btn btn-red-accent d-flex align-items-center gap-2 py-2 small"
              onClick={() => {
                setAddFormData({
                  userId: students[0]?.id || '',
                  courseId: courses[0]?.id || '',
                  semester: 'Semester 6',
                  internal1: 17.0,
                  internal2: 17.5,
                  assignmentScore: 9.0,
                  endSemScore: 40.0,
                  credits: 4,
                });
                setShowAddModal(true);
              }}
            >
              <i className="bi bi-plus-lg"></i>
              Enter Subject Marks
            </button>
          )}
          <button className="btn btn-outline-secondary rounded-2" onClick={loadData} title="Refresh">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Student Notice */}
      {isStudent && (
        <div className="alert bg-light border border-secondary border-opacity-25 rounded-3 py-2 px-3 mb-3 d-flex align-items-center justify-content-between small">
          <div className="d-flex align-items-center gap-2 text-secondary">
            <i className="bi bi-shield-lock-fill text-danger"></i>
            <span>
              <strong>Academic Office:</strong> Grades and marks are certified by the controller of examinations and faculty evaluators.
            </span>
          </div>
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
            Student Report Card
          </span>
        </div>
      )}

      {/* Faculty Filter Bar */}
      {isFacultyOrAdmin && (
        <div className="row g-2 mb-3 align-items-center bg-light p-3 rounded-3 border">
          <div className="col-md-5">
            <label className="form-label small fw-semibold text-muted mb-1">Filter by B.Tech Student</label>
            <select
              className="form-select form-select-sm rounded-2"
              value={selectedStudentId || 'ALL'}
              onChange={(e) => handleStudentFilterChange(e.target.value)}
            >
              <option value="ALL">All Enrolled Students (Gradebook Overview)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department || 'B.Tech CSE'})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-7 text-md-end pt-3 pt-md-0">
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle me-2 py-2 px-3 small">
              <i className="bi bi-pencil-square me-1"></i> Faculty Grade Edit Access
            </span>
          </div>
        </div>
      )}

      {/* Student Summary KPI Cards */}
      {(isStudent || (selectedStudentId && selectedStudentId !== 'ALL')) && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="kpi-card kpi-card-red">
              <div className="text-muted small fw-semibold">Current Semester SGPA</div>
              <div className="fs-2 fw-bold mt-1" style={{ color: 'var(--red-accent)' }}>
                {reportSummary.sgpa} <span className="fs-6 text-muted">/ 10.0</span>
              </div>
              <div className="small text-muted mt-1">Weighted Academic Performance Index</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="kpi-card kpi-card-blue">
              <div className="text-muted small fw-semibold">Total Credits Earned</div>
              <div className="fs-2 fw-bold mt-1" style={{ color: 'var(--blue-primary)' }}>
                {reportSummary.totalCredits} Credits
              </div>
              <div className="small text-muted mt-1">Syllabus Curriculum Completed</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="kpi-card kpi-card-blue">
              <div className="text-muted small fw-semibold">Standing & Classification</div>
              <div className="mt-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle fs-6 py-1 px-3">
                  <i className="bi bi-stars me-1 text-warning"></i> First Class with Distinction
                </span>
              </div>
              <div className="small text-muted mt-2">Zero Active Backlogs / Arrears</div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading semester scores...</p>
        </div>
      ) : scoresList.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3 border border-dashed">
          <i className="bi bi-journal-x fs-2 text-muted"></i>
          <h6 className="fw-bold mt-2 text-dark">No Marks Recorded</h6>
          <p className="text-muted small mb-0">Evaluation marks will appear once entered by faculty.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="academic-table table">
            <thead>
              <tr>
                {isFacultyOrAdmin && <th>Student Name</th>}
                <th>Subject / Course Title</th>
                <th>Credits</th>
                <th>CIE 1 (20)</th>
                <th>CIE 2 (20)</th>
                <th>Assignment (10)</th>
                <th>End-Sem (50)</th>
                <th>Total (100)</th>
                <th>Grade</th>
                <th>Points</th>
                {isFacultyOrAdmin && <th className="text-end" style={{ width: '100px' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {scoresList.map((item) => (
                <tr key={item.id}>
                  {isFacultyOrAdmin && <td className="fw-semibold text-dark">{item.studentName}</td>}
                  <td>
                    <div className="fw-bold text-dark">{item.courseTitle}</div>
                    <div className="text-muted small">{item.semester}</div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1">
                      {item.credits} Cr
                    </span>
                  </td>
                  <td className="fw-semibold text-secondary">{item.internal1}</td>
                  <td className="fw-semibold text-secondary">{item.internal2}</td>
                  <td className="fw-semibold text-secondary">{item.assignmentScore}</td>
                  <td className="fw-semibold text-secondary">{item.endSemScore}</td>
                  <td>
                    <span className="fw-bold fs-6" style={{ color: 'var(--blue-dark)' }}>
                      {item.totalMarks}
                    </span>
                  </td>
                  <td>{getGradeBadge(item.grade)}</td>
                  <td className="fw-bold text-dark">{item.gradePoints}</td>
                  {isFacultyOrAdmin && (
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary rounded-2"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Marks"
                      >
                        <i className="bi bi-pencil-square"></i> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Marks Modal (Faculty & Admin) */}
      {showEditModal && editingScore && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  Edit Assessment Marks: {editingScore.studentName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  <div className="small text-muted mb-3">
                    Course: <strong>{editingScore.courseTitle}</strong>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Internal Test 1 (Max 20)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        className="form-control rounded-2"
                        required
                        value={editFormData.internal1}
                        onChange={(e) => setEditFormData({ ...editFormData, internal1: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Internal Test 2 (Max 20)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        className="form-control rounded-2"
                        required
                        value={editFormData.internal2}
                        onChange={(e) => setEditFormData({ ...editFormData, internal2: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Assignment / Lab (Max 10)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        className="form-control rounded-2"
                        required
                        value={editFormData.assignmentScore}
                        onChange={(e) => setEditFormData({ ...editFormData, assignmentScore: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">End-Sem Exam (Max 50)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        className="form-control rounded-2"
                        required
                        value={editFormData.endSemScore}
                        onChange={(e) => setEditFormData({ ...editFormData, endSemScore: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Course Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      className="form-control rounded-2"
                      required
                      value={editFormData.credits}
                      onChange={(e) => setEditFormData({ ...editFormData, credits: parseInt(e.target.value) || 4 })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-red-accent" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Save Assessment Marks'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Marks Modal (Faculty & Admin) */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-dark">Enter Subject Marks</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleCreateScore}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Student</label>
                    <select
                      className="form-select rounded-2"
                      required
                      value={addFormData.userId}
                      onChange={(e) => setAddFormData({ ...addFormData, userId: e.target.value })}
                    >
                      <option value="">Select Student...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Course</label>
                    <select
                      className="form-select rounded-2"
                      required
                      value={addFormData.courseId}
                      onChange={(e) => setAddFormData({ ...addFormData, courseId: e.target.value })}
                    >
                      <option value="">Select Course...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Internal 1 (Max 20)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        className="form-control rounded-2"
                        required
                        value={addFormData.internal1}
                        onChange={(e) => setAddFormData({ ...addFormData, internal1: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Internal 2 (Max 20)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        className="form-control rounded-2"
                        required
                        value={addFormData.internal2}
                        onChange={(e) => setAddFormData({ ...addFormData, internal2: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Assignment (Max 10)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        className="form-control rounded-2"
                        required
                        value={addFormData.assignmentScore}
                        onChange={(e) => setAddFormData({ ...addFormData, assignmentScore: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">End-Sem (Max 50)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        className="form-control rounded-2"
                        required
                        value={addFormData.endSemScore}
                        onChange={(e) => setAddFormData({ ...addFormData, endSemScore: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      className="form-control rounded-2"
                      required
                      value={addFormData.credits}
                      onChange={(e) => setAddFormData({ ...addFormData, credits: parseInt(e.target.value) || 4 })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-red-accent" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Record Marks'}
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
