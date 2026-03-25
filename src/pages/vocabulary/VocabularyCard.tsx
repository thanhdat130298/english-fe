import { memo } from 'react';
import { Loader2, Archive } from 'lucide-react';
import type { Vocabulary, VocabularyDifficulty } from '../../services/api';

export type VocabularyCardProps = {
  item: Vocabulary;
  onReview: (id: string, difficulty: VocabularyDifficulty) => void;
  onArchive: (id: string) => void;
  pendingReviewDifficulty: VocabularyDifficulty | null;
  isArchivePending: boolean;
};

function difficultyBadgeClass(d: VocabularyDifficulty | null | undefined) {
  switch (d) {
    case 'EASY':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'HARD':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function stateBadge(v: Vocabulary): { label: string; className: string } {
  if (v.isMastered) {
    return { label: 'Mastered', className: 'bg-violet-100 text-violet-800 border-violet-200' };
  }
  if (v.isDue) {
    return { label: 'Review', className: 'bg-orange-100 text-orange-900 border-orange-200' };
  }
  if (v.reviewCount === 0) {
    return { label: 'New', className: 'bg-sky-100 text-sky-800 border-sky-200' };
  }
  return { label: 'Learning', className: 'bg-slate-100 text-slate-700 border-slate-200' };
}

function VocabularyCardInner({
  item,
  onReview,
  onArchive,
  pendingReviewDifficulty,
  isArchivePending,
}: VocabularyCardProps) {
  const diff = item.difficulty ?? undefined;
  const state = stateBadge(item);
  const busy = pendingReviewDifficulty !== null || isArchivePending;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{item.word}</h3>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyBadgeClass(diff ?? null)}`}
          >
            {diff ?? 'Unset'}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${state.className}`}>
            {state.label}
          </span>
        </div>
      </div>

      <p className="mt-2 text-gray-700 text-sm leading-relaxed">{item.meaning}</p>
      {item.example ? (
        <p className="mt-2 text-sm text-gray-500 italic border-l-2 border-[#15919B]/40 pl-3">
          {item.example}
        </p>
      ) : null}

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <div>
          <dt className="inline font-medium text-gray-600">Reviews: </dt>
          <dd className="inline">{item.reviewCount}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-gray-600">Correct: </dt>
          <dd className="inline">{item.correctCount}</dd>
        </div>
        {item.nextReviewAt ? (
          <div className="w-full sm:w-auto">
            <dt className="inline font-medium text-gray-600">Next: </dt>
            <dd className="inline">{new Date(item.nextReviewAt).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
          <button
            key={d}
            type="button"
            disabled={busy}
            onClick={() => onReview(item.id, d)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-[#E6FAF2] hover:border-[#15919B]/40 disabled:opacity-60"
          >
            {d === 'EASY' && '👍 Easy'}
            {d === 'MEDIUM' && '😐 Medium'}
            {d === 'HARD' && '🔥 Hard'}
            {pendingReviewDifficulty === d ? (
              <Loader2 className="animate-spin" size={14} aria-hidden />
            ) : null}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => onArchive(item.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-800 disabled:opacity-60"
        >
          <Archive size={16} />
          Archive
          {isArchivePending && <Loader2 className="animate-spin" size={14} />}
        </button>
      </div>
    </article>
  );
}

export const VocabularyCard = memo(VocabularyCardInner);
