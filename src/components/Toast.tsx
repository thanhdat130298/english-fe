import { useEffect } from 'react';
import { X } from 'lucide-react';

type ToastProps = {
  message: string;
  variant?: 'success' | 'error';
  onClose: () => void;
};

export function Toast({ message, variant = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 shadow-lg ${
        variant === 'error'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-[#C5F5E3] bg-white text-gray-900'
      }`}
      role="alert"
    >
      <p className="text-sm flex-1">{message}</p>
      <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}
