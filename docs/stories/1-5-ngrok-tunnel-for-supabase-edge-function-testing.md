# Story 1.5: ngrok Tunnel for Supabase Edge Function Testing (Optional)

**Status:** drafted  
**Epic:** 1 - Foundation & Infrastructure (Local Development)  
**Created:** November 12, 2025  
**Story Key:** 1-5-ngrok-tunnel-for-supabase-edge-function-testing

---

## Story

As a **backend developer**,  
I want **a public URL tunnel to my local Windows service**,  
So that **Supabase edge functions (running on cloud) can call my local development service for testing**.

---

## Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | ngrok installed on Mac or Windows | `ngrok version` returns version number |
| 2 | ngrok tunnel created to Windows service (vms.tnm.local:8000) | `ngrok http vms.tnm.local:8000` returns public HTTPS URL |
| 3 | Public ngrok URL accessible from internet | `curl https://abc123.ngrok.io/health` from external network succeeds |
| 4 | Supabase edge function configured with ngrok URL | Edge function environment variable `MT5_SERVICE_URL` set to ngrok URL |
| 5 | Edge function successfully calls local service through tunnel | Test edge function invocation returns data from local Windows service |
| 6 | ngrok dashboard shows request logs | Visit http://localhost:4040 shows incoming requests |
| 7 | (Optional) Alternative approach documented | Mock edge function responses for local frontend testing without ngrok |

---

## Tasks / Subtasks

### Task 1: ngrok Installation and Setup
- [ ] **1.1** Sign up for free ngrok account at https://ngrok.com/signup
- [ ] **1.2** Get ngrok auth token from dashboard
- [ ] **1.3** Install ngrok:
  - **Mac:** `brew install ngrok/ngrok/ngrok`
  - **Windows:** `choco install ngrok -y`
- [ ] **1.4** Verify installation:
  ```bash
  ngrok version
  # Expected: ngrok version 3.x.x
  ```
- [ ] **1.5** Configure ngrok with auth token:
  ```bash
  ngrok config add-authtoken YOUR_AUTH_TOKEN
  ```
- [ ] **1.6** Test ngrok configuration:
  ```bash
  ngrok config check
  ```

### Task 2: Create Tunnel to Local Windows Service
- [ ] **2.1** Ensure FastAPI service is running on Windows (vms.tnm.local:8000)
- [ ] **2.2** Start ngrok tunnel from Mac or Windows:
  ```bash
  # Can run from either Mac or Windows on same network
  ngrok http vms.tnm.local:8000
  ```
- [ ] **2.3** Note the public HTTPS URL from output:
  ```
  Forwarding: https://abc123-xyz.ngrok-free.app -> http://vms.tnm.local:8000
  ```
- [ ] **2.4** Document the ngrok URL in `.env` file or notes (it changes on restart!)
- [ ] **2.5** Keep ngrok terminal window open (tunnel stays active while running)
- [ ] **2.6** Access ngrok web interface at http://localhost:4040 for request inspection

### Task 3: Test Tunnel Connectivity
- [ ] **3.1** Test health endpoint from external network (use phone data or different network):
  ```bash
  curl https://your-ngrok-url.ngrok-free.app/health
  # Expected: {"status":"healthy", ...}
  ```
