# Complete Deployment Guide

**7 Days to Calm Meditation App**

This guide walks you through deploying the complete application to production using Render.com (backend) and Vercel (frontend).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (30 minutes)](#quick-start-30-minutes)
3. [Detailed Step-by-Step Guide](#detailed-step-by-step-guide)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Troubleshooting](#troubleshooting)
6. [Verification & Testing](#verification--testing)
7. [Post-Deployment](#post-deployment)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (free) - https://github.com/signup
- [ ] Render.com account (free tier available) - https://render.com/signup
- [ ] Vercel account (free tier available) - https://vercel.com/signup
- [ ] ElevenLabs account with API access - https://elevenlabs.io

### Required Software
- [ ] Git installed locally - https://git-scm.com/downloads
- [ ] Node.js 18+ - https://nodejs.org/
- [ ] Python 3.11+ (for local testing)
- [ ] Code editor (VS Code recommended)

### Required Information
- [ ] ElevenLabs API Key
- [ ] ElevenLabs Agent ID: `agent_4201k708pqxsed39y0vsz05gn66e`
- [ ] Your ElevenLabs agent configured and tested

### Local Testing Checklist
Before deploying, ensure everything works locally:

```bash
# Test backend
cd em-backend
uvicorn main:app --reload
# Visit http://localhost:8000/health - should return {"status":"healthy"}
# Visit http://localhost:8000/docs - should show API documentation

# Test frontend (in new terminal)
cd em-frontend
npm install
npm run dev
# Visit http://localhost:3000/7-days-to-calm
# Widget should load and be interactive
```

---

## Quick Start (30 minutes)

If you're comfortable with deployments, use the automated scripts:

```bash
# 1. Initialize Git (2 minutes)
./setup-git.sh

# 2. Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main

# 3. Deploy backend to Render (10 minutes)
./deploy-backend.sh
# Follow the prompts and manual steps in Render dashboard

# 4. Deploy frontend to Vercel (10 minutes)
./deploy-frontend.sh
# Follow the prompts and manual steps in Vercel dashboard

# 5. Test deployment (5 minutes)
./test-deployment.sh
```

For detailed step-by-step instructions, continue reading below.

---

## Detailed Step-by-Step Guide

### Phase 1: Git Repository Setup

#### Step 1.1: Initialize Git Repository

**Command:**
```bash
./setup-git.sh
```

**Manual alternative:**
```bash
git init
git branch -M main
git add .
git commit -m "Initial commit: 7 Days to Calm meditation app"
```

**Expected output:**
```
✓ Repository initialized
✓ Default branch set
✓ Files staged
✓ Initial commit created
```

**Screenshot description:** You should see a terminal with green checkmarks indicating successful initialization.

**Troubleshooting:**
- If "git: command not found": Install Git from https://git-scm.com/
- If "already exists": Run `rm -rf .git` first (WARNING: only if you haven't pushed to remote)

---

#### Step 1.2: Create GitHub Repository

**Instructions:**

1. **Go to GitHub:** https://github.com/new

   **Screenshot description:** GitHub page with "Create a new repository" form

2. **Repository settings:**
   - Repository name: `elevated-movements-7days` (or your choice)
   - Description: "7 Days to Calm - AI-powered meditation challenge"
   - Visibility: **Private** (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

4. **Copy the repository URL** shown on the next page
   - Example: `https://github.com/yourusername/elevated-movements-7days.git`

**Screenshot description:** GitHub success page showing "Quick setup" with the repository URL displayed prominently.

---

#### Step 1.3: Push to GitHub

**Command:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

**Expected output:**
```
Enumerating objects: 50, done.
Counting objects: 100% (50/50), done.
Writing objects: 100% (50/50), done.
To https://github.com/yourusername/repo.git
 * [new branch]      main -> main
```

**Troubleshooting:**
- If "Permission denied": Set up GitHub authentication (SSH key or personal access token)
- If "remote origin already exists": Run `git remote remove origin` first
- If "fatal: refusing to merge unrelated histories": You initialized the repo with files on GitHub - start fresh

**Verification:**
- Go to your GitHub repository URL in browser
- You should see all your project files listed
- Click on a few files to verify content is correct
- Check that `.env` files are NOT visible (they should be gitignored)

---

### Phase 2: Backend Deployment (Render)

#### Step 2.1: Access Render Dashboard

**Instructions:**

1. **Go to Render:** https://dashboard.render.com
2. **Log in** with your Render account
3. **Connect GitHub:**
   - If first time: Click "Connect GitHub" and authorize Render to access your repositories
   - Grant access to your organization/account

**Screenshot description:** Render dashboard showing "New +" button in top-right corner.

---

#### Step 2.2: Create Web Service

**Instructions:**

1. **Click "New +"** button (top-right)
2. **Select "Web Service"**

   **Screenshot description:** Dropdown menu showing options: Web Service, Static Site, Private Service, etc.

3. **Connect Repository:**
   - Find your repository in the list: `elevated-movements-7days`
   - Click "Connect"

   **Screenshot description:** List of GitHub repositories with "Connect" buttons.

4. **Render will scan the repository** and detect `render.yaml`

---

#### Step 2.3: Configure Service

Render should auto-detect settings from `render.yaml`. Verify these settings:

**Service Configuration:**

| Setting | Value |
|---------|-------|
| **Name** | `elevated-movements-api` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `em-backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2` |
| **Plan** | Free (or Starter for production) |

**Screenshot description:** Render service configuration form with all fields filled in as specified above.

**Important Notes:**
- **Root Directory:** Must be `em-backend` (not root of repo)
- **$PORT:** Render automatically provides this environment variable
- **Workers:** 2 workers for better performance (adjust based on plan)

---

#### Step 2.4: Set Environment Variables

**Critical Step:** Add these environment variables in Render dashboard:

1. **Scroll down to "Environment Variables" section**
2. **Click "Add Environment Variable"** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `ELEVENLABS_API_KEY` | Your actual API key | Get from https://elevenlabs.io/app/settings/api-keys |
| `ELEVENLABS_AGENT_ID` | `agent_4201k708pqxsed39y0vsz05gn66e` | Your agent ID |
| `CORS_ORIGINS` | `http://localhost:3000` | Temporary - will update after frontend deployment |
| `ENVIRONMENT` | `production` | Sets production mode |
| `LOG_LEVEL` | `info` | Logging verbosity |

**Screenshot description:** Render environment variables form showing multiple key-value pairs, with the "Add Environment Variable" button visible.

**Security Notes:**
- **NEVER commit API keys to Git**
- These variables are encrypted at rest by Render
- Only you and authorized team members can see these values

**How to get ElevenLabs API Key:**
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Click "Create API Key" or copy existing key
3. Paste into Render environment variables

---

#### Step 2.5: Deploy Backend

**Instructions:**

1. **Review all settings** one final time
2. **Click "Create Web Service"** button at bottom
3. **Wait for deployment** (5-10 minutes first time)

**Screenshot description:** Render deployment logs showing:
```
Building...
Installing dependencies...
✓ Dependencies installed
Starting service...
✓ Service started
==> Live
```

**Deployment Progress:**
- **Building:** Installing Python dependencies from `requirements.txt`
- **Deploying:** Starting the FastAPI service
- **Live:** Service is running and healthy (green "Live" badge)

**Expected logs:**
```
==> Installing dependencies
Collecting fastapi
Collecting uvicorn
...
Successfully installed fastapi-0.104.1 uvicorn-0.24.0
==> Starting service with 'uvicorn main:app --host 0.0.0.0 --port $PORT'
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

**Troubleshooting:**
- **Build failed:** Check `requirements.txt` for typos or incompatible versions
- **Service won't start:** Check `main.py` for syntax errors
- **Health check failing:** Verify `/health` endpoint exists and returns 200

---

#### Step 2.6: Get Backend URL

**Instructions:**

1. **Find your service URL** at top of Render dashboard
   - Format: `https://elevated-movements-api.onrender.com`
   - Or similar auto-generated URL

2. **Copy the full URL** (including `https://`)

3. **Save it** - you'll need it for frontend deployment

**Screenshot description:** Render service page showing the service URL prominently at the top, with a copy button next to it.

---

#### Step 2.7: Test Backend

**Test 1: Health Check**

**Command:**
```bash
curl https://YOUR_BACKEND_URL.onrender.com/health
```

**Expected output:**
```json
{"status":"healthy"}
```

**In browser:** Visit `https://YOUR_BACKEND_URL.onrender.com/health`

**Screenshot description:** Browser showing JSON response with "status: healthy".

---

**Test 2: API Documentation**

**In browser:** Visit `https://YOUR_BACKEND_URL.onrender.com/docs`

**Expected result:** Interactive API documentation (Swagger UI)

**Screenshot description:** FastAPI Swagger UI showing all endpoints like `/health`, `/widget/config`, etc.

---

**Test 3: CORS Configuration**

**Command:**
```bash
curl -H "Origin: http://localhost:3000" -I https://YOUR_BACKEND_URL.onrender.com/health
```

**Expected headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
```

**Troubleshooting:**
- **503 Service Unavailable:** Service is sleeping (free tier) - wait 30-60 seconds for wake-up
- **500 Internal Server Error:** Check logs in Render dashboard for Python errors
- **Connection refused:** Service might not be fully deployed yet

---

### Phase 3: Frontend Deployment (Vercel)

#### Step 3.1: Access Vercel Dashboard

**Instructions:**

1. **Go to Vercel:** https://vercel.com/new
2. **Log in** with your Vercel account
3. **Connect GitHub** (if not already connected)

**Screenshot description:** Vercel "Import Git Repository" page with GitHub integration option.

---

#### Step 3.2: Import Project

**Instructions:**

1. **Click "Import Project"** or "Add New..."
2. **Select "Import Git Repository"**
3. **Choose "GitHub"**
4. **Find your repository:** `elevated-movements-7days`
5. **Click "Import"**

**Screenshot description:** List of GitHub repositories with "Import" buttons.

---

#### Step 3.3: Configure Project

**Project Configuration:**

| Setting | Value |
|---------|-------|
| **Project Name** | `elevated-movements-7days` |
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `em-frontend` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

**Screenshot description:** Vercel project configuration form with "Root Directory" dropdown showing "em-frontend" selected.

**Important:**
- **Root Directory** must be set to `em-frontend`
- All other settings should auto-detect correctly for Next.js

---

#### Step 3.4: Set Environment Variables

**Critical Step:** Add environment variable:

1. **Scroll to "Environment Variables" section**
2. **Add variable:**

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | Your Render backend URL | Example: `https://elevated-movements-api.onrender.com` |

**Screenshot description:** Vercel environment variables form showing:
- Name: `NEXT_PUBLIC_BACKEND_URL`
- Value: `https://elevated-movements-api.onrender.com`
- Environment: Production (selected)

**Important Notes:**
- **NO trailing slash** in URL (wrong: `https://...com/`)
- Must start with `https://`
- Must be the full Render URL you saved earlier
- Select "Production" environment

---

#### Step 3.5: Deploy Frontend

**Instructions:**

1. **Click "Deploy"** button
2. **Wait for build** (3-5 minutes first time)

**Screenshot description:** Vercel deployment progress showing:
```
Cloning repository...
Installing dependencies...
Building application...
✓ Build successful
Deploying...
✓ Deployment successful
```

**Build Progress:**
- **Cloning:** Downloading code from GitHub
- **Installing:** Running `npm install`
- **Building:** Running `npm run build` to create optimized production build
- **Deploying:** Uploading to Vercel CDN

**Expected logs:**
```
Installing dependencies...
npm install
...
Building Next.js application...
Route (app)               Size     First Load JS
┌ ○ /                    137 B          87.2 kB
└ ○ /7-days-to-calm      2.45 kB        89.7 kB

✓ Build successful
```

**Troubleshooting:**
- **Build failed:** Check `package.json` dependencies
- **Module not found:** Run `npm install` locally first to verify
- **Environment variable not found:** Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly

---

#### Step 3.6: Get Frontend URL

**Instructions:**

1. **Find your deployment URL** on success page
   - Format: `https://elevated-movements-7days.vercel.app`
   - Or similar auto-generated URL

2. **Copy the full URL** (including `https://`)

3. **Test in browser:** Visit the URL - you should see the app (but widget may not work yet due to CORS)

**Screenshot description:** Vercel deployment success page showing:
- Large checkmark
- "Your project has been deployed"
- Domain: `elevated-movements-7days.vercel.app`
- "Visit" button

---

### Phase 4: Post-Deployment Configuration

#### Step 4.1: Update Backend CORS

**Critical Step:** Update CORS to allow frontend domain

**Instructions:**

1. **Return to Render Dashboard:** https://dashboard.render.com
2. **Select your backend service:** `elevated-movements-api`
3. **Go to "Environment" tab** (left sidebar)
4. **Find `CORS_ORIGINS` variable**
5. **Click "Edit"**
6. **Update value to include both:**
   ```
   https://elevated-movements-7days.vercel.app,http://localhost:3000
   ```

   **Important:**
   - Comma-separated, NO spaces
   - Replace with your actual Vercel URL
   - Keep `http://localhost:3000` for local development

7. **Click "Save Changes"**

**Screenshot description:** Render environment variable editor showing:
- Key: `CORS_ORIGINS`
- Value: `https://elevated-movements-7days.vercel.app,http://localhost:3000`
- "Save Changes" button

8. **Wait for automatic redeployment** (1-2 minutes)
   - Render automatically redeploys when environment variables change
   - Watch for "Live" status

**Verification:**
```bash
curl -H "Origin: https://YOUR_VERCEL_URL" -I https://YOUR_BACKEND_URL/health
```

Should return:
```
Access-Control-Allow-Origin: https://YOUR_VERCEL_URL
```

---

#### Step 4.2: Test Integration

**Instructions:**

1. **Open frontend in browser:** `https://YOUR_VERCEL_URL/7-days-to-calm`

2. **Open DevTools:**
   - Press `F12` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

3. **Check Console tab** for errors:

   **Expected:** No errors (or only harmless warnings)

   **Common issues:**
   - ❌ `CORS error` → Backend CORS not updated correctly
   - ❌ `404 Not Found` → Backend URL incorrect in Vercel env vars
   - ❌ `Widget failed to load` → ElevenLabs agent configuration issue

4. **Check Network tab:**
   - Look for requests to your backend URL
   - Should return 200 status codes
   - CORS headers should be present

**Screenshot description:** Browser DevTools showing:
- Console tab: No errors
- Network tab: Successful requests to backend (green 200 status)
- App visible with gradient background and widget

---

### Phase 5: Functional Testing

#### Test 1: Visual Verification

**Checklist:**
- [ ] Page loads without errors
- [ ] Gradient background displays (blue to purple)
- [ ] Progress bar shows Day 1 active
- [ ] Theme shows "Arrive"
- [ ] Description text visible
- [ ] Widget container visible (even if widget inside is loading)
- [ ] Mobile responsive (test by resizing browser)

**Screenshot description:** Full page view showing:
- Top: Progress bar with Day 1 highlighted
- Middle: "Arrive" theme with description
- Bottom: ElevenLabs widget container

---

#### Test 2: Widget Functionality

**Checklist:**
- [ ] ElevenLabs widget loads (blue interface appears)
- [ ] Can click microphone icon
- [ ] Can start conversation
- [ ] Voice responds (requires agent to be properly configured)

**If widget doesn't load:**

1. **Check ElevenLabs agent configuration:**
   - Go to https://elevenlabs.io/app/conversational-ai
   - Find your agent: "Mindfulness coach"
   - Click to edit

2. **Widget Settings tab:**
   - [ ] "Enable Widget" is ON
   - [ ] Widget embed code is available

3. **Security/Advanced tab:**
   - [ ] "Public Agent" is ENABLED
   - OR "Require Authentication" is DISABLED
   - [ ] Allowlist includes your Vercel domain

**Screenshot description:** ElevenLabs dashboard showing agent settings with "Public Agent" toggle enabled.

---

#### Test 3: Progress Tracking

**Test sequence:**

1. **Click "Complete Day 1" button**
   - Expected: Button changes to "Continue to Day 2"
   - Expected: Day 2 unlocks in progress bar
   - Expected: Progress bar shows 1/7 complete

2. **Refresh the page**
   - Expected: Progress persists (localStorage)
   - Expected: Still shows Day 1 completed

3. **Click "Continue to Day 2"**
   - Expected: Day 2 loads with theme "Release"
   - Expected: Widget updates with new agent context

4. **Click "Start Over" button**
   - Expected: Confirmation dialog appears
   - Expected: After confirm, returns to Day 1
   - Expected: Progress reset to 0/7

**Screenshot description:** Progress bar showing multiple days unlocked with green checkmarks.

---

#### Test 4: Cross-Browser Testing

**Test in multiple browsers:**
- [ ] Chrome/Edge (Chromium-based)
- [ ] Firefox
- [ ] Safari (Mac/iOS)
- [ ] Mobile browsers (Chrome Mobile, Safari iOS)

**Common browser issues:**
- Safari: May block audio autoplay (expected, user must interact first)
- Firefox: Web component support should work fine
- Mobile: Test touch interactions with widget

---

## Environment Variables Reference

### Backend (Render)

```bash
# Required
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx  # From ElevenLabs dashboard
ELEVENLABS_AGENT_ID=agent_4201k708pqxsed39y0vsz05gn66e  # Your agent ID

# CORS Configuration
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# Optional
ENVIRONMENT=production  # production or development
LOG_LEVEL=info  # debug, info, warning, error
```

### Frontend (Vercel)

```bash
# Required
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com  # NO trailing slash
```

**Important Notes:**
- `NEXT_PUBLIC_` prefix required for client-side access in Next.js
- All variables set in platform dashboards, NEVER in code
- Update `CORS_ORIGINS` whenever you change domains

---

## Troubleshooting

### Backend Issues

#### Problem: "503 Service Unavailable"

**Cause:** Render free tier services sleep after 15 minutes of inactivity.

**Solution:**
- Wait 30-60 seconds for service to wake up
- Refresh the page
- Consider upgrading to paid tier for always-on service

**Prevention:** Set up uptime monitoring (pings every 10 minutes)

---

#### Problem: "500 Internal Server Error"

**Cause:** Python error in backend code.

**Debug steps:**
1. Go to Render dashboard → your service
2. Click "Logs" tab
3. Look for Python tracebacks
4. Common issues:
   - Missing environment variables
   - Import errors
   - Database connection issues

**Solution:**
- Fix the error in code
- Commit and push to GitHub
- Render auto-redeploys

---

#### Problem: CORS errors in browser console

**Error message:**
```
Access to fetch at 'https://backend.onrender.com/api' from origin 'https://frontend.vercel.app'
has been blocked by CORS policy
```

**Solution:**
1. Go to Render dashboard
2. Check `CORS_ORIGINS` environment variable
3. Must include exact frontend URL (no trailing slash)
4. Format: `https://your-frontend.vercel.app,http://localhost:3000`
5. Save and wait for redeploy

**Verification:**
```bash
curl -H "Origin: https://your-frontend.vercel.app" -I https://your-backend.onrender.com/health
```

Should see: `Access-Control-Allow-Origin: https://your-frontend.vercel.app`

---

### Frontend Issues

#### Problem: "404 Page Not Found"

**Cause:** Vercel root directory not set correctly.

**Solution:**
1. Go to Vercel dashboard → your project
2. Settings → General
3. "Root Directory" must be `em-frontend`
4. Redeploy

---

#### Problem: Environment variables not working

**Symptoms:**
- Backend URL undefined
- API calls to wrong URL

**Solution:**
1. Go to Vercel dashboard → your project
2. Settings → Environment Variables
3. Verify `NEXT_PUBLIC_BACKEND_URL` is set
4. Must redeploy after adding variables:
   - Deployments tab → three dots → "Redeploy"

**Debug:**
Add this to a page component temporarily:
```tsx
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
```

---

#### Problem: Widget not loading

**Symptoms:**
- Blank white area where widget should be
- Console error: "Failed to load widget script"

**Debug steps:**

1. **Check Network tab in DevTools:**
   - Look for request to `https://unpkg.com/@elevenlabs/convai-widget-embed`
   - Should return 200 status
   - If blocked: Check content security policy

2. **Check Console for errors:**
   - Widget initialization errors
   - Authentication errors

3. **Verify ElevenLabs agent:**
   - Agent must be set to "Public"
   - Or authentication disabled
   - Allowlist must include your domain

4. **Check agent ID:**
   - In code: `agent-id="agent_4201k708pqxsed39y0vsz05gn66e"`
   - Must match your actual agent ID

**Solution:**
- Update agent settings in ElevenLabs dashboard
- Verify agent ID is correct
- Check browser console for specific error messages

---

### Deployment Issues

#### Problem: Build fails on Vercel

**Common causes:**

1. **TypeScript errors:**
   ```
   Type error: Property 'x' does not exist
   ```
   **Solution:** Fix TypeScript errors locally first, test with `npm run build`

2. **Missing dependencies:**
   ```
   Module not found: Can't resolve 'package-name'
   ```
   **Solution:** Run `npm install package-name` and commit `package.json`

3. **Environment variables:**
   ```
   Error: NEXT_PUBLIC_BACKEND_URL is undefined
   ```
   **Solution:** Add env var in Vercel dashboard and redeploy

---

#### Problem: Render build fails

**Common causes:**

1. **Python version mismatch:**
   ```
   ERROR: Package requires Python 3.11 or higher
   ```
   **Solution:** Update `runtime.txt` or Render Python version

2. **Missing dependencies:**
   ```
   ModuleNotFoundError: No module named 'fastapi'
   ```
   **Solution:** Update `requirements.txt`

3. **Wrong root directory:**
   ```
   ERROR: Could not find requirements.txt
   ```
   **Solution:** Set root directory to `em-backend` in render.yaml

---

## Verification & Testing

### Automated Tests

**Run the test script:**
```bash
./test-deployment.sh
```

**Expected output:**
```
[Test 1/6] Backend Health Check...
✓ PASSED: Backend is healthy

[Test 2/6] Backend API Documentation...
✓ PASSED: API docs accessible

[Test 3/6] Frontend Homepage...
✓ PASSED: Frontend is accessible

[Test 4/6] Frontend Main Application Page...
✓ PASSED: Main page is accessible

[Test 5/6] SSL Certificate...
✓ PASSED: Backend uses HTTPS

[Test 6/6] Environment Configuration...
✓ PASSED: Manual verification successful

=========================================
Test Summary
=========================================
Passed: 6
Failed: 0

✓ All tests passed!
🎉 Deployment successful!
```

---

### Manual Testing Checklist

**Backend Tests:**
- [ ] Health endpoint: `https://YOUR_BACKEND/health` returns `{"status":"healthy"}`
- [ ] API docs: `https://YOUR_BACKEND/docs` loads Swagger UI
- [ ] CORS headers present in responses
- [ ] Response time < 2 seconds (after wake-up)

**Frontend Tests:**
- [ ] Homepage redirects to `/7-days-to-calm`
- [ ] Main page loads without errors
- [ ] No console errors (F12 → Console tab)
- [ ] Widget container visible
- [ ] Progress bar displays correctly
- [ ] Can complete Day 1 and unlock Day 2
- [ ] Progress persists after refresh
- [ ] Mobile responsive (test on phone or resize browser)

**Integration Tests:**
- [ ] Frontend can communicate with backend
- [ ] CORS working (no CORS errors in console)
- [ ] Widget loads and initializes
- [ ] All 7 days can be accessed sequentially

---

## Post-Deployment

### Monitoring Setup

**Render Monitoring:**
1. Go to Render dashboard → your service
2. Enable email notifications:
   - Settings → Notifications
   - Check "Deploy Status" and "Service Status"

**Vercel Monitoring:**
1. Go to Vercel dashboard → your project
2. Enable deployment notifications:
   - Settings → Notifications
   - Check "Deployment Notifications"

**Uptime Monitoring (Optional):**
- Use services like UptimeRobot or Pingdom
- Ping `/health` endpoint every 5-10 minutes
- Prevents Render free tier from sleeping
- Get alerts if service goes down

---

### Custom Domain (Optional)

**Vercel Custom Domain:**

1. Go to Vercel dashboard → your project
2. Settings → Domains
3. Add your domain: `app.yourdomain.com`
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

**After adding custom domain:**
- Update `CORS_ORIGINS` in Render to include new domain
- Format: `https://app.yourdomain.com,https://old-url.vercel.app,http://localhost:3000`

---

### Continuous Deployment

**Already configured!** When you push to GitHub:

1. **Backend:** Render auto-deploys from `main` branch
2. **Frontend:** Vercel auto-deploys from `main` branch

**To deploy changes:**
```bash
git add .
git commit -m "Your change description"
git push origin main
```

**Monitor deployments:**
- Render: Dashboard → Logs
- Vercel: Dashboard → Deployments

---

### Performance Optimization

**Backend:**
- Increase workers in start command: `--workers 4`
- Upgrade Render plan for more resources
- Add caching for frequent requests
- Monitor response times in logs

**Frontend:**
- Vercel automatically optimizes Next.js builds
- Images automatically optimized
- CDN distribution worldwide
- Monitor Core Web Vitals in Vercel dashboard

---

## Rollback Procedures

### Frontend Rollback (Vercel)

**If latest deployment has issues:**

1. Go to Vercel dashboard → your project
2. Click "Deployments" tab
3. Find previous successful deployment
4. Click three dots → "Promote to Production"

**Screenshot description:** Vercel deployments list showing previous deployments with "Promote to Production" option.

**Instant rollback:** Traffic immediately routed to previous version

---

### Backend Rollback (Render)

**Method 1: Redeploy previous version**

1. Go to Render dashboard → your service
2. Click "Manual Deploy" → "Deploy previous commit"
3. Select commit to deploy
4. Wait for deployment (2-5 minutes)

**Method 2: Git revert**

```bash
# Find commit to revert to
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main

# Render auto-deploys
```

---

### Emergency Shutdown

**If you need to take the service offline:**

**Backend (Render):**
1. Dashboard → Service → Settings
2. Suspend Service (temporarily)
3. Or delete service (permanent)

**Frontend (Vercel):**
1. Dashboard → Project → Settings
2. Temporarily set maintenance page
3. Or delete deployment

---

## Success Criteria

### Deployment Complete When:

- ✅ Backend: "Live" status on Render
- ✅ Frontend: Deployed on Vercel
- ✅ Health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ No CORS errors in console
- ✅ Widget displays and initializes
- ✅ Can complete Day 1 and unlock Day 2
- ✅ Progress saves and persists
- ✅ Works on mobile devices

### Performance Targets:

- Backend response: < 2 seconds (after wake-up)
- Frontend load: < 3 seconds
- Widget initialization: < 5 seconds
- No 500 errors
- Uptime: > 99% (after stabilization)

---

## Additional Resources

**Documentation:**
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [ElevenLabs Widget Docs](https://elevenlabs.io/docs/conversational-ai)

**Support:**
- Render Support: support@render.com
- Vercel Support: https://vercel.com/support
- ElevenLabs Support: https://elevenlabs.io/support

**Project Documentation:**
- README.md - Project overview
- QUICK-START.md - 30-minute deployment guide
- PRODUCTION-CHECKLIST.md - Printable checklist
- DEPLOYMENT-FILES-SUMMARY.md - File reference

---

## Appendix: Common Commands

### Git Commands
```bash
# Check status
git status

# Stage changes
git add .

# Commit changes
git commit -m "Description"

# Push to GitHub
git push origin main

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Backend Testing
```bash
# Health check
curl https://YOUR_BACKEND/health

# API docs
curl https://YOUR_BACKEND/docs

# Test with CORS header
curl -H "Origin: https://YOUR_FRONTEND" -I https://YOUR_BACKEND/health

# Check response time
curl -w "@-" -o /dev/null -s https://YOUR_BACKEND/health <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
         time_total:  %{time_total}\n
EOF
```

### Frontend Testing
```bash
# Check homepage
curl -I https://YOUR_FRONTEND

# Check main page
curl -I https://YOUR_FRONTEND/7-days-to-calm

# Check SSL certificate
curl -vI https://YOUR_FRONTEND 2>&1 | grep -i "SSL"
```

---

**Last Updated:** October 2025
**Version:** 1.0.0

**Deployment Support:**
For issues or questions about this deployment, please check:
1. Troubleshooting section above
2. Platform-specific documentation (Render, Vercel)
3. GitHub Issues for this project
