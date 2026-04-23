# CoopVotes: Complete Deployment Guide for Vercel & Render

## Project Specifications Overview

**Frontend**: React + Vite + Tailwind CSS (located in `/client`)
**Backend**: Express.js + Node.js + MongoDB Atlas (located in `/server`)
**Database**: MongoDB Atlas
**Stack**: MERN (MongoDB, Express, React, Node.js)

---

## PART 1: DEPLOY FRONTEND ON VERCEL

### Step 1.1: Prepare Frontend for Vercel

1. **Ensure `vercel.json` exists in root**:
```json
{
  "buildCommand": "npm --prefix client install && npm --prefix client run build",
  "outputDirectory": "client/dist",
  "framework": "vite"
}
```

2. **Verify client environment variables** - Check `client/src/utils/api.js`:
```javascript
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
```

3. **Create `.env.local` in client directory** (for local testing):
```
VITE_API_URL=http://localhost:5000/api
```

### Step 1.2: Create Vercel Account & Link GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Choose **"GitHub"** → Authorize
3. After logging in, click **"Add New..."** → **"Project"**
4. Search for your GitHub repo **`coopvotes`** and click **"Import"**

### Step 1.3: Configure Vercel Settings

In the Vercel import dialog:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm --prefix client install && npm --prefix client run build` |
| **Output Directory** | `client/dist` |
| **Install Command** | `npm install` |
| **Development Command** | (leave default) |

### Step 1.4: Add Environment Variables

Click **"Environment Variables"** and add:

```
Name: VITE_API_URL
Value: https://your-backend-url/api
(You'll get this after deploying backend - use placeholder for now)
```

### Step 1.5: Deploy Frontend

1. Click **"Deploy"**
2. Wait for build to complete (3-5 minutes)
3. Once successful, you'll get a URL like: `https://coopvotes.vercel.app`
4. Your frontend is now live! ✅

### Step 1.6: Update Environment Variable (After Backend Deploy)

Once backend is deployed:
1. Go to **Vercel Dashboard** → Your project
2. Go to **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to your backend URL (e.g., `https://coopvotes-api.render.com/api`)
4. Trigger redeploy: **Deployments** → Click on latest → **Redeploy**

---

## PART 2: DEPLOY BACKEND ON RENDER

### Step 2.1: Prepare Backend for Render

1. **Verify server `package.json` has correct scripts**:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seeders/seed.js"
  }
}
```

2. **Ensure all environment variables are in `.env`** (for local testing):
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coopvotes
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_EXPIRE=7d
FRONTEND_URL=https://coopvotes.vercel.app
VOTE_ENCRYPTION_KEY=e4c3bdae7e8204cb13a8c7e94289d8fea9731018b35a8cb2590b1e387123381f
COOKIE_SECRET=your-cookie-secret-min-32-chars
NODE_VERSION=18.17.0
```

3. **Create `.gitignore`** if not present (ensure `.env` is ignored):
```
node_modules/
.env
.env.local
dist/
*.log
```

### Step 2.2: Create Render Account & Add Service

