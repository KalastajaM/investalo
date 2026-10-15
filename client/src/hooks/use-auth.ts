import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

const NEEDS_DEV_PASSWORD = "needs_dev_password" as const;

async function fetchUser(): Promise<User | null | typeof NEEDS_DEV_PASSWORD> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    if (data.needsDevPassword) return NEEDS_DEV_PASSWORD;
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<User | null | typeof NEEDS_DEV_PASSWORD>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const needsDevPassword = data === NEEDS_DEV_PASSWORD;
  const user = needsDevPassword ? null : (data as User | null | undefined) ?? null;

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    needsDevPassword,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
