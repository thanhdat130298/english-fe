import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Bookmark, Plus, Loader2, Check, AlertCircle } from 'lucide-react';
import { translateApi, vocabularyApi } from '../services/api';

type RecentTranslation = {
  source: string;
  target: string;
  time: string;
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export function TranslatePage() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [vocabularyId, setVocabularyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentTranslations, setRecentTranslations] = useState<RecentTranslation[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadRecentTranslations = async () => {
    try {
      const items = await vocabularyApi.getAll(0, 10);
      setRecentTranslations(
        items.map((item) => ({
          source: item.word,
          target: item.meaning,
          time: formatRelativeTime(item.createdAt),
        }))
      );
    } catch {
      // Ignore - recent translations are optional
    }
  };

  useEffect(() => {
    loadRecentTranslations();
  }, []);

  // Count words in input text
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const wordCount = getWordCount(inputText);
  const maxWords = 5;
  const isValidWordCount = wordCount > 0 && wordCount < maxWords;
  const exceedsLimit = wordCount >= maxWords;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim() || !isValidWordCount) return;
    setIsTranslating(true);
    setHasTranslated(false);
    setIsSaved(false);
    setError(null);
    setVocabularyId(null);

    try {
      const response = await translateApi.translate({
        text: inputText,
        targetLang: 'VI', // Vietnamese
      });
      setTranslatedText(response.translatedText);
      if (response.vocabulary) {
        setVocabularyId(response.vocabulary.id);
      }
      setRecentTranslations((prev) => [
        { source: inputText, target: response.translatedText, time: 'Just now' },
        ...prev.filter((r) => !(r.source === inputText && r.target === response.translatedText)).slice(0, 9),
      ]);
      setIsTranslating(false);
      setHasTranslated(true);
    } catch (err: any) {
      setError(err.message || 'Translation failed');
      setIsTranslating(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleTranslate();
    }
  };
  const handleSave = async () => {
    if (!inputText.trim() || !translatedText) return;
    
    try {
      // If vocabulary was already created during translation, mark as saved
      if (vocabularyId) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        return;
      }

      // Otherwise, translate with saveToVocabulary flag
      const response = await translateApi.translate({
        text: inputText,
        targetLang: 'VI',
        saveToVocabulary: true,
        vocabularyExample: inputText,
        vocabularySourceText: inputText,
      });

      if (response.vocabulary) {
        setVocabularyId(response.vocabulary.id);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        loadRecentTranslations();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save to vocabulary');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Translate</h1>
        <p className="text-gray-500 mt-1">Translate English text instantly (max 4 words)</p>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text to translate (max 4 words)..."
            className={`w-full min-h-[100px] text-base text-gray-900 placeholder-gray-400 resize-none focus:outline-none ${
              exceedsLimit ? 'border-2 border-red-300 rounded-lg' : ''
            }`} />

          {/* Word Count Indicator */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {exceedsLimit && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>Maximum 4 words allowed</span>
                </div>
              )}
            </div>
            <div className={`text-sm font-medium ${
              exceedsLimit ? 'text-red-600' : wordCount > 0 ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {wordCount > 0 ? `${wordCount} / ${maxWords - 1} words` : '0 / 4 words'}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
            <span className="px-2 py-1 bg-white rounded border border-gray-200">
              English
            </span>
            <ArrowRight size={16} className="text-gray-400" />
            <span className="px-2 py-1 bg-white rounded border border-gray-200">
              Vietnamese
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400 hidden sm:inline-block">
              Ctrl + Enter
            </span>
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !isValidWordCount}
              className="px-4 py-2 bg-[#213A58] text-white font-medium rounded-lg hover:bg-[#0C6478] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">

              {isTranslating &&
              <Loader2 size={16} className="animate-spin mr-2" />
              }
              Translate
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Output Section */}
      {(hasTranslated || isTranslating) &&
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {isTranslating ?
        <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div> :

        <>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {translatedText}
                </h3>
                <div className="flex space-x-2">
                  <button
                onClick={handleSave}
                className={`p-2 rounded-lg border transition-colors ${isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                title="Save to Vocabulary">

                    {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                  </button>
                  <button
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                title="Add to Wordlist">

                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6FAF2] text-[#0C6478]">
                  Noun
                </span>
                <span className="text-sm text-gray-500">Common noun</span>
              </div>
            </>
        }
        </div>
      }

      {/* Recent Translations */}
      <div className="pt-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Recent Translations
        </h3>
        <div className="grid gap-4">
          {recentTranslations.length > 0 ? (
            recentTranslations.map((item, index) => (
              <div
                key={`${item.source}-${item.target}-${index}`}
                onClick={() => {
                  setInputText(item.source);
                  setTranslatedText(item.target);
                  setHasTranslated(true);
                }}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#09D1C7] transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{item.source}</p>
                    <p className="text-gray-600 mt-1">{item.target}</p>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-[#15919B] transition-colors">
                    {item.time}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm py-4">No recent translations yet</p>
          )}
        </div>
      </div>
    </div>);

}