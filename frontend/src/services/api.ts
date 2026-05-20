/**
 * API Service
 * Centralized HTTP client with authentication support
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizeApiBaseUrl = (url: string): string => {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_URL);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Store authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Generic fetch wrapper with authentication support
 */
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!isJson) {
      // Server returned HTML or other non-JSON content (likely an error page)
      const text = await response.text();
      console.error('Server returned non-JSON response:', text.substring(0, 200));
      throw new Error(
        `Le serveur n'est pas accessible ou l'endpoint n'existe pas. Vérifiez que le backend est démarré sur ${API_BASE_URL}`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      // Extract error message from response
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }

    return data;
  } catch (error: unknown) {
    const err = error as Error;
    // Handle network errors
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(
        `Impossible de se connecter au serveur sur ${API_BASE_URL}. Vérifiez que le backend est démarré.`
      );
    }
    // Re-throw the error if it's already formatted
    throw error;
  }
}

/**
 * API Methods
 */
export const api = {
  /**
   * Authentication endpoints
   */
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiFetch<{ token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.token) {
        setAuthToken(response.token);
      }

      return response;
    },

    register: async (data: {
      rpps: string;
      email: string;
      password: string;
      cpsCardUrl?: string;
    }) => {
      return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    logout: () => {
      removeAuthToken();
    },
  },

  /**
   * Doctor endpoints
   */
  doctors: {
    getMe: async () => {
      return apiFetch('/doctors/me');
    },
  },
  diagnosis: {
    list: async () => {
      return apiFetch('/diagnosis');
    },
    get: async (id: string) => {
      return apiFetch(`/diagnosis/${id}`);
    },
    synthesize: async (id: string) => {
      return apiFetch(`/diagnosis/${id}/synthesize`, { method: 'POST' });
    },
    activateSynthesisVersion: async (id: string, versionId: string) => {
      return apiFetch(`/diagnosis/${id}/synthesis-versions/${versionId}/activate`, { method: 'POST' });
    },
  },

  /**
   * KYC endpoints
   */
  kyc: {
    start: async () => {
      return apiFetch('/kyc/start', {
        method: 'POST',
      });
    },
  },

  /**
   * Children (dossiers patients) endpoints
   */
  children: {
    list: async <T = unknown>() => {
      return apiFetch<T>('/children');
    },
    get: async <T = unknown>(id: string) => {
      return apiFetch<T>(`/children/${id}`);
    },
  },
};

export default api;
