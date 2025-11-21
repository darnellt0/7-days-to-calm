# Quick Domain Setup (5 minutes)

## Your Setup
- ✅ Code deployed to Vercel
- ✅ Cloudflare detected as DNS provider
- ✅ Ready to route domain

---

## 3-Step Setup

### Step 1: Add Domain in Vercel (1 min)

```
1. Open: https://vercel.com/dashboard
2. Click: 7-days-to-calm project
3. Click: Settings → Domains
4. Type: 7-days-to-calm.elevatedmovements.com
5. Click: Add
6. COPY the CNAME value shown (save it!)
```

**CNAME will look like:** `cname.vercel-dns.com.`

---

### Step 2: Add DNS Record in Cloudflare (1 min)

```
1. Open: https://dash.cloudflare.com
2. Select: elevatedmovements.com
3. Click: DNS (left menu)
4. Click: + Add record
5. Fill in:
   Type: CNAME
   Name: 7-days-to-calm
   Target: [PASTE from Step 1]
   TTL: Auto
   Proxy: DNS only
6. Click: Save
```

---

### Step 3: Wait & Verify (3 min)

```
Wait 5-10 minutes for DNS to propagate

Then:
1. Check Vercel dashboard → domain shows green ✓
2. Visit: https://7-days-to-calm.elevatedmovements.com
3. See your app! 🎉
```

---

## Quick Links

| Step | Link |
|------|------|
| Vercel Domains | https://vercel.com/dashboard → 7-days-to-calm → Settings → Domains |
| Cloudflare DNS | https://dash.cloudflare.com → elevatedmovements.com → DNS |

---

## Done!

Once domain is "Valid" in Vercel, your widget is live at:

🎉 **https://7-days-to-calm.elevatedmovements.com**

Every push to GitHub automatically deploys here!

---

## If Something Goes Wrong

**Domain shows red ✗ in Vercel?**
- Wait another 10 minutes (DNS is slow sometimes)
- Verify CNAME in Cloudflare matches exactly
- Check typos

**Still seeing old Webflow page?**
- Hard refresh: Ctrl+Shift+R
- Clear cache: DevTools → Application → Cache Storage → Clear All
- In Cloudflare: Caching → Purge Cache → Purge Everything

**SSL error?**
- Wait 30 minutes (Vercel needs time to issue cert)
- It'll work automatically, no action needed
