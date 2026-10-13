import React, { useState, useEffect } from 'react';
import {
  getUserCompetencies,
  assessUserCompetency,
  createCompetency,
  analyzeAiSkillGaps,
} from '../services/api';

export default function CompetencyHubModule({ currentUser, currentRole }) {
  const [competencies, setCompetencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newComp, setNewComp] = useState({
    name: '',
    category: 'Data Structures',
    description: '',
    targetBenchmarkLevel: 4,
    applicableDepartment: 'Computer Science & Engineering',
  });

  const userId = currentUser?.id || 3;

  useEffect(() => {
    fetchUserCompetencies();
  }, [userId]);

  const fetchUserCompetencies = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await getUserCompetencies(userId);
      setCompetencies(res.data || []);
    } catch (err) {
      console.error('Failed to load course outcome benchmarks:', err);
      setErrorMessage('Could not load course outcome profile from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLevel = async (competencyId, newLevel, targetLevel) => {
    try {
      await assessUserCompetency(userId, {
        competencyId,
        currentLevel: newLevel,
        targetLevel,
      });
      fetchUserCompetencies();
    } catch (err) {
      console.error('Failed to update competency level:', err);
      alert('Failed to update skill self-assessment.');
    }
  };

  const handleRunAiSkillGapAnalysis = async () => {
    setIsAiAnalyzing(true);
    try {
      const payload = {
        userName: currentUser?.name || 'Rahul Verma',
        role: currentUser?.designation || 'B.Tech CSE Student (Sem 6)',
        skills: competencies.map((c) => ({
          competencyName: c.competencyName,
          currentLevel: c.currentLevel,
          targetLevel: c.targetLevel,
        })),
      };
      const res = await analyzeAiSkillGaps(payload);
      setAiAnalysisResult(res.data?.analysis || 'No analysis generated.');
    } catch (err) {
      console.error('Error in AI skill-gap analysis:', err);
      alert('AI skill gap analysis request failed.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleCreateCompetency = async (e) => {
    e.preventDefault();
    try {
      await createCompetency(newComp);
      setShowAddModal(false);
      setNewComp({
        name: '',
        category: 'Data Structures',
        description: '',
        targetBenchmarkLevel: 4,
        applicableDepartment: 'Computer Science & Engineering',
      });
      fetchUserCompetencies();
    } catch (err) {
      console.error('Failed to create course outcome:', err);
      alert('Failed to create course outcome benchmark.');
    }
  };

  const totalCompetencies = competencies.length;
  const criticalGaps = competencies.filter((c) => c.skillGap >= 2).length;
  const avgCurrentLevel = totalCompetencies
    ? (competencies.reduce((acc, c) => acc + c.currentLevel, 0) / totalCompetencies).toFixed(1)
    : 0;
  const avgTargetLevel = totalCompetencies
    ? (competencies.reduce((acc, c) => acc + c.targetLevel, 0) / totalCompetencies).toFixed(1)
    : 0;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <span className="p-2 rounded-3 text-white" style={{ background: 'var(--red-accent)' }}>
              <i className="bi bi-bullseye fs-6"></i>
            </span>
            B.Tech Course Outcomes & Skill Gap Matrix
          </h4>
          <p className="text-muted small mb-0">
            Compare student proficiency levels against syllabus benchmarks and placement technical bars.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-ai-portal d-flex align-items-center gap-2 px-3 py-2 small"
            onClick={handleRunAiSkillGapAnalysis}
            disabled={isAiAnalyzing || competencies.length === 0}
          >
            {isAiAnalyzing ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <i className="bi bi-stars"></i>
                AI Skill Gap Analysis
              </>
            )}
          </button>

          {currentRole === 'ADMIN' && (
            <button
              className="btn btn-blue-primary d-flex align-items-center gap-2 py-2 small"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-lg"></i>
              Add Benchmark
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="kpi-card kpi-card-blue">
            <div className="text-muted small fw-semibold">Course Outcomes Tracked</div>
            <div className="fs-3 fw-bold text-dark mt-1">{totalCompetencies}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card kpi-card-blue">
            <div className="text-muted small fw-semibold">Current Student Index</div>
            <div className="fs-3 fw-bold mt-1" style={{ color: 'var(--blue-primary)' }}>
              {avgCurrentLevel} / 5.0
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card kpi-card-blue">
            <div className="text-muted small fw-semibold">Target Syllabus Benchmark</div>
            <div className="fs-3 fw-bold text-dark mt-1">{avgTargetLevel} / 5.0</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card kpi-card-red">
            <div className="text-muted small fw-semibold">Priority Learning Gaps</div>
            <div className="fs-3 fw-bold mt-1" style={{ color: 'var(--red-accent)' }}>
              {criticalGaps} Gaps
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Result Callout */}
      {aiAnalysisResult && (
        <div className="alert bg-white border border-danger border-opacity-25 rounded-4 p-4 mb-4 shadow-sm" style={{ borderLeft: '4px solid var(--red-accent)' }}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--red-dark)' }}>
              <i className="bi bi-robot text-danger"></i>
              Gemini AI Academic & Skill Gap Recommendations
            </h6>
            <button
              className="btn-close"
              onClick={() => setAiAnalysisResult('')}
              aria-label="Close"
            ></button>
          </div>
          <div
            className="small text-dark mt-2"
            style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
          >
            {aiAnalysisResult}
          </div>
        </div>
      )}

      {/* Competencies Matrix Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading course outcomes...</p>
        </div>
      ) : competencies.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <p className="text-muted mb-0">No course outcomes defined yet.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="academic-table table">
            <thead>
              <tr>
                <th>Outcome / Core Engineering Area</th>
                <th>Subject Area</th>
                <th style={{ width: '220px' }}>Current vs Target Level</th>
                <th>Syllabus Gap Status</th>
                <th className="text-end" style={{ width: '170px' }}>Self-Rate (1-5)</th>
              </tr>
            </thead>
            <tbody>
              {competencies.map((comp) => {
                const current = comp.currentLevel;
                const target = comp.targetLevel;
                const gap = comp.skillGap;

                return (
                  <tr key={comp.competencyId}>
                    <td>
                      <div className="fw-bold text-dark">{comp.competencyName}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '360px' }}>
                        {comp.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {comp.category}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-between small fw-semibold mb-1">
                        <span style={{ color: 'var(--blue-primary)' }}>Proficiency: {current}/5</span>
                        <span className="text-muted">Target: {target}/5</span>
                      </div>
                      <div className="skill-bar-container position-relative">
                        <div
                          className={gap === 0 ? 'skill-bar-fill-blue' : 'skill-bar-fill-red'}
                          style={{ width: `${(current / 5) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      {gap === 0 ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-check2-circle me-1"></i>Benchmark Met
                        </span>
                      ) : gap === 1 ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                          <i className="bi bi-dash-circle me-1"></i>Gap: -1 Level
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          <i className="bi bi-exclamation-octagon me-1"></i>Gap: -{gap} (Action Required)
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            className={`btn ${
                              current === lvl ? 'btn-primary' : 'btn-outline-secondary'
                            } px-2`}
                            onClick={() => handleUpdateLevel(comp.competencyId, lvl, target)}
                            title={`Set level to ${lvl}`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Benchmark Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold">Add Course Outcome Benchmark</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateCompetency}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Outcome Name</label>
                    <input
                      type="text"
                      className="form-control rounded-2"
                      required
                      placeholder="e.g. Dynamic Programming & Graph Algorithms"
                      value={newComp.name}
                      onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Course Area</label>
                    <select
                      className="form-select rounded-2"
                      value={newComp.category}
                      onChange={(e) => setNewComp({ ...newComp, category: e.target.value })}
                    >
                      <option value="Data Structures">Data Structures & Algorithms</option>
                      <option value="Operating Systems">Operating Systems</option>
                      <option value="Database Systems">Database Systems</option>
                      <option value="Data Science & AI">Data Science & AI</option>
                      <option value="Software Engineering">Software Engineering</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea
                      rows="2"
                      className="form-control rounded-2"
                      placeholder="Syllabus unit mapping and Bloom's taxonomy level..."
                      value={newComp.description}
                      onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Target Benchmark Level (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control rounded-2"
                      required
                      value={newComp.targetBenchmarkLevel}
                      onChange={(e) =>
                        setNewComp({ ...newComp, targetBenchmarkLevel: parseInt(e.target.value) })
                      }
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
                    Save Benchmark
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
