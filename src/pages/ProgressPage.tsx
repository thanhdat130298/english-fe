import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BookOpen, Flame, Calendar, Loader2, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  progressApi,
  type ProgressRecentActivityItem,
  type LeaderboardUser,
} from '../services/api';

function formatChartDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
}

function getActivityLabel(type: ProgressRecentActivityItem['type']): string {
  switch (type) {
    case 'VOCAB_ADDED':
      return 'Added word';
    case 'WORDLIST_CREATED':
      return 'Created list';
    case 'REVIEW_DONE':
      return 'Reviewed';
    case 'GOAL_COMPLETED':
      return 'Completed';
    default:
      return 'Activity';
  }
}

function getActivityDotClass(type: ProgressRecentActivityItem['type']): string {
  switch (type) {
    case 'VOCAB_ADDED':
      return 'bg-[#0C6478]';
    case 'WORDLIST_CREATED':
      return 'bg-purple-600';
    case 'REVIEW_DONE':
      return 'bg-orange-600';
    case 'GOAL_COMPLETED':
      return 'bg-green-600';
    default:
      return 'bg-gray-500';
  }
}

function LeaderboardCard({
  title,
  unit,
  items,
  prefixAt = true,
}: {
  title: string;
  unit: string;
  items: LeaderboardUser[];
  prefixAt?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 5).map((user, idx) => (
            <div key={`${user.userId}-${idx}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs w-5 text-gray-500">#{idx + 1}</span>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {prefixAt ? `@${user.username}` : user.username}
                </span>
              </div>
              <span className="text-sm text-[#0C6478] font-semibold">
                {user.value} {unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProgressPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['progress', 'dashboard-mapped'],
    queryFn: () => progressApi.getDashboardMapped(),
  });

  const chartData = useMemo(() => {
    if (!data?.activitySeries?.length) {
      return [
        { name: 'Mon', words: 0 },
        { name: 'Tue', words: 0 },
        { name: 'Wed', words: 0 },
        { name: 'Thu', words: 0 },
        { name: 'Fri', words: 0 },
        { name: 'Sat', words: 0 },
        { name: 'Sun', words: 0 },
      ];
    }
    return data.activitySeries.map((point) => ({
      name: formatChartDate(point.date),
      words: point.addedCount,
    }));
  }, [data]);

  const { data: leaderboard } = useQuery({
    queryKey: ['progress', 'leaderboard-mapped'],
    queryFn: () => progressApi.getLeaderboardMapped(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#15919B]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Progress</h1>
        <p className="text-gray-500 mt-1">Track your learning journey</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error instanceof Error ? error.message : 'Failed to load progress'}
        </div>
      )}

      {/* Leaderboard */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <LeaderboardCard
            title="Top Streak Users"
            unit="days"
            items={leaderboard?.topStreakUsers ?? []}
          />
          <LeaderboardCard
            title="Top Added Vocabulary"
            unit="words"
            items={leaderboard?.topAddedUsers ?? []}
          />
          <LeaderboardCard
            title="Top Review Users"
            unit="reviews"
            items={leaderboard?.topReviewUsers ?? []}
          />
          <LeaderboardCard
            title="Top Word Dịch Nhiều Nhất"
            unit="lần"
            items={leaderboard?.topTranslatedWords ?? []}
            prefixAt={false}
          />
        </div>
      </section>

      {/* Stats Grid */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Key Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Vocabulary
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.summary.totalVocabularyCount ?? 0}
              </h3>
            </div>
            <div className="p-2 bg-[#E6FAF2] text-[#0C6478] rounded-lg">
              <BookOpen size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Words Added Today
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.summary.dailyAddedVocabularyCount ?? 0}
              </h3>
            </div>
            <div className="p-2 bg-[#E6FAF2] text-[#15919B] rounded-lg">
              <Calendar size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Learning Streak
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.streak.currentStreakDays ?? 0} Days
              </h3>
            </div>
            <div className="p-2 bg-[#FFF3E6] text-orange-600 rounded-lg">
              <Flame size={20} />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Best: {data?.streak.longestStreakDays ?? 0} days
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Wordlists</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.wordlistsSummary.wordlistCount ?? 0}
              </h3>
            </div>
            <div className="p-2 bg-[#E6FAF2] text-[#213A58] rounded-lg">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Across {data?.wordlistsSummary.categoryCount ?? 0} categories
          </div>
        </div>
        </div>
      </section>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Words Added Activity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6B7280',
                    fontSize: 12
                  }}
                  dy={10} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6B7280',
                    fontSize: 12
                  }} />

                <Tooltip
                  cursor={{
                    fill: '#F3F4F6'
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />

                <Bar
                  dataKey="words"
                  fill="#15919B"
                  radius={[4, 4, 0, 0]}
                  barSize={40} />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Activity
          </h3>
          <div className="space-y-6">
            {(data?.recentActivity?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            ) : (
              data?.recentActivity.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${getActivityDotClass(item.type)}`} />
                  <div>
                    <p className="text-sm text-gray-900 font-medium">
                      {getActivityLabel(item.type)}:{' '}
                      <span className="text-gray-600 font-normal">
                        {item.target}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}