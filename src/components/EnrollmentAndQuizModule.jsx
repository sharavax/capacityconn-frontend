import React, { useState, useEffect } from 'react';
import {
  getUserEnrollments,
  updateEnrollmentProgress,
  getAssessments,
  submitAssessment,
} from '../services/api';

export default function EnrollmentAndQuizModule({ currentUser, currentRole }) {
  const [enrollments, setEnrollments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const userId = currentUser?.id || 3;

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [enrRes, assRes] = await Promise.all([
        getUserEnrollments(userId),
        getAssessments(),
      ]);
      setEnrollments(enrRes.data || []);
      setAssessments(assRes.data || []);
    } catch (err) {
      console.error('Failed to load enrolled courses or mock exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async (id, currentProgress) => {
    const nextProgress = Math.min(100, currentProgress + 25);
    try {
      await updateEnrollmentProgress(id, {
        progressPercentage: nextProgress,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update semester study progress:', err);
    }
  };

  const handleStartAssessment = (assessment) => {
    try {
      const parsed = JSON.parse(assessment.questionsJson);
      setQuizQuestions(parsed);
      setActiveQuiz(assessment);
      setUserAnswers({});
      setQuizResult(null);
    } catch (e) {
      alert('Failed to parse assessment questions.');
    }
  };

  const handleSelectOption = (qIndex, optionIndex) => {
    setUserAnswers({ ...userAnswers, [qIndex]: optionIndex });
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < quizQuestions.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit your mock test?')) {
        return;
      }
    }

    setIsSubmittingQuiz(true);
    try {
      let correctCount = 0;
      quizQuestions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctIndex) {
          correctCount++;
        }
      });

      const calculatedScore = Math.round((correctCount / quizQuestions.length) * 100);

      const res = await submitAssessment(activeQuiz.id, {
        userId,
        score: calculatedScore,
      });

      setQuizResult({
        ...res.data,
        correctCount,
        totalQuestions: quizQuestions.length,
      });

      // Update progress to 100% and record score
      const enrolled = enrollments.find((e) => e.programId === activeQuiz.programId);
      if (enrolled) {
        await updateEnrollmentProgress(enrolled.id, {
          progressPercentage: 100,
          status: 'COMPLETED',
          score: calculatedScore,
        });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to submit test:', err);
      alert('Error recording mock exam results.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <span className="p-2 rounded-3 text-white" style={{ background: 'var(--red-accent)' }}>
              <i className="bi bi-mortarboard-fill fs-6"></i>
            </span>
            Semester Study Milestones & Technical Mock Assessments
          </h4>
          <p className="text-muted small mb-0">
            Log unit study progress, verify subject comprehension, and test readiness for GATE & placement interviews.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading student milestones and assessments...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Enrollments Progress */}
          <div className="col-lg-7">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-pie-chart text-primary"></i>
              Enrolled Course Progress & Unit Coverage
            </h6>
            {enrollments.length === 0 ? (
              <div className="p-4 bg-light rounded-3 text-center text-muted">
                No active semester courses enrolled yet. Select courses from the Syllabus tab!
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {enrollments.map((enr) => (
                  <div key={enr.id} className="p-3 bg-white border rounded-3 shadow-sm" style={{ borderLeft: '3px solid var(--blue-primary)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="fw-bold text-dark mb-0">{enr.programTitle}</h6>
                      <span
                        className={`badge ${
                          enr.status === 'COMPLETED'
                            ? 'badge-status-completed'
                            : 'badge-status-active'
                        }`}
                      >
                        {enr.status}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between small text-muted my-2">
                      <span>Enrolled on: {enr.enrolledDate}</span>
                      <span className="fw-bold" style={{ color: 'var(--blue-dark)' }}>
                        Syllabus Covered: {enr.progressPercentage}%
                      </span>
                    </div>

                    <div className="progress mb-3" style={{ height: '7px' }}>
                      <div
                        className={`progress-bar ${
                          enr.progressPercentage === 100 ? 'bg-success' : 'bg-primary'
                        }`}
                        style={{ width: `${enr.progressPercentage}%` }}
                      ></div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      {enr.score != null ? (
                        <span className="small text-success fw-bold">
                          <i className="bi bi-award-fill me-1 text-danger"></i> Mock Score: {enr.score}% (Outcome Met)
                        </span>
                      ) : (
                        <span className="small text-muted">Assessment pending</span>
                      )}

                      {enr.progressPercentage < 100 && (
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => handleUpdateProgress(enr.id, enr.progressPercentage)}
                        >
                          <i className="bi bi-check2-circle me-1"></i> Log Study Unit (+25%)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Certification Exams */}
          <div className="col-lg-5">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-shield-check text-danger"></i>
              Outcome Verification & Mock Tests
            </h6>
            {assessments.length === 0 ? (
              <div className="p-4 bg-light rounded-3 text-center text-muted">
                No mock assessments configured.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {assessments.map((ass) => (
                  <div key={ass.id} className="p-3 bg-light border rounded-3" style={{ borderTop: '3px solid var(--red-accent)' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-white text-danger border border-danger-subtle fw-semibold">
                        Passing Mark: {ass.passingScore}%
                      </span>
                      <i className="bi bi-mortarboard text-primary fs-5"></i>
                    </div>

                    <h6 className="fw-bold text-dark mb-1">{ass.title}</h6>
                    <p className="text-muted small mb-3">{ass.programTitle}</p>

                    <button
                      className="btn btn-red-accent btn-sm w-100"
                      onClick={() => handleStartAssessment(ass)}
                    >
                      <i className="bi bi-pencil-square me-1"></i> Start Technical Mock Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Quiz Modal */}
      {activeQuiz && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">{activeQuiz.title}</h5>
                  <p className="text-muted small mb-0">{activeQuiz.programTitle}</p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveQuiz(null)}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {quizResult ? (
                  <div className="text-center py-4">
                    <div className="mb-3">
                      <i
                        className={`bi ${
                          quizResult.passed
                            ? 'bi-check-circle-fill text-success fs-1'
                            : 'bi-exclamation-circle-fill text-danger fs-1'
                        }`}
                      ></i>
                    </div>
                    <h5 className="fw-bold mb-1">
                      {quizResult.passed ? 'Mock Assessment Cleared!' : 'Further Revision Recommended'}
                    </h5>
                    <p className="fs-5 fw-bold text-primary mb-2">
                      Score: {quizResult.score}% ({quizResult.correctCount} of {quizResult.totalQuestions} correct)
                    </p>
                    <p className="text-muted small mb-4">{quizResult.feedback}</p>
                    <button
                      className="btn btn-blue-primary"
                      onClick={() => setActiveQuiz(null)}
                    >
                      Back to Student Dashboard
                    </button>
                  </div>
                ) : (
                  <div>
                    {quizQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="mb-4 p-3 bg-light rounded-3 border">
                        <div className="fw-bold mb-2 text-dark">
                          Q{qIdx + 1}. {q.question}
                        </div>
                        <div className="d-flex flex-column gap-2">
                          {q.options.map((opt, oIdx) => (
                            <label
                              key={oIdx}
                              className={`p-2 px-3 rounded-2 border cursor-pointer d-flex align-items-center gap-2 ${
                                userAnswers[qIdx] === oIdx
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-white text-dark'
                              }`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSelectOption(qIdx, oIdx)}
                            >
                              <input
                                type="radio"
                                name={`q_${qIdx}`}
                                checked={userAnswers[qIdx] === oIdx}
                                onChange={() => handleSelectOption(qIdx, oIdx)}
                                className="form-check-input mt-0"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!quizResult && (
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-2"
                    onClick={() => setActiveQuiz(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-blue-primary"
                    disabled={isSubmittingQuiz}
                    onClick={handleSubmitQuiz}
                  >
                    {isSubmittingQuiz ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Evaluating...
                      </>
                    ) : (
                      'Submit Mock Answers'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
