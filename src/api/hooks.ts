import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { DailyEntry, MonthlyEntry, SessionEntry, BlocksData, MetaResponse } from "../types";

export function useDaily(since?: string, until?: string) {
  const params = new URLSearchParams();
  if (since) params.set("since", since);
  if (until) params.set("until", until);
  const qs = params.toString();

  return useQuery<DailyEntry[]>({
    queryKey: ["daily", since, until],
    queryFn: () => apiFetch(`/daily${qs ? `?${qs}` : ""}`),
  });
}

export function useMonthly() {
  return useQuery<MonthlyEntry[]>({
    queryKey: ["monthly"],
    queryFn: () => apiFetch("/monthly"),
  });
}

export function useMonthlyAggregate() {
  return useQuery<MonthlyEntry[]>({
    queryKey: ["monthly-aggregate"],
    queryFn: () => apiFetch("/monthly/aggregate"),
  });
}

export function useSessions() {
  return useQuery<SessionEntry[]>({
    queryKey: ["sessions"],
    queryFn: () => apiFetch("/sessions"),
  });
}

export function useBlocks() {
  return useQuery<BlocksData>({
    queryKey: ["blocks"],
    queryFn: () => apiFetch("/blocks"),
    refetchInterval: 45_000, // Blocks refresh every 45s
  });
}

export function useMeta() {
  return useQuery<MetaResponse>({
    queryKey: ["meta"],
    queryFn: () => apiFetch("/meta"),
    refetchInterval: 10_000,
  });
}

export function useRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpoint?: string) =>
      apiFetch("/meta/refresh", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
