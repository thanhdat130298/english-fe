import { useState, useEffect } from 'react';
import { Plus, MoreVertical, ArrowRight, Book, Loader2, Trash2, Edit2 } from 'lucide-react';
import { wordlistsApi, Wordlist, VocabularyItem } from '../services/api';

const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500'];

export function WordlistsPage() {
  const [wordlists, setWordlists] = useState<Wordlist[]>([]);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [listItems, setListItems] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  useEffect(() => {
    loadWordlists();
  }, []);

  useEffect(() => {
    if (activeList) {
      loadListItems(activeList);
    }
  }, [activeList]);

  const loadWordlists = async () => {
    try {
      setIsLoading(true);
      const data = await wordlistsApi.getAll();
      setWordlists(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load wordlists');
    } finally {
      setIsLoading(false);
    }
  };

  const loadListItems = async (id: string) => {
    try {
      const items = await wordlistsApi.getItems(id);
      setListItems(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load list items');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const newList = await wordlistsApi.create({
        name: newListName,
        description: newListDesc || '',
      });
      setWordlists([...wordlists, newList]);
      setNewListName('');
      setNewListDesc('');
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create wordlist');
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wordlist?')) return;
    try {
      await wordlistsApi.delete(id);
      setWordlists(wordlists.filter(w => w.id !== id));
      if (activeList === id) {
        setActiveList(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete wordlist');
    }
  };

  const getColorForIndex = (index: number) => COLORS[index % COLORS.length];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#15919B]" size={32} />
      </div>
    );
  }

  if (activeList) {
    const list = wordlists.find((l) => l.id === activeList);
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveList(null)}
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center transition-colors">
          <ArrowRight className="rotate-180 mr-1" size={16} />
          Back to all lists
        </button>

        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {list?.name}
            </h1>
            <p className="text-gray-500 mt-1">{list?.description}</p>
          </div>
          <button className="px-4 py-2 bg-[#213A58] text-white rounded-lg hover:bg-[#0C6478] transition-colors text-sm font-medium">
            Practice this list
          </button>
        </header>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            {listItems.length > 0 ? (
              <div className="space-y-3">
                {listItems.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900">{item.word}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.meaning}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No words in this list yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add vocabulary items to this wordlist
                </p>
              </div>
            )}
          </div>
        </div>
      </div>);
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Wordlists</h1>
          <p className="text-gray-500 mt-1">
            Organize your vocabulary into collections
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-[#213A58] text-white rounded-lg hover:bg-[#0C6478] transition-colors flex items-center text-sm font-medium">
          <Plus size={18} className="mr-2" />
          New List
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Wordlist</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Wordlist name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20"
            />
            <textarea
              placeholder="Description (optional)"
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreateList}
                className="px-4 py-2 bg-[#213A58] text-white rounded-lg hover:bg-[#0C6478]">
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewListName('');
                  setNewListDesc('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wordlists.map((list, index) => {
          const color = getColorForIndex(index);
          return (
            <div
              key={list.id}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-[#09D1C7] transition-all relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />

              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}>
                  <Book size={20} className={color.replace('bg-', 'text-')} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list.id);
                  }}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-gray-50">
                  <Trash2 size={18} />
                </button>
              </div>

              <h3
                className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#0C6478] transition-colors cursor-pointer"
                onClick={() => setActiveList(list.id)}>
                {list.name}
              </h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                {list.description}
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  Updated {new Date(list.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setActiveList(list.id)}
                  className="text-sm text-[#15919B] hover:text-[#0C6478] font-medium">
                  View →
                </button>
              </div>
            </div>
          );
        })}

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-[#09D1C7] hover:text-[#15919B] hover:bg-[#E6FAF2] transition-all min-h-[200px]">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <Plus size={24} />
            </div>
            <span className="font-medium">Create new list</span>
          </button>
        )}
      </div>
    </div>);
}
