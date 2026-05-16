# Phantom — Deployment Guide

## Option A: Railway (Recommended — Easiest, all-in-one)

Railway hosts the API server + PostgreSQL. You can also serve the frontend as a separate static service.

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/phantom.git
git push -u origin main
```

### Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo
3. Railway will auto-detect the `railway.json` config

### Step 3 — Add PostgreSQL

In your Railway project → **New** → **Database** → **Add PostgreSQL**
Railway automatically sets `DATABASE_URL` for you.

### Step 4 — Set environment variables

In Railway → your service → **Variables**, add:

```
SESSION_SECRET=<any long random string, e.g. openssl rand -hex 32>
DASHBOARD_PASSCODE=<your secret access code>
```

### Step 5 — Add a static frontend service (optional but cleaner)

1. In Railway → **New** → **Empty Service**
2. Set the build command: `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-zod run build && pnpm --filter @workspace/api-client-react run build && cd artifacts/phantom && pnpm run build`
3. Set publish directory: `artifacts/phantom/dist/public`
4. Or just serve `artifacts/phantom/dist/public` via Railway's static hosting

**OR** deploy the frontend to Vercel (see Option B) and point it at the Railway API URL.

---

## Option B: Vercel (frontend) + Railway (API + DB)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Vercel auto-reads `vercel.json`
3. Add this environment variable in Vercel:
   ```
   VITE_API_URL=https://your-api-server.up.railway.app
   ```

### API + DB → Railway

Follow Option A steps 2–4. The API runs on Railway, frontend on Vercel.

---

## Option C: Render.com (free tier)

1. Create a **Web Service** → connect GitHub → build command:
   ```
   pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
   ```
   Start command: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
2. Add a **PostgreSQL** database (Render sets `DATABASE_URL` automatically)
3. Set env vars: `SESSION_SECRET`, `DASHBOARD_PASSCODE`
4. For frontend: add a **Static Site** service, build command:
   ```
   pnpm install && pnpm --filter @workspace/api-zod run build && pnpm --filter @workspace/api-client-react run build && cd artifacts/phantom && pnpm run build
   ```
   Publish directory: `artifacts/phantom/dist/public`

---

## Environment Variables Reference

| Variable | Where | Required | Description |
|---|---|---|---|
| `SESSION_SECRET` | API server | Yes | JWT signing key + steganography key — never change after deployment |
| `DASHBOARD_PASSCODE` | API server | Yes | Your secret code to access compose + dashboard |
| `DATABASE_URL` | API server | Yes | PostgreSQL connection string |
| `PORT` | API server | Auto | Set by Railway/Render automatically |
| `VITE_API_URL` | Frontend build | Only if different domain | Full URL of the API server |

---

## How the passcode auth works

- No user accounts. No signup. No database users.
- You set `DASHBOARD_PASSCODE` on the server — e.g. `my_secret_word`
- When you visit Phantom, enter that code → you get a 30-day JWT stored in your browser
- The compose/dashboard are protected. The `/decode` page is always public.
- To "change password", update `DASHBOARD_PASSCODE` env var and redeploy.
