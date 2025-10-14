# Quick Start Guide - Elevated Movements 7 Days to Calm

Get your application deployed in under 30 minutes!

## 📋 Before You Start

Make sure you have:
- [ ] GitHub account
- [ ] Render account (sign up at https://render.com)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] ElevenLabs API key (from https://elevenlabs.io)

## 🚀 Deployment in 5 Steps

### Step 1: Run Pre-Deployment Check (2 minutes)

```bash
# Navigate to project directory
cd "C:\Users\darne\OneDrive\Documents\Python Scripts\Elevated_Movements\elevated-movements-7dtc"

# Run the pre-deployment checker
pre-deploy-check.bat
```

**Expected Result**: All checks should pass. Fix any failures before continuing.

---

### Step 2: Initialize Git & Push to GitHub (5 minutes)

```bash
# Initialize Git repository
init-git.bat

# Create repository on GitHub
# Go to: https://github.com/new
# Name: elevated-movements-7dtc
# Visibility: Private
# Click "Create repository"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/elevated-movements-7dtc.git
git push -u origin main
```

**Expected Result**: Code is now on GitHub. Refresh the page to see your files.

---

### Step 3: Deploy Backend to Render (10 minutes)

1. **Go to Render**: https://dashboard.render.com
2. **Click**: "New +" → "Web Service"
3. **Connect**: Your GitHub repository
4. **Configure**:
   ```
   Name: elevated-movements-backend
   Root Directory: em-backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. **Add Environment Variables**:
   ```
   PYTHON_VERSION = 3.11.0
   ELEVENLABS_API_KEY = (your key from ElevenLabs)
   ELEVENLABS_AGENT_ID = agent_4201k708pqxsed39y0vsz05gn66e
   CORS_ORIGINS = http://localhost:3000
   ```
6. **Click**: "Create Web Service"
7. **Wait**: 3-5 minutes for deployment
8. **Copy**: Your backend URL (e.g., `https://elevated-movements-backend.onrender.com`)

**Expected Result**: Green "Live" status. Test at: `https://YOUR-APP.onrender.com/health`

---

### Step 4: Deploy Frontend to Vercel (5 minutes)

1. **Go to Vercel**: https://vercel.com/new
2. **Import**: Your GitHub repository
3. **Configure**:
   ```
   Framework Preset: Next.js (auto-detected)
   Root Directory: em-frontend
   Build Command: npm run build (auto-filled)
   Output Directory: .next (auto-filled)
   ```
4. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_BACKEND_URL = (your Render backend URL)
   ```
5. **Click**: "Deploy"
6. **Wait**: 2-3 minutes for deployment
7. **Copy**: Your frontend URL (e.g., `https://elevated-movements-7dtc.vercel.app`)

**Expected Result**: Successful deployment with preview. Click "Visit" to see your app.

---

### Step 5: Update CORS & Test (3 minutes)

1. **Update CORS on Render**:
   - Go to your Render service → "Environment" tab
   - Edit `CORS_ORIGINS` to: `https://YOUR-VERCEL-APP.vercel.app,http://localhost:3000`
   - Save (Render will redeploy automatically)

2. **Test Your Deployment**:
   - Visit: `https://YOUR-VERCEL-APP.vercel.app/7-days-to-calm`
   - Verify:
     - [ ] Page loads without errors
     - [ ] Progress bar displays
     - [ ] Widget shows in blue/purple gradient
     - [ ] No console errors (press F12)

**Expected Result**: Fully functional meditation app! 🎉

---

## 🔧 Troubleshooting

### Widget Not Loading?
1. Check browser console (F12) for errors
2. Verify backend is "Live" on Render
3. Test backend health: `https://YOUR-BACKEND.onrender.com/health`
4. Confirm `NEXT_PUBLIC_BACKEND_URL` is correct on Vercel
5. Ensure CORS includes your Vercel URL

### CORS Errors?
1. Verify `CORS_ORIGINS` format: `https://app1.com,https://app2.com` (no spaces)
2. Ensure no trailing slashes in URLs
3. Wait for Render to finish redeploying after changes

### Build Failures?
- **Render**: Check logs, verify `requirements.txt` exists in `em-backend`
- **Vercel**: Verify root directory is `em-frontend`, check build logs

---

## 📚 Next Steps

### Optional Enhancements

**Custom Domains**:
- Vercel: Settings → Domains → Add
- Render: Settings → Custom Domain → Add
- Update environment variables with new URLs

**Monitoring**:
- Render: View logs, set up alerts
- Vercel: Enable Analytics
- Both: Check deployment history

**Updates**:
```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Both platforms auto-deploy on push!
```

---

## 📖 Detailed Documentation

For more information, see:
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide with screenshots
- **[README.md](./README.md)** - Project overview and local development
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

## ✅ Success Checklist

Your deployment is successful when:
- [x] Backend `/health` endpoint returns 200 OK
- [x] Frontend loads at `/7-days-to-calm`
- [x] Widget appears (blue/purple gradient background)
- [x] Can complete Day 1 and unlock Day 2
- [x] Progress persists after refresh
- [x] No CORS errors in console
- [x] Mobile responsive

**Congratulations! Your app is live! 🎉**

---

## 🆘 Need Help?

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
2. Review logs on Render and Vercel dashboards
3. Verify all environment variables are set correctly
4. Compare with working local setup

**Common Issues**:
- Render free tier sleeps after inactivity (first request is slow)
- Environment variables need redeployment to take effect
- CORS must be configured for specific domains
