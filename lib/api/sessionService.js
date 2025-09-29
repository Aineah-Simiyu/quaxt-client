import apiClient from './apiClient';

const sessionService = {
  // Get all sessions (generic method)
  getSessions: async () => {
    const response = await apiClient.get('/sessions');
    return response.data;
  },

  // Get sessions by school
  getSessionsBySchool: async (schoolId) => {
    const response = await apiClient.get(`/sessions/school/${schoolId}`);
    return response.data;
  },

  // Get sessions by trainer
  getSessionsByTrainer: async (trainerId) => {
    const response = await apiClient.get(`/sessions/trainer/${trainerId}`);
    return response.data;
  },

  // Get sessions by cohort
  getSessionsByCohort: async (cohortId) => {
    const response = await apiClient.get(`/sessions/cohort/${cohortId}`);
    return response.data;
  },

  // Get active sessions
  getActiveSessions: async (userId) => {
    const response = await apiClient.get(`/sessions/active?userId=${userId}`);
    return response.data;
  },

  // Get previous sessions
  getPreviousSessions: async (userId) => {
    const response = await apiClient.get(`/sessions/previous?userId=${userId}`);
    return response.data;
  },

  // Get upcoming sessions
  getUpcomingSessions: async (userId) => {
    const response = await apiClient.get(`/sessions/upcoming?userId=${userId}`);
    return response.data;
  },

  // Create a new session
  createSession: async (sessionData) => {
    const response = await apiClient.post('/sessions', sessionData);
    return response.data;
  },

  // Update session
  updateSession: async (sessionId, sessionData) => {
    const response = await apiClient.put(`/sessions/${sessionId}`, sessionData);
    return response.data;
  },

  // Delete session
  deleteSession: async (sessionId) => {
    const response = await apiClient.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  // Get session by ID
  getSessionById: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Join session
  joinSession: async (sessionId, userId) => {
    const response = await apiClient.post(`/sessions/${sessionId}/join`, { userId });
    return response.data;
  },

  // Leave session
  leaveSession: async (sessionId, userId) => {
    const response = await apiClient.post(`/sessions/${sessionId}/leave`, { userId });
    return response.data;
  },

  // Start session
  startSession: async (sessionId) => {
    const response = await apiClient.put(`/sessions/${sessionId}/start`);
    return response.data;
  },

  // End session
  endSession: async (sessionId) => {
    const response = await apiClient.put(`/sessions/${sessionId}/end`);
    return response.data;
  },

  // Get session attendance
  getSessionAttendance: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/attendance`);
    return response.data;
  },

  // Mark attendance
  markAttendance: async (sessionId, attendanceData) => {
    const response = await apiClient.post(`/sessions/${sessionId}/attendance`, attendanceData);
    return response.data;
  },

  // Get session statistics
  getSessionStats: async (userId, role) => {
    const response = await apiClient.get(`/sessions/stats?userId=${userId}&role=${role}`);
    return response.data;
  },

  // Duplicate session
  duplicateSession: async (sessionId) => {
    const response = await apiClient.post(`/sessions/${sessionId}/duplicate`);
    return response.data;
  },

  // Cancel session
  cancelSession: async (sessionId, reason) => {
    const response = await apiClient.put(`/sessions/${sessionId}/cancel`, { reason });
    return response.data;
  },

  // Reschedule session
  rescheduleSession: async (sessionId, newDateTime) => {
    const response = await apiClient.put(`/sessions/${sessionId}/reschedule`, {
      startDateTime: newDateTime.startDateTime,
      endDateTime: newDateTime.endDateTime
    });
    return response.data;
  },

  // Get session recordings
  getSessionRecordings: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/recordings`);
    return response.data;
  },

  // Upload session recording
  uploadRecording: async (sessionId, recordingData) => {
    const response = await apiClient.post(`/sessions/${sessionId}/recordings`, recordingData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Send session notification
  sendSessionNotification: async (sessionId, notificationData) => {
    const response = await apiClient.post(`/sessions/${sessionId}/notify`, notificationData);
    return response.data;
  },
};

export default sessionService;
