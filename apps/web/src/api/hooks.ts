import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateReportInput,
  ListReportsQuery,
  ReportDetails,
  ReportStatus,
} from '@city-reporter/shared';
import { api } from './client';

export const queryKeys = {
  map: (bbox: string) => ['map', bbox] as const,
  report: (id: string) => ['report', id] as const,
  reports: (query: Partial<ListReportsQuery>) => ['reports', query] as const,
};

export function useMapPins(bbox: string | null) {
  return useQuery({
    queryKey: queryKeys.map(bbox ?? ''),
    queryFn: () => api.mapPins(bbox!),
    enabled: bbox !== null,
    placeholderData: keepPreviousData, // keep pins visible while panning
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: queryKeys.report(id ?? ''),
    queryFn: () => api.report(id!),
    enabled: id !== null,
  });
}

export function useReports(query: Partial<ListReportsQuery>) {
  return useQuery({
    queryKey: queryKeys.reports(query),
    queryFn: () => api.listReports(query),
    placeholderData: keepPreviousData,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) => api.createReport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useToggleUpvote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (upvoted: boolean) => (upvoted ? api.removeUpvote(id) : api.upvote(id)),
    onSuccess: (result) => {
      queryClient.setQueryData<ReportDetails>(queryKeys.report(id), (old) =>
        old ? { ...old, ...result } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      api.updateStatus(id, status),
    onSuccess: (_report, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.report(id) });
      queryClient.invalidateQueries({ queryKey: ['map'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
