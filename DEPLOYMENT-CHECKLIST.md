# Deployment Checklist

Use this checklist to ensure successful deployment of the Elevated Movements app.

## Pre-Deployment

### Accounts & Access
- [ ] GitHub account created and logged in
- [ ] Render account created and logged in
- [ ] Vercel account created and logged in
- [ ] ElevenLabs account with API key
- [ ] ElevenLabs Agent ID: `agent_4201k708pqxsed39y0vsz05gn66e`

### Local Environment
- [ ] Backend runs successfully on `localhost:8000`
- [ ] Frontend runs successfully on `localhost:3000`
- [ ] Widget loads and displays correctly
- [ ] Can complete Day 1 and unlock Day 2
- [ ] No console errors during local testing
- [ ] All environment variables configured locally

### Code Preparation
- [ ] All code changes committed
- [ ] No sensitive data in code (keys, passwords, etc.)
- [ ] `.env` files in `.gitignore`
- [ ] `.gitignore` files present in both directories
- [ ] `requirements.txt` up to date (backend)
- [ ] `package.json` dependencies correct (frontend)

---

## Git Setup

### Repository Initialization
- [ ] Git repository initialized (`git init`)
- [ ] All files added to git (`git add .`)
- [ ] Initial commit created
- [ ] Branch renamed to `main` (`git branch -M main`)

### GitHub Repository
- [ ] GitHub repository created
- [ ] Repository name: `elevated-movements-7dtc` (or custom)
- [ ] Visibility set (private recommended)
- [ ] Remote added (`git remote add origin ...`)
- [ ] Code pushed to GitHub (`git push -u origin main`)
- [ ] Repository visible on GitHub.com

---

## Backend Deployment (Render)

### Service Creation
- [ ] New Web Service created on Render
- [ ] GitHub account connected to Render
- [ ] Repository connected to Render service
- [ ] Service name set: `elevated-movements-backend`

### Configuration
- [ ] Runtime: Python 3
- [ ] Region selected (e.g., Oregon)
- [ ] Plan selected (Free or paid)
- [ ] Branch: `main`
- [ ] Root Directory: `em-backend`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Environment Variables
- [ ] `PYTHON_VERSION` = `3.11.0`
- [ ] `ELEVENLABS_API_KEY` = (your key)
- [ ] `ELEVENLABS_AGENT_ID` = `agent_4201k708pqxsed39y0vsz05gn66e`
- [ ] `CORS_ORIGINS` = `http://localhost:3000` (will update later)

### Deployment
- [ ] Service created and deployment started
- [ ] Build logs reviewed for errors
- [ ] Deployment status shows "Live" (green)
- [ ] Backend URL copied (e.g., `https://your-app.onrender.com`)

### Testing
- [ ] Health endpoint tested: `https://YOUR-APP.onrender.com/health`
- [ ] Returns: `{"status":"healthy","timestamp":"..."}`
- [ ] API docs accessible: `https://YOUR-APP.onrender.com/docs`
- [ ] No 503 or 500 errors

---

## Frontend Deployment (Vercel)

### Project Import
- [ ] Vercel project created
- [ ] GitHub account connected to Vercel
- [ ] Repository imported
- [ ] Project name set (auto-generated is fine)

### Configuration
- [ ] Framework Preset: Next.js (auto-detected)
- [ ] Root Directory: `em-frontend`
- [ ] Build Command: `npm run build` (auto-filled)
- [ ] Output Directory: `.next` (auto-filled)
- [ ] Install Command: `npm install` (auto-filled)

### Environment Variables
- [ ] `NEXT_PUBLIC_BACKEND_URL` = (your Render backend URL)
- [ ] No trailing slash in URL
- [ ] Uses `https://` protocol

### Deployment
- [ ] Deployment started
- [ ] Build logs reviewed for errors
- [ ] Deployment successful
- [ ] Frontend URL copied (e.g., `https://your-app.vercel.app`)

### Testing
- [ ] Homepage accessible
- [ ] Navigate to `/7-days-to-calm`
- [ ] Page loads without 404 errors
- [ ] No build errors in browser console

---

## Post-Deployment Configuration

### CORS Update
- [ ] Returned to Render dashboard
- [ ] Navigated to Environment tab
- [ ] `CORS_ORIGINS` updated to include Vercel URL
- [ ] Format: `https://your-app.vercel.app,http://localhost:3000`
- [ ] No spaces in the list
- [ ] No trailing slashes
- [ ] Changes saved
- [ ] Render redeployment completed