1. Go to [render.com](https://render.com)
2. Click **"Sign up"** → Choose **"GitHub"** → Authorize
3. After login, click **"+ New"** → **"Web Service"**
4. Click **"Connect a repository"** → Find your `coopvotes` repo
5. Click **"Connect"**

### Step 2.3: Configure Render Web Service

Fill in the deployment configuration:

| Setting | Value |
|---------|-------|
| **Name** | `coopvotes-api` |
| **Environment** | `Node` |
| **Region** | Choose closest to you (e.g., Frankfurt, Singapore) |
| **Branch** | `master` |
| **Build Command** | `npm --prefix server install` |
| **Start Command** | `cd server && npm start` |

### Step 2.4: Set Environment Variables

Click **"Environment"** and add all variables:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://Notetaker:Iamhim@note.evnbg3v.mongodb.net/coopvotes?appName=Note
JWT_SECRET=9c61762e7f0e84a21503de2c9613c1b5d8802e362c92cabb21677d3f1671eda0
JWT_EXPIRE=7d
FRONTEND_URL=https://coopvotes.vercel.app
VOTE_ENCRYPTION_KEY=e4c3bdae7e8204cb13a8c7e94289d8fea9731018b35a8cb2590b1e387123381f
COOKIE_SECRET=your-secure-32-char-cookie-secret
```

⚠️ **Security Note**: These are sensitive! Mark as "Secret" in Render dashboard.

### Step 2.5: Configure Advanced Settings (Optional)

- **Auto-Deploy**: Keep enabled (auto-deploys on git push to `master`)
- **Disk**: Keep default (unless you need file storage)
- **Health Check Path**: `/api/health`

### Step 2.6: Deploy Backend

1. Click **"Create Web Service"**
2. Render will auto-deploy (5-10 minutes)
3. Once successful, you'll see: **"Live"** with a URL like `https://coopvotes-api.render.com`
4. Your backend is now live! ✅

### Step 2.7: Test Backend Deployment

Test these endpoints in Postman or curl:

```bash
# Health Check
curl https://coopvotes-api.render.com/api/health

# Get Current Election
curl https://coopvotes-api.render.com/api/election

# Test Login (replace with real credentials)
curl -X POST https://coopvotes-api.render.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.cuk.ac.ke", "regNumber": "C026/405411/2024"}'
```

---

## PART 3: CONNECT FRONTEND TO BACKEND

### Step 3.1: Update Vercel Environment

1. Go to **Vercel Dashboard** → Select `coopvotes` project
2. Go to **Settings** → **Environment Variables**
3. Update or add:
```
VITE_API_URL=https://coopvotes-api.render.com/api
```

4. Click **"Save"** and trigger redeploy:
   - Go to **Deployments**
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to `master`

### Step 3.2: Test Integration

1. Visit your Vercel frontend: `https://coopvotes.vercel.app`
2. Try logging in with your CUK credentials
3. Check browser console (F12) for any API errors
4. If errors, check both logs:
   - **Vercel logs**: Deployments → [name] → Logs
   - **Render logs**: Your service → Logs

---

## PART 4: SETUP DATABASE (MongoDB Atlas)

### Step 4.1: Verify MongoDB Connection

Your `MONGODB_URI` is already configured:
```
mongodb+srv://Notetaker:Iamhim@note.evnbg3v.mongodb.net/coopvotes?appName=Note
```

### Step 4.2: Whitelist Render IP (Important!)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Login → Go to your cluster
3. Click **"Network Access"** in left sidebar
4. Click **"Add IP Address"**
5. Click **"Allow Access from Anywhere"** (or add Render's IPs)
6. Click **"Confirm"**

### Step 4.3: Run Database Migration (Optional)

If you need to run migrations on production:

```bash
# Local terminal
cd server
npm run migrate
```

Or through Render:
1. Go to **Shell** in Render dashboard
2. Run: `cd server && npm run migrate`

---

## PART 5: ENABLE AUTO-DEPLOYMENT

### Setup GitHub Push-to-Deploy

Both Vercel and Render auto-deploy on git push to `master`. Just push your changes:

```bash
git add .
git commit -m "Your deployment message"
git push origin master
```

Both will automatically:
1. Detect the push
2. Start building
3. Deploy if build succeeds
4. Show status in their dashboards

---

## PART 6: DOMAIN SETUP (Optional)

### Point Custom Domain to Frontend (Vercel)

1. Go to **Vercel Dashboard** → Project **Settings**
2. Click **"Domains"**
3. Enter your domain (e.g., `coopvotes.cuk.ac.ke`)
4. Click **"Add"**
5. Follow DNS setup instructions
6. Wait for DNS to propagate (5 min - 48 hours)

### Point API Subdomain to Backend (Render)

1. Go to **Render Dashboard** → Your Web Service
2. Click **"Settings"** → **"Custom Domain"**
3. Enter subdomain (e.g., `api.coopvotes.cuk.ac.ke`)
4. Add the CNAME record to your DNS provider
5. Wait for propagation

---

## PART 7: MONITORING & LOGS

### Monitor Vercel Frontend

**Vercel Dashboard:**
- **Analytics**: Real User Monitoring (RUM)
- **Deployments**: View all deployments
- **Logs**: Click deployment → "Functions" tab

### Monitor Render Backend

**Render Dashboard:**
- **Metrics**: CPU, Memory, Bandwidth
- **Logs**: Real-time logs
- **Events**: Build & deploy history

### Check Live Logs

```bash
# Frontend errors
Visit https://coopvotes.vercel.app → Open F12 Console

# Backend logs
Go to Render dashboard → Your service → Logs tab
```

---

## PART 8: TROUBLESHOOTING

### Issue: "Cannot find package '@vitejs/plugin-react'"
**Solution**: Already fixed! Your `package.json` now includes dependency install in build command.

### Issue: "MONGODB_URI connection failed"
**Solutions:**
1. Verify MongoDB Atlas is running
2. Whitelist Vercel/Render IPs in MongoDB Network Access
3. Test connection string locally first
4. Check credentials in `.env`

### Issue: "CORS error when frontend calls backend"
**Solution**: In your backend `server.js`, ensure CORS is configured:
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue: "Frontend shows blank page"
**Solutions:**
1. Check Vercel build logs for errors
2. Verify `VITE_API_URL` environment variable is set
3. Test frontend locally: `npm run dev`
4. Check browser console for errors (F12)

### Issue: "Backend returns 503 Service Unavailable"
**Solutions:**
1. Check Render service logs for errors
2. Verify all environment variables are set in Render
3. Check MongoDB connection string
4. Restart service in Render dashboard

---

## PART 9: PERFORMANCE OPTIMIZATION

### Frontend (Vercel)

1. **Enable Analytics**: Vercel Dashboard → Analytics
2. **Use Edge Functions** for serverless middleware
3. **Monitor Web Vitals**

### Backend (Render)

1. **Use caching**: Implemented in your project
2. **Monitor logs** for slow queries
3. **Scale if needed**: Render → Metrics → Upgrade plan

---

## PART 10: SECURITY CHECKLIST

- [ ] Environment variables stored in dashboard (NOT in code)
- [ ] `.env` file in `.gitignore`
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] CORS configured for your frontend domain
- [ ] MongoDB Atlas whitelist updated
- [ ] JWT secrets are strong (32+ chars)
- [ ] Sensitive variables marked as "Secret" in dashboards
- [ ] Rate limiting enabled on backend
- [ ] Authentication middleware active
- [ ] Audit logging enabled

---

## PART 11: QUICK REFERENCE

### Vercel Frontend URL
```
https://coopvotes.vercel.app
```

### Render Backend URL
```
https://coopvotes-api.render.com/api
```

### Check Status

**Frontend**: `curl https://coopvotes.vercel.app`
**Backend**: `curl https://coopvotes-api.render.com/api/health`

### Redeploy Commands

**Vercel**: Push to git or click "Redeploy" in dashboard
**Render**: Push to git or click "Manual Deploy" in dashboard

---

## PART 12: NEXT STEPS

1. ✅ Deploy frontend on Vercel
2. ✅ Deploy backend on Render
3. ✅ Connect them with environment variables
4. ✅ Test end-to-end functionality
5. ✅ Setup custom domains (optional)
6. ✅ Monitor logs and metrics
7. ✅ Setup alerts for errors
8. Consider: CI/CD pipeline improvements, automated testing, load testing

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.mongodb.com/atlas/
- **Express.js**: https://expressjs.com/
- **React + Vite**: https://vitejs.dev/guide/

---

**Last Updated**: April 2026
**Project**: CoopVotes MERN Voting System
