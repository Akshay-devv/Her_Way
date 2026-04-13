import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type RouteInput = z.infer<typeof api.navigation.route.input>;

export function useRouteCalculation() {
  return useMutation({
    mutationFn: async (data: RouteInput) => {
      const res = await fetch(api.navigation.route.path, {
        method: api.navigation.route.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to calculate route");
      return api.navigation.route.responses[200].parse(await res.json());
    },
  });
}
