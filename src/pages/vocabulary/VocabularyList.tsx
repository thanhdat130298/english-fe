import { VocabularyCard } from './VocabularyCard';
import type { Vocabulary, VocabularyDifficulty } from '../../services/api';

type VocabularyListProps = {
  items: Vocabulary[];
  pendingReview: { id: string; difficulty: VocabularyDifficulty } | null;
  pendingArchiveId: string | null;
  onReview: (id: string, difficulty: VocabularyDifficulty) => void;
  onArchive: (id: string) => void;
};

export function VocabularyList({
  items,
  pendingReview,
  pendingArchiveId,
  onReview,
  onArchive,
}: VocabularyListProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 rounded-xl border border-dashed border-gray-200 bg-white">
        No words match your search and filters.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id}>
          <VocabularyCard
            item={item}
            onReview={onReview}
            onArchive={onArchive}
            pendingReviewDifficulty={
              pendingReview?.id === item.id ? pendingReview.difficulty : null
            }
            isArchivePending={pendingArchiveId === item.id}
          />
        </li>
      ))}
    </ul>
  );
}
