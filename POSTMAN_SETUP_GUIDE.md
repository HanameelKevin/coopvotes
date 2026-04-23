# CoopVotes API - Postman Setup Guide

## 📋 Overview

This guide helps you import and use the complete CoopVotes API collection in Postman for local development and Vercel deployment testing.

## 📁 Files Included

1. **CoopVotes-API.postman_collection.json** - Complete API collection with all endpoints
2. **CoopVotes-Development.postman_environment.json** - Local development environment
3. **CoopVotes-Production.postman_environment.json** - Production/Vercel environment

## 🚀 Quick Start

### Step 1: Import Collection

1. Open **Postman**
2. Click **Import** button (top left)
3. Select **CoopVotes-API.postman_collection.json**
4. Click **Import**

### Step 2: Import Development Environment

1. Click the **gear icon** ⚙️ (top right)
2. Select **Environments**
3. Click **Import** 
4. Select **CoopVotes-Development.postman_environment.json**
5. Click **Import**

### Step 3: Import Production Environment (Optional)

1. Repeat Step 2 with **CoopVotes-Production.postman_environment.json**
2. After import, edit the environment and replace placeholder values

### Step 4: Select Active Environment

1. Click the environment dropdown (top right, currently says "No environment")
2. Select **"CoopVotes Development"** for local testing
3. Or select **"CoopVotes Production"** for Vercel testing

## 🔑 API Authentication Flow

### For Student Users:

```
1. POST /api/auth/login
   - Email: student@student.cuk.ac.ke
   - RegNumber: C026/405411/2024
   ↓
2. Check email for OTP
   ↓
3. POST /api/auth/verify-otp
   - userId: (from login response)
   - otp: (from email)
   ↓
4. GET token from response
   ↓
5. Copy token to {{token}} variable in environment
   ↓
6. Use token in all protected requests
```

### In Postman:

1. **Login** → Check response for `userId`
2. Copy `userId` to **Environment Variable** `{{userId}}`
3. **Verify OTP** → Check response for `token`
4. Copy `token` to **Environment Variable** `{{token}}`
5. All authenticated requests will automatically use this token

## 📚 API Endpoints Summary

### Public Endpoints (No Auth Required)
- `GET /api/health` - Health check
- `GET /api/security/status` - Security features
- `GET /api/election` - Current election info
- `GET /api/candidates` - All candidates
- `GET /api/candidates/:id` - Specific candidate
- `GET /api/vote/verify?receipt=xxx` - Verify vote

### Authentication Endpoints
- `POST /api/auth/login` - Start login (get OTP)
- `POST /api/auth/verify-otp` - Verify OTP (get token)
- `GET /api/auth/me` - Current user info (protected)
- `GET /api/auth/election-status` - Election status (protected)
- `POST /api/auth/logout` - Logout (protected)

### Candidate Endpoints
- `GET /api/candidates` - List all candidates
- `GET /api/candidates/:id` - Get candidate details
- `GET /api/candidates/department/:dept` - Filter by department
- `POST /api/candidates` - Create (Admin only)
- `PUT /api/candidates/:id` - Update (Admin only)
- `PATCH /api/candidates/:id/offlineVotes` - Add offline votes (Admin only)
- `DELETE /api/candidates/:id` - Delete (Admin only)

### Voting Endpoints
- `POST /api/vote` - Cast vote (protected)
- `GET /api/vote/status` - Vote status (protected)
- `GET /api/vote/results` - Election results (protected, must have voted)
- `GET /api/vote/verify?receipt=xxx` - Public verification
- `GET /api/vote/verify-chain` - Verify integrity (Admin only)
- `GET /api/vote/results/export` - Export CSV (Admin only)
- `GET /api/vote/results/export/pdf` - Export PDF (Admin only)

### Election Endpoints
- `GET /api/election` - Current election
- `POST /api/election/start` - Start election (Admin only)
- `POST /api/election/end` - End election (Admin only)
- `GET /api/election/history` - Past elections (Admin only)
- `GET /api/election/:id/stats` - Election stats (Admin only)
- `PUT /api/election/:id` - Update (Admin only)
- `DELETE /api/election/:id` - Delete (Admin only)

