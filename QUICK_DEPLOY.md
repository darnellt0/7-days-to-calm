# Quick Deployment (5 minutes)

## For Vercel Auto-Deployment

### Step 1: Commit and Push (2 minutes)

```bash
# From project root
cd em-frontend

# Check what changed
git status

# Stage all changes
git add .

# Commit with description
git commit -m "feat: add surgical edits - softer message, dynamic vars, setReminder tool, Skip dialog, ARIA labels, reduced-motion support"

# Push to GitHub (Vercel will auto-deploy)
git push origin main
```

### Step 2: Wait for Vercel (3 minutes)

1. Go to: https://vercel.com/dashboard
2. Click your project: `7-days-to-calm`
3. Watch the build progress
4. Once status shows "Ready ✓" → **You're done!**

### Step 3: Test Production (1 minute)

Visit: https://7-days-to-calm.vercel.app

**Quick checks:**
- [ ] Page loads
- [ ] Three buttons visible
- [ ] No console errors
- [ ] "Reset" and "Skip" buttons work

---

## If Build Fails

**Check Vercel logs:**
1. Dashboard → Deployments → Click latest
2. Read the error message
3. **Common fixes:**
   - Missing env var: Add to Vercel dashboard Settings → Environment Variables
   - Build error: Run `npm run build` locally to debug

---

## That's It!

Your changes are now live at:
🚀 **https://7-days-to-calm.vercel.app**
