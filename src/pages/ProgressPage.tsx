import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { TrendingUp, BookOpen, Flame, Calendar, Loader2 } from 'lucide-react';
import { progressApi } from '../services/api';
const data = [
{
  name: 'Mon',
  words: 12
},
{
  name: 'Tue',
  words: 19
},
{
  name: 'Wed',
  words: 8
},
{
  name: 'Thu',
  words: 24
},
{
  name: 'Fri',
  words: 15
},
{
  name: 'Sat',
  words: 5
},
{
  name: 'Sun',
  words: 10
}];

export function ProgressPage() {
  const [summary, setSummary] = useState<{
    date: string;
    totalVocabularyCount: number;
    dailyAddedVocabularyCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setIsLoading(true);
      const data = await progressApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  };

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
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Vocabulary
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.totalVocabularyCount || 0}
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
                {summary?.dailyAddedVocabularyCount || 0}
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
              <h3 className="text-2xl font-bold text-gray-900 mt-1">14 Days</h3>
            </div>
            <div className="p-2 bg-[#FFF3E6] text-orange-600 rounded-lg">
              <Flame size={20} />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">Keep it up! 🔥</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Wordlists</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">8</h3>
            </div>
            <div className="p-2 bg-[#E6FAF2] text-[#213A58] rounded-lg">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">Across 5 categories</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Words Added Activity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
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
            {[
            {
              action: 'Added word',
              target: 'Serendipity',
              time: '2 hours ago',
              icon: 'bg-[#C5F5E3] text-[#0C6478]'
            },
            {
              action: 'Created list',
              target: 'IELTS Prep',
              time: '5 hours ago',
              icon: 'bg-purple-100 text-purple-600'
            },
            {
              action: 'Completed',
              target: 'Daily Goal',
              time: 'Yesterday',
              icon: 'bg-green-100 text-green-600'
            },
            {
              action: 'Added word',
              target: 'Ephemeral',
              time: 'Yesterday',
              icon: 'bg-[#C5F5E3] text-[#0C6478]'
            },
            {
              action: 'Reviewed',
              target: 'Business English',
              time: '2 days ago',
              icon: 'bg-orange-100 text-orange-600'
            }].
            map((item, i) =>
            <div key={i} className="flex items-start space-x-3">
                <div
                className={`w-2 h-2 mt-2 rounded-full ${item.icon.split(' ')[1].replace('text-', 'bg-')}`} />

                <div>
                  <p className="text-sm text-gray-900 font-medium">
                    {item.action}:{' '}
                    <span className="text-gray-600 font-normal">
                      {item.target}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}