# Story 5.5: Frontend Environment Configuration

**Epic**: Epic 5 - TNM Pro Integration  
**Status**: ✅ Complete  
**Assignee**: Development Team  
**Sprint**: Current

## User Story
As a developer, I need a robust environment configuration system so that I can reliably configure the frontend for different environments (local, dev, production) and ensure all required environment variables are present before deployment.

## Acceptance Criteria
- [x] Local `.env` template with placeholder values documented
- [x] Production environment variables documented in deployment guide
- [x] Configuration module created for accessing env vars in code
- [x] Environment variables validated before build process
- [x] Documentation updated in LOCAL-DEVELOPMENT-GUIDE.md
- [x] Build process includes pre-build validation

## Technical Implementation

### Environment Files Created/Modified

#### 1. `.env` (Local Development - Gitignored)
- Supabase configuration (URL, anon key, project ID)
- MT5 service URLs (HTTP and WebSocket)
- Feature flags (REALTIME, MT5_WEBSOCKET)
- Note: Contains actual credentials, not committed to git

#### 2. `env.example` (Template - Committed)
```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"

# MT5 Service Configuration
VITE_MT5_SERVICE_URL="https://your-ngrok-subdomain.ngrok-free.app"
VITE_MT5_SERVICE_WS="wss://your-ngrok-subdomain.ngrok-free.app"

# Feature Flags
VITE_ENABLE_REALTIME="true"
VITE_ENABLE_MT5_WEBSOCKET="false"
```

#### 3. `scripts/check-env.js` (Validation Script)
- Parses .env file manually (handles quoted values, Windows line endings)
- Validates required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MT5_SERVICE_URL
- Checks recommended variables: VITE_SUPABASE_PROJECT_ID, VITE_ENABLE_REALTIME, VITE_MT5_SERVICE_WS
- Provides helpful error messages with remediation steps
- Exits with code 0 (success) or 1 (failure)

#### 4. `src/config/index.ts` (Configuration Module)
```typescript
// Centralized configuration access
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
};

export const MT5_CONFIG = {
  apiUrl: import.meta.env.VITE_MT5_SERVICE_URL,
  wsUrl: import.meta.env.VITE_MT5_SERVICE_WS,
};

export const FEATURE_FLAGS = {
  enableRealtime: import.meta.env.VITE_ENABLE_REALTIME === 'true',
  enableMT5WebSocket: import.meta.env.VITE_ENABLE_MT5_WEBSOCKET === 'true',
};

// Helper functions
export function getMT5ApiUrl(path: string): string
export function getMT5WebSocketUrl(path: string): string
export function validateConfig(): void
```

### Build Process Integration

#### Updated `package.json` Scripts
```json
{
  "scripts": {
    "build": "node scripts/check-env.js && vite build",
    "build:dev": "node scripts/check-env.js && vite build --mode development",
    "check-env": "node scripts/check-env.js"
  }
}
```

### Documentation Updates

#### LOCAL-DEVELOPMENT-GUIDE.md
Added comprehensive "Environment Configuration (Story 5.5)" section with:
- Required and recommended variables table
- Step-by-step setup instructions
- Getting Supabase credentials from dashboard
- MT5 service URL configuration options (ngrok vs direct network)
- Validation commands and expected output
- Syncing environment with backend configuration
- Troubleshooting common issues

## Environment Variables

### Required (Build will fail if missing)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUz...` |
| `VITE_MT5_SERVICE_URL` | MT5 service base URL | `https://abc.ngrok-free.app` |

### Recommended (Optional but recommended)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | From URL |
| `VITE_ENABLE_REALTIME` | Enable Supabase Realtime | `true` |
| `VITE_MT5_SERVICE_WS` | MT5 WebSocket URL | HTTP URL with wss:// |

## Testing

### Manual Testing Performed
1. ✅ Run `npm run check-env` - validates environment variables
2. ✅ Run `npm run build:dev` - builds with validation
3. ✅ Test with missing required var - build fails with helpful error
4. ✅ Test with all vars present - build succeeds
5. ✅ Test quote handling - correctly parses `KEY="value"` format
6. ✅ Test Windows line endings - handles `\r\n` correctly
7. ✅ Test config module import - TypeScript types work correctly

### Validation Script Tests
```bash
# Test 1: All variables present
$ npm run check-env
✅ All environment variables validated successfully!

# Test 2: Missing required variable
$ npm run check-env
❌ VITE_MT5_SERVICE_URL - MISSING
❌ Validation FAILED - Missing required variables

# Test 3: Build with validation
$ npm run build:dev
📁 Reading environment from: D:\tnm\tnm_concept\.env
📊 Found 8 variables in .env file
✅ All environment variables validated successfully!
vite v5.4.19 building for development...
✓ 3812 modules transformed.
✓ built in 16.24s
```

## Developer Notes

### Key Design Decisions
1. **Manual .env parsing**: Used custom parser instead of dotenv to avoid runtime dependencies and have full control over validation
2. **Regex pattern**: Used `/^([A-Z_][A-Z0-9_]*)=(.+)$/` to match variable names with digits (e.g., MT5)
3. **Quote handling**: Removes surrounding quotes from values (`"value"` → `value`)
4. **Build-time validation**: Runs before every build to catch configuration issues early
5. **Helpful error messages**: Provides actionable guidance when validation fails

### Common Issues Resolved
1. **Regex not matching MT5**: Original pattern `[A-Z_]+` didn't include digits - fixed with `[A-Z_][A-Z0-9_]*`
2. **Windows line endings**: Added `/\r?\n/` regex to handle both Unix and Windows line breaks
3. **Quoted values**: Parser strips surrounding quotes from values for consistency

## Dependencies
- Node.js (built-in fs, path modules)
- Vite (import.meta.env for runtime access)

## Related Stories
- Story 5.1: AccountLinkForm re-enabled
- Story 5.2: auth.ts state management
- Story 5.3: LinkedAccountsList with Realtime
- Story 5.4: AIHub with live data integration
- Story 6.1: WebSocket implementation (will use VITE_ENABLE_MT5_WEBSOCKET flag)

## Completion Checklist
- [x] All acceptance criteria met
- [x] Environment files created/updated
- [x] Validation script implemented and tested
- [x] Configuration module created
- [x] Build process updated
- [x] Documentation updated
- [x] Manual testing completed
- [x] Story marked complete in sprint status

## Time Tracking
- Estimated: 2 hours
- Actual: 2.5 hours (including debugging regex and quote handling)
- Story Points: 3
