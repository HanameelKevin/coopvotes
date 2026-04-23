# CoopVotes Deployment Guide: Step-by-Step

This guide provides a clear path to deploying the CoopVotes platform to production, ensuring security and stability.

---

## 🚀 Environment Verification
Before deploying, ensure the local environment is stable.
- **Development**: `npm run dev` (Starts backend on 5000 and frontend on 5173/5174/5175)
- **Production Build**: `npm run build` (Generates `client/dist` folder)
- **Database**: Seeded with `npm run seed` for initial testing.

---

## 🌐 1. Deploying Frontend to Vercel
Vercel is the recommended platform for the React (Vite) frontend.

### Steps:
1. **Prepare Repository**: Ensure your code is pushed to GitHub/GitLab/Bitbucket.
2. **Connect Vercel**: 
   - Go to [vercel.com](https://vercel.com) and click **"Add New"** → **"Project"**.
   - Import the `coopvotes` repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Vite.
   - **Root Directory**: `client` (Very important!).
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
4. **Environment Variables**: Add the following:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api` (You will get this from the Render step below).
5. **Deploy**: Click **"Deploy"**.

---

## ☁️ 2. Deploying Backend to Render
Render is excellent for Node.js backend services.

### Steps:
1. **Create Web Service**:
   - Log in to [render.com](https://render.com).
   - Click **"New"** → **"Web Service"**.
   - Connect the same repository.
2. **Configure Settings**:
   - **Name**: `coopvotes-api`.
   - **Root Directory**: `server`.
   - **Environment**: `Node`.
   - **Build Command**: `npm install`.
   - **Start Command**: `node server.js`.
3. **Environment Variables**: Click **"Advanced"** and add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default)
   - `MONGODB_URI`: `mongodb+srv://...` (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: `[Generate a long random string]`
   - `COOKIE_SECRET`: `[Generate a long random string]`
   - `VOTE_ENCRYPTION_KEY`: `[Run node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" locally to generate]`
   - `FRONTEND_URL`: `https://your-frontend-name.vercel.app` (The URL you got from Vercel)
4. **Deploy**: Click **"Create Web Service"**.

---

## 📮 3. API Documentation & Testing with Postman
Postman is used to verify the API is working correctly.

### Steps:
1. **Import Collection**:
   - Open Postman.
   - Click **Import** and select `CoopVotes-API.postman_collection.json` from the root directory.
2. **Import Environment**:
   - Import `CoopVotes-Production.postman_environment.json`.
3. **Update Environment Variables**:
   - In Postman, switch to the **"CoopVotes-Production"** environment.
   - Update `base_url` to your Render URL: `https://coopvotes-api.onrender.com`.
4. **Run Health Check**:
   - Execute the **"Health Check"** request. You should get a `200 OK`.
5. **Verify Security**:
   - Run the **"Security Status"** request to ensure all encryption features are active.

---

## 🔐 Security Best Practices
- **Never** commit `.env` files to Git.
- **Whitelist** Vercel and Render IPs in MongoDB Atlas (or allow connections from everywhere `0.0.0.0/0` if necessary, but restrict by DB user).
- **Ensure** `FRONTEND_URL` in the backend matches the actual Vercel URL exactly (no trailing slash).

---

## ✅ Final Verification
1. Open your Vercel URL.
2. Log in using a test account (e.g., `admin@student.cuk.ac.ke`).
3. If using real email (production), check your inbox for the OTP.
4. Complete a test vote and verify the receipt hash appears.
