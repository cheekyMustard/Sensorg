import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchJokes, createJoke, deleteJoke, fetchCategories, createCategory } from '../api/jokes.js';

export function useJokes() {
  return useQuery({ queryKey: ['jokes'], queryFn: fetchJokes, staleTime: 60_000 });
}

export function useJokeCategories() {
  return useQuery({ queryKey: ['joke-categories'], queryFn: fetchCategories, staleTime: 120_000 });
}

export function useCreateJoke() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJoke,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jokes'] });
      toast.success('Joke added!');
    },
    onError: () => toast.error('Failed to add joke'),
  });
}

export function useDeleteJoke() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteJoke,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jokes'] });
      toast.success('Joke removed');
    },
    onError: () => toast.error('Failed to delete joke'),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['joke-categories'] }),
  });
}
