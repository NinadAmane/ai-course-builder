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
        { topic, refresh },
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
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden transition-colors">
      {/* Animated Background (decorative, no pointer events) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-purple-200/10 to-slate-100 transition-colors"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay (decorative) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full px-6 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-70"></div>
                <div className="relative p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                  <BrainCircuit className="text-white" size={28} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-gray-600 bg-clip-text text-transparent">
                  AI Course Builder
                </h1>
                <p className="text-sm text-gray-600">Powered by Intelligence</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 relative">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-slate-800 bg-black/5 backdrop-blur-sm border border-black/10 rounded-xl hover:bg-black/10 hover:border-black/20 transition-all duration-300"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setShowHistory((s) => !s)}
                className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-white/60 backdrop-blur-sm border border-black/10 rounded-xl hover:bg-white transition-all duration-300"
                aria-haspopup="menu"
                aria-expanded={showHistory}
              >
                <History size={16} className="opacity-80" />
                <span className="hidden sm:inline">History</span>
              </button>

              {/* History dropdown */}
              {showHistory && (
                <div
                  className="absolute top-12 right-0 w-[260px] bg-white border border-black/10 rounded-xl shadow-xl p-2 z-20"
                  role="menu"
                >
                  <div className="px-2 py-1 text-xs font-semibold text-slate-500">Recent topics</div>
                  {recent.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">No recent topics</div>
                  ) : (
                    <ul className="max-h-60 overflow-auto">
                      {recent.map((t, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => useRecent(t)}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                          >
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-6xl text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full">
                  <Sparkles size={16} className="animate-pulse" />
                  AI-Powered Learning Revolution
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-center">
                  <span className="block text-slate-900">Build Courses with</span>
                  <span className="block mt-2 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(236,72,153,0.25)]">
                    Artificial Intelligence
                  </span>
                </h1>

                <p className="max-w-3xl mx-auto text-center text-slate-700">
                  Transform any topic into a comprehensive learning path with curated video resources, powered by cutting-edge AI technology.
                </p>
              </div>
            </div>

            {/* Course Generation Form */}
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-3xl blur-xl pointer-events-none"></div>
                <div className="relative bg-white/80 text-slate-900 backdrop-blur-xl border border-black/10 rounded-3xl p-8 shadow-2xl transition-colors">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-md opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl">
                        <BookOpen className="text-purple-600" size={28} />
                      </div>
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold">Generate Your Course</h2>
                      <p className="text-gray-700">Enter a topic and watch AI create magic</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="course-topic" className="block text-sm font-medium text-slate-800 text-left">
                        What would you like to learn?
                      </label>
                      <div className="relative">
                        <input
                          id="course-topic"
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Machine Learning, Web Development, Data Science, Photography..."
                          className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm text-slate-900 placeholder-gray-500 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                          required
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700 self-start">
                        <input
                          type="checkbox"
                          className="accent-purple-600"
                          checked={refresh}
                          onChange={(e) => setRefresh(e.target.checked)}
                        />
                        Improve results (refresh sources)
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="group relative flex-1 overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300 shadow-xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center justify-center gap-3">
                            <Sparkles size={20} className={isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform duration-300'} />
                            <span className="text-lg">
                              {isLoading ? 'Creating Your Course...' : 'Generate Course'}
                            </span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </button>
                        {isLoading && (
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-5 py-4 font-semibold rounded-2xl border border-black/10 bg-white/70 hover:bg-white transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Loading, Error, and Results */}
            <div className="space-y-8">
              {isLoading && <Loader />}

              {error && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-700 p-6 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {course && (
                <div className="w-full animate-fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl blur-xl pointer-events-none"></div>
                    <div className="relative bg-white/80 text-slate-900 backdrop-blur-xl border border-black/10 rounded-3xl p-8 shadow-2xl transition-colors">
                      <div className="text-center mb-10">
                        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                          {course.title}
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full mx-auto"></div>
                      </div>

                      <div className="space-y-10">
                        {course.modules.map((module, index) => (
                          <div key={index} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            <div className="relative bg-white/80 text-slate-900 backdrop-blur-sm border border-black/10 rounded-2xl p-6 hover:border-black/20 transition-all duration-300">
                              <div className="text-left mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <h3 className="text-2xl font-bold">
                                    {module.title}
                                  </h3>
                                </div>
                                <p className="text-gray-700 leading-relaxed ml-11">
                                  {module.learningObjective}
                                </p>

                                {/* AI Summary */}
                                {module.summary && (
                                  <div className="p-5 bg-white/80 border border-black/10 rounded-xl text-left shadow-sm">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                      AI Summary
                                    </h4>
                                    <div
                                      className="prose prose-slate max-w-none text-slate-800 text-[0.95rem] leading-7"
                                      dangerouslySetInnerHTML={{ __html: marked.parse(module.summary || '') }}
                                    />
                                  </div>
                                )}

                                {module.videos && module.videos.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {module.videos.map((video) => (
                                      <a
                                        key={video.videoId}
                                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group/video relative bg-black/5 backdrop-blur-sm rounded-xl overflow-hidden border border-black/10 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl"
                                      >
                                        <div className="relative aspect-video overflow-hidden bg-slate-200">
                                          <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover/video:scale-110 transition-transform duration-700"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300"></div>
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-all duration-300">
                                            <div className="relative">
                                              <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full animate-ping"></div>
                                              <div className="relative p-4 bg-white/30 backdrop-blur-md rounded-full border border-white/20">
                                                <Play size={24} className="text-white fill-current ml-1" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="p-4">
                                          <h4 className="font-semibold group-hover/video:text-purple-700 transition-colors duration-300 line-clamp-2 leading-snug">
                                            {video.title}
                                          </h4>
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-pink-500/0 group-hover/video:from-purple-500/10 group-hover/video:to-pink-500/10 transition-all duration-500 rounded-xl"></div>
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {module.resources && module.resources.length > 0 && (
                                  <div className="mt-8 text-left">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                      Recommended Resources
                                    </h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {module.resources.map((r, idx) => (
                                        <li key={idx} className="group/resource relative p-4 bg-white/60 border border-black/10 rounded-xl hover:border-purple-500/40 transition-all">
                                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="block">
                                            <div className="text-sm text-slate-500 mb-1">{r.source}</div>
                                            <div className="font-semibold text-slate-900 group-hover/resource:text-purple-700 line-clamp-2">{r.title}</div>
                                            {r.snippet && (
                                              <div className="mt-1 text-sm text-slate-700 line-clamp-3">{r.snippet}</div>
                                            )}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 px-6">
          <div className="max-w-7xl mx-auto space-y-2">
            <p className="text-sm text-gray-700">
              &copy; 2025 AI Course Builder. Crafted with intelligence and passion.
            </p>
            <p className="text-xs text-gray-600">
              Empowering learners through AI-generated educational content.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}