import { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Sparkles, BrainCircuit, Play, ArrowRight, History } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const Loader = () => (
  <div className="flex justify-center items-center py-16">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-purple-200/30 border-t-purple-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-pink-500 rounded-full animate-spin animate-reverse"></div>
      <div className="absolute inset-2 w-12 h-12 border-2 border-blue-200/20 border-r-blue-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
    </div>
  </div>
);

const RECENT_KEY = 'recent_topics';
const MAX_RECENTS = 8;

function loadRecentTopics() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function SafeHTML({ html }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html)
      }}
    />
  );
}

function saveRecentTopic(topic) {
  try {
    const list = loadRecentTopics().filter((t) => t.toLowerCase() !== topic.toLowerCase());
    list.unshift(topic);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
  } catch {
    // no-op
  }
}

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [controller, setController] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // New: semantic and filter controls
  const [semantic, setSemantic] = useState(true);
  const [minViews, setMinViews] = useState('');
  const [minMinutes, setMinMinutes] = useState('');
  const [maxMinutes, setMaxMinutes] = useState('');
  const [uploadedAfter, setUploadedAfter] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(loadRecentTopics());
  }, []);

  const refreshRecent = () => setRecent(loadRecentTopics());

  // Quick action: clear form and results
  const handleClear = () => {
    setTopic('');
    setCourse(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setCourse(null);
    setError('');

    const ctrl = new AbortController();
    setController(ctrl);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/generate',
        {
          topic,
          refresh,
          semantic,
          filters: {
            minViews: minViews ? Number(minViews) : undefined,
            minMinutes: minMinutes ? Number(minMinutes) : undefined,
            maxMinutes: maxMinutes ? Number(maxMinutes) : undefined,
            uploadedAfter: uploadedAfter || undefined,
          },
        },
        { signal: ctrl.signal, timeout: 60000 }
      );
      setCourse(response.data);
      saveRecentTopic(topic);
      refreshRecent();
    } catch (err) {
      if (axios.isCancel?.(err) || err?.name === 'CanceledError') {
        setError('Request was cancelled.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.response?.data?.message || 'An error occurred while generating the course.');
      }
    } finally {
      setIsLoading(false);
      setController(null);
    }
  };

  const handleCancel = () => {
    if (controller) {
      controller.abort();
    }
  };

  const useRecent = (t) => {
    setTopic(t);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden transition-colors">
      {/* Animated Background (decorative, no pointer events) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 transition-colors"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-amber-500/20 rounded-full mix-blend-screen filter blur-xl opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/20 rounded-full mix-blend-screen filter blur-xl opacity-25 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <header className="max-w-7xl mx-auto px-6 pt-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-sm backdrop-blur">
                <BookOpen className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">AI Course Builder</h1>
                <p className="text-sm text-slate-400">Generate curated learning paths with AI</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-slate-400">Powered by smart search</span>
              <Sparkles className="text-pink-400" />
            </div>
          </div>
        </header>

        {/* Subtle disclaimer */}
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Note: AI‑generated content may contain mistakes or unexpected results. Please review important details.
          </p>
        </div>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-md overflow-hidden">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-300 outline-none"
                        placeholder="What do you want to learn? e.g., React hooks, DSA, Prompt engineering"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
                      disabled={isLoading || !topic.trim()}
                    >
                      <BrainCircuit size={18} />
                      Generate
                      <ArrowRight size={18} />
                    </button>
                  </div>

                  {/* Semantic + Filters (minimal) */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                      <input
                        type="checkbox"
                        checked={semantic}
                        onChange={(e) => setSemantic(e.target.checked)}
                      />
                      <span className="text-sm">Semantic ranking</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Min views"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-100 placeholder:text-slate-500"
                      value={minViews}
                      onChange={(e) => setMinViews(e.target.value)}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Min minutes"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-100 placeholder:text-slate-500"
                      value={minMinutes}
                      onChange={(e) => setMinMinutes(e.target.value)}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Max minutes"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-100 placeholder:text-slate-500"
                      value={maxMinutes}
                      onChange={(e) => setMaxMinutes(e.target.value)}
                    />
                    <input
                      type="date"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-100 placeholder:text-slate-500"
                      value={uploadedAfter}
                      onChange={(e) => setUploadedAfter(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={refresh} onChange={(e) => setRefresh(e.target.checked)} />
                      <span className="text-slate-300">Force refresh</span>
                    </label>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-200"
                      onClick={handleClear}
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-200"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History size={14} className="inline mr-1" /> Recent
                    </button>

                    {isLoading && (
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-red-50 text-red-600"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {showHistory && (
                  <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex flex-wrap gap-2">
                      {recent.map((t, i) => (
                        <button key={i} onClick={() => useRecent(t)} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 hover:border-purple-400/40 text-slate-200 text-sm">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="px-6 pb-6">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-300">
                    {error}
                  </div>
                )}

                {isLoading && <Loader />}

                {course && (
                  <div className="space-y-8">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 font-semibold text-purple-300">
                        <Sparkles size={18} /> Generated Course
                      </div>
                      <h2 className="mt-1 text-2xl font-bold text-slate-100">{course.title}</h2>
                    </div>

                    <div className="space-y-6">
                      {course.modules.map((module, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-sm backdrop-blur-md">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold text-slate-100"><span className="mr-2 text-slate-400">{idx + 1}.</span>{module.title}</h3>
                              {module.learningObjective && (
                                <p className="text-sm text-slate-300 mt-1">{module.learningObjective}</p>
                              )}
                            </div>
                          </div>

                          {/* Summary */}
                          {module.summary && (
                            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                              <SafeHTML html={marked.parse(module.summary)} />
                            </div>
                          )}

                          {/* Videos */}
                          {module.videos && module.videos.length > 0 && (
                            <div className="mt-6">
                              <h4 className="font-semibold mb-3">Suggested Videos</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {module.videos.map((video, vIdx) => (
                                  <a key={vIdx} href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="group/video block rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition shadow-sm">
                                    <div className="relative aspect-video bg-white/5">
                                      {video.thumbnailUrl && (
                                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                          <div className="absolute inset-0 bg-fuchsia-400/20 backdrop-blur-md rounded-full animate-ping"></div>
                                          <div className="relative p-4 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                                            <Play size={24} className="text-white fill-current ml-1" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-4">
                                      <h4 className="font-semibold text-slate-100 group-hover/video:text-purple-300 transition-colors duration-300 line-clamp-2 leading-snug">
                                        {video.title}
                                      </h4>
                                      {(video.relevanceScore != null || video.viewCount != null || video.durationSec != null) && (
                                        <div className="mt-2 text-xs text-slate-400 space-x-2">
                                          {video.relevanceScore != null && <span>sim: {video.relevanceScore.toFixed(2)}</span>}
                                          {video.viewCount != null && <span>views: {video.viewCount.toLocaleString?.() || video.viewCount}</span>}
                                          {video.durationSec != null && <span>⏱ {Math.round(video.durationSec/60)}m</span>}
                                        </div>
                                      )}
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {module.resources && module.resources.length > 0 && (
                            <div className="mt-8 text-left">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Recommended Resources
                              </h4>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {module.resources.map((r, idx) => (
                                  <li key={idx} className="group/resource relative p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/40 transition-all">
                                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="block">
                                      <div className="text-sm text-slate-400 mb-1">{r.source}</div>
                                      <div className="font-semibold text-slate-100 group-hover/resource:text-purple-300 line-clamp-2">{r.title}</div>
                                      {r.snippet && (
                                        <div className="mt-1 text-sm text-slate-300/80 line-clamp-3">{r.snippet}</div>
                                      )}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 px-6">
          <div className="max-w-7xl mx-auto space-y-2">
            <p className="text-sm text-slate-400">
              &copy; 2025 AI Course Builder. Crafted with intelligence and passion.
            </p>
            <p className="text-xs text-slate-500">
              Empowering learners through AI-generated educational content.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}