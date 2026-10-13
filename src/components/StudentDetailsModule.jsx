import React, { useState, useEffect } from 'react';
import {
  getUsers,
  getAllAttendance,
  getAllSemesterScores,
  getEnrollments,
  updateEnrollmentProgress,
} from '../services/api';

export default function StudentDetailsModule({ onNavigateTab, onSelectStudentForAttendance, onSelectStudentForScores }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [scoresData, setScoresData] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Course Progress Edit Modal
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [progressVal, setProgressVal] = useState(50);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, attRes, scoresRes, enrRes] = await Promise.all([
        getUsers(),
        getAllAttendance(),
        getAllSemesterScores(),
        getEnrollments(),
      ]);
      const studentUsers = (usersRes.data || []).filter((u) => u.role === 'EMPLOYEE');
      setStudents(studentUsers);
      setAttendanceData(attRes.data || []);
      setScoresData(scoresRes.data || []);
      setEnrollments(enrRes.data || []);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentStats = (studentId) => {
    const studentAtt = attendanceData.filter((a) => a.userId === studentId);
    const totalClasses = studentAtt.reduce((acc, a) => acc + (a.totalClasses || 0), 0);
    const attendedClasses = studentAtt.reduce((acc, a) => acc + (a.attendedClasses || 0), 0);
    const attPct = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : 'N/A';

    const studentScores = scoresData.filter((s) => s.userId === studentId);
    let totalCredits = 0;
    let weightedPoints = 0;
    studentScores.forEach((s) => {
      const c = s.credits || 4;
      totalCredits += c;
      weightedPoints += (c * (s.gradePoints || 0));
    });
    const sgpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : 'N/A';

    const studentEnrollments = enrollments.filter((e) => e.userId === studentId);

    return {
      attPct,
      sgpa,
      enrolledCount: studentEnrollments.length,
      enrollments: studentEnrollments,
    };
  };

  const handleOpenProgressModal = (enr) => {
    setSelectedEnrollment(enr);
    setProgressVal(enr.progressPercentage || 0);
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setIsUpdatingProgress(true);
    try {
      await updateEnrollmentProgress(selectedEnrollment.id, {
        progressPercentage: progressVal,
      });
      setSelectedEnrollment(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update course progress:', err);
      alert('Error updating course progress.');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <span className="p-2 rounded-3 text-white" style={{ background: 'var(--blue-dark)' }}>
              <i className="bi bi-people-fill fs-6"></i>
            </span>
            B.Tech Student Details & Academic Roster
          </h4>
          <p className="text-muted small mb-0">
            Faculty and administrator directory: manage student profiles, monitor attendance shortage, and update course progress.
          </p>
        </div>

        <button className="btn btn-outline-secondary rounded-2" onClick={loadData} title="Refresh">
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      {/* Search Input */}
      <div className="row g-2 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search by student name, roll number, or semester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Student Details Cards */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading B.Tech student profiles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <p className="text-muted mb-0">No student profiles found.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((student) => {
            const stats = getStudentStats(student.id);
            const isShortage = stats.attPct !== 'N/A' && parseFloat(stats.attPct) < 75.0;

            return (
              <div key={student.id} className="col-lg-6">
                <div className="card h-100 border rounded-3 p-3 shadow-sm hover-shadow" style={{ borderLeft: '4px solid var(--blue-primary)' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: '40px', height: '40px', background: 'var(--gradient-brand)' }}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{student.name}</h6>
                        <span className="text-muted small">{student.email}</span>
                      </div>
                    </div>
                    <span className="badge bg-light text-secondary border">
                      {student.designation || 'B.Tech CSE'}
                    </span>
                  </div>

                  <div className="row g-2 my-2 py-2 bg-light rounded-2 text-center">
                    <div className="col-4 border-end">
                      <div className="text-muted small fw-semibold" style={{ fontSize: '0.7rem' }}>ATTENDANCE</div>
                      <div className="fw-bold fs-6" style={{ color: isShortage ? 'var(--red-accent)' : 'var(--blue-primary)' }}>
                        {stats.attPct}%
                      </div>
                    </div>
                    <div className="col-4 border-end">
                      <div className="text-muted small fw-semibold" style={{ fontSize: '0.7rem' }}>SEMESTER SGPA</div>
                      <div className="fw-bold fs-6 text-dark">{stats.sgpa}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted small fw-semibold" style={{ fontSize: '0.7rem' }}>COURSES</div>
                      <div className="fw-bold fs-6 text-dark">{stats.enrolledCount}</div>
                    </div>
                  </div>

                  {/* Course Progress Entries */}
                  {stats.enrollments.length > 0 && (
                    <div className="mb-3">
                      <div className="text-muted small fw-semibold mb-1">Enrolled Courses & Progress:</div>
                      <div className="d-flex flex-column gap-1">
                        {stats.enrollments.slice(0, 3).map((enr) => (
                          <div key={enr.id} className="d-flex align-items-center justify-content-between small p-1 bg-white border rounded">
                            <span className="text-truncate" style={{ maxWidth: '240px' }}>
                              {enr.programTitle}
                            </span>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold" style={{ color: 'var(--blue-dark)' }}>
                                {enr.progressPercentage}%
                              </span>
                              <button
                                className="btn btn-outline-secondary btn-sm py-0 px-1"
                                onClick={() => handleOpenProgressModal(enr)}
                                title="Update Course Progress"
                              >
                                <i className="bi bi-pencil" style={{ fontSize: '0.75rem' }}></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
                    <button
                      className="btn btn-sm btn-outline-primary rounded-pill px-3"
                      onClick={() => onSelectStudentForAttendance && onSelectStudentForAttendance(student.id)}
                    >
                      <i className="bi bi-calendar2-check me-1"></i> Manage Attendance
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger rounded-pill px-3"
                      onClick={() => onSelectStudentForScores && onSelectStudentForScores(student.id)}
                    >
                      <i className="bi bi-card-checklist me-1"></i> Enter Marks
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Progress Edit Modal */}
      {selectedEnrollment && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-dark">Update Student Course Progress</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEnrollment(null)}></button>
              </div>
              <form onSubmit={handleSaveProgress}>
                <div className="modal-body p-4">
                  <div className="mb-2 text-muted small">
                    Course: <strong>{selectedEnrollment.programTitle}</strong>
                  </div>
                  <div className="mb-3 text-muted small">
                    Student: <strong>{selectedEnrollment.userName}</strong>
                  </div>

                  <label className="form-label small fw-semibold">
                    Syllabus Covered & Completion: {progressVal}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="form-range"
                    value={progressVal}
                    onChange={(e) => setProgressVal(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>0% (Not Started)</span>
                    <span>50% (Mid-Term)</span>
                    <span>100% (Completed)</span>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setSelectedEnrollment(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-blue-primary" disabled={isUpdatingProgress}>
                    {isUpdatingProgress ? 'Saving...' : 'Update Progress'}
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
