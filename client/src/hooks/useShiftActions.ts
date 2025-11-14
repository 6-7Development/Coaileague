/**
 * Shared Shift Actions Hook
 * Provides mutations for shift operations (create, update, delete, approve, reject)
 */

import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useShiftActions() {
  const { toast } = useToast();

  // Create shift mutation
  const createShift = useMutation({
    mutationFn: async (shiftData: any) => {
      return await apiRequest('POST', '/api/shifts', shiftData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Shift Created',
        description: 'The shift has been successfully created',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create shift',
        variant: 'destructive',
      });
    },
  });

  // Update shift mutation
  const updateShift = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest('PATCH', `/api/shifts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Shift Updated',
        description: 'The shift has been successfully updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update shift',
        variant: 'destructive',
      });
    },
  });

  // Delete shift mutation
  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Shift Deleted',
        description: 'The shift has been successfully deleted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete shift',
        variant: 'destructive',
      });
    },
  });

  // Approve shift mutation
  const approveShift = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('PATCH', `/api/shifts/${id}`, { status: 'confirmed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Shift Approved',
        description: 'The shift has been approved',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve shift',
        variant: 'destructive',
      });
    },
  });

  // Reject shift mutation
  const rejectShift = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Shift Rejected',
        description: 'The shift has been rejected and deleted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject shift',
        variant: 'destructive',
      });
    },
  });

  return {
    createShift,
    updateShift,
    deleteShift,
    approveShift,
    rejectShift,
  };
}
