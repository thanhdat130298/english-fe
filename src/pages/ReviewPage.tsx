import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { vocabularyApi, vocabularyKeys, type VocabularyReviewResult } from '../services/api';

type ReviewPageProps = {
  onBack: () => void;
};

export function ReviewPage({ onBack }: ReviewPageProps) {
  const queryClient = useQueryClient();
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);
  const [selfAnswer, setSelfAnswer] = useState('');

  const { data: due = [], isLoading, isError, error } = useQuery({
    queryKey: vocabularyKeys.reviewQueue(),
    queryFn: () => vocabularyApi.getReviewQueue(),
  });
  const { data: practicePool = [] } = useQuery({
    queryKey: vocabularyKeys.list({ page: 1, limit: 100, includeArchived: false }),
    queryFn: () => vocabularyApi.getList({ page: 1, limit: 100, includeArchived: false }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, result }: { id: string; result: VocabularyReviewResult }) =>
      vocabularyApi.review(id, result),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: vocabularyKeys.reviewQueue() });
      const previousQueue = queryClient.getQueryData(vocabularyKeys.reviewQueue()) as
        | ReturnType<typeof vocabularyApi.getReviewQueue>
        | undefined;
      queryClient.setQueryData(vocabularyKeys.reviewQueue(), (old: any) =>
        Array.isArray(old) ? old.filter((item) => item.id !== id) : old
      );
      return { previousQueue };
    },
    onSuccess: () => {
      setSessionDone((v) => v + 1);
      setShowAnswer(false);
      setSelfAnswer('');
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.reviewQueue() });
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.all });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousQueue) {
        queryClient.setQueryData(vocabularyKeys.reviewQueue(), ctx.previousQueue as any);
      }
    },
  });

  const practiceCandidates = practicePool.filter((item) => !item.isArchived && item.reviewCount === 0);
  const currentQueue = due.length > 0 ? due : practiceCandidates;
  const currentCard = currentQueue[0];
  const totalSeen = sessionDone + currentQueue.length;
  const progress = totalSeen > 0 ? Math.round((sessionDone / totalSeen) * 100) : 0;

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
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#0C6478] hover:underline"
      >
        <ArrowLeft size={18} />
        Back to vocabulary
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="text-[#15919B]" size={28} />
          Review
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Review one word at a time and rate how difficult it feels.
        </p>
      </header>

      {currentQueue.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          <p className="font-medium text-gray-900">
            {sessionDone > 0 ? 'Session completed' : 'You&apos;re all caught up!'}
          </p>
          <p className="text-sm mt-2">
            {sessionDone > 0
              ? `You reviewed ${sessionDone} cards in this session.`
              : 'No words are due for review right now.'}
          </p>
          {sessionDone > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSessionDone(0);
                setShowAnswer(false);
                queryClient.invalidateQueries({ queryKey: vocabularyKeys.reviewQueue() });
              }}
              className="mt-4 px-4 py-2 text-sm bg-[#213A58] text-white rounded-lg hover:bg-[#0C6478]"
            >
              Check for new due words
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          {due.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No due words right now. Showing practice mode with new words.
            </div>
          ) : null}
          <div className="rounded-lg bg-gray-100 h-2 overflow-hidden">
            <div
              className="h-full bg-[#15919B] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            Reviewed: {sessionDone} | Remaining: {currentQueue.length}
          </p>

          {currentCard ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <p className="text-sm text-gray-500 mb-2">Word</p>
              <h2 className="text-3xl font-semibold text-gray-900">{currentCard.word}</h2>

              {!showAnswer ? (
                <div className="mt-6 space-y-3">
                  <label className="block">
                    <span className="text-sm text-gray-500">Your meaning (active recall)</span>
                    <textarea
                      value={selfAnswer}
                      onChange={(e) => setSelfAnswer(e.target.value)}
                      placeholder="Type what you remember before showing answer..."
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#15919B]/20"
                    />
                  </label>
                </div>
              ) : null}

              {showAnswer ? (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">Meaning</p>
                  <p className="text-xl text-gray-800">{currentCard.meaning}</p>
                  {selfAnswer.trim() ? (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">Your answer</p>
                      <p className="text-sm text-gray-700 mt-1">{selfAnswer}</p>
                    </div>
                  ) : null}
                  {currentCard.example ? (
                    <p className="text-sm text-gray-500 mt-3 italic">Example: {currentCard.example}</p>
                  ) : null}
                  {currentCard.sourceText ? (
                    <p className="text-sm text-gray-500 mt-2">Source: {currentCard.sourceText}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-2">
                {!showAnswer ? (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="px-4 py-2 rounded-lg bg-[#213A58] text-white hover:bg-[#0C6478]"
                  >
                    Show answer
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => reviewMutation.mutate({ id: currentCard.id, result: 'HARD' })}
                      disabled={reviewMutation.isPending}
                      className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                    >
                      Chưa pass
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewMutation.mutate({ id: currentCard.id, result: 'EASY' })}
                      disabled={reviewMutation.isPending}
                      className="px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
                    >
                      Pass
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
