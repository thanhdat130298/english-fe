import { Filter } from 'lucide-react';
import type { DifficultyFilter, StateFilter } from './types';

type FilterBarProps = {
  difficulty: DifficultyFilter;
  state: StateFilter;
  onDifficultyChange: (v: DifficultyFilter) => void;
  onStateChange: (v: StateFilter) => void;
};

const diffOptions: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const stateOptions: { value: StateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'due', label: 'Need review' },
  { value: 'mastered', label: 'Mastered' },
];

export function FilterBar({
  difficulty,
  state,
  onDifficultyChange,
  onStateChange,
}: FilterBarProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <Filter size={18} className="text-gray-400 flex-shrink-0" />
        <span className="font-medium whitespace-nowrap">Filters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm text-gray-600">
          <span className="font-medium whitespace-nowrap mb-1 block">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as DifficultyFilter)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#15919B]/20"
          >
            {diffOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-gray-600">
          <span className="font-medium whitespace-nowrap mb-1 block">Learning</span>
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value as StateFilter)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#15919B]/20"
          >
            {stateOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
