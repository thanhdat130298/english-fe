import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { translateApi, type DictionaryEntry, type TranslateResponse } from '../services/api';

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

function getDictionaryFromResponse(response: TranslateResponse): DictionaryEntry[] | null {
  if (!response.dictionary || response.dictionary.length === 0) return null;
  return response.dictionary;
}

export function TranslatePage() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [dictionaryResult, setDictionaryResult] = useState<DictionaryEntry[] | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


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
    setError(null);
    setDictionaryResult(null);

    try {
      const response = await translateApi.translate({
        text: inputText,
        targetLang: 'VI',
        saveToVocabulary: true,
        vocabularyWord: inputText.trim(),
        vocabularyExample: inputText,
        vocabularySourceText: inputText,
      });

      if (typeof (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV !== 'undefined') {
        console.log('[Translate] API response:', response);
      }

      const dictionary = getDictionaryFromResponse(response);
      let displayTarget = '';

      if (dictionary && dictionary.length > 0) {
        setDictionaryResult(dictionary);
        const apiTranslated = response.translatedText;
        displayTarget = apiTranslated || (dictionary[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? dictionary[0]?.word ?? '');
        setTranslatedText(displayTarget);
      } else {
        setDictionaryResult(null);
        setTranslatedText(response.translatedText);
        displayTarget = response.translatedText;
      }

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
      {(hasTranslated || isTranslating) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {isTranslating ? (
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
          ) : dictionaryResult && dictionaryResult.length > 0 ? (
            <>
              {translatedText && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Translation
                  </h4>
                  <p className="text-lg font-medium text-gray-900">{translatedText}</p>
                </div>
              )}
              {dictionaryResult.map((entry, entryIndex) => (
                <div key={entryIndex} className={entryIndex > 0 ? 'mt-8 pt-8 border-t border-gray-100' : ''}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{entry.word}</h3>
                      {entry.phonetic && (
                        <p className="text-gray-500 mt-1">{entry.phonetic}</p>
                      )}
                      {entry.phonetics && entry.phonetics.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {entry.phonetics.filter((p) => p.audio).map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                const a = new Audio(p.audio);
                                a.play();
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
                            >
                              <Volume2 size={16} />
                              {p.text || 'Play'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {entry.meanings?.map((meaning, mIndex) => (
                      <div key={mIndex}>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6FAF2] text-[#0C6478] mb-3">
                          {meaning.partOfSpeech}
                        </span>
                        <ul className="space-y-3 list-none pl-0">
                          {meaning.definitions?.map((def, dIndex) => (
                            <li key={dIndex} className="border-l-2 border-gray-200 pl-4 py-1">
                              <p className="text-gray-900">{def.definition}</p>
                              {def.example && (
                                <p className="text-gray-600 italic text-sm mt-1">“{def.example}”</p>
                              )}
                              {def.synonyms && def.synonyms.length > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Words with the same meaning(Synonyms): {def.synonyms.join(', ')}
                                </p>
                              )}
                              {def.antonyms && def.antonyms.length > 0 && (
                                <p className="text-sm text-gray-500">
                                  Words with opposite meaning(Antonyms): {def.antonyms.join(', ')}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                        {meaning.synonyms && meaning.synonyms.length > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Synonyms:</span> {meaning.synonyms.join(', ')}
                          </p>
                        )}
                        {meaning.antonyms && meaning.antonyms.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Antonyms:</span> {meaning.antonyms.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">{translatedText}</h3>
              </div>
            </>
          )}
        </div>
      )}

    </div>);

}