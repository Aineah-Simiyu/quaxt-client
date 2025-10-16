import apiClient from './apiClient';

const extractArray = (resp) => {
  const data = resp?.data ?? resp;
  const payload = data?.data ?? data;
  // Handle paginated assignments response structure
  if (payload?.assignments?.docs && Array.isArray(payload.assignments.docs)) {
    return payload.assignments.docs;
  }
  if (Array.isArray(payload?.assignments)) return payload.assignments;
  if (Array.isArray(payload?.submissions)) return payload.submissions;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload)) return payload;
  return [];
};

const extractItem = (resp, key) => {
  const data = resp?.data ?? resp;
  const payload = data?.data ?? data;
  if (key && payload?.[key]) return payload[key];
  return payload;
};

const assignmentService = {
  // Get all assignments (with optional filters)
  getAssignments: async (filters = {}) => {
    const response = await apiClient.get('/assignments', { params: filters });
    return response;
  },

  // Get a single assignment by ID
  getAssignment: async (id) => {
    const response = await apiClient.get(`/assignments/${id}`);
    return extractItem(response, 'assignment');
  },

  // Create a new assignment
  createAssignment: async (assignmentData) => {
    const response = await apiClient.post('/assignments', assignmentData);
    return extractItem(response, 'assignment');
  },

  // Update an existing assignment
  updateAssignment: async (id, assignmentData) => {
    const response = await apiClient.put(`/assignments/${id}`, assignmentData);
    return extractItem(response, 'assignment');
  },

  // Delete an assignment
  deleteAssignment: async (id) => {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response?.data?.success === true;
  },

  // Get submissions for an assignment (for instructors)
  getSubmissions: async (assignmentId, filters = {}) => {
    const response = await apiClient.get(`/submissions/assignment/${assignmentId}`, {
      params: filters,
    });
    return extractArray(response);
  },

  // Submit an assignment (for students): create then mark as submitted
  submitAssignment: async (assignmentId, submissionData = {}) => {
    // Debug logging
    
    
    
    
    // Create submission (content optional)
    const requestData = {
      assignment: assignmentId,
      content: submissionData.content || {},
    };
    
    
    
    const createResp = await apiClient.post(`/submissions`, requestData);
    const created = extractItem(createResp);

    // Mark as submitted
    const id = created?._id || created?.id;
    if (id) {
      const submitResp = await apiClient.put(`/submissions/${id}/submit`);
      return extractItem(submitResp);
    }
    return created;
  },

  // Update an existing submission (for students editing their submission)
  updateSubmission: async (submissionId, submissionData = {}) => {
    // Debug logging
    
    
    
    const requestData = {
      content: submissionData.content || {},
    };
    
    
    
    const response = await apiClient.put(`/submissions/${submissionId}`, requestData);
    return extractItem(response);
  },

  // Grade a submission (for instructors)
  gradeSubmission: async (submissionId, gradeData) => {
    const response = await apiClient.put(`/submissions/${submissionId}/grade`, gradeData);
    return extractItem(response);
  },

  // Get analytics for an assignment
  getAssignmentAnalytics: async (assignmentId) => {
    const response = await apiClient.get(`/assignments/${assignmentId}/analytics`);
    return extractItem(response);
  },
};

export default assignmentService;