- [ ] **3.2** Test from ngrok dashboard by clicking "Replay" on a request
- [ ] **3.3** Verify requests appear in ngrok web interface (http://localhost:4040)
- [ ] **3.4** Check FastAPI service logs show incoming requests from ngrok
- [ ] **3.5** Test CORS works through ngrok:
  ```javascript
  // From browser console on any website
  fetch('https://your-ngrok-url.ngrok-free.app/health')
    .then(r => r.json())
    .then(console.log);
  ```

### Task 4: Configure Supabase Edge Functions (If Testing Full Integration)
- [ ] **4.1** Update Supabase edge function environment variables:
  ```bash
  # In Supabase dashboard or via CLI
  supabase secrets set MT5_SERVICE_URL=https://your-ngrok-url.ngrok-free.app
  ```
- [ ] **4.2** Restart edge functions to pick up new environment variable
- [ ] **4.3** Test edge function that calls MT5 service:
  ```bash
  # From browser console or Postman
  # Call your edge function endpoint
  ```
- [ ] **4.4** Verify edge function successfully reaches local Windows service
- [ ] **4.5** Check ngrok dashboard shows requests from Supabase IPs

### Task 5: Alternative Approach - Mock Edge Functions (Optional)
- [ ] **5.1** If ngrok is not needed, document mock approach:
  - Create mock responses in frontend for edge function calls
  - Test frontend → Windows service directly (vms.tnm.local:8000)
  - Skip Supabase integration testing until VPS deployment
- [ ] **5.2** Add mock data files to `src/mocks/` directory
- [ ] **5.3** Update frontend to use mock data when `VITE_USE_MOCKS=true`
- [ ] **5.4** Document when to use ngrok vs mocks in LOCAL-DEVELOPMENT-GUIDE.md

### Task 6: Documentation and Troubleshooting
- [ ] **6.1** Add ngrok setup section to LOCAL-DEVELOPMENT-GUIDE.md
- [ ] **6.2** Document common issues:
  - **Issue:** ngrok URL changes on restart → **Solution:** Update edge function env vars
  - **Issue:** Tunnel timeout → **Solution:** ngrok free tier has 2-hour session limit
  - **Issue:** CORS errors through ngrok → **Solution:** Ensure CORS middleware allows ngrok domain
  - **Issue:** Slow responses → **Solution:** ngrok adds latency, use direct IP when possible
- [ ] **6.3** Document ngrok dashboard features (request inspection, replay)
- [ ] **6.4** Note ngrok URL in project documentation for team reference

---

## Dev Notes

### When to Use ngrok

**Use ngrok IF:**
- Testing Supabase edge functions that need to call MT5 service
- Testing webhooks or callbacks from external services
- Demoing local development to remote team members
- Testing OAuth flows that require public callback URLs

**Skip ngrok IF:**
- Only testing frontend → Windows service communication (use vms.tnm.local:8000 directly)
- Not integrating with Supabase edge functions yet
- Working on Epic 1-3 stories (foundation and core MT5 logic)

### Cost Optimization

**ngrok Free Tier:**
- ✅ 1 online ngrok process
- ✅ 40 connections/minute
- ✅ HTTPS tunnel
- ⚠️ URL changes on restart
- ⚠️ 2-hour session timeout (reconnect required)

**ngrok Paid ($8/month):**
- Static domain (no URL changes)
- Longer session timeouts
- More simultaneous tunnels
- **Not needed for development** - only consider if URL stability is critical

**Alternative: Cloudflare Tunnel (Free, More Stable):**
- Static subdomain
- No session timeouts
- Better performance
- More setup complexity
- Consider if ngrok limitations become blocker

### Network Architecture with ngrok

```
┌─────────────────────┐
│  Supabase Cloud     │
│  (Edge Functions)   │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│  ngrok Cloud        │
│  abc123.ngrok.io    │
└──────────┬──────────┘
           │ Tunnel
           ▼
┌─────────────────────┐         ┌──────────────────┐
│  Mac/Windows        │         │  Windows PC      │
│  (ngrok client)     │────────▶│  vms.tnm.local   │
│  localhost:4040     │  HTTP   │  :8000           │
└─────────────────────┘         └──────────────────┘
```

### Security Considerations

- ⚠️ **Never expose production credentials through ngrok**
- ⚠️ **Use demo/test MT5 accounts only**
- ⚠️ **ngrok URLs are public** - anyone with URL can access
- ✅ Keep `X-API-Key` authentication enabled
- ✅ Use ngrok's built-in authentication (paid feature) for extra security
- ✅ Monitor ngrok dashboard for unexpected traffic

### Testing Strategy

**Phase 1: ngrok Setup (This Story)**
- Install and configure ngrok
- Create tunnel to local service
- Verify public accessibility

**Phase 2: Supabase Integration (Epic 4)**
- Configure edge functions with ngrok URL
- Test full flow: Frontend → Supabase → ngrok → Windows MT5 service
- Validate data synchronization

**Phase 3: VPS Migration (Week 4)**
- Replace ngrok with real VPS public IP
- Update all edge function environment variables
- Remove ngrok dependency

### Project Structure Notes

**Files to Update:**
- `docs/LOCAL-DEVELOPMENT-GUIDE.md` - Add ngrok setup section
- `.env.local` (frontend) - Optional: `VITE_MT5_SERVICE_URL=https://ngrok-url`
- Supabase edge functions - Update `MT5_SERVICE_URL` secret

**No code changes needed** - ngrok is infrastructure only.

### References

- **[Source: docs/epics.md#Story-1.5]** - Original story requirements
- **[Source: docs/LOCAL-DEVELOPMENT-GUIDE.md]** - Local development workflow
- **[Source: https://ngrok.com/docs]** - ngrok documentation
- **[Source: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/]** - Cloudflare Tunnel alternative

---

## Dev Agent Record

### Context Reference
**Story Context XML:** `docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.context.xml`

MCP-enhanced context includes:
- Sequential-thinking analysis of ngrok use cases (when needed vs optional)
- Alternative approach documentation (mock edge functions instead of ngrok)
- Note: OPTIONAL story - can be skipped if not testing full Supabase integration locally

### Agent Model Used
_To be filled by Dev Agent during implementation_

### Debug Log References
_To be filled by Dev Agent if issues encountered_

### Completion Notes List
_To be filled by Dev Agent upon story completion:_
- [ ] ngrok version installed
- [ ] ngrok auth token configured
- [ ] Public tunnel URL (document before restart!)
- [ ] Supabase edge functions updated (yes/no)
- [ ] Alternative mock approach used (yes/no)
- [ ] Request logs verified in ngrok dashboard
- [ ] Common issues tested and documented
- [ ] Recommendations for Story 1.6

### File List
_To be filled by Dev Agent - files created/modified:_
- MODIFIED: `docs/LOCAL-DEVELOPMENT-GUIDE.md` (add ngrok section)
- NEW: (Optional) `src/mocks/edge-function-responses.ts` (if using mock approach)
- MODIFIED: (Optional) Supabase edge function environment variables

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-12 | 1.0 | Initial draft created by create-story workflow | AF (via BMad Master) |
