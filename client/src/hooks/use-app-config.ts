import { useQuery } from "@tanstack/react-query";

interface AppConfig {
  claudeFeatures: boolean;
}

export function useAppConfig(): AppConfig {
  const { data } = useQuery<AppConfig>({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
    staleTime: Infinity,
  });
  // Default to enabled while loading so the UI doesn't flash on first render
  // for users where the feature is enabled.
  return data ?? { claudeFeatures: true };
}
