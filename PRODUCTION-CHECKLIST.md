# Production Deployment Checklist

Complete this checklist to ensure successful deployment of the 7 Days to Calm app.

## Pre-Deployment Tasks

### Environment Setup
- [ ] GitHub account created
- [ ] Render.com account created
- [ ] Vercel account created
- [ ] ElevenLabs API key obtained
- [ ] Agent ID confirmed: `agent_4201k708pqxsed39y0vsz05gn66e`

### Local Testing
- [ ] Backend runs successfully (`uvicorn main:app --reload`)
- [ ] Frontend runs successfully (`npm run dev`)
- [ ] Widget loads and displays correctly
- [ ] Can complete Day 1 and unlock Day 2
- [ ] No console errors in browser
- [ ] All environment variables work locally

### Code Preparation
- [ ] All code changes committed
- [ ] No secrets in code (API keys, passwords)
- [ ] `.env` files in `.gitignore`
- [ ] `requirements.txt` is up to date
- [ ] `package.json` dependencies are correct
- [ ] Production config files created (render.yaml, vercel.json)

---

## Git Configuration

### Repository Setup
- [ ] Git initialized (`./setup-git.sh`)
- [ ] GitHub repository created
- [ ] Repository is private (recommended)
- [ ] Remote added (`git remote add origin ...`)
- [ ] Code pushed to GitHub (`git push -u origin main`)

### Verification
- [ ] Repository visible on GitHub
- [ ] All files present (backend and frontend)
- [ ] `.gitignore` working (no .env files)
- [ ] README.md displays correctly

---

## Backend Deployment (Render)

### Service Creation
- [ ] Logged into Render dashboard
- [ ] Clicked "New +" → "Web Service"
- [ ] GitHub repository connected
- [ ] Service name set: `elevated-movements-api`

### Configuration
- [ ] render.yaml auto-detected
- [ ] Root directory: `em-backend`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Runtime: Python 3.11
- [ ] Region selected
- [ ] Plan selected (Free/Starter)

### Environment Variables
- [ ] `ELEVENLABS_API_KEY` = (your API key)
- [ ] `ELEVENLABS_AGENT_ID` = `agent_4201k708pqxsed39y0vsz05gn66e`
- [ ] `CORS_ORIGINS` = `http://localhost:3000` (temporary)
- [ ] `ENVIRONMENT` = `production`
- [ ] `LOG_LEVEL` = `info`

### Deployment
- [ ] Service created
- [ ] Build logs reviewed
- [ ] Deployment successful (green "Live" status)
- [ ] Backend URL copied: __________________________

### Testing
- [ ] Health endpoint works: `https://YOUR-APP.onrender.com/health`
- [ ] Returns: `{"status":"healthy"}`
- [ ] API docs accessible: `https://YOUR-APP.onrender.com/docs`
- [ ] No 503 errors

---

## Frontend Deployment (Vercel)

### Project Setup
- [ ] Logged into Vercel dashboard
- [ ] Clicked "New Project"
- [ ] GitHub repository imported
- [ ] Project name set

### Configuration
- [ ] Framework: Next.js (auto-detected)
- [ ] Root directory: `em-frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`

### Environment Variables
- [ ] `NEXT_PUBLIC_BACKEND_URL` = (your Render URL)
- [ ] No trailing slash in URL
- [ ] Uses `https://` protocol

### Deployment
- [ ] Deployment started
- [ ] Build logs reviewed
- [ ] Deployment successful
- [ ] Frontend URL copied: __________________________

### Testing
- [ ] Homepage redirects to `/7-days-to-calm`
- [ ] Main page loads without errors
- [ ] No 404 errors
- [ ] Browser console clean

---

## Post-Deployment Configuration

### CORS Update
- [ ] Returned to Render dashboard
- [ ] Selected backend service
- [ ] Went to Environment tab
- [ ] Updated `CORS_ORIGINS` to include Vercel URL
- [ ] Format: `https://your-app.vercel.app,http://localhost:3000`
- [ ] Saved changes
- [ ] Service redeployed automatically

### Integration Testing
- [ ] Opened Vercel URL in browser
- [ ] Navigated to `/7-days-to-calm`
- [ ] Opened DevTools Console (F12)
- [ ] No CORS errors
- [ ] No JavaScript errors
- [ ] Widget container visible

