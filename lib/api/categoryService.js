/**
 * Category Service
 * Handles API calls for category management
 */

import apiClient from './apiClient';

class CategoryService {
  /**
   * Get all categories for the user's school
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Categories data
   */
  async getCategories(params = {}) {
    try {
      const response = await apiClient.get('/categories', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get category statistics
   * @returns {Promise<Object>} Category statistics
   */
  async getCategoryStats() {
    try {
      const response = await apiClient.get('/categories/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    try {
      const response = await apiClient.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCategory(categoryId) {
    try {
      const response = await apiClient.delete(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Find or create a category by name
   * @param {string} name - Category name
   * @returns {Promise<Object>} Category data
   */
  async findOrCreateCategory(name) {
    try {
      const response = await apiClient.post('/categories/find-or-create', { name });
      return response.data;
    } catch (error) {
      console.error('Error finding or creating category:', error);
      throw error;
    }
  }

  /**
   * Initialize default categories
   * @returns {Promise<Object>} Initialization result
   */
  async initializeDefaultCategories() {
    try {
      const response = await apiClient.post('/categories/initialize-defaults');
      return response.data;
    } catch (error) {
      console.error('Error initializing default categories:', error);
      throw error;
    }
  }
}

const categoryService = new CategoryService();
export default categoryService;