/**
 * Application constants - Frontend
 * These constants should match the backend constants for consistency
 */

export const ROLES = {
  ADMIN: "admin",
  SCHOOL_ADMIN: "school_admin",
  TRAINER: "trainer",
  STUDENT: "student",
};

// Assignment visibility
export const ASSIGNMENT_VISIBILITY = {
  PUBLIC: "public",
  SINGLE_COHORT: "single_cohort",
  MULTIPLE_COHORTS: "multiple_cohorts",
};

// Submission status
export const SUBMISSION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  GRADED: "graded",
  LATE: "late",
};

// Notification types
export const NOTIFICATION_TYPES = {
  ASSIGNMENT_CREATED: "assignment_created",
  ASSIGNMENT_DUE_SOON: "assignment_due_soon",
  SUBMISSION_RECEIVED: "submission_received",
  GRADE_POSTED: "grade_posted",
  INVITATION: "invitation",
  FEEDBACK_ADDED: "feedback_added",
  FEEDBACK_UPDATED: "feedback_updated",
};

// Feedback types
export const FEEDBACK_TYPES = {
  GENERAL: "general",
  CODE_QUALITY: "code_quality",
  CONCEPT_UNDERSTANDING: "concept_understanding",
  IMPROVEMENT_SUGGESTION: "improvement_suggestion",
  QUESTION: "question",
  ANSWER: "answer",
};

// Feedback visibility
export const FEEDBACK_VISIBILITY = {
  PRIVATE: "private", // Only visible to the creator and the student
  PUBLIC: "public", // Visible to all trainers and the student
};

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/zip",
    "text/plain",
  ],
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Legacy role mappings for backward compatibility
// Note: 'instructor' maps to 'trainer' in the new system
export const LEGACY_ROLES = {
  instructor: ROLES.TRAINER,
  admin: ROLES.ADMIN,
  student: ROLES.STUDENT,
  school_admin: ROLES.SCHOOL_ADMIN,
};

// Helper function to check if user has specific role
export const hasRole = (user, role) => {
  if (!user || !user.role) return false;
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
};

// Helper function to check if user has any of the instructor/trainer roles
export const isInstructorOrAdmin = (user) => {
  return (
    hasRole(user, [ROLES.TRAINER, ROLES.ADMIN, ROLES.SCHOOL_ADMIN]) ||
    hasRole(user, ["instructor", "admin"])
  ); // Legacy support
};

// Helper function to check if user has any of the instructor/trainer roles
export const isInstructor = (user) => {
  return (
    hasRole(user, [ROLES.TRAINER]) ||
    hasRole(user, ["instructor"])
  ); // Legacy support
};

// Helper function to check if user is admin
export const isAdmin = (user) => {
  return (
    hasRole(user, [ROLES.ADMIN, ROLES.SCHOOL_ADMIN]) || hasRole(user, "admin")
  ); // Legacy support
};

// Check if user is a school admin
export const isSchoolAdmin = (user) => {
  return (
    user && (user.role === ROLES.SCHOOL_ADMIN || user.role === "school_admin")
  );
};

// Helper function to get user-friendly role display name
export const getRoleDisplayName = (role) => {
  const roleMap = {
    [ROLES.ADMIN]: "Administrator",
    [ROLES.SCHOOL_ADMIN]: "School Administrator",
    [ROLES.TRAINER]: "Trainer",
    [ROLES.STUDENT]: "Student",
    // Legacy role mappings
    admin: "Administrator",
    instructor: "Trainer",
    student: "Student",
    school_admin: "School Administrator",
  };

  return roleMap[role] || role || "Student";
};
