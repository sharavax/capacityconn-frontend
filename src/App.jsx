import React, { useState, useEffect } from 'react';
import { getUsers, enrollUser } from './services/api';
import TrainingProgramsModule from './components/TrainingProgramsModule';
import CompetencyHubModule from './components/CompetencyHubModule';
import LearningResourcesModule from './components/LearningResourcesModule';
import EnrollmentAndQuizModule from './components/EnrollmentAndQuizModule';
import AttendanceModule from './components/AttendanceModule';
import SemesterScoresModule from './components/SemesterScoresModule';
import StudentDetailsModule from './components/StudentDetailsModule';
import AiAssistantDrawer from './components/AiAssistantDrawer';

export default function App() {
  const [currentRole, setCurrentRole] = useState('EMPLOYEE'); // Default: Student
  const [currentUser, setCurrentUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance'); // Default for student: Attendance
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(true);

  // Role booleans
  const isStudent = currentRole === 'EMPLOYEE';
  const isFaculty = currentRole === 'TRAINER';
  const isAdmin = currentRole === 'ADMIN';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      const users = res.data || [];
      setUsersList(users);
      const studentUser = users.find((u) => u.role === 'EMPLOYEE') || users[0];
      setCurrentUser(studentUser);
      if (studentUser) {
        setCurrentRole(studentUser.role);
        setActiveTab('attendance');
      }
    } catch (err) {
      console.warn('Backend users not loaded yet, using fallback.');
      setCurrentUser({
        id: 3,
        name: 'Meera Nair',
        role: 'EMPLOYEE',
        department: 'Semester 6',
        designation: 'B.Tech CSE Student',
      });
      setCurrentRole('EMPLOYEE');
      setActiveTab('attendance');
    }
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    const matched = usersList.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
    } else {
      if (role === 'ADMIN') {
        setCurrentUser({ id: 1, name: 'Dr. Ananya Rao', role: 'ADMIN', designation: 'Program Coordinator' });
      } else if (role === 'TRAINER') {
        setCurrentUser({ id: 2, name: 'Prof. Karthik Menon', role: 'TRAINER', designation: 'Faculty Mentor' });
      } else {
        setCurrentUser({ id: 3, name: 'Meera Nair', role: 'EMPLOYEE', designation: 'B.Tech CSE Student' });
      }
    }

    // Adjust active tab to appropriate default for the role
    if (role === 'EMPLOYEE') {
      setActiveTab('attendance'); // Student lands on their attendance
    } else if (role === 'TRAINER') {
      setActiveTab('students'); // Faculty lands on Student Details & Roster
    } else {
      setActiveTab('programs'); // Admin lands on Syllabus
    }
  };

  const handleEnrollFromTable = async (program) => {
    try {
      await enrollUser({
        userId: currentUser?.id || 3,
        programId: program.id,
      });
      showToast(`Enrolled in "${program.title}" successfully!`);
      setActiveTab('progress');
    } catch (err) {
      console.error('Enrollment error:', err);
      showToast('Could not complete enrollment.');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-success shadow-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2 border-0"
          style={{ zIndex: 2000, background: '#10b981', color: '#fff' }}
        >
          <i className="bi bi-check-circle-fill fs-5"></i>
          <span className="fw-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top py-2 px-3">
        <div className="container-fluid px-2">
          {/* Brand */}
          <div className="d-flex align-items-center gap-2 me-4">
            <div
              className="rounded-3 p-2 text-white shadow-sm"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <i className="bi bi-mortarboard-fill fs-5"></i>
            </div>
            <div>
              <span className="brand-title fs-5 mb-0 d-block lh-1">
                Capacity Connect
              </span>
              <span className="text-muted small fw-medium" style={{ fontSize: '0.72rem' }}>
                B.Tech Student & Academics Portal
              </span>
            </div>
          </div>

          {/* Role-Based Navigation Tabs */}
          <div className="d-flex flex-wrap gap-1 me-auto my-2 my-lg-0">
            {/* 1. STUDENT VIEW TABS (Available to Student & Admin) */}
            {isStudent && (
              <>
                <button
                  className={`nav-pill-subtle ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  <i className="bi bi-calendar2-check text-primary"></i> My Attendance
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'scores' ? 'active' : ''}`}
                  onClick={() => setActiveTab('scores')}
                >
                  <i className="bi bi-file-earmark-spreadsheet text-danger"></i> Semester Scores & SGPA
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'progress' ? 'active' : ''}`}
                  onClick={() => setActiveTab('progress')}
                >
                  <i className="bi bi-check2-circle text-success"></i> Course Progress & Quizzes
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'programs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('programs')}
                >
                  <i className="bi bi-journal-text text-primary"></i> Syllabus & Courses
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'competencies' ? 'active' : ''}`}
                  onClick={() => setActiveTab('competencies')}
                >
                  <i className="bi bi-bullseye text-warning"></i> Course Outcomes
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resources')}
                >
                  <i className="bi bi-folder2-open text-info"></i> Lab Manuals & Notes
                </button>
              </>
            )}

            {/* 2. FACULTY VIEW TABS (Faculty View & Student Details) */}
            {isFaculty && (
              <>
                <button
                  className={`nav-pill-subtle ${activeTab === 'students' ? 'active' : ''}`}
                  onClick={() => setActiveTab('students')}
                >
                  <i className="bi bi-people-fill text-primary"></i> Student Details & Roster
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  <i className="bi bi-calendar-check-fill text-danger"></i> Manage Attendance (Edit)
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'scores' ? 'active' : ''}`}
                  onClick={() => setActiveTab('scores')}
                >
                  <i className="bi bi-award-fill text-primary"></i> Gradebook & Marks (Edit)
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'programs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('programs')}
                >
                  <i className="bi bi-journal-bookmark-fill text-danger"></i> Syllabus & Courses
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resources')}
                >
                  <i className="bi bi-folder-fill text-info"></i> Lab Manuals & Handouts
                </button>
              </>
            )}

            {/* 3. ADMIN VIEW TABS (Admin has access to ALL views) */}
            {isAdmin && (
              <>
                <button
                  className={`nav-pill-subtle ${activeTab === 'students' ? 'active' : ''}`}
                  onClick={() => setActiveTab('students')}
                >
                  <i className="bi bi-people text-primary"></i> Student Roster
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  <i className="bi bi-calendar2-check text-danger"></i> All Attendance
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'scores' ? 'active' : ''}`}
                  onClick={() => setActiveTab('scores')}
                >
                  <i className="bi bi-file-earmark-spreadsheet text-primary"></i> All Semester Scores
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'programs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('programs')}
                >
                  <i className="bi bi-journal-text text-danger"></i> Syllabus Plans
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'competencies' ? 'active' : ''}`}
                  onClick={() => setActiveTab('competencies')}
                >
                  <i className="bi bi-bullseye text-warning"></i> Outcome Benchmarks
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resources')}
                >
                  <i className="bi bi-folder2-open text-info"></i> Lab Repository
                </button>
                <button
                  className={`nav-pill-subtle ${activeTab === 'progress' ? 'active' : ''}`}
                  onClick={() => setActiveTab('progress')}
                >
                  <i className="bi bi-check2-circle text-success"></i> Exam Milestones
                </button>
              </>
            )}
          </div>

          {/* Right Controls: AI Assistant & Academic Role Switcher */}
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-ai-portal d-flex align-items-center gap-2 px-3 py-2 small"
              onClick={() => setIsAiDrawerOpen(true)}
            >
              <i className="bi bi-stars"></i>
              <span className="d-none d-sm-inline">AI Mentor (Gemini 3.8)</span>
            </button>

            {/* Academic Role Selector */}
            <div className="dropdown position-relative">
              <button
                className="btn btn-light border dropdown-toggle d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div
                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '28px',
                    height: '28px',
                    fontSize: '0.75rem',
                    backgroundColor:
                      isAdmin
                        ? 'var(--blue-dark)'
                        : isFaculty
                        ? 'var(--blue-primary)'
                        : 'var(--red-accent)',
                  }}
                >
                  {isStudent ? 'S' : isFaculty ? 'F' : 'A'}
                </div>
                <div className="text-start d-none d-md-block">
                  <div className="fw-bold small lh-1 text-dark">
                    {currentUser?.name || currentRole}
                  </div>
                  <span className="badge p-0 text-muted" style={{ fontSize: '0.65rem' }}>
                    {isStudent ? 'Student (Self View)' : isFaculty ? 'Faculty (Grading Access)' : 'Dean (Full Access)'}
                  </span>
                </div>
              </button>

              <ul
                className={`dropdown-menu dropdown-menu-end shadow border rounded-3 ${
                  isUserMenuOpen ? 'show' : ''
                }`}
                style={{ position: 'absolute', right: 0 }}
              >
                <li className="dropdown-header text-uppercase small fw-bold text-muted">Switch Academic Persona</li>
                <li>
                  <button
                    className={`dropdown-item ${isStudent ? 'active' : ''}`}
                    onClick={() => {
                      handleRoleChange('EMPLOYEE');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <i className="bi bi-person-fill text-danger me-2"></i> B.Tech Student (Meera Nair)
                    <div className="small text-muted ps-4" style={{ fontSize: '0.7rem' }}>Access: Student View Only</div>
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${isFaculty ? 'active' : ''}`}
                    onClick={() => {
                      handleRoleChange('TRAINER');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <i className="bi bi-person-badge-fill text-primary me-2"></i> Faculty (Prof. Karthik Menon)
                    <div className="small text-muted ps-4" style={{ fontSize: '0.7rem' }}>Access: Faculty View + Student Details + Grading</div>
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${isAdmin ? 'active' : ''}`}
                    onClick={() => {
                      handleRoleChange('ADMIN');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <i className="bi bi-shield-lock-fill text-dark me-2"></i> Academic Dean / HOD (Dr. Ananya Rao)
                    <div className="small text-muted ps-4" style={{ fontSize: '0.7rem' }}>Access: All Portal Views & Admin Controls</div>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Strip */}
      <div
        className="text-white py-3 px-4 mb-3"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="container-fluid">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <span className="badge bg-white bg-opacity-10 border border-white border-opacity-25 text-white px-2 py-1 mb-1">
                <i className="bi bi-mortarboard me-1 text-danger"></i> B.Tech Computer Science & Engineering
              </span>
              <h5 className="fw-bold mb-0">
                {isStudent
                  ? 'B.Tech Student Portal — Attendance, Scores & Learning'
                  : isFaculty
                  ? 'Faculty Academic Management & Grading Portal'
                  : 'Dean of Academic Affairs & Curriculum Management Portal'}
              </h5>
            </div>
            <div className="d-flex gap-3 small text-white-50">
              <div>
                <strong className="text-white">Active User:</strong> {currentUser?.name}
              </div>
              <div>|</div>
              <div>
                <strong className="text-white">Access Level:</strong>{' '}
                <span className={isStudent ? 'text-warning' : isFaculty ? 'text-info' : 'text-danger'}>
                  {isStudent ? 'Student View' : isFaculty ? 'Faculty & Student Details' : 'Administrator (All Views)'}
                </span>
              </div>
              <div>|</div>
              <div>
                <strong className="text-white">Backend:</strong>{' '}
                <span className="text-success fw-bold">
                  <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.45rem' }}></i>
                  Port 8081 Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guided Walkthrough Banner */}
      {showWalkthrough && (
        <div className="container-fluid px-4 mb-3">
          <div className="walkthrough-banner shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-3 p-2 text-white"
                style={{ background: 'var(--red-accent)', marginTop: '2px' }}
              >
                <i className="bi bi-compass-fill fs-5"></i>
              </div>
              <div>
                <div className="fw-bold text-dark small">
                  {isStudent
                    ? 'B.Tech Student Walkthrough Guide'
                    : isFaculty
                    ? 'Faculty & Lecturer Portal Guide'
                    : 'Dean & Administrator Full Access Guide'}
                </div>
                <div className="text-secondary small mt-1">
                  {isStudent ? (
                    <>
                      <strong>1. My Attendance:</strong> Check subject attendance & &ge;75% exam eligibility.&nbsp;&bull;&nbsp;
                      <strong>2. Semester Scores:</strong> View CIE marks, end-sem grades & SGPA.&nbsp;&bull;&nbsp;
                      <strong>3. Progress & Quizzes:</strong> Track unit completion & take mock tests.&nbsp;&bull;&nbsp;
                      <strong>4. Syllabus:</strong> Register in courses.&nbsp;&bull;&nbsp;
                      <strong>5. AI Mentor:</strong> Get 24/7 academic coaching.
                    </>
                  ) : isFaculty ? (
                    <>
                      <strong>1. Student Roster:</strong> View student profiles, attendance rates & SGPA.&nbsp;&bull;&nbsp;
                      <strong>2. Attendance (Edit):</strong> 1-click mark Present/Absent or update sessions.&nbsp;&bull;&nbsp;
                      <strong>3. Gradebook (Edit):</strong> Record CIE 1, CIE 2, assignment & end-sem marks.&nbsp;&bull;&nbsp;
                      <strong>4. Syllabus:</strong> Review course outcomes.
                    </>
                  ) : (
                    <>
                      <strong>Dean Full Access:</strong> Manage students, faculty, syllabus creation, attendance audits, gradebook oversight, and curriculum outcomes benchmarks.
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-nowrap"
              onClick={() => setShowWalkthrough(false)}
            >
              <i className="bi bi-x-lg me-1"></i> Dismiss Guide
            </button>
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <main className="container-fluid px-4 flex-grow-1">
        {/* Attendance Module */}
        {activeTab === 'attendance' && (
          <AttendanceModule
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}

        {/* Semester Scores Module */}
        {activeTab === 'scores' && (
          <SemesterScoresModule
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}

        {/* Student Details & Roster (Faculty & Admin) */}
        {activeTab === 'students' && (isFaculty || isAdmin) && (
          <StudentDetailsModule
            onSelectStudentForAttendance={(studentId) => {
              setActiveTab('attendance');
            }}
            onSelectStudentForScores={(studentId) => {
              setActiveTab('scores');
            }}
          />
        )}

        {/* Syllabus & Courses Module */}
        {activeTab === 'programs' && (
          <TrainingProgramsModule
            currentRole={currentRole}
            onEnrollClick={handleEnrollFromTable}
          />
        )}

        {/* Course Outcomes Module */}
        {activeTab === 'competencies' && (
          <CompetencyHubModule
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}

        {/* Lab Manuals & Notes Module */}
        {activeTab === 'resources' && (
          <LearningResourcesModule currentRole={currentRole} />
        )}

        {/* Course Progress & Mock Tests */}
        {activeTab === 'progress' && (
          <EnrollmentAndQuizModule
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}
      </main>

      {/* AI Assistant Modal Drawer */}
      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-top py-3 px-4 text-center text-muted small mt-auto">
        <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <strong>Capacity Connect</strong> &copy; 2026. B.Tech Engineering, Attendance & Competency Platform.
          </div>
          <div className="d-flex gap-3">
            <span className="text-primary fw-medium">Spring Boot 4 / MySQL</span>
            <span>&bull;</span>
            <span className="text-danger fw-medium">React + Bootstrap (Red/Blue Accents)</span>
            <span>&bull;</span>
            <span className="text-primary fw-medium">Role-Based Access Control (RBAC)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
