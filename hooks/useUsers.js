import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// React Query versions (incremental migration)

export function useUsersQuery(filters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userService.getUsers(filters),
  });
}

export function useUserQuery(id) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, userData }) => userService.updateUser(userId, userData),
    onSuccess: (_data, variables) => {
      toast.success('User updated successfully');
      qc.invalidateQueries({ queryKey: ['users'] });
      if (variables?.userId) qc.invalidateQueries({ queryKey: ['users', variables.userId] });
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => userService.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted successfully');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userData) => userService.updateProfile(userData),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}