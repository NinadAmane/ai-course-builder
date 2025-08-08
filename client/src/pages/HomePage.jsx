import { useState } from 'react';
import axios from 'axios';
import { Github, BookOpen, Sparkles, BrainCircuit, Play, ArrowRight } from 'lucide-react';

const Loader = () => (
  <div className="flex justify-center items-center py-16">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-purple-200/30 border-t-purple-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-pink-500 rounded-full animate-spin animate-reverse"></div>
      <div className="absolute inset-2 w-12 h-12 border-2 border-blue-200/20 border-r-blue-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
    </div>
  </div>
);

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setCourse(null);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/generate', { topic });
      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while generating the course.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  AI Course Builder
                </h1>
                <p className="text-sm text-gray-400">Powered by Intelligence</p>
              </div>
            </div>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-300 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <Github size={16} className="group-hover:rotate-12 transition-transform duration-300" />
              Github
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-4xl text-center space-y-12">
            
            {/* Hero Section */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full">
                  <Sparkles size={16} className="animate-pulse" />
                  AI-Powered Learning Revolution
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="block text-white mb-2">Build Courses with</span>
                  <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
                    Artificial Intelligence
                  </span>
                </h1>
                
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Transform any topic into a comprehensive learning path with curated video resources, 
                  powered by cutting-edge AI technology.
                </p>
              </div>
            </div>

            {/* Course Generation Form */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-md opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl">
                        <BookOpen className="text-purple-300" size={28} />
                      </div>
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-white">Generate Your Course</h2>
                      <p className="text-gray-300">Enter a topic and watch AI create magic</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="course-topic" className="block text-sm font-medium text-gray-300 text-left">
                        What would you like to learn?
                      </label>
                      <div className="relative">
                        <input
                          id="course-topic"
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Machine Learning, Web Development, Data Science, Photography..."
                          className="w-full px-6 py-4 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                          required
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300 shadow-xl"
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
                  </form>
                </div>
              </div>
            </div>

            {/* Loading, Error, and Results */}
            <div className="space-y-8">
              {isLoading && <Loader />}

              {error && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 p-6 rounded-2xl">
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
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                      <div className="text-center mb-10">
                        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient">
                          {course.title}
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full mx-auto"></div>
                      </div>
                      
                      <div className="space-y-10">
                        {course.modules.map((module, index) => (
                          <div key={index} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                              <div className="text-left mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <h3 className="text-2xl font-bold text-white">
                                    {module.title}
                                  </h3>
                                </div>
                                <p className="text-gray-300 leading-relaxed ml-11">
                                  {module.learningObjective}
                                </p>

                                {/* AI Summary Panel */}
                                {module.summary && (
                                  <div className="mt-4 ml-11 p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <h4 className="text-white font-semibold mb-2">AI Summary</h4>
                                    <p className="text-gray-300 whitespace-pre-wrap">
                                      {module.summary}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {module.videos && module.videos.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {module.videos.map((video) => (
                                    <a 
                                      key={video.videoId} 
                                      href={`https://www.youtube.com/watch?v=${video.videoId}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="group/video relative bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl"
                                    >
                                      <div className="relative aspect-video overflow-hidden bg-slate-900/50">
                                        <img 
                                          src={video.thumbnailUrl} 
                                          alt={video.title} 
                                          className="w-full h-full object-cover group-hover/video:scale-110 transition-transform duration-700" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-300"></div>
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
                                        <h4 className="font-semibold text-white group-hover/video:text-purple-300 transition-colors duration-300 line-clamp-2 leading-snug">
                                          {video.title}
                                        </h4>
                                      </div>
                                      
                                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-pink-500/0 group-hover/video:from-purple-500/10 group-hover/video:to-pink-500/10 transition-all duration-500 rounded-xl"></div>
                                    </a>
                                  ))}
                                </div>
                              )}
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
            <p className="text-sm text-gray-400">
              &copy; 2025 AI Course Builder. Crafted with intelligence and passion.
            </p>
            <p className="text-xs text-gray-500">
              Empowering learners through AI-generated educational content.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}