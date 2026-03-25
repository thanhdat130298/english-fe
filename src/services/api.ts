// API Service with authentication token management

const envBaseUrl = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
  ?.VITE_API_BASE_URL;
const API_BASE_URL = (envBaseUrl || '/api').replace(/\/+$/, '');

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (
    response.status === 401 &&
    !endpoint.startsWith('/auth/login') &&
    !endpoint.startsWith('/auth/register') &&
    !endpoint.startsWith('/auth/password') &&
    !endpoint.startsWith('/auth/reset-password')
  ) {
    removeToken();
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' })) as {
      message?: string | string[];
    };
    const message = Array.isArray(error.message)
      ? error.message.join(', ')
      : error.message;
    throw new Error(message || `HTTP error! status: ${response.status}`);
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

  updatePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<{ updated: true }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  resetPassword: async () => {
    return apiRequest<{ updated: true }>('/auth/reset-password', {
      method: 'PATCH',
    });
  },
};

// Dictionary (translate) API response types
export type DictionaryPhonetic = {
  text?: string;
  audio?: string;
  sourceUrl?: string;
  license?: { name: string; url: string };
};

export type DictionaryDefinition = {
  definition: string;
  synonyms: string[];
  antonyms: string[];
  example?: string;
};

export type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
};

export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  license?: { name: string; url: string };
  sourceUrls?: string[];
};

export type TranslateResponse = {
  text: string;
  sourceLang: string;
  targetLang: string;
  detectedSourceLang: string;
  translatedText: string;
  cached: boolean;
  dictionary?: DictionaryEntry[] | null;
  vocabulary?: { id: string };
};

