# 7 Days to Calm - Deployment Guide

## Overview

Your application is a **Next.js 14 frontend** deployed on **Vercel**, communicating with a **Python backend** (likely on Render or similar).

Current production URLs:
- Frontend: https://7-days-to-calm.vercel.app (configured in next.config.js)
- Backend: https://seven-days-to-calm.onrender.com (or your Render URL)

---

## Prerequisites

✅ You have:
- Git repository initialized (`.git` folder exists)
- Vercel deployment configured
- Environment files ready
- GitHub repository created (https://github.com/darnellt0/7-days-to-calm)

✅ What you need:
1. Vercel account (if not already set up)
2. GitHub repository access
3. Environment variables configured
4. Backend API running

---

## Step 1: Prepare Your Code for Production

### 1.1 Verify Build Locally

```bash
cd em-frontend
npm run build
npm run start
```

This tests the production build locally before deploying.

**Expected output:**
```
> next build
- Creating an optimized production build ...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data ...
✓ Generating static pages (3/3)
✓ Finalizing page optimization ...

Route (pages)                              Size     First Load JS
/7-days-to-calm                           ...      ...
```

### 1.2 Commit Your Changes

```bash
cd em-frontend
git add .
git commit -m "Add surgical edits: softer message, dynamic vars, setReminder tool, Skip to Today dialog, ARIA labels, reduced-motion"
git push origin main
```

---

## Step 2: Environment Setup

### 2.1 Create Production Environment Variables

Copy `.env.production.example` to `.env.production.local`:

```bash
cd em-frontend
cp .env.production.example .env.production.local
```

Edit `.env.production.local` with your actual values:

```env
# Backend API URL - MUST point to your deployed backend
NEXT_PUBLIC_BACKEND_URL=https://seven-days-to-calm.onrender.com

# Optional: Google Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional: Google Tag Manager (for dataLayer)
# NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Optional: Error Tracking (Sentry)
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

**⚠️ IMPORTANT:** Never commit `.env.production.local` to Git. Add to `.gitignore`:

```bash
# .gitignore
.env.production.local
.env.local
.env.*.local
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Git Push (Recommended)

Vercel automatically deploys when you push to GitHub:

```bash
# Ensure you're on main branch
git checkout main

# Push your changes
git push origin main

# Vercel will automatically:
# 1. Build your Next.js app
# 2. Run tests
# 3. Deploy to production
```

**Check deployment status:**
1. Go to https://vercel.com/dashboard
2. Select your project: `7-days-to-calm`
3. Watch the build progress in real-time
4. View deployment logs if there are errors

### Option B: Deploy via Vercel CLI

Install Vercel CLI if you haven't:

```bash
npm install -g vercel
```

Deploy from the `em-frontend` directory:

```bash
cd em-frontend
vercel --prod
```

Follow the prompts:
- Link to existing project: Yes
- Build settings: Use defaults
- Override production settings: No

---

## Step 4: Configure Environment Variables on Vercel

### Via Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Select project:** `7-days-to-calm`
3. **Settings** → **Environment Variables**
4. **Add new variables:**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://seven-days-to-calm.onrender.com` | Production, Preview, Development |
| `NEXT_PUBLIC_GA_ID` | (if using GA) | Production |
| `NEXT_PUBLIC_GTM_ID` | (if using GTM) | Production |

### Via Vercel CLI

```bash
vercel env add NEXT_PUBLIC_BACKEND_URL
# Paste: https://seven-days-to-calm.onrender.com
# Select: Production, Preview, Development (select all)
```

---

## Step 5: Verify Production Deployment

### 5.1 Test Live App

1. **Open:** https://7-days-to-calm.vercel.app
2. **Verify:**
   - [ ] Page loads without errors
   - [ ] "7 Days to Calm" title visible
   - [ ] Progress bar shows all 7 days
   - [ ] Three buttons visible: Reset, Skip, Continue
   - [ ] Widget loads (or shows "Unable to load" if backend is down)

### 5.2 Test in Browser Console

```javascript
// Check environment
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);

// Check if widget exists
document.getElementById('em-shria') ? '✓ Widget loaded' : '✗ Not loaded';

// Check attributes
document.getElementById('em-shria')?.getAttribute('override-first-message');
// Should show: "Hey, you made it. Day X — Title. Would 2, 5, or 8 minutes feel good right now?"

// Check dataLayer
window.dataLayer; // Should have analytics events
```

### 5.3 Test Buttons

1. **Click "Reset to Day 1"**
   - [ ] Confirmation dialog appears
   - [ ] "Cancel" closes dialog
   - [ ] "Reset Progress" resets day to 1

2. **Click "Skip to Today"**
   - [ ] Confirmation dialog appears (if today > current day)
   - [ ] Shows correct day numbers

3. **Click "Continue Day X"**
   - [ ] Widget initializes conversation (if backend is running)
   - [ ] Check console for `em_convai_started` event

### 5.4 Test Accessibility

```javascript
// Check ARIA labels
Array.from(document.querySelectorAll('button[aria-label]')).forEach(b => {
  console.log(`${b.textContent.trim()} → ${b.getAttribute('aria-label')}`);
});

// Check localStorage
localStorage.getItem('em_challenge_day')  // Should show "1"
localStorage.getItem('em_challenge_start') // Should show ISO timestamp
```

---

## Step 6: Monitor Production

### Monitor Vercel Deployments

1. **Vercel Dashboard:** https://vercel.com/dashboard
   - View deployment status
   - Check build logs
   - Monitor performance

2. **Analytics:**
   - Real User Monitoring (RUM)
   - Core Web Vitals
   - Error rates

### Monitor Backend Connection

The app makes API calls to: `{NEXT_PUBLIC_BACKEND_URL}/convai/signed-url?challenge_day={day}`

**If backend is down:**
- Widget shows: "Unable to load Shria guide. Failed to fetch"
- Check your Render service: https://dashboard.render.com

### Monitor Analytics

Check your `window.dataLayer` events in production:
- `em_convai_started` - User started conversation
- `em_convai_ended` - User ended conversation
- `em_jump_to_today` - User jumped to today
- `em_reminder_set` - User set reminder
- `em_challenge_reset` - User reset progress

---

## Step 7: Rollback if Needed

### Quick Rollback on Vercel

1. **Go to:** https://vercel.com/dashboard/[project]/deployments
2. **Find previous deployment** (before your latest push)
3. **Click the "..." menu** → **Promote to Production**

### Rollback via Git

If you need to revert code changes:

```bash
# Revert last commit
git revert HEAD

# Push to GitHub
git push origin main

# Vercel will automatically redeploy with the reverted code
```

---

## Troubleshooting

### Issue: "Unable to load Shria guide"

**Cause:** Backend API is not responding

**Solution:**
1. Check backend is running: Visit `{BACKEND_URL}/health` or similar
2. Verify `NEXT_PUBLIC_BACKEND_URL` is correct in Vercel env vars
3. Check CORS settings on backend (should allow frontend origin)
4. Check Render service status: https://status.render.com

### Issue: Build fails on Vercel

**Cause:** Missing dependencies or environment variables

**Solution:**
1. Check Vercel build logs: https://vercel.com/dashboard → Project → Deployments
2. Verify `package.json` is committed
3. Verify all env vars are set in Vercel dashboard
4. Try building locally: `npm run build`

### Issue: Changes not showing on production

**Cause:** Browser cache or stale deployment

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Clear browser cache: DevTools → Application → Cache Storage → Clear All
3. Wait for deployment to complete (check Vercel dashboard)
4. Verify commit was pushed to GitHub: `git log` or GitHub.com

### Issue: Buttons don't appear

**Cause:** JavaScript or CSS not loaded

**Solution:**
1. Check browser console for errors: F12 → Console tab
2. Check Network tab: Look for 404 errors
3. Verify CSS is loaded: DevTools → Elements → Check applied styles
4. Hard refresh browser cache

---

## Deployment Checklist

- [ ] Code built successfully locally: `npm run build && npm start`
- [ ] All changes committed: `git log` shows latest commit
- [ ] Pushed to GitHub: `git push origin main`
- [ ] Environment variables set in Vercel dashboard
- [ ] Vercel deployment status is "Ready"
- [ ] Production app loads: https://7-days-to-calm.vercel.app
- [ ] Three buttons visible and clickable
- [ ] DevTools console shows no errors
- [ ] "Reset" dialog works
- [ ] "Skip" dialog works
- [ ] First message is softer: "Hey, you made it..."
- [ ] ARIA labels present: `Array.from(document.querySelectorAll('button[aria-label]')).length === 3`
- [ ] Backend connection working (or gracefully showing error)
- [ ] localStorage working: `localStorage.getItem('em_challenge_day')`

---

## Post-Deployment

### Monitor for Issues

1. **First 24 hours:** Watch error rates in Vercel dashboard
2. **Check analytics:** Look for `em_convai_started` events
3. **Test on mobile:** Verify responsive design works on iOS/Android
4. **User feedback:** Monitor for bug reports

### Iterate

If you need to make changes:

1. **Make code changes** in `em-frontend/components/` or `em-frontend/app/`
2. **Test locally:** `npm run dev`
3. **Commit:** `git add . && git commit -m "Description of change"`
4. **Push:** `git push origin main`
5. **Vercel auto-deploys** within minutes

---

## Support URLs

| Service | URL |
|---------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Your Project** | https://vercel.com/dashboard/7-days-to-calm |
| **GitHub Repository** | https://github.com/darnellt0/7-days-to-calm |
| **Backend (Render)** | https://dashboard.render.com |
| **Live App** | https://7-days-to-calm.vercel.app |

---

## Questions?

Check these resources:
- **Next.js docs:** https://nextjs.org/docs
- **Vercel docs:** https://vercel.com/docs
- **GitHub:** https://docs.github.com
- **Render:** https://render.com/docs

