import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchTasks, createTask, updateTask, deleteTask, completeTask, uncompleteTask, approveTask, rejectTask } from '../api/tasks.js';

export function useTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: fetchTasks });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      const count = Array.isArray(created) ? created.length : 1;
      toast.success(count > 1 ? `${count} tasks created` : 'Task created');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task updated'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => completeTask(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError:    (err) => toast.error(err.message),
  });
}

export function useUncompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => uncompleteTask(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError:    (err) => toast.error(err.message),
  });
}

export function useApproveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => approveTask(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task approved'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useRejectTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => rejectTask(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task rejected'); },
    onError:    (err) => toast.error(err.message),
  });
}
