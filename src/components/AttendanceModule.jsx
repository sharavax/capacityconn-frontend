import React, { useState, useEffect } from 'react';
import {
  getStudentAttendance,
  getAllAttendance,
  updateAttendance,
  markAttendance,
  createAttendanceRecord,
  getUsers,
  getTrainingPrograms,
} from '../services/api';

export default function AttendanceModule({ currentUser, currentRole }) {
  const [attendanceList, setAttendanceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  // Edit / Add Modal State (Faculty/Admin only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    totalClasses: 40,
    attendedClasses: 35,
    remarks: '',
  });

  const [addFormData, setAddFormData] = useState({
    userId: '',
    courseId: '',
    totalClasses: 40,
    attendedClasses: 35,
    remarks: 'Regular semester session',
  });

  const isStudent = currentRole === 'EMPLOYEE';
  const isFacultyOrAdmin = currentRole === 'TRAINER' || currentRole === 'ADMIN';

  useEffect(() => {
    loadInitialData();
  }, [currentUser, currentRole]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isFacultyOrAdmin) {
        const [usersRes, coursesRes, allAttRes] = await Promise.all([
          getUsers(),
          getTrainingPrograms(),
          getAllAttendance(),
        ]);
        const allStudents = (usersRes.data || []).filter((u) => u.role === 'EMPLOYEE');
        setStudents(allStudents);
        setCourses(coursesRes.data || []);
        setAttendanceList(allAttRes.data || []);
      } else {
        // Student view - fetch only for current student
        const studentId = currentUser?.id || 3;
        const res = await getStudentAttendance(studentId);
        setAttendanceList(res.data || []);
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
      setErrorMessage('Could not load attendance data from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentFilterChange = async (studentId) => {
    setSelectedStudentId(studentId);
    setIsLoading(true);
    try {
      if (!studentId || studentId === 'ALL') {
        const res = await getAllAttendance();
        setAttendanceList(res.data || []);
      } else {
        const res = await getStudentAttendance(studentId);
        setAttendanceList(res.data || []);
      }
    } catch (err) {
      console.error('Error filtering attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMark = async (recordId, isPresent) => {
    try {
      await markAttendance(recordId, isPresent);
      if (isStudent) {
        const res = await getStudentAttendance(currentUser?.id || 3);
        setAttendanceList(res.data || []);
      } else if (selectedStudentId && selectedStudentId !== 'ALL') {
        const res = await getStudentAttendance(selectedStudentId);
        setAttendanceList(res.data || []);
      } else {
        const res = await getAllAttendance();
        setAttendanceList(res.data || []);
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
      alert('Failed to mark attendance.');
    }
  };

  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setEditFormData({
      totalClasses: rec.totalClasses,
      attendedClasses: rec.attendedClasses,
      remarks: rec.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSubmitting(true);
    try {
      await updateAttendance(editingRecord.id, editFormData);
      setShowEditModal(false);
      if (selectedStudentId && selectedStudentId !== 'ALL') {
        const res = await getStudentAttendance(selectedStudentId);
        setAttendanceList(res.data || []);
      } else {
        const res = await getAllAttendance();
        setAttendanceList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to update attendance:', err);
      alert('Error updating attendance record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAttendance = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createAttendanceRecord(addFormData);
      setShowAddModal(false);
      const res = await getAllAttendance();
      setAttendanceList(res.data || []);
    } catch (err) {
      console.error('Failed to create attendance entry:', err);
      alert('Error adding attendance entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student metrics
  const totalClassesSum = attendanceList.reduce((acc, r) => acc + (r.totalClasses || 0), 0);
  const attendedClassesSum = attendanceList.reduce((acc, r) => acc + (r.attendedClasses || 0), 0);
  const overallPercentage = totalClassesSum > 0 ? ((attendedClassesSum / totalClassesSum) * 100).toFixed(1) : 0;
  const isShortageOverall = overallPercentage < 75.0;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <span className="p-2 rounded-3 text-white" style={{ background: 'var(--blue-primary)' }}>
              <i className="bi bi-calendar2-check-fill fs-6"></i>
            </span>
            {isStudent ? 'My Attendance Record' : 'Student Attendance Management'}
          </h4>
          <p className="text-muted small mb-0">
            {isStudent
              ? 'Subject-wise attendance tracking, minimum 75% examination eligibility criteria, and lab logs.'
              : 'Lecturer and Professor portal for recording daily class attendance and monitoring shortage.'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isFacultyOrAdmin && (
            <button
              className="btn btn-blue-primary d-flex align-items-center gap-2 py-2 small"
              onClick={() => {
                setAddFormData({
                  userId: students[0]?.id || '',
                  courseId: courses[0]?.id || '',
                  totalClasses: 40,
                  attendedClasses: 35,
                  remarks: 'Regular lecture session',
                });
                setShowAddModal(true);
              }}
            >
              <i className="bi bi-plus-lg"></i>
              Add Attendance Entry
            </button>
          )}
          <button className="btn btn-outline-secondary rounded-2" onClick={loadInitialData} title="Refresh">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      {isStudent && (
        <div className="alert bg-light border border-info border-opacity-25 rounded-3 py-2 px-3 mb-3 d-flex align-items-center justify-content-between small">
          <div className="d-flex align-items-center gap-2 text-secondary">
            <i className="bi bi-info-circle-fill text-primary"></i>
            <span>
              <strong>Note:</strong> Attendance is verified and updated by subject professors and course lecturers. Students have read-only access.
            </span>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
            Student Read-Only View
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
              <option value="ALL">All Enrolled Students (Roster View)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department || 'B.Tech CSE'})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-7 text-md-end pt-3 pt-md-0">
            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle me-2 py-2 px-3 small">
              <i className="bi bi-shield-lock-fill me-1"></i> Faculty Edit Access Enabled
            </span>
          </div>
        </div>
      )}

      {/* Metrics Row (for single student view) */}
      {(isStudent || (selectedStudentId && selectedStudentId !== 'ALL')) && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="kpi-card kpi-card-blue">
              <div className="text-muted small fw-semibold">Overall Attendance</div>
              <div className="fs-3 fw-bold mt-1" style={{ color: 'var(--blue-primary)' }}>
                {overallPercentage}%
              </div>
              <div className="small text-muted mt-1">
                {attendedClassesSum} attended of {totalClassesSum} sessions
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className={`kpi-card ${isShortageOverall ? 'kpi-card-red' : 'kpi-card-blue'}`}>
              <div className="text-muted small fw-semibold">Semester Exam Eligibility</div>
              <div className="mt-2">
                {!isShortageOverall ? (
                  <span className="badge bg-success-subtle text-success border border-success-subtle fs-6 py-1 px-3">
                    <i className="bi bi-check-circle-fill me-1"></i> Eligible (&ge; 75%)
                  </span>
                ) : (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle fs-6 py-1 px-3">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Shortage Warning (&lt; 75%)
                  </span>
                )}
              </div>
              <div className="small text-muted mt-2">
                {!isShortageOverall ? 'Meets university examination criteria' : 'Requires condonation approval or remedial classes'}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="kpi-card kpi-card-blue">
              <div className="text-muted small fw-semibold">Subjects Tracked</div>
              <div className="fs-3 fw-bold text-dark mt-1">{attendanceList.length} Courses</div>
              <div className="small text-muted mt-1">Current Academic Term</div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading attendance records from database...</p>
        </div>
      ) : attendanceList.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3 border border-dashed">
          <i className="bi bi-calendar-x fs-2 text-muted"></i>
          <h6 className="fw-bold mt-2 text-dark">No Attendance Records Found</h6>
          <p className="text-muted small mb-0">Records will appear once faculty logs course sessions.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="academic-table table">
            <thead>
              <tr>
                {isFacultyOrAdmin && <th>Student Name</th>}
                <th>Course / Subject</th>
                <th>Sessions Held</th>
                <th>Attended</th>
                <th style={{ width: '180px' }}>Attendance Rate</th>
                <th>Status</th>
                <th>Faculty Remarks</th>
                {isFacultyOrAdmin && <th className="text-end" style={{ width: '170px' }}>Faculty Actions</th>}
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((rec) => {
                const pct = rec.attendancePercentage;
                const isShortage = pct < 75.0;

                return (
                  <tr key={rec.id}>
                    {isFacultyOrAdmin && (
                      <td className="fw-semibold text-dark">{rec.studentName}</td>
                    )}
                    <td>
                      <div className="fw-bold text-dark">{rec.courseTitle}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1">
                        {rec.totalClasses} classes
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{rec.attendedClasses}</span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-between small fw-bold mb-1">
                        <span style={{ color: isShortage ? 'var(--red-accent)' : 'var(--blue-primary)' }}>
                          {pct}%
                        </span>
                        <span className="text-muted small">Min 75%</span>
                      </div>
                      <div className="skill-bar-container">
                        <div
                          className={isShortage ? 'skill-bar-fill-red' : 'skill-bar-fill-blue'}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      {pct >= 75 ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-check-circle me-1"></i>Eligible
                        </span>
                      ) : pct >= 65 ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                          <i className="bi bi-exclamation-circle me-1"></i>Warning
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          <i className="bi bi-x-octagon me-1"></i>Shortage
                        </span>
                      )}
                    </td>
                    <td className="text-muted small">
                      {rec.remarks || 'Regular class attendance'}
                    </td>
                    {isFacultyOrAdmin && (
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleQuickMark(rec.id, true)}
                            title="Mark Present (+1)"
                          >
                            <i className="bi bi-check2"></i> Present
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleQuickMark(rec.id, false)}
                            title="Mark Absent (+0 attended, +1 total)"
                          >
                            <i className="bi bi-x"></i> Absent
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenEdit(rec)}
                            title="Edit Record"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Attendance Modal (Faculty/Admin only) */}
      {showEditModal && editingRecord && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  Edit Attendance: {editingRecord.studentName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  <div className="small text-muted mb-3">
                    Course: <strong>{editingRecord.courseTitle}</strong>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Total Classes Held</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control rounded-2"
                        required
                        value={editFormData.totalClasses}
                        onChange={(e) => setEditFormData({ ...editFormData, totalClasses: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Classes Attended</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control rounded-2"
                        required
                        value={editFormData.attendedClasses}
                        onChange={(e) => setEditFormData({ ...editFormData, attendedClasses: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Faculty Remarks</label>
                    <input
                      type="text"
                      className="form-control rounded-2"
                      placeholder="e.g. Leave submitted; regular participation"
                      value={editFormData.remarks}
                      onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-blue-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Save Attendance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Attendance Entry Modal (Faculty/Admin only) */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-dark">Add New Attendance Record</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleCreateAttendance}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Student</label>
                    <select
                      className="form-select rounded-2"
                      required
                      value={addFormData.userId}
                      onChange={(e) => setAddFormData({ ...addFormData, userId: e.target.value })}
                    >
                      <option value="">Choose Student...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Course</label>
                    <select
                      className="form-select rounded-2"
                      required
                      value={addFormData.courseId}
                      onChange={(e) => setAddFormData({ ...addFormData, courseId: e.target.value })}
                    >
                      <option value="">Choose Course...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Total Classes Held</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control rounded-2"
                        required
                        value={addFormData.totalClasses}
                        onChange={(e) => setAddFormData({ ...addFormData, totalClasses: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Classes Attended</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control rounded-2"
                        required
                        value={addFormData.attendedClasses}
                        onChange={(e) => setAddFormData({ ...addFormData, attendedClasses: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Remarks</label>
                    <input
                      type="text"
                      className="form-control rounded-2"
                      value={addFormData.remarks}
                      onChange={(e) => setAddFormData({ ...addFormData, remarks: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-blue-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Create Record'}
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
