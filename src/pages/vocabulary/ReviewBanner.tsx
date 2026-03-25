import { Play } from 'lucide-react';

type ReviewBannerProps = {
  dueCount: number;
  onStartReview: () => void;
};

export function ReviewBanner({ dueCount, onStartReview }: ReviewBannerProps) {
  return (
    <div className="rounded-xl border border-[#15919B]/30 bg-gradient-to-r from-[#E6FAF2] to-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-[#0C6478]">Ready to review?</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {dueCount === 0
            ? 'No words due right now. Come back later or add new words.'
            : `${dueCount} word${dueCount === 1 ? '' : 's'} waiting for review.`}
        </p>
      </div>
      <button
        type="button"
        onClick={onStartReview}
        disabled={dueCount === 0}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#213A58] text-white text-sm font-medium hover:bg-[#0C6478] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        <Play size={18} />
        Start review ({dueCount})
      </button>
    </div>
  );
}
