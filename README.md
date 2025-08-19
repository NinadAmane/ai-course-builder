# AI Course Builder

Generate a clean, readable learning path for any topic using AI. One prompt → a structured course with modules, summaries, videos, and resources.

## 🔥 Highlights
- **Beautiful summaries** with professional typography on a dark, modern UI
- **Code snippets** with a header and one‑click **Copy**
- **Export to PDF** (client‑side, no install)
- **Smart discovery**: semantic ranking + simple filters (views, duration, date)
- **Fast & safe**: CORS‑restricted API, input validation, rate‑limited, Helmet
- **Mongo‑backed** with a unique index on `Course.title`
- **Powered by Google Gemini** for outlines and summarization

## ⚡ Quick Start
```bash
# Server
cd server && npm i && npm run dev
# Client (new terminal)
cd client && npm i && npm run dev   # http://localhost:5173
```

## 🔑 Environment Variables
- `server/.env`
  - `MONGO_URI` — MongoDB connection
  - `PORT=5000`
  - `CLIENT_ORIGIN=http://localhost:5173`
  - `GEMINI_API_KEY` and `YOUTUBE_API_KEY`
- `client/.env`
  - `VITE_API_URL=http://localhost:5000`


## 🧱 Tech Stack
- Frontend: React + Vite, Tailwind CSS, Marked + DOMPurify, lucide-react
- Backend: Node.js, Express, Mongoose (MongoDB)
- AI & APIs: Google Gemini, YouTube Data API

## � Security & Stability
- CORS restricted via `CLIENT_ORIGIN`
- Rate limiting and security headers (Helmet)
- Input validation and centralized error handling
- MongoDB unique index on `Course.title`

## �👤 Author
Built by **Ninad Amane**
- LinkedIn: https://www.linkedin.com/in/ninad-amane-126775290/
- GitHub: https://github.com/NinadAmane
- Twitter/X: https://x.com/NinadAmane
