import apiClient from './apiClient';

const cohortService = {
  // Get all cohorts (generic method)
  getCohorts: async () => {
    const response = await apiClient.get('/cohorts');
    return response.data;
  },

  // Get cohorts by school
  getCohortsBySchool: async (schoolId) => {
    const response = await apiClient.get(`/cohorts/school/${schoolId}`);
    return response.data;
  },

  // Get cohorts by trainer (optimized - uses user.cohorts field)
  getCohortsByTrainer: async (trainerId) => {
    const response = await apiClient.get(`/cohorts/trainer/${trainerId}`);
    return response.data;
  },

  // Get user's cohorts from their cohorts field (optimized approach)
  getUserCohorts: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data.user.cohorts || [];
  },

  // Create a new cohort
  createCohort: async (cohortData) => {
    const response = await apiClient.post('/cohorts', cohortData);
    return response.data;
  },

  // Update cohort
  updateCohort: async (cohortId, cohortData) => {
    const response = await apiClient.put(`/cohorts/${cohortId}`, cohortData);
    return response.data;
  },

  // Delete cohort
  deleteCohort: async (cohortId) => {
    const response = await apiClient.delete(`/cohorts/${cohortId}`);
    return response.data;
  },

  // Add trainer to cohort
  addTrainerToCohort: async (cohortId, trainerId) => {
    const response = await apiClient.post(`/cohorts/${cohortId}/trainers`, { trainerId });
    return response.data;
  },

  // Remove trainer from cohort
  removeTrainerFromCohort: async (cohortId, trainerId) => {
    const response = await apiClient.delete(`/cohorts/${cohortId}/trainers/${trainerId}`);
    return response.data;
  },

  // Add student to cohort
  addStudentToCohort: async (cohortId, studentId) => {
    const response = await apiClient.post(`/cohorts/${cohortId}/students`, { studentId });
    return response.data;
  },

  // Remove student from cohort
  removeStudentFromCohort: async (cohortId, studentId) => {
    const response = await apiClient.delete(`/cohorts/${cohortId}/students/${studentId}`);
    return response.data;
  },

  // Invite students to cohort
  inviteStudentsToCohort: async (cohortId, emails) => {
    const response = await apiClient.post(`/cohorts/${cohortId}/invite-students`, { emails });
    return response.data;
  },

  // Get cohorts by student (optimized - uses user.cohorts field)
  getCohortsByStudent: async (studentId) => {
    const response = await apiClient.get(`/cohorts/student/${studentId}`);
    return response.data;
  },
};

export default cohortService;