import type { Vocabulary } from '../../services/api';
import type { DifficultyFilter, StateFilter } from './types';

export function filterVocabulary(
  items: Vocabulary[],
  debouncedSearch: string,
  difficulty: DifficultyFilter,
  state: StateFilter
): Vocabulary[] {
  const q = debouncedSearch.trim().toLowerCase();
  return items.filter((v) => {
    const matchSearch =
      !q ||
      v.word.toLowerCase().includes(q) ||
      v.meaning.toLowerCase().includes(q);
    const matchDiff = difficulty === 'all' || v.difficulty === difficulty;
    let matchState = true;
    if (state !== 'all') {
      if (state === 'new') matchState = v.reviewCount === 0;
      else if (state === 'due') matchState = v.isDue;
      else if (state === 'mastered') matchState = v.isMastered;
    }
    return matchSearch && matchDiff && matchState;
  });
}
