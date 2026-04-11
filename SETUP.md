# Quick Start Guide

Get CoopVotes up and running in 10 minutes!

## Prerequisites

- Node.js v16+ (download from https://nodejs.org/)
- MongoDB (local or Atlas)
- Git
- Code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/coopvotes.git
cd coopvotes

# Install server dependencies
cd server
npm install

# Install client dependencies (in new terminal)
cd ../client
npm install
```

### 2. Configure Environment

**Server (.env)**
```bash
cd server
# Create .env file
cat > .env << EOF
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/coopvotes
JWT_SECRET=coopvotes_jwt_secret_key_change_in_production_2026
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
EOF
```

**Client (.env)**
```bash
cd ../client
# Create .env file (usually works as-is for local dev)
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CoopVotes
VITE_APP_TITLE=CoopVotes - The Co-operative University of Kenya
EOF
```

### 3. Setup MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

**Option B: Docker**
```bash
docker run -d -p 27017:27017 --name coopvotes-mongo mongo
```

**Option C: MongoDB Atlas** (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in server `.env`

### 4. Seed Database

```bash
cd server
npm run seed

# Expected output:
# ✅ Database seeded successfully!
# 📊 Summary:
#    - Users: 9
#    - Candidates: 6
#    - Elections: 1
#    - Votes: 10
```

### 5. Start Development Servers

**Terminal 1 - Backend**
```bash
cd server
npm run dev

# Expected output:
# ╔═══════════════════════════════════════════════════════════╗
# ║   CoopVotes Server - The Co-operative University of Kenya ║
# ║   Server running in development mode on port 5000        ║
# ╚═══════════════════════════════════════════════════════════╝
```

**Terminal 2 - Frontend**
```bash
cd client
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

### 6. Open in Browser

- Go to http://localhost:5173
- You should see the CoopVotes login page

## Test Login Credentials

After running `npm run seed`, use these test accounts:

| Role | Email | Reg Number | Notes |
|------|-------|-----------|-------|
| Admin | admin@coop.ac.ke | ADMIN/001 | Full access to admin panel |
| Student (BIT) | john.bit@coop.ac.ke | BIT/2023/10001 | Can vote for BIT positions |
| Student (BBM) | bob.bbm@coop.ac.ke | BBM/2023/20001 | Can vote for BBM positions |
| Aspirant (CS) | eve.cs@coop.ac.ke | CS/2022/30002 | Can view campaign dashboard |

## Testing Workflow

### As a Student
1. Login with `john.bit@coop.ac.ke` / `BIT/2023/10001`
2. Click "Cast Your Vote"
3. Select candidates for each position
4. View results

### As an Admin
1. Login with `admin@coop.ac.ke` / `ADMIN/001`
2. Go to Admin Panel
3. Start election if not active
4. View candidates
5. Record offline votes if needed
6. Export results as CSV

### As an Aspirant
1. Login with `eve.cs@coop.ac.ke` / `CS/2022/30002`
2. Go to "My Campaign"
3. View real-time vote tally

## Common Issues & Solutions

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
```bash
# Check if MongoDB is running
# macOS
brew services list

# Start MongoDB
brew services start mongodb-community

# Or use MongoDB Atlas instead
```

### Port 5000 Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in server/.env
```

### Frontend Can't Connect to Backend
```
Failed to fetch from http://localhost:5000/api
```
**Solution:**
- Check backend is running (`npm run dev` in server directory)
- Verify `VITE_API_URL` in client/.env matches backend URL
- Check CORS configuration in server/server.js

### Seed Data Not Loaded
```bash
# Check MongoDB directly
mongo coopvotes
db.users.find()

# If empty, run seed again
cd server
npm run seed
```

## Development Tips

### Enable Hot Reload
- Backend: Using nodemon (enabled with `npm run dev`)
- Frontend: Vite auto-reloads (check terminal shows "Local:")

### View Backend Logs
```bash
# Terminal running server will show all API requests
[GET] /api/candidates
[POST] /api/auth/login
```

### Debug React Components
- Browser DevTools: F12
- React DevTools extension recommended
- TanStack React Query DevTools built in

### Check Database
```bash
# Connect to MongoDB
mongo coopvotes

# View all users
db.users.find()

# View all votes
db.votes.find()

# Count documents
db.candidates.countDocuments()
```

## Next Steps

1. **Read the full README** for architecture and features
2. **Check API_DOCUMENTATION.md** for endpoint details
3. **Review ARCHITECTURE.md** for code structure
4. **Create your own candidates** using Admin Panel
5. **Customize styling** in client/src/index.css

## Useful Commands

```bash
# Backend
npm run dev      # Start dev server with reload
npm run seed     # Seed test data
npm start        # Start production server

# Frontend
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build

# Database
mongo            # Open MongoDB shell
mongoimport      # Import data
mongoexport      # Export data
```

## Production Deployment Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Configure FRONTEND_URL correctly
- [ ] Set up domain and SSL certificate
- [ ] Update client VITE_API_URL to production URL
- [ ] Run `npm run build` for frontend
- [ ] Deploy to hosting service
- [ ] Run smoke tests on production

## Get Help

- 📖 Full docs: README.md
- 🏗️ Architecture: ARCHITECTURE.md
- 📡 API docs: API_DOCUMENTATION.md
- 🚀 Deployment: DEPLOYMENT.md
- 💬 Issues: GitHub Issues

Good luck! 🎉
