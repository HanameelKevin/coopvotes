# CoopVotes API - Quick Reference Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Postman installed
- CoopVotes API server running on port 5000
- Valid student credentials (@student.cuk.ac.ke email)

### Step 1: Import Files to Postman

In Postman:
1. **Import → CoopVotes-API.postman_collection.json**
2. **Settings ⚙️ → Environments → Import → CoopVotes-Development.postman_environment.json**
3. **Select Environment** (top right dropdown) → "CoopVotes Development"

### Step 2: Test Health Check

```
Collection → Health & Status → Health Check → Send
```

Expected Response:
```json
{
  "success": true,
  "message": "CoopVotes API is running",
  "version": "2.0.0-secure"
}
```

### Step 3: Test Authentication

**Request 1: Login**
```
Collection → Authentication → Login (Step 1) → Send
```

Body:
```json
{
  "email": "your_email@student.cuk.ac.ke",
  "regNumber": "C026/405411/2024"
}
```

Response:
```json
{
  "success": true,
  "userId": "xyz123...",
  "message": "OTP sent to email"
}
```

**SAVE:** Copy `userId` from response

**Request 2: Verify OTP**

Check your email for OTP (6 digits)

```
Collection → Authentication → Verify OTP (Step 2) → Send
```

Body (use values from login):
```json
{
  "userId": "xyz123...",  // From login response
  "otp": "123456"  // From your email
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

**SAVE:** Copy `token` to environment variable `{{token}}`

### Step 4: Get Current User

```
Collection → Authentication → Get Current User → Send
```

Should work now because token is set in environment!

## 📋 Common Test Scenarios

### Scenario 1: View All Candidates
```
GET /api/candidates
```
No auth required - Returns list of all candidates

### Scenario 2: Cast a Vote

First, get a candidate ID from candidates list, then:

```
POST /api/vote
Authorization: Bearer {{token}}

Body:
{
  "candidateId": "copy_from_candidates_list",
  "position": "President"
}
```

Response includes receipt for verification

### Scenario 3: Verify Your Vote
```
GET /api/vote/status
Authorization: Bearer {{token}}
```

Shows your vote receipt and encrypted hash

### Scenario 4: View Results
```
GET /api/vote/results
Authorization: Bearer {{token}}
```

Returns voting results (only accessible after voting)

## 🔐 Environment Variables Cheat Sheet

After logging in, Postman automatically uses these variables in all requests:

| Variable | Purpose | Where Used |
|----------|---------|-----------|
| `{{base_url}}` | API base URL | All requests |
| `{{token}}` | JWT token | All protected requests |
| `{{userId}}` | Current user ID | Some requests |
| `{{candidateId}}` | Candidate ID | Candidate operations |

## ⚡ Admin Operations

If your account has admin role:

### Get System Stats
```
GET /api/admin/stats
Authorization: Bearer {{token}}
```

### Get Audit Logs
```
GET /api/admin/audit-logs?limit=100&page=1
Authorization: Bearer {{token}}
```

### Start an Election
```
POST /api/election/start
Authorization: Bearer {{token}}

Body:
{
  "name": "2024 Elections",
  "year": 2024,
  "positions": ["President", "Congress Person"]
}
```

### View Election Results
```
GET /api/vote/results
Authorization: Bearer {{token}}
```

## 🛡️ Request Headers

All authenticated requests automatically include:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

## 💾 How to Save Values from Responses

In Postman, use **Tests** tab to save response values:

```javascript
// Save token to environment
pm.environment.set("token", pm.response.json().token);

// Save userId
pm.environment.set("userId", pm.response.json().userId);

// Save candidateId
pm.environment.set("candidateId", pm.response.json()._id);
```

The collection includes these automatically! ✅

## 📊 Full API Map

```
Authentication
├─ POST /api/auth/login → Get OTP
├─ POST /api/auth/verify-otp → Get Token
├─ GET /api/auth/me → User Info
├─ GET /api/auth/election-status → Election Status
└─ POST /api/auth/logout → Logout

Candidates
├─ GET /api/candidates → All candidates (public)
├─ GET /api/candidates/:id → Single candidate (public)
├─ GET /api/candidates/department/:dept → By department (public)
├─ POST /api/candidates → Create (admin)
├─ PUT /api/candidates/:id → Update (admin)
├─ PATCH /api/candidates/:id/offlineVotes → Add votes (admin)
└─ DELETE /api/candidates/:id → Delete (admin)

Voting
├─ POST /api/vote → Cast vote
├─ GET /api/vote/status → Your vote status
├─ GET /api/vote/results → Results (after voting)
├─ GET /api/vote/verify?receipt=xxx → Public verify
├─ GET /api/vote/verify-chain → Verify chain (admin)
├─ GET /api/vote/results/export → CSV export (admin)
└─ GET /api/vote/results/export/pdf → PDF export (admin)

Election
├─ GET /api/election → Current election (public)
├─ POST /api/election/start → Start (admin)
├─ POST /api/election/end → End (admin)
├─ GET /api/election/history → History (admin)
├─ GET /api/election/:id/stats → Stats (admin)
├─ PUT /api/election/:id → Update (admin)
└─ DELETE /api/election/:id → Delete (admin)

Admin
├─ GET /api/admin/audit-logs → System logs
├─ GET /api/admin/security/alerts → Security alerts
├─ GET /api/admin/stats → System stats
├─ GET /api/admin/votes-over-time → Analytics
├─ GET /api/admin/votes/:id → Vote details
└─ POST /api/admin/logout → Force user logout
```

## ✅ Testing Checklist

- [ ] Health check responds
- [ ] Can login with student email
- [ ] Receive OTP in email
- [ ] Can verify OTP and get token
- [ ] Can get current user info
- [ ] Can view all candidates
- [ ] Can cast a vote
- [ ] Can verify vote status
- [ ] Can view results after voting
- [ ] Can verify vote by receipt number

## 🚢 For Vercel Deployment

1. Switch environment to "CoopVotes Production"
2. Update `base_url` to your Vercel domain
3. Test health check on production
4. Re-authenticate with production credentials
5. Run full test suite

## 📝 Notes

- Each request has detailed descriptions
- Tests tab automatically extracts and saves values
- Rate limiting may apply to repeated requests
- Votes are encrypted and cannot be modified
- All admin operations logged in audit trail

---

**Need Help?** See [POSTMAN_SETUP_GUIDE.md](./POSTMAN_SETUP_GUIDE.md) for detailed instructions.
