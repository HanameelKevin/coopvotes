# CoopVotes API - Vercel Deployment Checklist

## Pre-Deployment Requirements

### 1. Environment Variables

Ensure all these are set in your Vercel project:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=your_production_database_uri
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.vercel.app
VOTE_ENCRYPTION_KEY=your_encryption_key
COOKIE_SECRET=your_cookie_secret
```

### 2. Verify All Environment Variables

In Vercel Dashboard:
1. Go to **Settings → Environment Variables**
2. Verify all variables listed above are present
3. Check that secrets are marked as "Sensitive"
4. Do NOT expose sensitive keys in version control

### 3. MongoDB Connection

- [ ] Ensure MongoDB Atlas is accessible from Vercel
- [ ] Whitelist Vercel IPs in MongoDB Network Access
- [ ] Test connection string locally first
- [ ] Verify database has all collections: Users, Candidates, Elections, Votes, AuditLogs

### 4. API Security Headers

The API includes:
- [ ] CORS configured for your frontend domain
- [ ] Helmet security headers enabled
- [ ] HTTPS enforcement (automatic on Vercel)
- [ ] Rate limiting active
- [ ] Authentication middleware required

## Deployment Steps

### Step 1: Push to Git

```bash
git add .
git commit -m "Add CoopVotes API for production"
git push origin main
```

### Step 2: Configure Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Select **Framework**: Node.js
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm start` or `npm run dev`
6. Add all **Environment Variables**
7. Click **Deploy**

### Step 3: Wait for Deployment

- Initial build: 2-5 minutes
- Check deployment logs for errors
- Note your deployment URL (e.g., `https://coopvotes-api.vercel.app`)

### Step 4: Test Deployment

#### Test 1: Health Check
```
GET https://your-deployment-url/api/health
```

Expected: `{"success": true, "message": "CoopVotes API is running"}`

#### Test 2: Security Status
```
GET https://your-deployment-url/api/security/status
```

Expected: Security features list

#### Test 3: Get Election (Public)
```
GET https://your-deployment-url/api/election
```

Expected: Current election or empty object

#### Test 4: Authentication Flow
```
POST https://your-deployment-url/api/auth/login
Body:
{
  "email": "student@student.cuk.ac.ke",
  "regNumber": "C026/405411/2024"
}
```

Expected: OTP sent message

## Post-Deployment Verification

### In Postman

1. Import **CoopVotes-Production.postman_environment.json**
2. Update `base_url` to your Vercel URL:
   ```
   https://your-deployment-url
   ```
3. Replace all placeholder values:
   ```
   {{REPLACE_WITH_PRODUCTION_JWT_SECRET}} → actual secret
   {{REPLACE_WITH_PRODUCTION_MONGODB_URI}} → actual URI
   ```
4. Run health check request
5. Test full authentication flow

### Using cURL

```bash
# Health check
curl https://your-deployment-url/api/health

# Login
curl -X POST https://your-deployment-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@student.cuk.ac.ke",
    "regNumber": "C026/405411/2024"
  }'

# Get candidates
curl https://your-deployment-url/api/candidates
```

## Vercel-Specific Configuration

### Build Settings

Create `vercel.json` in root directory:

```json
{
  "buildCommand": "npm install",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nodejs",
  "outputDirectory": "server"
}
```

### Enable Preview Deployments

1. Go to **Project Settings**
2. Enable **Preview Deployments**
3. This allows testing before production

### Set Production Domain

1. Go to **Settings → Domains**
2. Add custom domain if available
3. Configure DNS if needed

## Monitoring & Logs

### View Deployment Logs

1. Go to your Vercel project
2. Click on latest deployment
3. View **Build Logs** and **Runtime Logs**
4. Check for errors or warnings

### Enable Error Tracking

Set in environment:
```
SENTRY_DSN=your_sentry_dsn (optional)
```

### Monitor Database

- [ ] Check MongoDB Atlas logs
- [ ] Monitor connection pool usage
- [ ] Verify no query timeouts
- [ ] Track database storage usage

## Frontend Configuration

### Update API URL

In your frontend (e.g., `client/src/utils/api.js`):

```javascript
// Development
const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000/api';

// Production - set via environment variable
```

### Environment Variables for Frontend

Add to `.env` or Vercel:
```
VITE_API_URL=https://your-api-domain/api
VITE_APP_NAME=CoopVotes
```

### CORS Configuration

Frontend domain must be in server's `FRONTEND_URL`:
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] All secrets are marked as "sensitive" in Vercel
- [ ] HTTPS is enforced (automatic)
- [ ] CORS is restricted to your frontend domain
- [ ] Database connection uses credentials
- [ ] Rate limiting is enabled
- [ ] Audit logging is active
- [ ] Encryption keys are properly set
- [ ] No secrets in git repository
- [ ] Environment variables not exposed in console

## Testing in Production

### Login Flow Test

```bash
# 1. Login
curl -X POST https://your-api/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@student.cuk.ac.ke","regNumber":"C026/405411/2024"}'

# 2. Get OTP from email

# 3. Verify OTP (replace userId and otp)
curl -X POST https://your-api/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"userId":"from_login","otp":"123456"}'

# 4. Use token from response in subsequent requests
curl -H "Authorization: Bearer TOKEN_HERE" \
  https://your-api/api/auth/me
```

### Vote Test

```bash
# Get candidates
curl https://your-api/api/candidates

# Cast vote
curl -X POST https://your-api/api/vote \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"candidate_id","position":"President"}'
```

## Troubleshooting

### Issue: 502 Bad Gateway
- Check build logs for compilation errors
- Verify MongoDB connection string
- Ensure PORT is set to 5000
- Check that server starts correctly

### Issue: 401 Unauthorized
- Verify JWT_SECRET matches
- Check token expiration
- Ensure token is in Authorization header

### Issue: 404 Not Found
- Ensure routes are under `/api/` prefix
- Check URL includes correct endpoint
- Verify middleware isn't blocking requests

### Issue: CORS Errors
- Update FRONTEND_URL in environment variables
- Redeploy after changing CORS settings
- Check browser console for exact CORS error

### Issue: Slow Responses
- Check MongoDB query performance
- Verify rate limiting isn't too strict
- Check network latency with `curl -w`

## Rollback Plan

If issues occur:

1. **Revert to Previous Deployment**
   - Go to **Deployments** in Vercel
   - Find previous working deployment
   - Click **Promote to Production**

2. **Check Git History**
   ```bash
   git log --oneline
   git revert COMMIT_HASH
   git push
   ```

3. **Verify Backup**
   - Ensure database backups exist
   - Test restore procedure locally

## Post-Launch Monitoring

### Daily Checks

- [ ] Health check returns 200
- [ ] Authentication flow works
- [ ] No error spikes in logs
- [ ] Database performance normal
- [ ] API response times < 2 seconds

### Weekly Reviews

- [ ] Check audit logs for anomalies
- [ ] Review security alerts
- [ ] Monitor storage usage
- [ ] Verify backup completeness
- [ ] Check rate limiting effectiveness

### Monthly Tasks

- [ ] Review JWT expiration policy
- [ ] Audit user accounts and roles
- [ ] Update security headers if needed
- [ ] Analyze voting patterns
- [ ] Plan capacity if needed

## Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Security Guide**: [server/SECURITY.md](./server/SECURITY.md)
- **Postman Setup**: [POSTMAN_SETUP_GUIDE.md](./POSTMAN_SETUP_GUIDE.md)

---

**Deployment Date**: _______________  
**Deployment URL**: https://_______________  
**Status**: ☐ Testing | ☐ Live | ☐ Production  
**Notes**: _______________
