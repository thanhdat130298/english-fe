import { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  vocabularyApi,
  vocabularyKeys,
  type Vocabulary,
  type VocabularyDifficulty,
  type VocabListParams,
} from '../services/api';

/** Stable list query using page/limit API contract. */
const VOCAB_LIST_PARAMS: VocabListParams = {
  page: 1,
  limit: 100,
  includeArchived: false,
};
import { useDebounce } from '../hooks/useDebounce';
import { Toast } from '../components/Toast';
import { SearchBar } from './vocabulary/SearchBar';
import { FilterBar } from './vocabulary/FilterBar';
import { ReviewBanner } from './vocabulary/ReviewBanner';
import { VocabularyList } from './vocabulary/VocabularyList';
import { filterVocabulary } from './vocabulary/filterVocabulary';
import type { DifficultyFilter, StateFilter } from './vocabulary/types';

type VocabularyPageProps = {
  onNavigateToReview: () => void;
};

export function VocabularyPage({ onNavigateToReview }: VocabularyPageProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const { data: items = [], isLoading, isError, error, isFetching } = useQuery({
    queryKey: vocabularyKeys.list(VOCAB_LIST_PARAMS),
    queryFn: () => vocabularyApi.getList(VOCAB_LIST_PARAMS),
  });

  const { data: reviewQueue = [] } = useQuery({
    queryKey: vocabularyKeys.reviewQueue(),
    queryFn: () => vocabularyApi.getReviewQueue(),
  });

  const filtered = useMemo(
    () => filterVocabulary(items, debouncedSearch, difficulty, stateFilter),
    [items, debouncedSearch, difficulty, stateFilter]
  );

  /** Matches GET /vocab/review-queue (max 20 due items) */
  const dueCount = reviewQueue.length;

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      difficulty: d,
    }: {
      id: string;
      difficulty: VocabularyDifficulty;
    }) => vocabularyApi.review(id, d),
    onMutate: async ({ id, difficulty: d }) => {
      await queryClient.cancelQueries({ queryKey: vocabularyKeys.list(VOCAB_LIST_PARAMS) });
      const previous = queryClient.getQueryData<Vocabulary[]>(vocabularyKeys.list(VOCAB_LIST_PARAMS));
      queryClient.setQueryData<Vocabulary[]>(vocabularyKeys.list(VOCAB_LIST_PARAMS), (old) =>
        old?.map((v) =>
          v.id === id
            ? {
                ...v,
                difficulty: d,
                reviewCount: v.reviewCount + 1,
                isDue: false,
              }
            : v
        )
      );
      return { previous };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Vocabulary[]>(vocabularyKeys.list(VOCAB_LIST_PARAMS), (old) =>
        old?.map((v) => (v.id === updated.id ? updated : v))
      );
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.reviewQueue() });
      setToast({ message: `Updated “${updated.word}”`, variant: 'success' });
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(vocabularyKeys.list(VOCAB_LIST_PARAMS), ctx.previous);
      }
      setToast({ message: err.message || 'Could not save review', variant: 'error' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => vocabularyApi.archive(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: vocabularyKeys.list(VOCAB_LIST_PARAMS) });
      const previous = queryClient.getQueryData<Vocabulary[]>(vocabularyKeys.list(VOCAB_LIST_PARAMS));
      queryClient.setQueryData<Vocabulary[]>(vocabularyKeys.list(VOCAB_LIST_PARAMS), (old) =>
        old?.filter((v) => v.id !== id)
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.reviewQueue() });
      setToast({ message: 'Word archived', variant: 'success' });
    },
    onError: (err: Error, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(vocabularyKeys.list(VOCAB_LIST_PARAMS), ctx.previous);
      }
      setToast({ message: err.message || 'Could not archive', variant: 'error' });
    },
  });

  const handleReview = useCallback(
    (id: string, d: VocabularyDifficulty) => {
      reviewMutation.mutate({ id, difficulty: d });
    },
    [reviewMutation]
  );

  const handleArchive = useCallback(
    (id: string) => {
      archiveMutation.mutate(id);
    },
    [archiveMutation]
  );

  const pendingReview =
    reviewMutation.isPending && reviewMutation.variables
      ? { id: reviewMutation.variables.id, difficulty: reviewMutation.variables.difficulty }
      : null;

  const pendingArchiveId =
    archiveMutation.isPending && archiveMutation.variables ? archiveMutation.variables : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#15919B]" size={36} aria-label="Loading" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
        {error instanceof Error ? error.message : 'Failed to load vocabulary'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Vocabulary</h1>
          {isFetching && !isLoading ? (
            <Loader2 className="animate-spin text-[#15919B]" size={18} aria-hidden />
          ) : null}
        </div>
        <p className="text-gray-500 text-sm">
          Search, filter by difficulty and learning state, and rate words in one tap.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
        <SearchBar value={search} onChange={setSearch} />
        <div className="lg:flex-shrink-0 lg:max-w-md w-full">
          <FilterBar
            difficulty={difficulty}
            state={stateFilter}
            onDifficultyChange={setDifficulty}
            onStateChange={setStateFilter}
          />
        </div>
      </div>

      <ReviewBanner dueCount={dueCount} onStartReview={onNavigateToReview} />

      <section aria-label="Vocabulary list">
        <p className="text-sm text-gray-500 mb-3">
          Showing {filtered.length} of {items.length} words
        </p>
        <VocabularyList
          items={filtered}
          pendingReview={pendingReview}
          pendingArchiveId={pendingArchiveId}
          onReview={handleReview}
          onArchive={handleArchive}
        />
      </section>

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