---

## Functional Testing

### Basic UI
- [ ] Progress bar displays correctly
- [ ] Day 1 highlighted
- [ ] Theme shows: "Arrive"
- [ ] Description visible
- [ ] Gradient background renders
- [ ] Mobile responsive

### Widget
- [ ] ElevenLabs widget loads
- [ ] No blank white area
- [ ] No loading spinner stuck
- [ ] Can interact with widget
- [ ] Voice works (if agent is public)

### Progress Tracking
- [ ] "Complete Day 1" button works
- [ ] Day 2 unlocks
- [ ] Progress bar updates
- [ ] Progress persists after refresh
- [ ] "Start Over" resets correctly
- [ ] Can progress through all 7 days

### Cross-Browser (Sample)
- [ ] Chrome/Edge tested
- [ ] Firefox tested (optional)
- [ ] Safari tested (optional)
- [ ] Mobile browser tested

---

## Security & Performance

### Security
- [ ] All environment variables set in dashboards (not code)
- [ ] No `.env` files in repository
- [ ] CORS restricted to specific domains
- [ ] HTTPS enabled on both services
- [ ] Security headers configured (vercel.json)

### Performance
- [ ] Backend responds quickly (<2s)
- [ ] Frontend loads fast (<3s)
- [ ] Widget initializes quickly
- [ ] No memory leaks observed
- [ ] Lighthouse score checked (optional)

---

## Documentation & Monitoring

### Documentation
- [ ] URLs documented:
  - Backend: __________________________
  - Frontend: __________________________
  - Repository: __________________________
- [ ] Environment variables documented
- [ ] Access credentials stored securely
- [ ] Team members notified (if applicable)

### Monitoring Setup
- [ ] Render email notifications enabled
- [ ] Vercel email notifications enabled
- [ ] Error tracking configured (optional)
- [ ] Uptime monitoring setup (optional)

---

## Post-Launch Tasks

### Immediate (Day 1)
- [ ] Monitor error logs
- [ ] Watch for user reports
- [ ] Test all features again
- [ ] Verify analytics working (if configured)

### Short Term (Week 1)
- [ ] Review performance metrics
- [ ] Check error rates
- [ ] Gather user feedback
- [ ] Fix any critical bugs

### Ongoing
- [ ] Regular dependency updates
- [ ] Security patches
- [ ] Performance optimization
- [ ] Feature enhancements

---

## Rollback Plan

### If Deployment Fails
- [ ] Check build logs for errors
- [ ] Verify environment variables
- [ ] Test locally with production config
- [ ] Rollback to previous version if needed

### Rollback Steps
1. Go to platform dashboard (Render/Vercel)
2. Find previous successful deployment
3. Click "Redeploy" or "Rollback"
4. Verify functionality restored

---

## Success Criteria

### All Systems Green
- [ ] Backend: "Live" status on Render
- [ ] Frontend: Deployed on Vercel
- [ ] Health check: Returns 200 OK
- [ ] Frontend: Loads without errors
- [ ] Widget: Displays and functions
- [ ] Progress: Saves correctly
- [ ] CORS: No console errors
- [ ] Mobile: Works on phones

### Performance Targets
- [ ] Backend response: <2 seconds
- [ ] Frontend load: <3 seconds
- [ ] Widget init: <5 seconds
- [ ] No 500 errors
- [ ] Uptime: >99% (after stabilization)

---

## Final Sign-Off

**Deployment Date**: _________________

**Deployed By**: _________________

**Verified By**: _________________

**URLs**:
- Frontend: _______________________________
- Backend: _______________________________
- API Docs: _______________________________

**Status**: ☐ Success  ☐ Issues (document below)

**Notes**:
___________________________________________________
___________________________________________________
___________________________________________________

---

## Quick Reference Commands

```bash
# Initial setup
./setup-git.sh

# Deploy backend
./deploy-backend.sh

# Deploy frontend
./deploy-frontend.sh

# Test deployment
./test-deployment.sh

# Update after changes
git add .
git commit -m "Your message"
git push
# Auto-deploys to both platforms
```

---

**Last Updated**: October 2025
