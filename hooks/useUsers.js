import { useState } from 'react';
import userService from '@/lib/api/userService';
import { toast } from 'sonner';

export const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.updateProfile(userData);
      toast.success('Profile updated successfully');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile,
    loading,
    error
  };
};

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUsers = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(filters);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUserById(id);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch user';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.updateUser(userId, userData);
      toast.success('User updated successfully');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update user';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.deleteUser(userId);
      toast.success('User deleted successfully');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    loading,
    error
  };
};