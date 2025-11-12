# Security Documentation

## Overview
This document outlines security measures, encryption policies, incident response procedures, and best practices for the Trade'n More application.

## Table of Contents
1. [Credential Security](#credential-security)
2. [Encryption Standards](#encryption-standards)
3. [Security Monitoring](#security-monitoring)
4. [Incident Response](#incident-response)
5. [Access Control](#access-control)
6. [Security Headers](#security-headers)

---

## Credential Security

### Encryption Requirements
- **All trading account credentials MUST be encrypted** before storage
- Use AES-256-GCM encryption for credential storage
- Encryption keys must be stored separately from encrypted data
- Each account integration must have a unique `encryption_key_id`

### Credential Storage Flow
```typescript
// ✅ Correct: Server-side encryption
await supabase.functions.invoke('connect-mt5-account', {
  body: { credentials, accountId }
});

// ❌ Wrong: Client-side storage of credentials
localStorage.setItem('credentials', JSON.stringify(credentials));
```

### Audit Logging
Every credential access is logged:
- **Read Operations**: When credentials are decrypted/accessed
- **Write Operations**: When new credentials are stored
- **Delete Operations**: When credentials are removed
- **Failed Access**: Unauthorized access attempts

### Monitoring
```typescript
import { credentialSecurity } from '@/utils/credential-security';

// Verify encryption before use
const isEncrypted = await credentialSecurity.verifyEncryption(accountId);

// Log credential access
await credentialSecurity.logCredentialAccess(accountId, 'read', userId);

// Detect suspicious patterns
const isSuspicious = credentialSecurity.detectSuspiciousActivity(userId);
```

---

## Encryption Standards

### Key Management
- **Rotation Schedule**: Encryption keys rotated every 90 days
- **Key Storage**: Keys stored in Supabase secrets (never in code)
- **Key Access**: Only admin roles can access encryption keys
- **Backup Keys**: Encrypted backups of keys stored separately

### Encryption Key Rotation Process
1. **Generate New Key**
   ```sql
   -- Generate new encryption key
   INSERT INTO encryption_keys (key_version, created_at)
   VALUES ('v2', NOW());
   ```

2. **Re-encrypt Existing Data**
   - Decrypt with old key
   - Encrypt with new key
   - Update `encryption_key_id`
   - Verify encryption

3. **Deprecate Old Key**
   - Mark old key as deprecated
   - Keep for 30 days for rollback
   - Securely delete after grace period

---

## Security Monitoring

### Real-Time Monitoring
The application monitors:
- **Failed Login Attempts**: >3 failures in 5 minutes
- **Credential Access**: Unusual patterns (>10 accesses/5min)
- **API Rate Limits**: Exceeded request limits
- **Suspicious Form Submissions**: Injection attempts

### Security Events Logged
All events are stored in the `security_events` table:

| Event Type | Severity | Action Required |
|-----------|----------|----------------|
| `failed_login` | Medium | Monitor for brute force |
| `unauthorized_access` | High | Immediate investigation |
| `unencrypted_credentials_detected` | Critical | Fix immediately |
| `suspicious_form_submission` | Medium | Review and block if needed |
| `rate_limit_exceeded` | Low | May indicate abuse |

### Viewing Security Events
```typescript
// Admin dashboard
const { data } = await supabase
  .from('security_events')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);
```

Access the monitoring dashboard at `/admin/performance`

---

## Incident Response

### Security Incident Classifications

#### P0 - Critical (Immediate Response)
- Data breach or unauthorized data access
- System compromise
- Unencrypted credentials in production

**Response Time**: < 15 minutes
**Actions**:
1. Disable affected systems immediately
2. Notify security team
3. Begin incident investigation
4. Document everything

#### P1 - High (1-hour Response)
- Repeated failed authentication
- Suspicious credential access patterns
- SQL injection attempts

**Response Time**: < 1 hour
**Actions**:
1. Investigate logs
2. Block suspicious IPs
3. Review access patterns
4. Update security rules

#### P2 - Medium (24-hour Response)
- Form submission anomalies
- Rate limit violations
- Client-side errors

**Response Time**: < 24 hours
**Actions**:
1. Review logs
2. Update monitoring rules
3. Document patterns

### Incident Response Checklist

**Immediate (0-15 minutes)**
- [ ] Identify affected systems
- [ ] Isolate compromised components
- [ ] Preserve logs and evidence
- [ ] Notify team lead

**Short-term (15min-4 hours)**
- [ ] Complete root cause analysis
- [ ] Implement immediate fix
- [ ] Verify no ongoing breach
- [ ] Document timeline

**Long-term (4-24 hours)**
- [ ] Implement permanent fix
- [ ] Update security policies
- [ ] Review similar vulnerabilities
- [ ] Post-mortem report

---

## Access Control

### Role-Based Access Control (RBAC)

#### Admin Role
- Full access to all features
- View security events
- Manage user roles
- Access credential logs

#### User Role
- Access own trading accounts
- View own data only
- Cannot access admin features

### Implementing Admin Checks

**✅ Correct: Server-side validation**
```typescript
// In edge function
const { data: { user } } = await supabase.auth.getUser();
const isAdmin = await hasRole(user.id, 'admin');

if (!isAdmin) {
  return new Response('Unauthorized', { status: 403 });
}
```

**❌ Wrong: Client-side checks**
```typescript
// Never do this!
const isAdmin = localStorage.getItem('isAdmin') === 'true';
```

### Row-Level Security (RLS) Policies

All tables have RLS enabled with policies:

```sql
-- Example: Users can only see their own trading accounts
CREATE POLICY "Users can view their own accounts"
ON trading_accounts FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all security events
CREATE POLICY "Admins can view security events"
ON security_events FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

---

## Security Headers

### Production Headers Configuration

**Location**: `public/_headers`

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' https://s3.tradingview.com ...
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
```

### Testing Security Headers

**Tools**:
- [Security Headers Checker](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com)

**Expected Grade**: A+

### Updating CSP Hashes

When adding inline scripts or styles:

1. **Get the hash** from browser console error
2. **Add to CSP** in `public/_headers`:
   ```
   style-src 'self' 'sha256-NEW_HASH_HERE'
   ```
3. **Test** on all browsers
4. **Deploy** and verify

---

## Security Best Practices

### Development
- ✅ Use environment variables for secrets
- ✅ Never commit `.env` files
- ✅ Use `prodLogger` instead of `console.log`
- ✅ Validate all user inputs
- ✅ Use parameterized queries

### Production
- ✅ Enable all security headers
- ✅ Use HTTPS only
- ✅ Implement rate limiting
- ✅ Monitor security events
- ✅ Regular security audits

### Code Review Checklist
- [ ] No hardcoded credentials
- [ ] All inputs validated
- [ ] RLS policies reviewed
- [ ] Security logging implemented
- [ ] Error messages don't leak info
- [ ] Admin checks server-side only

---

## Contact

**Security Issues**: Report immediately to security team
**Questions**: Refer to this document first
**Updates**: Review quarterly and after incidents

---

*Last Updated: 2025-10-06*
*Next Review: 2025-01-06*