### Integration Testing
- [ ] Opened Vercel URL in browser
- [ ] Navigated to `/7-days-to-calm`
- [ ] Opened browser console (F12)
- [ ] No CORS errors visible
- [ ] No other errors in console
- [ ] Widget container visible (blue/purple gradient)
- [ ] ElevenLabs widget loads (no blank white box)

---

## Functional Testing

### Basic Functionality
- [ ] Progress bar displays correctly
- [ ] Day 1 is highlighted
- [ ] "Arrive" theme shows
- [ ] Description visible: "2-min quick reset, breath + sound"
- [ ] Widget area has decorative background blobs
- [ ] Page is responsive (test on mobile)

### Widget Interaction
- [ ] Widget loads without errors
- [ ] Can interact with widget (if agent is public)
- [ ] No authentication errors
- [ ] Voice interaction works (if tested)

### Progress Tracking
- [ ] "Complete Day 1" button works
- [ ] Day 2 unlocks after completing Day 1
- [ ] Progress bar updates
- [ ] Progress persists after page refresh
- [ ] "Start Over" button resets progress
- [ ] Can complete all 7 days

### Cross-Browser Testing (Optional)
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

---

## Monitoring Setup

### Render
- [ ] Deployment notification emails enabled
- [ ] Service dashboard bookmarked
- [ ] Know how to view logs
- [ ] Understand free tier limitations (sleeps after inactivity)

### Vercel
- [ ] Deployment notification emails enabled
- [ ] Project dashboard bookmarked
- [ ] Know how to view deployment history
- [ ] Analytics enabled (optional)

### Documentation
- [ ] Backend URL documented
- [ ] Frontend URL documented
- [ ] Environment variables documented
- [ ] Access credentials stored securely

---

## Optional Enhancements

### Custom Domains
- [ ] Domain purchased (if desired)
- [ ] DNS configured for Vercel
- [ ] DNS configured for Render
- [ ] SSL certificates issued (automatic)
- [ ] Environment variables updated with custom domains
- [ ] CORS updated with custom domains

### Performance
- [ ] Render upgraded to paid tier (if needed)
- [ ] CDN configuration reviewed
- [ ] Image optimization checked
- [ ] Lighthouse score checked

### Security
- [ ] All environment variables set in platforms only
- [ ] No `.env` files committed to git
- [ ] CORS restricted to specific domains only
- [ ] API keys rotated regularly
- [ ] SSL/HTTPS enabled everywhere

---

## Troubleshooting Completed

### Backend Issues Resolved
- [ ] Build failures fixed
- [ ] Start command issues resolved
- [ ] Environment variable problems fixed
- [ ] CORS configuration correct
- [ ] Health endpoint responding

### Frontend Issues Resolved
- [ ] Build errors fixed
- [ ] Environment variables correct
- [ ] Root directory configuration correct
- [ ] No 404 errors
- [ ] Widget loading properly

### Integration Issues Resolved
- [ ] CORS errors eliminated
- [ ] API calls succeeding
- [ ] No network errors in console
- [ ] Widget communicating with backend

---

## Final Verification

### All Systems Go
- [ ] Backend: Green "Live" status on Render
- [ ] Frontend: Successful deployment on Vercel
- [ ] Health check: Returns 200 OK
- [ ] Frontend page: Loads without errors
- [ ] Widget: Displays and functions correctly
- [ ] Progress: Saves and persists
- [ ] CORS: No errors in console
- [ ] Mobile: Responsive design works

### Documentation Complete
- [ ] URLs documented
- [ ] Credentials stored securely
- [ ] Team members notified (if applicable)
- [ ] Support contacts saved

### Ready for Users
- [ ] All functionality tested
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Monitoring in place
- [ ] Can deploy updates if needed

---

## Deployment Complete! 🎉

**Deployment Date**: ___________________

**URLs**:
- Frontend: _______________________________________________
- Backend: _______________________________________________
- API Docs: _______________________________________________

**Deployed By**: ___________________

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## Maintenance Reminders

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Check performance metrics monthly
- [ ] Rotate API keys quarterly
- [ ] Review security settings quarterly
- [ ] Update dependencies regularly

### Update Procedure
```bash
1. Make changes locally and test
2. git add .
3. git commit -m "Description of changes"
4. git push
5. Verify auto-deployment on Render and Vercel
6. Test production environment
```

### Emergency Rollback
1. Go to Vercel/Render dashboard
2. Find previous successful deployment
3. Click "Redeploy" or "Rollback"
4. Verify functionality

---

## Support Contacts

- **Render Support**: https://render.com/docs
- **Vercel Support**: https://vercel.com/help
- **ElevenLabs Support**: https://elevenlabs.io/docs
- **GitHub Issues**: https://github.com/YOUR_USERNAME/REPO/issues

---

**Last Updated**: October 2025