// Translate API - returns dictionary entries (word, phonetic, meanings with definitions/examples)
export const translateApi = {
  translate: async (data: {
    text: string;
    targetLang: string;
    saveToVocabulary?: boolean;
    vocabularyWord?: string;
    vocabularyExample?: string;
    vocabularySourceText?: string;
  }) => {
    return apiRequest<TranslateResponse>('/translate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Vocabulary API
export type VocabularyDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type VocabularyItem = {
  id: string;
  userId: string;
  word: string;
  meaning: string;
  example: string | null;
  sourceText: string | null;
  createdAt: string;
  updatedAt: string;
  dictionary?: DictionaryEntry[];
};

/**
 * Learning fields — UI derives badges from these (no separate status field).
 * `isMastered` is computed server-side (e.g. correctCount ≥ threshold and difficulty EASY).
 */
export type Vocabulary = VocabularyItem & {
  difficulty?: VocabularyDifficulty | null;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
  isNew: boolean;
  isDue: boolean;
  isMastered: boolean;
  /** Soft-hide; DELETE sets this (same as archive) */
  isArchived?: boolean;
};

/** Body for PATCH /vocab/:id/review — server maps to difficulty + scheduling */
export type VocabularyReviewResult = VocabularyDifficulty;

export function normalizeVocabulary(raw: VocabularyItem & Partial<Vocabulary>): Vocabulary {
  const reviewCount = raw.reviewCount ?? 0;
  const correctCount = raw.correctCount ?? 0;
  return {
    ...raw,
    reviewCount,
    correctCount,
    lastReviewedAt: raw.lastReviewedAt ?? null,
    nextReviewAt: raw.nextReviewAt ?? null,
    difficulty: raw.difficulty ?? undefined,
    isNew: raw.isNew ?? reviewCount === 0,
    isDue: raw.isDue ?? false,
    isMastered: raw.isMastered ?? false,
    isArchived: raw.isArchived ?? false,
  };
}

export type VocabularyListResponse = {
  items: (VocabularyItem & Partial<Vocabulary>)[];
  total: number;
  page: number;
  pageSize?: number;
  limit?: number;
};

/**
 * GET `/api/vocab` or `/vocabulary` (same controller).
 * Pagination: `page`+`limit` (default page=1, limit≤100) **or** legacy `skip`+`take` (take≤500).
 * If `page` **or** `limit` is set, API prefers page/limit and ignores skip/take.
 */
export type VocabListParams = {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: VocabularyDifficulty;
  isDue?: boolean;
  isNew?: boolean;
  includeArchived?: boolean;
};

function buildVocabListQuery(params?: VocabListParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.search) sp.set('search', params.search);
  if (params.difficulty) sp.set('difficulty', params.difficulty);
  if (params.isDue !== undefined) sp.set('isDue', String(params.isDue));
  if (params.isNew !== undefined) sp.set('isNew', String(params.isNew));
  if (params.includeArchived !== undefined) {
    sp.set('includeArchived', String(params.includeArchived));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const vocabularyKeys = {
  all: ['vocabulary'] as const,
  list: (params?: VocabListParams) => [...vocabularyKeys.all, 'list', params] as const,
  reviewQueue: () => [...vocabularyKeys.all, 'review-queue'] as const,
};

/** Recommended base path; `/vocabulary` is a legacy alias (same backend). */
const VOCAB_PATH = '/vocab';

export const vocabularyApi = {
  /**
   * GET list — paginated (`page`/`limit` or `skip`/`take`) + optional filters.
   */
  getList: async (params?: VocabListParams) => {
    const res = await apiRequest<VocabularyListResponse>(
      `${VOCAB_PATH}${buildVocabListQuery(params)}`
    );
    const normalized = res.items.map((item) => normalizeVocabulary(item));
    // FE guard: when includeArchived is not explicitly true, hide archived rows.
    if (params?.includeArchived === true) return normalized;
    return normalized.filter((item) => !item.isArchived);
  },

  /** Helper for full list in UI; still uses page/limit API contract. */
  getAll: async (page = 1, limit = 50) => {
    return vocabularyApi.getList({ page, limit, includeArchived: false });
  },

  getById: async (id: string) => {
    const raw = await apiRequest<VocabularyItem & Partial<Vocabulary>>(`${VOCAB_PATH}/${id}`);
    return normalizeVocabulary(raw);
  },

  create: async (data: {
    word: string;
    meaning: string;
    example: string;
    sourceText: string;
  }) => {
    const raw = await apiRequest<VocabularyItem & Partial<Vocabulary>>(VOCAB_PATH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeVocabulary(raw);
  },

  /** PATCH — meaning/example/sourceText/word; not for spaced repetition (use `review`). */
  update: async (
    id: string,
    data: Partial<{ word: string; meaning: string; example: string; sourceText: string }>
  ) => {
    const raw = await apiRequest<VocabularyItem & Partial<Vocabulary>>(`${VOCAB_PATH}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return normalizeVocabulary(raw);
  },

  /**
   * DELETE — soft archive (`isArchived: true`). Returns updated row, not `{ deleted: true }`.
   */
  delete: async (id: string) => {
    const raw = await apiRequest<VocabularyItem & Partial<Vocabulary>>(`${VOCAB_PATH}/${id}`, {
      method: 'DELETE',
    });
    return normalizeVocabulary(raw);
  },

  /**
   * PATCH …/review — spaced repetition (not the same as PATCH …/).
   * Body: { result: "EASY" | "MEDIUM" | "HARD" }
   */
  review: async (id: string, result: VocabularyReviewResult) => {
    const raw = await apiRequest<VocabularyItem & Partial<Vocabulary>>(`${VOCAB_PATH}/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ result }),
    });
    return normalizeVocabulary(raw);
  },

  /** PATCH …/archive — sets isArchived (same effect as DELETE). */
  archive: async (id: string) => {
    const raw = await apiRequest<VocabularyItem & Partial<Vocabulary>>(`${VOCAB_PATH}/${id}/archive`, {
      method: 'PATCH',
    });
    return normalizeVocabulary(raw);
  },

  /**
   * GET …/review-queue — due items, max 20, ordered by nextReviewAt asc
   */
  getReviewQueue: async () => {
    const res = await apiRequest<
      | (VocabularyItem & Partial<Vocabulary>)[]
      | { items: (VocabularyItem & Partial<Vocabulary>)[] }
    >(`${VOCAB_PATH}/review-queue`);
    const raw = Array.isArray(res) ? res : res.items;
    const now = Date.now();
    return raw
      .map((item) => normalizeVocabulary(item))
      .filter((item) => {
        if (item.isArchived) return false;
        if (item.isDue) return true;
        if (!item.nextReviewAt) return false;
        const nextAt = Date.parse(item.nextReviewAt);
        return Number.isFinite(nextAt) && nextAt <= now;
      })
      .sort((a, b) => {
        const aTs = a.nextReviewAt ? Date.parse(a.nextReviewAt) : Number.MAX_SAFE_INTEGER;
        const bTs = b.nextReviewAt ? Date.parse(b.nextReviewAt) : Number.MAX_SAFE_INTEGER;
        return aTs - bTs;
      })
      .slice(0, 20);
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
export type ProgressSummary = {
  date: string;
  totalVocabularyCount: number;
  dailyAddedVocabularyCount: number;
};

export type ProgressActivityPoint = {
  date: string;
  addedCount: number;
};

export type ProgressStreak = {
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string | null;
};

export type ProgressWordlistsSummary = {
  wordlistCount: number;
  categoryCount: number;
};

export type ProgressRecentActivityItem = {
  id: string;
  type: 'VOCAB_ADDED' | 'REVIEW_DONE' | 'WORDLIST_CREATED' | 'GOAL_COMPLETED' | 'OTHER';
  target: string;
  createdAt: string;
};

export type ProgressDashboardResponse = {
  summary: ProgressSummary;
  activitySeries: ProgressActivityPoint[];
  streak: ProgressStreak;
  wordlistsSummary: ProgressWordlistsSummary;
  recentActivity: ProgressRecentActivityItem[];
};

export type ProgressDashboardData = {
  summary: ProgressSummary;
  activitySeries: ProgressActivityPoint[];
  streak: ProgressStreak;
  wordlistsSummary: ProgressWordlistsSummary;
  recentActivity: ProgressRecentActivityItem[];
};

export type LeaderboardUser = {
  userId: string;
  username: string;
  value: number;
};

export type ProgressLeaderboardResponse = {
  topStreakUsers: LeaderboardUser[];
  topAddedUsers: LeaderboardUser[];
  topReviewUsers: LeaderboardUser[];
  topTranslatedWords: LeaderboardUser[];
};

function normalizeProgressDashboard(raw: unknown): ProgressDashboardData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const summaryRaw =
    (r.summary as Record<string, unknown> | undefined) ??
    (r.data as Record<string, unknown> | undefined)?.summary;
  if (!summaryRaw) return null;
  const summaryObj = summaryRaw as Record<string, unknown>;

  const summary: ProgressSummary = {
    date: String(summaryObj.date ?? ''),
    totalVocabularyCount: Number(summaryObj.totalVocabularyCount ?? 0),
    dailyAddedVocabularyCount: Number(summaryObj.dailyAddedVocabularyCount ?? 0),
  };

  const activityRaw =
    (r.activitySeries as Record<string, unknown>[] | undefined) ??
    (r.series as Record<string, unknown>[] | undefined) ??
    [];
  const activitySeries: ProgressActivityPoint[] = activityRaw.map((p) => ({
    date: String(p.date ?? ''),
    addedCount: Number(p.addedCount ?? p.count ?? 0),
  }));

  const streakRaw = (r.streak as Record<string, unknown> | undefined) ?? {};
  const streak: ProgressStreak = {
    currentStreakDays: Number(streakRaw.currentStreakDays ?? streakRaw.current ?? 0),
    longestStreakDays: Number(streakRaw.longestStreakDays ?? streakRaw.longest ?? 0),
    lastActiveDate: streakRaw.lastActiveDate ? String(streakRaw.lastActiveDate) : null,
  };

  const wordlistsRaw = (r.wordlistsSummary as Record<string, unknown> | undefined) ?? {};
  const wordlistsSummary: ProgressWordlistsSummary = {
    wordlistCount: Number(wordlistsRaw.wordlistCount ?? wordlistsRaw.count ?? 0),
    categoryCount: Number(wordlistsRaw.categoryCount ?? 0),
  };

  const recentRaw =
    (r.recentActivity as Record<string, unknown>[] | undefined) ??
    (r.activities as Record<string, unknown>[] | undefined) ??
    [];
  const recentActivity: ProgressRecentActivityItem[] = recentRaw.map((a, idx) => ({
    id: String(a.id ?? `activity-${idx}`),
    type: String(a.type ?? 'OTHER') as ProgressRecentActivityItem['type'],
    target: String(a.target ?? a.message ?? ''),
    createdAt: String(a.createdAt ?? a.date ?? new Date().toISOString()),
  }));

  return { summary, activitySeries, streak, wordlistsSummary, recentActivity };
}

function normalizeLeaderboardUsers(raw: unknown): LeaderboardUser[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((u, idx) => {
    const item = (u ?? {}) as Record<string, unknown>;
    return {
      userId: String(item.userId ?? item.id ?? `user-${idx}`),
      username: String(item.username ?? item.name ?? 'unknown'),
      value: Number(item.value ?? item.count ?? item.score ?? 0),
    };
  });
}

function normalizeProgressLeaderboard(raw: unknown): ProgressLeaderboardResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const base = (r.data as Record<string, unknown> | undefined) ?? r;
  return {
    topStreakUsers: normalizeLeaderboardUsers(base.topStreakUsers ?? base.topStreak ?? base.streak),
    topAddedUsers: normalizeLeaderboardUsers(base.topAddedUsers ?? base.topAdded ?? base.added),
    topReviewUsers: normalizeLeaderboardUsers(base.topReviewUsers ?? base.topReviewed ?? base.review),
    topTranslatedWords: normalizeLeaderboardUsers(
      base.topTranslatedWords ?? base.topWords ?? base.mostTranslatedWords ?? base.translatedWords
    ),
  };
}

function hasAnyLeaderboardData(data: ProgressLeaderboardResponse): boolean {
  return (
    data.topStreakUsers.length > 0 ||
    data.topAddedUsers.length > 0 ||
    data.topReviewUsers.length > 0 ||
    data.topTranslatedWords.length > 0
  );
}

export const progressApi = {
  getSummary: async (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return apiRequest<ProgressSummary>(`/progress/summary${query}`);
  },

  getDashboard: async (from?: string, to?: string) => {
    const sp = new URLSearchParams();
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    const qs = sp.toString();
    return apiRequest<ProgressDashboardResponse>(`/progress/dashboard${qs ? `?${qs}` : ''}`);
  },

  getLeaderboard: async () => {
    return apiRequest<ProgressLeaderboardResponse>('/progress/leaderboard');
  },

  // FE-safe mapping: prefer /progress/dashboard, fallback to /progress/summary.
  getDashboardMapped: async (): Promise<ProgressDashboardData> => {
    try {
      const res = await progressApi.getDashboard();
      const normalized = normalizeProgressDashboard(res);
      if (normalized) return normalized;
      throw new Error('Invalid dashboard response shape');
    } catch {
      const summary = await progressApi.getSummary();
      return {
        summary,
        activitySeries: [],
        streak: { currentStreakDays: 0, longestStreakDays: 0, lastActiveDate: null },
        wordlistsSummary: { wordlistCount: 0, categoryCount: 0 },
        recentActivity: [],
      };
    }
  },

  getLeaderboardMapped: async (): Promise<ProgressLeaderboardResponse> => {
    try {
      const res = await progressApi.getLeaderboard();
      const normalized = normalizeProgressLeaderboard(res);
      if (normalized && hasAnyLeaderboardData(normalized)) return normalized;
      throw new Error('Invalid leaderboard response shape');
    } catch {
      return {
        // Fallback sample data so FE UI is usable before BE endpoint is ready.
        topStreakUsers: [
          { userId: 'sample-1', username: 'alice', value: 32 },
          { userId: 'sample-2', username: 'bob', value: 27 },
          { userId: 'sample-3', username: 'charlie', value: 19 },
        ],
        topAddedUsers: [
          { userId: 'sample-4', username: 'david', value: 180 },
          { userId: 'sample-5', username: 'eva', value: 156 },
          { userId: 'sample-6', username: 'frank', value: 149 },
        ],
        topReviewUsers: [
          { userId: 'sample-7', username: 'grace', value: 420 },
          { userId: 'sample-8', username: 'henry', value: 380 },
          { userId: 'sample-9', username: 'irene', value: 355 },
        ],
        topTranslatedWords: [
          { userId: 'word-1', username: 'practice', value: 48 },
          { userId: 'word-2', username: 'synchronize', value: 35 },
          { userId: 'word-3', username: 'pathway', value: 27 },
        ],
      };
    }
  },
};

// Feedback API
export type FeedbackItem = {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};

export const feedbackApi = {
  create: async (message: string) => {
    return apiRequest<FeedbackItem>('/feedback', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  getMine: async () => {
    return apiRequest<FeedbackItem[]>('/feedback/mine');
  },
};

