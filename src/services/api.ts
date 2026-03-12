// API Service with authentication token management

const API_DOMAIN = import.meta.env.VITE_API_DOMAIN || 'localhost:1000';
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || 'http';
// In development use Vite proxy (/api) to avoid CORS. In production use full URL.
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment
  ? '/api'
  : `${API_PROTOCOL}://${API_DOMAIN}`;

// Token management
const TOKEN_KEY = 'accessToken';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
    removeToken();
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: async (username: string, password: string) => {
    const response = await apiRequest<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(response.accessToken);
    return response;
  },

  login: async (username: string, password: string) => {
    const response = await apiRequest<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(response.accessToken);
    return response;
  },

  me: async () => {
    return apiRequest<{ userId: string; username: string }>('/auth/me');
  },
};

// Translate API
export const translateApi = {
  translate: async (data: {
    text: string;
    targetLang: string;
    saveToVocabulary?: boolean;
    vocabularyExample?: string;
    vocabularySourceText?: string;
  }) => {
    return apiRequest<{
      text: string;
      targetLang: string;
      detectedSourceLang: string;
      translatedText: string;
      cached: boolean;
      vocabulary?: { id: string };
    }>('/translate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Vocabulary API
export type VocabularyItem = {
  id: string;
  userId: string;
  word: string;
  meaning: string;
  example: string;
  sourceText: string;
  createdAt: string;
  updatedAt: string;
};

export const vocabularyApi = {
  getAll: async (skip = 0, take = 50) => {
    return apiRequest<VocabularyItem[]>(`/vocabulary?skip=${skip}&take=${take}`);
  },

  getById: async (id: string) => {
    return apiRequest<VocabularyItem>(`/vocabulary/${id}`);
  },

  create: async (data: {
    word: string;
    meaning: string;
    example: string;
    sourceText: string;
  }) => {
    return apiRequest<VocabularyItem>('/vocabulary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{ meaning: string; example: string; sourceText: string }>) => {
    return apiRequest<VocabularyItem>(`/vocabulary/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ deleted: boolean }>(`/vocabulary/${id}`, {
      method: 'DELETE',
    });
  },
};

// Wordlists API
export type Wordlist = {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export const wordlistsApi = {
  getAll: async () => {
    return apiRequest<Wordlist[]>('/wordlists');
  },

  getById: async (id: string) => {
    return apiRequest<Wordlist>(`/wordlists/${id}`);
  },

  create: async (data: { name: string; description: string }) => {
    return apiRequest<Wordlist>('/wordlists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{ name: string; description: string }>) => {
    return apiRequest<Wordlist>(`/wordlists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ deleted: boolean }>(`/wordlists/${id}`, {
      method: 'DELETE',
    });
  },

  getItems: async (id: string) => {
    return apiRequest<VocabularyItem[]>(`/wordlists/${id}/items`);
  },

  addItem: async (wordlistId: string, vocabularyId: string) => {
    return apiRequest<{ added: boolean }>(`/wordlists/${wordlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ vocabularyId }),
    });
  },

  removeItem: async (wordlistId: string, vocabularyId: string) => {
    return apiRequest<{ removed: boolean }>(`/wordlists/${wordlistId}/items/${vocabularyId}`, {
      method: 'DELETE',
    });
  },
};

// Progress API
export const progressApi = {
  getSummary: async (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return apiRequest<{
      date: string;
      totalVocabularyCount: number;
      dailyAddedVocabularyCount: number;
    }>(`/progress/summary${query}`);
  },
};

