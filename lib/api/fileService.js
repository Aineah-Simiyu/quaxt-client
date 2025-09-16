import apiClient from './apiClient';

/**
 * File upload service for handling file uploads to the backend
 */
const fileService = {
  /**
   * Upload a single file to the backend
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Upload response with file data
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/submissions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Upload multiple files to the backend
   * @param {File[]} files - Array of files to upload
   * @returns {Promise<Object[]>} Array of upload responses
   */
  uploadFiles: async (files) => {
    const uploadPromises = files.map(file => fileService.uploadFile(file));
    return Promise.all(uploadPromises);
  },

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFile: (file, options = {}) => {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    // Check file type
    const isAllowedType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      errors.push('File type not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

export default fileService;