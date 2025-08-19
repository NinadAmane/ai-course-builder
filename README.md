# AI Course Builder

Generate curated, readable learning paths from YouTube and AI — complete with modules, summaries, suggested videos, and resources. Designed to look great and be production‑ready.

## ✨ Features
- **Readable AI summaries**: Beautiful article‑style layout with professional typography, comfortable line length, and clean hierarchy.
- **Dark, modern UI**: Subtle animated blur glows and consistent visual rhythm.
- **Udemy‑like code snippets**: Code blocks include a header and a one‑click **Copy** button.
- **Client‑side Export to PDF**: Save the generated course to a PDF (uses `html2pdf.js` via CDN).
- **Semantic ranking (optional)**: Prioritizes high‑quality, relevant videos.
- **Filters**: Minimum views, min/max duration, uploaded after date.
- **Recent topics**: Quick access to your last searches.
- **Input validation & error handling**: Frontend and backend safeguards.
- **Security hardening**: `helmet`, rate limiting, CORS restricted by env.
- **Data integrity**: MongoDB index on `Course.title`, graceful duplicate handling.
- **404 route and polished UX**: Empty states, loading skeletons, non‑blocking errors.

## 🧱 Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, `marked` + `DOMPurify`, `lucide-react`
- **Backend**: Node.js, Express, Mongoose
- **AI & APIs**: Google Gemini (generation/summaries), YouTube Data API; optional local embeddings

## 📁 Project Structure
```
root/
├─ client/                 # React app (Vite)
│  ├─ src/
│  │  ├─ pages/HomePage.jsx
│  │  ├─ App.jsx
│  │  └─ index.css
│  └─ ...
├─ server/                 # Express API
│  ├─ controllers/
│  │  ├─ courseController.js
│  │  └─ summaryController.js
│  ├─ models/
│  │  ├─ Course.js
│  │  └─ User*.js (if used)
│  ├─ routes/
│  │  ├─ courseRoutes.js
│  │  └─ summaryRoutes.js
│  └─ index.js
└─ README.md
```

## ⚙️ Environment Variables
Create two `.env` files, one per package. Do not commit them.

### `server/.env`
```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
PORT=5000
CLIENT_ORIGIN=http://localhost:5173   # Comma‑separated allowed origins in prod
GEMINI_API_KEY=your_gemini_key
YOUTUBE_API_KEY=your_youtube_key
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Local Development
### 1) Install
```bash
# In project root
cd server && npm i
cd ../client && npm i
```

### 2) Run
```bash
# Terminal A
cd server
npm run dev        # or: npm start

# Terminal B
cd client
npm run dev        # open http://localhost:5173
```

## 📦 Build
```bash
cd client && npm run build
```
This creates a production build of the frontend.

## 🔒 Security & Stability
- `helmet` for security headers
- `express-rate-limit` to mitigate abuse
- Strict CORS via `CLIENT_ORIGIN`
- Centralized error handling
- Input sanitation/validation in `courseController.js`
- MongoDB index on `Course.title` (prevents duplicates, speeds lookups)

## 🧭 API Overview
Base URL is `VITE_API_URL` (client) or your server URL.

- `POST /api/generate`
  - Body: `{ topic: string, refresh?: boolean, semantic?: boolean, filters?: { minViews?, minMinutes?, maxMinutes?, uploadedAfter? } }`
  - Returns: `{ title, modules: [{ title, learningObjective?, summary, videos[], resources[] }] }`

- `GET /api/summary/:videoId` (if used)
  - Returns: AI summary for a single video transcript.

Errors are returned as JSON with a helpful `message`.

## 🖨 Export to PDF
- Button appears on the results header.
- Uses `html2pdf.js` via CDN. Requires internet access.
- Animations and non‑essential elements are disabled during export for clean pages.
- If you want to include thumbnails in PDFs, remove the `IMG` filter in `html2canvas.ignoreElements` in `client/src/pages/HomePage.jsx`.

## 🖼 Screenshots
Drop your screenshots in `client/public/` and reference here:
- Home page with generated course
- Summary block with code snippet + Copy
- Exported PDF sample page

## ☁️ Deployment
- Frontend: Netlify, Vercel, or any static host.
  - Set environment: `VITE_API_URL` pointing to your server.
- Backend: Render, Railway, Fly.io, or your server.
  - Set `CLIENT_ORIGIN` to your deployed frontend URL.
  - Ensure `MONGO_URI`, `GEMINI_API_KEY`, `YOUTUBE_API_KEY` are set.

## 🧩 Troubleshooting
- **CORS error**: Check `CLIENT_ORIGIN` includes your frontend URL.
- **PDF export fails**: Ensure network can load `html2pdf.js` CDN.
- **Duplicate key error** on Course: remove duplicates or change titles; index prevents future duplicates.
- **No results**: Try `refresh` or relax filters (views/duration/date).

## 🗺 Roadmap (optional)
- Export as Markdown
- Improved language detection labels for code blocks
- Optional Dockerfiles and CI

## 🤝 Contributing
PRs welcome. Please open an issue for feature requests or bugs.

## 📄 License
MIT