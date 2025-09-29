import apiClient from "./apiClient";

const userService = {
  // Get all users (with optional filters)
  getUsers: async (filters = {}) => {
    const response = await apiClient.get("/users", { params: filters });
    return response.data;
  },

  // Get a single user by ID
  getUser: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Get user by ID (alias for getUser)
  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Get current user profile
  getCurrentProfile: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await apiClient.put("/users/profile", userData);
    return response.data;
  },

  // Update user avatar
  updateAvatar: async (formData) => {
    const response = await apiClient.post("/users/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.post(
      "/auth/change-password",
      passwordData,
    );
    return response.data;
  },

  // Get user dashboard data
  getDashboardData: async () => {
    const response = await apiClient.get("/analytics/dashboard");
    return response.data;
  },

  // Get user notifications
  getNotifications: async (params = {}) => {
    const response = await apiClient.get("/users/notifications", { params });
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await apiClient.put(
      `/users/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    const response = await apiClient.put("/users/notifications/read-all");
    return response.data;
  },

  // Get users by school and role
  getUsersBySchoolAndRole: async (schoolId, role) => {
    const response = await apiClient.get(
      `/users/school/${schoolId}/role/${role}`,
    );
    return response.data;
  },

  // Invite user
  inviteUser: async (inviteData) => {
    const response = await apiClient.post("/users/invite", inviteData);
    return response.data;
  },

  // Create trainer
  createTrainer: async (trainerData) => {
    const response = await apiClient.post("/users/trainers", trainerData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await apiClient.patch(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // Get user cohorts (optimized - from user.cohorts field)
  getUserCohorts: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data.user.cohorts || [];
  },

  // Get current user's cohorts
  getCurrentUserCohorts: async () => {
    const response = await apiClient.get("/users/profile");
    return response.data.user.cohorts || [];
  },

  // Bulk upload students from CSV
  bulkUploadStudents: async (file, cohortId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cohortId", cohortId);

    const response = await apiClient.post("/users/bulk-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Bulk upload trainers from CSV
  bulkUploadTrainers: async (file, cohortId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cohortId", cohortId);
    formData.append("role", "trainer");

    const response = await apiClient.post(
      "/users/bulk-upload-trainers",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};

export default userService;
