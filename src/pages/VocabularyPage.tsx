import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Edit2, Trash2, Filter, Loader2 } from 'lucide-react';
import { vocabularyApi, VocabularyItem } from '../services/api';

export function VocabularyPage() {
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editMeaning, setEditMeaning] = useState('');

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      setIsLoading(true);
      const data = await vocabularyApi.getAll();
      setVocabItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vocabulary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;
    try {
      await vocabularyApi.delete(id);
      setVocabItems(vocabItems.filter(item => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete vocabulary');
    }
  };

  const handleEdit = (item: VocabularyItem) => {
    setIsEditing(true);
    setEditMeaning(item.meaning);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updated = await vocabularyApi.update(id, { meaning: editMeaning });
      setVocabItems(vocabItems.map(item => item.id === id ? updated : item));
      setIsEditing(false);
      if (selectedId === id) {
        setSelectedId(null);
        setTimeout(() => setSelectedId(id), 100);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update vocabulary');
    }
  };

  const filteredVocab = vocabItems.filter(
    (item) =>
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedItem = vocabItems.find((item) => item.id === selectedId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#15919B]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vocabulary</h1>
          <p className="text-gray-500 mt-1">
            Manage your saved words and phrases
          </p>
        </div>
        <span className="px-3 py-1 bg-[#E6FAF2] text-[#0C6478] rounded-full text-sm font-medium">
          {vocabItems.length} words
        </span>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20} />

          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20 focus:border-[#15919B] transition-all" />

        </div>
        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center transition-colors">
          <Filter size={18} className="mr-2" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List View */}
        <div className="lg:col-span-2 space-y-3">
          {filteredVocab.length > 0 ?
          filteredVocab.map((item) =>
          <div
            key={item.id}
            onClick={() => {
              setSelectedId(item.id);
              setIsEditing(false);
            }}
            className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedId === item.id ? 'border-[#15919B] ring-1 ring-[#15919B]' : 'border-gray-200 hover:border-[#09D1C7]'}`}>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.word}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                      {item.meaning}
                    </p>
                  </div>
                </div>
              </div>
          ) :

          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500">
                {searchTerm ? `No vocabulary found matching "${searchTerm}"` : 'No vocabulary items yet'}
              </p>
            </div>
          }
        </div>

        {/* Detail View */}
        <div className="lg:col-span-1">
          {selectedItem ?
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedItem.word}
                </h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Meaning
                  </h4>
                  {isEditing && selectedId === selectedItem.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editMeaning}
                        onChange={(e) => setEditMeaning(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(selectedItem.id)}
                          className="px-3 py-1.5 bg-[#213A58] text-white text-sm rounded-lg hover:bg-[#0C6478]">
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditMeaning(selectedItem.meaning);
                          }}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900">{selectedItem.meaning}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Example
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-gray-700">
                    "{selectedItem.example}"
                  </div>
                </div>

                {selectedItem.sourceText && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Source Text
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
                      {selectedItem.sourceText}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Added on {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(selectedItem)}
                      className="p-2 text-gray-500 hover:text-[#0C6478] hover:bg-[#E6FAF2] rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedItem.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div> :

          <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-8 text-center h-full flex flex-col items-center justify-center text-gray-500">
              <p>Select a word to view details</p>
            </div>
          }
        </div>
      </div>
    </div>);
}