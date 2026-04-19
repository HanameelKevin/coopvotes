# CoopVotes Security Implementation

## Overview
This document describes the comprehensive security measures implemented in the CoopVotes voting system.

## 1. Authentication Security

### Email Domain Validation (STRICT)
- **Rule**: Only `@student.cuk.ac.ke` emails are allowed
- **Validation**: Regex pattern enforces strict domain matching
- **No manual input**: Email must come from OAuth/SSO, no manual email entry

### Registration Number Validation (STRICT)
- **Format**: `C[0-9]{3}/[0-9]{6}/[0-9]{4}` (e.g., `C026/405411/2024`)
- **Regex**: `^C[0-9]{3}/[0-9]{6}/[0-9]{4}$`
- **Immutable**: Registration number cannot be changed after creation
- **Unique**: Database enforces unique constraint

### Login Security
- Rate limiting: 5 attempts per 15 minutes
- Account lockout after 5 failed attempts (2 hours)
- IP tracking for suspicious activity
- Multi-IP login detection

## 2. Double Voting Prevention (MULTI-LAYER)

### Database Level
```javascript
// Compound unique index
voteSchema.index({ voterId: 1, position: 1, department: 1 }, { unique: true });
```
- Makes double voting impossible at database level
- Transaction-based vote creation

### Application Level
- Pre-vote check inside transaction
- Lock user record during vote
- Idempotent endpoints (same request = same result)

### Audit Level
- Every vote attempt logged
- Failed attempts tracked
- Anomaly detection for suspicious patterns

## 3. Vote Encryption (AES-256-GCM)

### Implementation
```javascript
const encryptedVote = encryptVote({
  voterId,
  candidateId,
  position,
  timestamp
});
```

### Storage
```javascript
{
  encryptedData: "...",
  iv: "...",
  authTag: "...",
  algorithm: "aes-256-gcm"
}
```

### Key Management
- Encryption key stored in `VOTE_ENCRYPTION_KEY` environment variable
- 64-character hex string (32 bytes)
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **NEVER hardcode in source code**

## 4. Vote Hash Receipt System (SHA-256)

### Generation
```javascript
const receiptHash = generateVoteReceiptHash(
  userId,
  positionId,
  candidateId,
  timestamp
);
```

### Verification
- Endpoint: `GET /api/vote/verify?hash=XYZ`
- Returns: Vote status without revealing vote choice
- Public endpoint for transparency

### Receipt Format
```json
{
  "receipt": {
    "hash": "a9f3c2...",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "position": "President",
    "department": null
  }
}
```

## 5. Anti-Tampering (Chained Hashes)

### Chain Structure
```javascript
hash_n = SHA-256(vote_data + hash_n-1)
```

### Features
- Each vote links to previous vote's hash
- Blockchain-like integrity chain
- Verification endpoint: `GET /api/vote/verify-chain` (admin only)
- Any modification breaks chain integrity

## 6. Audit Logging System

### Logged Events
- `LOGIN` / `LOGIN_FAILED`
- `LOGOUT`
- `VOTE_CAST` / `VOTE_FAILED`
- `VOTE_VERIFIED`
- `SUSPICIOUS_ACTIVITY`
- `MULTI_IP_LOGIN`
- `RAPID_REQUESTS`
- `RATE_LIMIT_EXCEEDED`

### Log Data
```javascript
{
  userId,
  action,
  details,
  ipAddress,
  userAgent,
  timestamp,
  severity: ['low', 'medium', 'high', 'critical'],
  metadata: { electionId, candidateId, position }
}
```

## 7. Anomaly Detection

### Detected Patterns
| Pattern | Threshold | Severity |
|---------|-----------|----------|
| Multi-IP Login | 2+ IPs in 1 hour | High |
| Rapid Requests | 30+ per minute | Medium |
| Vote Spike | 20+ votes/min per position | High |
| Brute Force | 5+ failed logins/15 min | Critical |
| Multi-Vote from IP | 5+ users/IP/hour | High |

### Response
- Automatic logging with severity
- Critical anomalies block requests
- Admin alerts for suspicious activity

## 8. Data Sanitization

### API Response Rules
- **Never expose**: `regNumber`, internal IDs
- **Mask emails**: `firstname.lastname@domain` → `fi***@domain`
- **Minimal data**: Only return necessary fields

### User Object Sanitization
```javascript
{
  id: user._id,
  email: user.email,  // Only if needed
  department: user.department,
  yearOfStudy: user.yearOfStudy,
  role: user.role,
  hasVoted: user.hasVoted
  // regNumber EXCLUDED
}
```

## 9. Rate Limiting

### Endpoints
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 attempts | 15 min |
| `/api/vote` (POST) | 10 votes | 1 hour |
| `/api/vote/verify` | 10 requests | 1 min |
| General API | 100 requests | 15 min |

## 10. RBAC (Role-Based Access Control)

### Roles
- `student`: Vote, view results
- `aspirant`: Student + view own application
- `admin`: Full access, export results, view audit logs

### Middleware
```javascript
authorize('student')      // Students only
authorize('admin')        // Admins only
authorize('student', 'admin')  // Multiple roles
```

## 11. Production Security Checklist

### Environment Variables
```bash
NODE_ENV=production
VOTE_ENCRYPTION_KEY=<64-char-hex>
JWT_SECRET=<secure-random-string>
COOKIE_SECRET=<secure-random-string>
MONGODB_URI=<secure-connection-string>
```

### HTTPS Configuration
- TLS 1.2+ required
- HSTS enabled (1 year)
- Secure cookies in production
- Force HTTPS redirect

### Database Security
- MongoDB authentication enabled
- Network access restricted
- Regular backups
- Encrypted at rest (if supported)

### Deployment Security
- Use Cloudflare/AWS WAF
- DDoS protection enabled
- Load balancer with SSL termination
- Container security scanning

## 12. API Endpoints Security Matrix

| Endpoint | Auth | Rate Limit | Role | Notes |
|----------|------|------------|------|-------|
| POST /api/auth/login | No | Strict (5/15m) | Any | - |
| GET /api/auth/me | Yes | General | Any | Sanitized data |
| POST /api/vote | Yes | Strict (10/h) | Student | Encrypted |
| GET /api/vote/verify | No | Moderate | Any | Public |
| GET /api/vote/results | No | General | Any | Sanitized |
| GET /api/vote/verify-chain | Yes | General | Admin | Integrity check |

## 13. Testing Security

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Verify Vote Chain
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/vote/verify-chain
```

### Test Rate Limiting
```bash
# Should fail after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@student.cuk.ac.ke","regNumber":"C026/000000/2024"}'
done
```

## 14. Incident Response

### Suspicious Activity Detected
1. Check audit logs: `GET /api/admin/audit-logs`
2. Review user activity
3. Block IP if necessary
4. Notify security team

### Vote Chain Broken
1. Stop election immediately
2. Investigate tampering
3. Restore from backup if needed
4. Report incident

## 15. Compliance

### Data Protection
- GDPR compliant data handling
- User data deletion supported
- Audit log retention: 90 days

### Transparency
- Public vote verification
- Immutable vote records
- Open source (optional)

---

**Last Updated**: 2024
**Version**: 2.0.0-Secure
**Security Level**: Production-Grade
