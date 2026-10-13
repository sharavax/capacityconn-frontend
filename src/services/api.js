import axios from 'axios';

const API_BASE = 'http://localhost:8081/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Training Programs / Courses
export const getTrainingPrograms = () => client.get('/training-programs');
export const getTrainingProgramById = (id) => client.get(`/training-programs/${id}`);
export const createTrainingProgram = (data) => client.post('/training-programs', data);
export const updateTrainingProgram = (id, data) => client.put(`/training-programs/${id}`, data);
export const deleteTrainingProgram = (id) => client.delete(`/training-programs/${id}`);

// Competencies & Course Outcomes
export const getCompetencies = () => client.get('/competencies');
export const getUserCompetencies = (userId) => client.get(`/competencies/user/${userId}`);
export const assessUserCompetency = (userId, data) => client.post(`/competencies/user/${userId}/assess`, data);
export const createCompetency = (data) => client.post('/competencies', data);

// Learning Resources / Lab Manuals
export const getLearningResources = () => client.get('/learning-resources');
export const createLearningResource = (data) => client.post('/learning-resources', data);
export const deleteLearningResource = (id) => client.delete(`/learning-resources/${id}`);

// Enrollments & Course Progress
export const getEnrollments = () => client.get('/enrollments');
export const getUserEnrollments = (userId) => client.get(`/enrollments/user/${userId}`);
export const enrollUser = (data) => client.post('/enrollments', data);
export const updateEnrollmentProgress = (id, data) => client.put(`/enrollments/${id}/progress`, data);

// Assessments / Mock Quizzes
export const getAssessments = () => client.get('/assessments');
export const getAssessmentsByProgram = (programId) => client.get(`/assessments/program/${programId}`);
export const submitAssessment = (id, data) => client.post(`/assessments/${id}/submit`, data);

// Student Attendance
export const getAllAttendance = () => client.get('/attendance');
export const getStudentAttendance = (userId) => client.get(`/attendance/student/${userId}`);
export const getCourseAttendance = (courseId) => client.get(`/attendance/course/${courseId}`);
export const createAttendanceRecord = (data) => client.post('/attendance', data);
export const updateAttendance = (id, data) => client.put(`/attendance/${id}`, data);
export const markAttendance = (id, present) => client.post(`/attendance/${id}/mark`, { present });

// Semester Scores & Grade Cards
export const getAllSemesterScores = () => client.get('/scores');
export const getStudentScoresReport = (userId) => client.get(`/scores/student/${userId}`);
export const getCourseScores = (courseId) => client.get(`/scores/course/${courseId}`);
export const createSemesterScore = (data) => client.post('/scores', data);
export const updateSemesterScore = (id, data) => client.put(`/scores/${id}`, data);

// Users / Students / Faculty
export const getUsers = () => client.get('/users');

// AI Assistant & Placement Mentor
export const askAiAssistant = (prompt) => client.post('/ai/chat', { prompt });
export const analyzeAiSkillGaps = (data) => client.post('/ai/skill-gap-analysis', data);
export const generateAiQuiz = (data) => client.post('/ai/generate-quiz', data);

export default client;
