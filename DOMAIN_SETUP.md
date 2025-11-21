# Domain Setup: Route elevatedmovements.com/7-days-to-calm to Vercel

## Current Setup
- **Domain:** elevatedmovements.com
- **DNS Provider:** Cloudflare (detected from DNS records)
- **Site Builder:** Webflow (likely, since you use Cloudflare + Webflow commonly)
- **New Frontend:** Vercel (7-days-to-calm.vercel.app)

## Goal
Route `elevatedmovements.com/7-days-to-calm` → Vercel deployment

---

## Option 1: Route Subdomain via Cloudflare (Recommended)

### Step 1: Add Vercel Domain in Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Select project:** `7-days-to-calm`
3. **Settings** → **Domains**
4. **Add Domain:** Enter `7-days-to-calm.elevatedmovements.com`
5. **Click "Add"**
6. Vercel will show you a CNAME record to add

### Step 2: Add CNAME Record in Cloudflare

1. **Go to:** https://dash.cloudflare.com
2. **Select domain:** `elevatedmovements.com`
3. **DNS** → **Records**
4. **Add Record:**
   - **Type:** CNAME
   - **Name:** `7-days-to-calm`
   - **Target:** `cname.vercel-dns.com.` (copy from Vercel)
   - **Proxy status:** DNS only (or Proxied, but DNS only is simpler)
   - **TTL:** Auto
   - **Click Save**

### Step 3: Verify in Vercel

After ~5 minutes, Vercel should show domain as "Valid" with a green ✓

Once verified, your app lives at:
🎉 **https://7-days-to-calm.elevatedmovements.com**

---

## Option 2: Redirect /7-days-to-calm Path (If Webflow Pages)

If you want: `elevatedmovements.com/7-days-to-calm` (path, not subdomain):

### In Webflow:
1. Go to Webflow project settings
2. **Hosting** → **Redirects**
3. **Add Redirect:**
   - **From:** `/7-days-to-calm`
   - **To:** `https://7-days-to-calm.elevatedmovements.com/` (subdomain from Option 1)
   - **Type:** Permanent (301)
   - **Save**

OR:

### In Cloudflare (Worker Script):
1. Go to Cloudflare dashboard
2. **Workers** → **Create Service**
3. Add route: `elevatedmovements.com/7-days-to-calm*`
4. Script to redirect or proxy to Vercel

---

## Option 3: Use Cloudflare Page Rules (Simple)

If Webflow is the main site and you want path-based routing:

1. **Cloudflare Dashboard** → **Rules** → **Page Rules**
2. **Create Rule:**
   - **URL:** `elevatedmovements.com/7-days-to-calm/*`
   - **Settings:** Forwarding URL (301)
   - **Forward to:** `https://7-days-to-calm.elevatedmovements.com/$1`

---

## Quick Decision Tree

```
Do you want: elevatedmovements.com/7-days-to-calm ?
│
├─ YES → Use Option 2 or 3 (path-based)
│   └─ Requires Webflow redirect or Cloudflare rule
│
└─ NO → Use Option 1 (subdomain)
    └─ Just add CNAME in Cloudflare
    └─ Live at: 7-days-to-calm.elevatedmovements.com
```

---

## My Recommendation

**Use Option 1 (Subdomain):**
- ✅ Simplest setup
- ✅ Works with Cloudflare + Vercel
- ✅ No extra redirects needed
- ✅ Better for SEO and tracking
- ✅ Can add path page (e.g., `/coaching`) later

**Final URL:** `https://7-days-to-calm.elevatedmovements.com`

---

## Step-by-Step Instructions

### In Vercel (3 minutes)

1. **Go to:** https://vercel.com/dashboard
2. **Click project:** `7-days-to-calm`
3. **Settings** → **Domains** (left sidebar)
4. **Input field:** Type `7-days-to-calm.elevatedmovements.com`
5. **Click "Add"** button
6. **Copy the CNAME value** that appears (should be something like `cname.vercel-dns.com.`)

### In Cloudflare (3 minutes)

1. **Go to:** https://dash.cloudflare.com
2. **Select:** `elevatedmovements.com` domain
3. **DNS** (left sidebar) → **Records**
4. **+ Add record** button
5. **Fill in:**
   - **Type:** CNAME (dropdown)
   - **Name:** `7-days-to-calm` (just the subdomain part)
   - **Target:** Paste the CNAME from Vercel (e.g., `cname.vercel-dns.com.`)
   - **TTL:** Auto
   - **Proxy status:** DNS only
6. **Save**

### Verify (5-10 minutes)

Wait 5-10 minutes, then:

1. **In Vercel dashboard**, domain should show green ✓ "Valid"
2. **In browser**, visit: `https://7-days-to-calm.elevatedmovements.com`
3. **Should load:** Your Vercel app with the widget

---

## Troubleshooting

### Domain shows red ✗ in Vercel?

**Solution:**
- Wait 10-15 minutes for DNS to propagate
- Verify CNAME is correct in Cloudflare (no typos)
- Check TTL has expired (usually 5-10 min)
- Run: `nslookup 7-days-to-calm.elevatedmovements.com`
  - Should return Vercel's IP (e.g., 76.76.19.x)

### Still getting Webflow page?

**Cause:** Browser/Cloudflare cache

**Solution:**
- Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
- Clear cache: DevTools → Application → Cache Storage → Clear All
- In Cloudflare: **Caching** → **Purge Cache** → **Purge Everything**

### SSL/HTTPS Certificate Error?

**Cause:** Vercel needs time to issue SSL cert

**Solution:**
- Wait 15-30 minutes after DNS propagates
- Vercel automatically issues Let's Encrypt cert
- No action needed

---

## What You'll Have After Setup

✅ **Your Vercel app** accessible at your domain
✅ **Auto-deploying** from GitHub pushes
✅ **SSL/HTTPS** automatically managed
✅ **CDN** for fast global delivery
✅ **Analytics** in Vercel dashboard
✅ **Easy rollbacks** if needed

---

## Support URLs

| Service | Dashboard |
|---------|-----------|
| **Vercel** | https://vercel.com/dashboard |
| **Cloudflare** | https://dash.cloudflare.com |
| **Your Project** | https://vercel.com/dashboard/7-days-to-calm |

---

## Next Steps

1. **Open Vercel:** https://vercel.com/dashboard → 7-days-to-calm → Settings → Domains
2. **Add domain:** `7-days-to-calm.elevatedmovements.com`
3. **Copy CNAME** Vercel provides
4. **Open Cloudflare:** https://dash.cloudflare.com → elevatedmovements.com → DNS
5. **Add CNAME record** with value from Vercel
6. **Wait 5-10 min** for DNS propagation
7. **Test:** Visit your domain
8. **Done!** 🎉

---

**Questions?** Check Vercel docs: https://vercel.com/docs/concepts/deployments/custom-domains
