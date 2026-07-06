import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";

export function useRequireAuth() {
  const [, setLocation] = useLocation();
  const token = getToken();
  
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetCurrentUserQueryKey()
    }
  });

  useEffect(() => {
    if (!token || error) {
      setLocation("/login");
    }
  }, [token, error, setLocation]);

  return { user, isLoading: isLoading || (!user && !!token) };
}

export function useRoleRedirect(user: any) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user && location === "/") {
      if (user.role === "admin" || user.role === "hr") {
        setLocation("/hr");
      }
    }
  }, [user, location, setLocation]);
}
