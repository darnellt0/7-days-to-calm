# Shria Agent – Stub Package

Generated: 2025-10-15T00:39:05.894576Z

This repo provides a **minimal, production-style skeleton** for your mindfulness agent:
- Tool handlers: `setChallengeDay`, `trackEvent`, `setReminder`
- In-memory store with a clean interface you can swap for a DB later
- Simple routing to map user intents to flows (2/5/8, presets, challenge)
- Express server with endpoints so you can integration-test quickly
- Vitest unit tests


## Quick Start

```bash
# 1) Install
npm install

# 2) Run dev
npm run dev

# 3) Hit the sample endpoints in another shell
curl -X POST http://localhost:4000/api/tools/setChallengeDay -H "Content-Type: application/json" -d '{"day":2}'
curl -X POST http://localhost:4000/api/tools/trackEvent -H "Content-Type: application/json" -d '{"name":"em_day_complete","payload":{"day":1}}'
curl -X POST http://localhost:4000/api/tools/setReminder -H "Content-Type: application/json" -d '{"time":"13:00","label":"7 Days to Calm"}'
curl http://localhost:4000/convai/signed-url?challenge_day=1
```

> Store is in-memory by default. Replace it with Redis/Postgres later by implementing the same interface in `src/store/store.ts` and switching the import in `src/server.ts`.

## Webflow Embed Snippet

1. Deploy with `CORS_ALLOWLIST` set to your production domains.
2. Add an Embed element in Webflow with:

```html
<div id="em-convai"></div>
<script>
  (function initEM(){
    function ready(fn){document.readyState!=="loading"?fn():document.addEventListener("DOMContentLoaded",fn);}
    ready(async()=>{
      const host=document.querySelector("#em-convai");
      if(!host){console.error("[EM] missing #em-convai");return;}
      const res=await fetch("https://seven-days-to-calm.onrender.com/convai/signed-url?challenge_day=1",{credentials:"omit"});
      if(!res.ok){console.error("[EM] signed-url error",res.status);return;}
      const {ok,url}=await res.json();
      if(!ok||!url){console.error("[EM] signed-url bad payload");return;}
      const iframe=document.createElement("iframe");
      iframe.src=`/widget.html?ws=${encodeURIComponent(url)}`;
      iframe.style.cssText="width:360px;height:560px;border:0;border-radius:12px;";
      host.appendChild(iframe);
      console.log("[EM] widget ready");
    });
  })();
</script>
```

Verify in the browser console:

```js
fetch("https://seven-days-to-calm.onrender.com/convai/signed-url?challenge_day=1")
  .then(r => r.json())
  .then(console.log);
```

You should see `{ ok: true, url, expiresAt, challenge_day: 1 }` and Render logs with no 500 errors.

## Structure

```
src/
  server.ts                # Express app wiring routes + tools
  routes/sessionRouter.ts  # Intent → flow decision helper (stub)
  tools/
    setChallengeDay.ts
    trackEvent.ts
    setReminder.ts
  store/
    store.ts               # Store interface
    memoryStore.ts         # Default in-memory store
    types.ts               # Shared types
  voice/
    elevenlabsClient.ts    # Placeholder client (pseudo)
  prompt/
    system_prompt.txt      # Full integrated system prompt
tests/
  tools.test.ts
```
