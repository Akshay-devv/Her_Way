import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useSafetyZones(lat?: number, lng?: number, radius: number = 5000) {
  return useQuery({
    queryKey: [api.safety.zones.path, lat, lng, radius],
    queryFn: async () => {
      const qs = lat && lng ? `?lat=${lat}&lng=${lng}&radius=${radius}` : '';
      const res = await fetch(`${api.safety.zones.path}${qs}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch safety zones");
      return api.safety.zones.responses[200].parse(await res.json());
    },
  });
}

export function useSafeStops(lat?: number, lng?: number, radius: number = 5000) {
  return useQuery({
    queryKey: [api.safety.stops.path, lat, lng, radius],
    queryFn: async () => {
      const qs = lat && lng ? `?lat=${lat}&lng=${lng}&radius=${radius}` : '';
      const res = await fetch(`${api.safety.stops.path}${qs}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch safe stops");
      return api.safety.stops.responses[200].parse(await res.json());
    },
  });
}

export function useReportSafetyZone() {
  return useMutation({
    mutationFn: async (zoneData: { lat: number; lng: number; radius: number; riskLevel: string; description?: string }) => {
      const res = await apiRequest("POST", api.safety.reportZone.path, zoneData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.safety.zones.path] });
    },
  });
}