### Admin Endpoints (All require Admin role)
- `GET /api/admin/audit-logs` - System logs
- `GET /api/admin/security/alerts` - Security alerts
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/votes-over-time` - Vote analytics
- `GET /api/admin/votes/:id` - Vote details
- `POST /api/admin/logout` - Force user logout

## 🔧 Environment Variables

### Development Environment Includes:
```
base_url: http://localhost:5000
frontend_url: http://localhost:5173
jwt_secret: [your local secret]
mongodb_uri: [your local/atlas URI]
token: [filled after authentication]
userId: [filled after login]
candidateId: [fill as needed]
electionId: [fill as needed]
```

### Production Environment Requires:
- Replace `https://your-vercel-domain.vercel.app` with your actual Vercel URL
- Replace `{{REPLACE_WITH_PRODUCTION_JWT_SECRET}}` with production secret
- Replace `{{REPLACE_WITH_PRODUCTION_MONGODB_URI}}` with production database
- Replace `{{REPLACE_WITH_PRODUCTION_ENCRYPTION_KEY}}` with production key

## 🛡️ Security Features Enabled

The API includes:
- ✅ AES-256-GCM Vote Encryption
- ✅ SHA-256 Hash Receipts
- ✅ Chained Vote Hashes
- ✅ Audit Logging
- ✅ Anomaly Detection
- ✅ Rate Limiting
- ✅ Role-Based Access Control (RBAC)
- ✅ Data Sanitization
- ✅ CORS Protection
- ✅ Helmet Security Headers
- ✅ JWT Authentication

## 📌 Important Notes

### Testing Workflow:

1. **Test Public Endpoints First**
   ```
   GET /api/health
   GET /api/election
   GET /api/candidates
   ```

2. **Authenticate**
   ```
   POST /api/auth/login (with valid student credentials)
   POST /api/auth/verify-otp (with OTP from email)
   ```

3. **Test Protected Endpoints**
   ```
   GET /api/auth/me
   POST /api/vote (cast your vote)
   GET /api/vote/status
   ```

4. **Admin Functions** (if you have admin role)
   ```
   GET /api/admin/stats
   GET /api/election/history
   ```

### Rate Limiting:

- Login attempts: Limited to prevent brute force
- Vote casting: Limited to 1 vote per election per user
- API calls: General rate limiting on all endpoints
- Verify endpoint: Limited for security

### Data Validation:

- Email must be `@student.cuk.ac.ke`
- Registration number format: `CXXX/XXXXXX/XXXX` (e.g., C026/405411/2024)
- OTP: 6 digits sent via email
- Manifesto: Max 2000 characters

## 🚢 Deploying to Vercel

Before deploying, ensure:

1. **Set Environment Variables on Vercel**:
   ```
   PORT=5000
   MONGODB_URI=your_production_mongodb
   JWT_SECRET=your_production_secret
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=your_vercel_frontend_url
   VOTE_ENCRYPTION_KEY=your_production_key
   ```

2. **Update Production Environment in Postman**:
   - Change `base_url` to your Vercel API URL
   - Replace all `{{REPLACE_WITH_...}}` placeholders

3. **Test After Deployment**:
   - Switch to "CoopVotes Production" environment
   - Run health check
   - Test authentication flow
   - Verify all endpoints

## 💡 Pro Tips

1. **Save Token Value**: After auth, the token is auto-set in the environment
2. **Use Pre-request Scripts**: Postman can auto-populate fields
3. **Test Collections**: Use Postman's collection runner for batch testing
4. **Monitor Requests**: Check the Postman console for full request/response
5. **Documentation**: Each request includes description and usage notes

## 🆘 Troubleshooting

**404 Not Found**
- Ensure server is running on correct port (5000)
- Check that URL includes `/api/` prefix
- Verify environment variable `base_url` is correct

**401 Unauthorized**
- Token may be expired
- Re-authenticate to get new token
- Check that {{token}} variable is set in environment

**422 Validation Error**
- Check email format (must be @student.cuk.ac.ke)
- Check registration number format (CXXX/XXXXXX/XXXX)
- Verify all required fields are present

**500 Server Error**
- Check server logs for details
- Verify MongoDB connection
- Check environment variables are set

## 📞 Support

For issues or questions:
1. Check server logs: `server/` directory
2. Review API documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. Check security implementation: [server/SECURITY.md](./server/SECURITY.md)

---

**Last Updated**: April 23, 2026
**API Version**: 2.0.0-secure
