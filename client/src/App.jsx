import HomePage from "./pages/HomePage";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Search, SlidersHorizontal, Database, FileText, Link as LinkIcon, ShieldCheck } from "lucide-react";

function IntroPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Decorative dark blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 -left-10 w-80 h-80 bg-fuchsia-500/20 rounded-full filter blur-3xl mix-blend-screen"></div>
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-indigo-500/20 rounded-full filter blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl mix-blend-screen"></div>
      </div>
      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 ring-1 ring-white/10 backdrop-blur">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">AI</span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">AI Course Builder</h1>
            <p className="mt-2 text-sm text-slate-400">Free, semantic, curated learning paths</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        <section>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">Whats New?</h2>
            <p className="text-sm text-slate-400 mt-1">Built with free, local-first components. No paid APIs.</p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 p-6 transition transform hover:-translate-y-1 ring-1 ring-white/10 hover:ring-white/20">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-500/0 via-transparent to-violet-500/0 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 text-fuchsia-300 ring-1 ring-white/10">
                  <Search size={18} />
                </div>
                <div>
                  <div className="text-slate-100 font-medium">Local embeddings (MiniLM)</div>
                  <div className="text-xs text-fuchsia-300 font-semibold">Semantic search</div>
                  <p className="text-sm text-slate-400 mt-2">Reranks YouTube results with free on-device embeddings via @xenova/transformers.</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 p-6 transition transform hover:-translate-y-1 ring-1 ring-white/10 hover:ring-white/20">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/0 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 ring-1 ring-white/10">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <div className="text-slate-100 font-medium">Views, duration, date</div>
                  <div className="text-xs text-pink-300 font-semibold">Smart filters</div>
                  <p className="text-sm text-slate-400 mt-2">Narrow to recent, popular, and right-length content in one click.</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 p-6 transition transform hover:-translate-y-1 ring-1 ring-white/10 hover:ring-white/20">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-transparent to-cyan-500/0 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-300 ring-1 ring-white/10">
                  <Database size={18} />
                </div>
                <div>
                  <div className="text-slate-100 font-medium">MongoDB caching</div>
                  <div className="text-xs text-cyan-300 font-semibold">Fast reuse</div>
                  <p className="text-sm text-slate-400 mt-2">Stores video embeddings and metadata to avoid recomputation.</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 p-6 transition transform hover:-translate-y-1 ring-1 ring-white/10 hover:ring-white/20">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 via-transparent to-teal-500/0 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-300 ring-1 ring-white/10">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-slate-100 font-medium">Transcript-aware with fallback</div>
                  <div className="text-xs text-emerald-300 font-semibold">Summaries</div>
                  <p className="text-sm text-slate-400 mt-2">Generates concise notes; falls back gracefully when captions are missing.</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 p-6 transition transform hover:-translate-y-1 ring-1 ring-white/10 hover:ring-white/20">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-transparent to-violet-500/0 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 ring-1 ring-white/10">
                  <LinkIcon size={18} />
                </div>
                <div>
                  <div className="text-slate-100 font-medium">Curated web links</div>
                  <div className="text-xs text-indigo-300 font-semibold">Resources</div>
                  <p className="text-sm text-slate-400 mt-2">Pulls helpful references; uses safe defaults when search is sparse.</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 p-6 transition transform hover:-translate-y-1 ring-1 ring-white/10 hover:ring-white/20">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 via-transparent to-orange-500/0 opacity-0 group-hover:opacity-100 transition"></div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 ring-1 ring-white/10">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-slate-100 font-medium">No paid services</div>
                  <div className="text-xs text-amber-300 font-semibold">Open & free</div>
                  <p className="text-sm text-slate-400 mt-2">Runs on free/open‑source tooling—no vector DB or paid APIs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Single CTA */}
          <div className="mt-12 text-center">
            <Link to="/app" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition font-semibold shadow-lg shadow-black/30 ring-1 ring-white/20 backdrop-blur">
              Get Started
              <span aria-hidden>→</span>
            </Link>
            <p className="text-xs text-slate-400 mt-2">Note: AI‑generated content may contain mistakes. Please review important details.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-slate-400 mt-2">Page not found</p>
        <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">Go Home</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route
            path="/app"
            element={
              <div className="min-h-screen bg-slate-950 text-slate-100">
                <HomePage />
              </div>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
