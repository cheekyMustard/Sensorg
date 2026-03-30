import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchNotes, createNote, updateNote, deleteNote } from '../api/notes.js';
import { fetchArchive } from '../api/admin.js';

export function useNotes() {
  return useQuery({ queryKey: ['notes'], queryFn: fetchNotes });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notes'] }); toast.success('Note created'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateNote(id, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notes'] }); toast.success('Note saved'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteNote(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notes'] }); toast.success('Note deleted'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useMarkNoteDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }) => updateNote(id, { is_done: done }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notes'] }); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useArchive() {
  return useQuery({ queryKey: ['archive'], queryFn: fetchArchive, staleTime: 30_000 });
}
