# Neon Luminary — AI Briefing App

Real-time AI news powered by Claude AI + web search. Launches in under 5 minutes.

---

## Deploy to Vercel (Fastest — ~3 minutes)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create neon-luminary --public --push
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo `neon-luminary`
3. Click **Deploy** (default settings work)

### Step 3 — Add your API Key
1. In Vercel dashboard → **Settings** → **Environment Variables**
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-your-key-here`
3. **Redeploy** (Settings → Deployments → Redeploy)

✅ **Done. Your app is live.**

---

## Local Development

```bash
npm install

# Add your API key
cp .env.local.example .env.local
# Edit .env.local and paste your Anthropic API key

npm run dev
# Open http://localhost:3000
```

---

## How It Works

| Component | Purpose |
|---|---|
| `pages/index.jsx` | Full React app (Neon Luminary UI) |
| `pages/api/news.js` | **Secure proxy** — calls Anthropic API server-side, API key never exposed |
| `styles/globals.css` | Animations and global resets |

**Auto-refresh:** The app fetches live AI news on load and every 10 minutes automatically.

**Security:** Your `ANTHROPIC_API_KEY` lives only in Vercel's environment — never sent to the browser.

---

## Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key**
3. Copy and paste into Vercel env vars

---

## Stack
- **Next.js 14** — framework
- **Vercel** — hosting (free tier works)
- **Anthropic Claude API** — news summarization + web search
