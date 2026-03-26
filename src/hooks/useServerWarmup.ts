import { useCallback, useEffect, useMemo, useState } from 'react';

type WarmupStatus = 'idle' | 'warming' | 'ready' | 'error';

type UseServerWarmupOptions = {
  /** Minimum time to keep loader visible (ms). */
  minDurationMs?: number;
  /** Show “taking longer than usual” after this (ms). */
  slowThresholdMs?: number;
  /** Per-attempt timeout (ms). */
  attemptTimeoutMs?: number;
  /** Minimum delay between warmup requests (ms). */
  requestIntervalMs?: number;
  /** Stop trying after this many total warmup requests. */
  maxRequests?: number;
  /** Retry count (not including the first attempt). */
  retries?: number;
  /** Candidate endpoints to ping (in order). */
  endpoints?: string[];
};

type UseServerWarmupResult = {
  status: WarmupStatus;
  progress: number; // 0..100
  message: string;
  isSlow: boolean;
  attempt: number;
  error: string | null;
  lastUrl: string | null;
  gaveUp: boolean;
  retry: () => void;
};

const DEFAULT_MESSAGES = [
  'Đang chuẩn bị…',
  'Đang kết nối…',
  'Chờ chút nhé…',
  'Sắp xong rồi…',
  'Đợi mình chút nha…',
  'Đang khởi động hệ thống…',
  'Đang tải dữ liệu…',
  'Đang kiểm tra kết nối…',
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const ac = new AbortController();
  const t = window.setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    return res;
  } finally {
    window.clearTimeout(t);
  }
}

function getApiBaseUrl(): string {
  const env = (import.meta as unknown as {
    env?: {
      VITE_API_BASE_URL?: string;
      VITE_API_DOMAIN?: string;
      VITE_API_PROTOCOL?: string;
    };
  }).env;

  const explicit = (env?.VITE_API_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const domain = (env?.VITE_API_DOMAIN || '').trim();
  if (domain) {
    const protocol = (env?.VITE_API_PROTOCOL || 'https').trim();
    const origin = domain.startsWith('http://') || domain.startsWith('https://')
      ? domain.replace(/\/+$/, '')
      : `${protocol}://${domain}`.replace(/\/+$/, '');
    return `${origin}/api`.replace(/\/+$/, '');
  }

  return '/api';
}

export function useServerWarmup(options?: UseServerWarmupOptions): UseServerWarmupResult {
  const disableWarmup =
    ((import.meta as unknown as { env?: { VITE_DISABLE_WARMUP?: string } }).env?.VITE_DISABLE_WARMUP ??
      '') === '1';

  const {
    minDurationMs = 2500,
    slowThresholdMs = 15000,
    attemptTimeoutMs = 15000,
    requestIntervalMs = 10000,
    maxRequests = 10,
    retries = 2,
    endpoints = ['/ping', '/health', '/', ''],
  } = options ?? {};

  const [status, setStatus] = useState<WarmupStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setIsSlow(false);
    setAttempt(0);
    setError(null);
    setLastUrl(null);
    setGaveUp(false);
    setNonce((v) => v + 1);
  }, []);

  const message = useMemo(() => {
    if (gaveUp) return 'Máy chủ đang lỗi. Vào app trước nhé.';
    if (status === 'error') return 'Không kết nối được. Vào app trước nhé.';
    if (isSlow) return 'Đang khởi động… chờ chút nhé.';
    return DEFAULT_MESSAGES[messageIndex % DEFAULT_MESSAGES.length];
  }, [gaveUp, isSlow, messageIndex, status]);

  useEffect(() => {
    if (!disableWarmup) return;
    setProgress(100);
    setStatus('ready');
  }, [disableWarmup]);

  useEffect(() => {
    if (disableWarmup) return;
    if (status !== 'warming') return;
    const msgTimer = window.setInterval(() => {
      setMessageIndex((v) => v + 1);
    }, 2200);
    return () => window.clearInterval(msgTimer);
  }, [disableWarmup, status]);

  useEffect(() => {
    if (status !== 'warming') return;

    const slowTimer = window.setTimeout(() => setIsSlow(true), slowThresholdMs);

    // Fake progress to 90% slowly.
    const progressTimer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        // easing: slower as it approaches 90
        const delta = Math.max(0.15, (90 - p) / 240);
        return clamp(p + delta * 100 * 0.016, 0, 90);
      });
    }, 16);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearInterval(progressTimer);
    };
  }, [slowThresholdMs, status]);

  useEffect(() => {
    if (disableWarmup) return;
    let cancelled = false;

    const run = async () => {
      setStatus('warming');
      const startedAt = Date.now();
      const base = getApiBaseUrl();

      const candidates = endpoints
        .map((p) => (p.startsWith('/') ? `${base}${p}` : `${base}/${p}`))
        .map((u) => u.replace(/\/+$/, ''))
        // also allow base itself
        .flatMap((u) => [u, u + '/'])
        .filter((u, idx, arr) => arr.indexOf(u) === idx);

      let lastErr: unknown = null;
      let requestCount = 0;

      for (let i = 0; i <= retries; i++) {
        if (cancelled) return;
        setAttempt(i + 1);
        try {
          for (const url of candidates) {
            if (cancelled) return;
            if (requestCount >= maxRequests) {
              setGaveUp(true);
              setProgress(100);
              setStatus('ready');
              return;
            }
            requestCount += 1;

            setLastUrl(url);
            const res = await fetchWithTimeout(url, attemptTimeoutMs);
            if (res.ok) {
              const elapsed = Date.now() - startedAt;
              const remaining = minDurationMs - elapsed;
              if (remaining > 0) await sleep(remaining);
              if (cancelled) return;
              setProgress(100);
              await sleep(250);
              if (cancelled) return;
              setStatus('ready');
              return;
            }

            if (cancelled) return;
            await sleep(requestIntervalMs);
          }
          lastErr = new Error('No warmup endpoint responded OK');
        } catch (e) {
          lastErr = e;
        }
        if (i < retries) await sleep(Math.max(requestIntervalMs, 650 + i * 450));
      }

      if (cancelled) return;
      setError(lastErr instanceof Error ? lastErr.message : 'Warmup failed');
      setStatus('error');
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    attemptTimeoutMs,
    endpoints,
    minDurationMs,
    retries,
    slowThresholdMs,
    nonce,
    disableWarmup,
    requestIntervalMs,
    maxRequests,
  ]);

  return { status, progress, message, isSlow, attempt, error, lastUrl, gaveUp, retry };
}
