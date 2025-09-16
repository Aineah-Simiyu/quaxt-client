/**
 * Resource Service
 * Handles API calls for resource management
 */

import apiClient from './apiClient';

class ResourceService {
  /**
   * Get all resources with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Resources data
   */
  async getResources(params = {}) {
    try {
      const response = await apiClient.get('/resources', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }

  /**
   * Get resource by ID
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Resource data
   */
  async getResourceById(resourceId) {
    try {
      const response = await apiClient.get(`/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resource:', error);
      throw error;
    }
  }

  /**
   * Create a new resource
   * @param {Object} resourceData - Resource data
   * @returns {Promise<Object>} Created resource
   */
  async createResource(resourceData) {
    try {
      const response = await apiClient.post('/resources', resourceData);
      return response.data;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  /**
   * Update a resource
   * @param {string} resourceId - Resource ID
   * @param {Object} resourceData - Updated resource data
   * @returns {Promise<Object>} Updated resource
   */
  async updateResource(resourceId, resourceData) {
    try {
      const response = await apiClient.put(`/resources/${resourceId}`, resourceData);
      return response.data;
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  /**
   * Delete a resource
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteResource(resourceId) {
    try {
      const response = await apiClient.delete(`/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  /**
   * Upload resource file
   * @param {File} file - File to upload
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadResourceFile(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await apiClient.post('/resources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading resource file:', error);
      throw error;
    }
  }

  /**
   * Get resources by category
   * @param {string} category - Resource category
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Resources data
   */
  async getResourcesByCategory(category, params = {}) {
    try {
      const response = await apiClient.get(`/resources/category/${category}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources by category:', error);
      throw error;
    }
  }

  /**
   * Get resources by cohort
   * @param {string} cohortId - Cohort ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Resources data
   */
  async getResourcesByCohort(cohortId, params = {}) {
    try {
      const response = await apiClient.get(`/resources/cohort/${cohortId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources by cohort:', error);
      throw error;
    }
  }

  /**
   * Get resource categories
   * @returns {Promise<Object>} Categories data
   */
  async getResourceCategories() {
    try {
      const response = await apiClient.get('/resources/category-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching resource categories:', error);
      throw error;
    }
  }

  /**
   * Get template resources
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Template resources
   */
  async getTemplateResources(params = {}) {
    try {
      const response = await apiClient.get('/resources/templates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching template resources:', error);
      throw error;
    }
  }

  /**
   * Get popular resources
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Popular resources
   */
  async getPopularResources(params = {}) {
    try {
      const response = await apiClient.get('/resources/popular', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular resources:', error);
      throw error;
    }
  }

  /**
   * Get recent resources
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Recent resources
   */
  async getRecentResources(params = {}) {
    try {
      const response = await apiClient.get('/resources/recent', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent resources:', error);
      throw error;
    }
  }

  /**
   * Get resources by creator
   * @param {string} creatorId - Creator ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Resources data
   */
  async getResourcesByCreator(creatorId, params = {}) {
    try {
      const response = await apiClient.get(`/resources/creator/${creatorId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources by creator:', error);
      throw error;
    }
  }

  /**
   * Get resources by school
   * @param {string} schoolId - School ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Resources data
   */
  async getResourcesBySchool(schoolId, params = {}) {
    try {
      const response = await apiClient.get(`/resources/school/${schoolId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources by school:', error);
      throw error;
    }
  }

  /**
   * Get resources by type
   * @param {string} type - Resource type
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Resources data
   */
  async getResourcesByType(type, params = {}) {
    try {
      const response = await apiClient.get(`/resources/type/${type}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources by type:', error);
      throw error;
    }
  }

  /**
   * Increment resource views
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Result
   */
  async incrementViews(resourceId) {
    try {
      const response = await apiClient.post(`/resources/${resourceId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error incrementing resource views:', error);
      throw error;
    }
  }

  /**
   * Increment resource downloads
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Result
   */
  async incrementDownloads(resourceId) {
    try {
      const response = await apiClient.post(`/resources/${resourceId}/download`);
      return response.data;
    } catch (error) {
      console.error('Error incrementing resource downloads:', error);
      throw error;
    }
  }

  /**
   * Toggle resource favorite status
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Result
   */
  async toggleFavorite(resourceId) {
    try {
      const response = await apiClient.post(`/resources/${resourceId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Error toggling resource favorite:', error);
      throw error;
    }
  }

  /**
   * Bulk update resources
   * @param {Array} resourceIds - Array of resource IDs
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Result
   */
  async bulkUpdateResources(resourceIds, updateData) {
    try {
      const response = await apiClient.patch('/resources/bulk', {
        resourceIds,
        updateData
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating resources:', error);
      throw error;
    }
  }

  /**
   * Search resources
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Search results
   */
  async searchResources(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      const response = await apiClient.get('/resources/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching resources:', error);
      throw error;
    }
  }

  /**
   * Get resource analytics
   * @param {Object} params - Analytics parameters
   * @returns {Promise<Object>} Analytics data
   */
  async getResourceAnalytics(params = {}) {
    try {
      const response = await apiClient.get('/resources/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resource analytics:', error);
      throw error;
    }
  }

  /**
   * Track resource access
   * @param {string} resourceId - Resource ID
   * @param {Object} accessData - Access tracking data
   * @returns {Promise<Object>} Tracking result
   */
  async trackResourceAccess(resourceId, accessData = {}) {
    try {
      const response = await apiClient.post(`/resources/${resourceId}/access`, accessData);
      return response.data;
    } catch (error) {
      console.error('Error tracking resource access:', error);
      throw error;
    }
  }

  /**
   * Get favorite resources
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Favorite resources
   */
  async getFavoriteResources(params = {}) {
    try {
      const response = await apiClient.get('/resources/favorites', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching favorite resources:', error);
      throw error;
    }
  }

  /**
   * Add resource to favorites
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Result
   */
  async addToFavorites(resourceId) {
    try {
      const response = await apiClient.post(`/resources/${resourceId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Error adding resource to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove resource from favorites
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Result
   */
  async removeFromFavorites(resourceId) {
    try {
      const response = await apiClient.delete(`/resources/${resourceId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Error removing resource from favorites:', error);
      throw error;
    }
  }
}

const resourceService = new ResourceService();
export default resourceService;