import apiClient from './apiClient';

const analyticsService = {
  // Get assignment analytics
  getAssignmentAnalytics: async (filters = {}) => {
    const response = await apiClient.get('/analytics/assignments', { params: filters });
    return response.data;
  },

  // Get submission analytics
  getSubmissionAnalytics: async (filters = {}) => {
    const response = await apiClient.get('/analytics/submissions', { params: filters });
    return response.data;
  },

  // Get grading analytics
  getGradingAnalytics: async (filters = {}) => {
    const response = await apiClient.get('/analytics/gradings', { params: filters });
    return response.data;
  },

  // Get student performance analytics
  getStudentPerformanceAnalytics: async (studentId, filters = {}) => {
    const response = await apiClient.get(`/analytics/students/${studentId}`, { params: filters });
    return response.data;
  },

  // Get cohort performance analytics
  getCohortPerformanceAnalytics: async (cohortId, filters = {}) => {
    const response = await apiClient.get(`/analytics/cohorts/${cohortId}`, { params: filters });
    return response.data;
  },

  // Get dashboard analytics (combined overview)
  getDashboardAnalytics: async (filters = {}) => {
    try {
      const [assignments, submissions, gradings] = await Promise.all([
        analyticsService.getAssignmentAnalytics(filters),
        analyticsService.getSubmissionAnalytics(filters),
        analyticsService.getGradingAnalytics(filters)
      ]);
      
      return {
        assignments: assignments.data,
        submissions: submissions.data,
        gradings: gradings.data
      };
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  },

  // Get school overview analytics (for School Admin)
  getSchoolAnalytics: async (schoolId, filters = {}) => {
    const schoolFilters = { ...filters, schoolId };
    return analyticsService.getDashboardAnalytics(schoolFilters);
  },

  // Get trainer analytics (for Trainer view)
  getTrainerAnalytics: async (trainerId, filters = {}) => {
    const trainerFilters = { ...filters, creatorId: trainerId };
    return analyticsService.getDashboardAnalytics(trainerFilters);
  }
};

export default analyticsService;