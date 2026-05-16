import { QueryClient } from "@tanstack/react-query";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") || "";
setBaseUrl(`${API_BASE}/api`);

setAuthTokenGetter(() => localStorage.getItem("phantom_token"));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});
