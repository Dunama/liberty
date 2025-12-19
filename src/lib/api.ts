import axios from "axios";

// In production (Vercel), use relative path. In dev, use localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Helper to generate user-friendly error messages
function getUserFriendlyError(error: unknown): string {
  // No response at all (network error, CORS, server down)
  if (axios.isAxiosError(error) && !error.response) {
    if (error.message?.includes("Network Error")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    if (error.message?.includes("timeout")) {
      return "The request took too long. Please check your connection and try again.";
    }
    return "Could not reach the server. Please try again in a moment.";
  }

  // Server responded with an error
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data as { error?: string; message?: string } | undefined;
    
    // If backend sent a specific error message, use it
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    
    // Otherwise, provide friendly messages for common status codes
    switch (status) {
      case 400:
        return "The request was invalid. Please check your input and try again.";
      case 401:
        return "Please log in to continue. Your session may have expired.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested item was not found.";
      case 409:
        return "This item already exists. Please try a different name.";
      case 413:
        return "The file is too large to upload. Please try a smaller file (max 10MB).";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Something went wrong on our end. Please try again later.";
      case 502:
      case 503:
      case 504:
        return "The server is temporarily unavailable. Please try again in a few moments.";
      default:
        return `An error occurred (code ${status}). Please try again.`;
    }
  }

  // Fallback for unknown error types
  if (error instanceof Error && error.message) {
    return error.message;
  }
  
  return "An unexpected error occurred. Please try again.";
}

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token expired or invalid - clear session
      localStorage.removeItem("session");
      setAuthToken(null);
    }
    
    // Attach user-friendly message to the error for consumption by components
    if (axios.isAxiosError(error)) {
      const friendlyMessage = getUserFriendlyError(error);
      // Store in response.data.error so getErrorMessage in components can pick it up
      if (error.response) {
        error.response.data = { 
          ...((typeof error.response.data === 'object' && error.response.data) || {}),
          error: (error.response.data as { error?: string })?.error || friendlyMessage 
        };
      } else {
        // Network error - create a synthetic response
        error.response = {
          data: { error: friendlyMessage },
          status: 0,
          statusText: "Network Error",
          headers: {},
          config: error.config!,
        } as typeof error.response;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
