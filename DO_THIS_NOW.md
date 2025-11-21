# DO THIS NOW (5 minutes to production!)

## Status
✅ Code deployed to Vercel
✅ App live at: https://7-days-to-calm.vercel.app
⏳ **Just need to route your domain**

---

## Copy-Paste Instructions

### STEP 1: Vercel (Open in new tab right now)

**Go to:** https://vercel.com/dashboard

1. Click the **7-days-to-calm** project
2. Click **Settings** (left sidebar)
3. Click **Domains**
4. In the text field, type: `7-days-to-calm.elevatedmovements.com`
5. Click **Add**
6. **Copy the CNAME value** that appears (it will say something like `cname.vercel-dns.com.`)
7. **Keep this tab open** → You'll need it for Step 2

---

### STEP 2: Cloudflare (Open in new tab)

**Go to:** https://dash.cloudflare.com

1. Click **elevatedmovements.com** domain
2. Click **DNS** (left sidebar)
3. Click **+ Add record** (blue button)
4. In the form, fill in:
   - **Type:** Select "CNAME" from dropdown
   - **Name:** Type `7-days-to-calm`
   - **Target:** Paste the value from Step 1
   - **TTL:** Leave as "Auto"
   - **Proxy status:** Choose "DNS only"
5. Click **Save** (blue button)

---

### STEP 3: Wait & Verify

Wait **5-10 minutes**, then:

1. Go back to Vercel tab
2. Refresh the page
3. Look for domain name with green **✓** checkmark
4. Once green ✓ appears, domain is ready!

---

## Test It Works

1. Open browser
2. Visit: `https://7-days-to-calm.elevatedmovements.com`
3. Should see your 7 Days to Calm widget
4. Click buttons to test:
   - "Reset to Day 1" → shows dialog ✓
   - "Skip to Today" → shows dialog ✓
   - "Continue Day 1" → starts conversation ✓

---

## That's It! 🎉

Your widget is now live at your domain with:
- ✅ Softer first message
- ✅ Dynamic variables (time, energy, environment, intent)
- ✅ setReminder tool
- ✅ Skip to Today dialog
- ✅ ARIA labels for accessibility
- ✅ Reduced motion support
- ✅ Enhanced analytics

---

## If Stuck

**DNS still not working after 15 minutes?**

Common issues:
1. **Typo in CNAME** - Double-check spelling in Cloudflare
2. **Wrong domain** - Make sure it's exactly: `7-days-to-calm.elevatedmovements.com`
3. **Need to wait longer** - DNS propagation can take up to 48 hours (usually 5-10 min)

**Seeing old Webflow page?**
- Hard refresh: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try in Incognito/Private mode

---

## Links You'll Need

| Link | Use |
|------|-----|
| https://vercel.com/dashboard | Add domain (Step 1) |
| https://dash.cloudflare.com | Add DNS record (Step 2) |
| https://7-days-to-calm.vercel.app | Test before domain setup |
| https://7-days-to-calm.elevatedmovements.com | Your final URL (after setup) |

---

**Done!** Your widget is live. Go do Step 1 & 2 now! 🚀
