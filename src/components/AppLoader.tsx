import { useEffect, useMemo, useState } from 'react';

type AppLoaderProps = {
  visible: boolean;
  progress: number;
  message: string;
  isSlow: boolean;
  attempt: number;
  error: string | null;
  onFadeOutDone?: () => void;
};

function Dot({ className = '' }: { className?: string }) {
  return <span className={`h-1.5 w-1.5 rounded-full bg-white/60 animate-loader-dot ${className}`} />;
}

export function AppLoader({
  visible,
  progress,
  message,
  isSlow,
  attempt,
  error,
  onFadeOutDone,
}: AppLoaderProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const [isFadingOut, setIsFadingOut] = useState(false);
  // details removed for simpler user-facing UI

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      setIsFadingOut(false);
      return;
    }
    if (!isMounted) return;
    setIsFadingOut(true);
    const t = window.setTimeout(() => {
      setIsMounted(false);
      onFadeOutDone?.();
    }, 450);
    return () => window.clearTimeout(t);
  }, [isMounted, onFadeOutDone, visible]);

  const statusLine = useMemo(() => {
    if (error) return 'Đang thử kết nối lại…';
    if (isSlow) return 'Đang kết nối hơi lâu, bạn chờ chút nhé…';
    return 'Đang kết nối…';
  }, [error, isSlow]);

  if (!isMounted) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-[999] flex items-center justify-center',
        'bg-[#05060A] text-white overflow-hidden',
        isFadingOut ? 'opacity-0' : 'opacity-100',
        isFadingOut ? 'pointer-events-none' : 'pointer-events-auto',
        'transition-opacity duration-500',
      ].join(' ')}
      aria-label="App loading"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute -inset-[40%] animate-loader-rotate bg-[conic-gradient(from_180deg_at_50%_50%,#0C6478_0deg,#15919B_90deg,#213A58_180deg,#0C6478_360deg)] opacity-30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(21,145,155,0.35),transparent_55%),radial-gradient(circle_at_70%_75%,rgba(12,100,120,0.35),transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:100%_12px] animate-loader-scan" />
      </div>

      <div className="relative w-full max-w-md px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_0_80px_rgba(21,145,155,0.16)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-white/60">English App</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Đang chuẩn bị…
              </h1>
              <p className="mt-2 text-sm text-white/70 truncate">
                {message}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#15919B,rgba(255,255,255,0.9),#0C6478)] bg-[length:220%_100%] animate-loader-shimmer transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <Dot />
                <Dot className="[animation-delay:120ms]" />
                <Dot className="[animation-delay:240ms]" />
                <span className="ml-1 text-white/60">{statusLine}</span>
              </span>
              <span className="text-white/40">{attempt ? `Thử lần ${attempt}` : ''}</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-white/45">
            Nếu mạng yếu, có thể sẽ chờ lâu hơn một chút.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loaderRotate { to { transform: rotate(360deg); } }
        @keyframes loaderScan { 0% { transform: translateY(-10%); } 100% { transform: translateY(10%); } }
        @keyframes loaderShimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes loaderDot { 0%, 80%, 100% { transform: translateY(0); opacity: .55; } 40% { transform: translateY(-3px); opacity: 1; } }
        .animate-loader-rotate { animation: loaderRotate 12s linear infinite; }
        .animate-loader-scan { animation: loaderScan 1.8s ease-in-out infinite alternate; }
        .animate-loader-shimmer { animation: loaderShimmer 1.4s linear infinite; }
        .animate-loader-dot { animation: loaderDot 900ms ease-in-out infinite; }
      `}</style>
    </div>
  );
}

