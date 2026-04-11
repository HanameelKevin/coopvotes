# CoopVotes 🗳️

A secure, scalable MERN stack (MongoDB, Express, React, Node.js) web application for managing student voting systems at The Co-operative University of Kenya.

## Overview

CoopVotes is a comprehensive election management system designed for university campuses, enabling students to vote for campus leaders across different departments while maintaining security, transparency, and real-time vote counting.

### Key Features

- 🔐 **Secure Authentication**: JWT-based authentication with university email validation
- 🗳️ **Multi-position Voting**: President (university-wide), Congress Persons, Male & Female Delegates (department-based)
- 📊 **Live Results**: Real-time vote counting and results visualization
- 📈 **Aspirant Dashboard**: Live campaign tracking for candidates
- ⚙️ **Admin Controls**: Manage candidates, elections, and offline votes
- 📱 **Responsive Design**: Mobile-first modern UI with Tailwind CSS
- 💾 **Persistent Data**: MongoDB for reliable data storage
- 🛡️ **Role-Based Access Control**: Student, Aspirant, and Admin roles
- 📥 **CSV Export**: Download results for official records

## Architecture

### Tech Stack

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- bcryptjs for password hashing
- Helmet for security
- Express Rate Limiting

**Frontend:**
- React 19
- React Router for navigation
- TanStack React Query for data fetching
- Tailwind CSS for styling
- Chart.js for data visualization
- Axios for API calls

## Project Structure

```
coopvotes/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React Context (Auth)
│   │   ├── utils/             # Helper functions
│   │   ├── App.jsx            # Main app component
│   │   └── index.css          # Global styles
│   ├── .env                   # Frontend environment variables
│   └── vite.config.js         # Vite configuration
│
└── server/                    # Express backend
    ├── config/                # Database configuration
    ├── controllers/           # Route controllers
    ├── middleware/            # Custom middleware
    ├── models/                # MongoDB models
    ├── routes/                # API routes
    ├── seeders/               # Database seeders
    ├── utils/                 # Utility functions
    ├── server.js              # Express app entry point
    └── .env                   # Backend environment variables
```

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/coopvotes.git
cd coopvotes
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env .env.backup
# Edit .env with your configuration (see Environment Variables section)

# Start MongoDB
# On macOS with Homebrew:
# brew services start mongodb-community

# Run database seeder
npm run seed

# Start the server
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Create .env file
cp .env .env.backup
# Edit .env if needed (default should work for local development)

# Start the development server
npm run dev
```

The client will start on `http://localhost:5173`

## Environment Variables

### Server (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/coopvotes

# JWT Authentication
JWT_SECRET=coopvotes_jwt_secret_key_change_in_production_2026
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Client (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CoopVotes
VITE_APP_TITLE=CoopVotes - The Co-operative University of Kenya
```

## Database Schema

### User Collection
```javascript
{
  email: String,                    // @coop.ac.ke
  regNumber: String,                // BIT/2022/12345
  department: String,               // BIT, BBM, CS, etc.
  yearOfStudy: Number,              // 1-6
  role: String,                     // student, aspirant, admin
  hasVoted: Boolean,
  votedPositions: [String],
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Candidate Collection
```javascript
{
  userId: ObjectId,                 // Reference to User
  position: String,                 // President, Congress Person, etc.
  department: String | null,        // null for President
  manifesto: String,
  image: String,
  votes: Number,                    // Online votes
  offlineVotes: Number,
  isApproved: Boolean,
  totalVotes: Virtual,              // votes + offlineVotes
  createdAt: Date,
  updatedAt: Date
}
```

### Vote Collection
```javascript
{
  voterId: ObjectId,                // Reference to User
  candidateId: ObjectId,            // Reference to Candidate
  position: String,
  department: String | null,
  electionId: ObjectId,
  timestamp: Date
}
```

### Election Collection
```javascript
{
  name: String,
  year: Number,
  isActive: Boolean,
  status: String,                   // draft, active, completed, cancelled
  startTime: Date,
  endTime: Date,
  totalVoters: Number,
  totalVotes: Number,
  turnout: Number,                  // Percentage
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and registration number
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout
- `GET /api/auth/election-status` - Get election status

### Candidates
- `GET /api/candidates` - Get all candidates with filters
- `GET /api/candidates/:id` - Get single candidate
- `POST /api/candidates` - Create candidate (Admin)
- `PUT /api/candidates/:id` - Update candidate (Admin)
- `PATCH /api/candidates/:id/offlineVotes` - Add offline votes (Admin)
- `DELETE /api/candidates/:id` - Delete candidate (Admin)
- `GET /api/candidates/department/:department` - Get candidates by department

### Voting
- `POST /api/vote` - Cast a vote (Student)
- `GET /api/vote/status` - Get current user's vote status
- `GET /api/vote/results` - Get election results
- `GET /api/vote/results/export` - Export results as CSV (Admin)

### Election Management
- `GET /api/election` - Get current election status
- `POST /api/election/start` - Start election (Admin)
- `POST /api/election/end` - End election (Admin)
- `GET /api/election/history` - Get election history (Admin)
- `GET /api/election/:id/stats` - Get election statistics (Admin)
- `PUT /api/election/:id` - Update election (Admin)
- `DELETE /api/election/:id` - Delete election (Admin)

## Authentication Logic

### Registration Number Parsing

Registration numbers follow the format: `DEPT/YEAR/SEQUENCE`

Examples:
- `BIT/2022/12345` → BIT student, admitted 2022, year of study calculated dynamically
- `BBM/2023/10001` → BBM student, admitted 2023
- `ADMIN/001` → Admin account

### Department Mapping

| Code | Department |
|------|------------|
| BIT | Business Information Technology |
| BBM | Business Management |
| CS | Computer Science |
| COMM | Commerce |
| LAW | Law |
| EDU | Education |
| ADMIN | Administration |

### Year of Study Calculation

Calculated dynamically from admission year:
- Academic year runs August to July
- Current academic year = admission year + (current year - admission year)

## Usage Guide

### For Students

1. **Login**
   - Enter your @coop.ac.ke email
   - Enter your registration number
   - System auto-assigns department and year

2. **Voting**
   - Dashboard → "Cast Your Vote"
   - Vote for one candidate per position
   - Department positions limited to your department
   - President is university-wide

3. **View Results**
   - Dashboard → "View Results"
   - See live vote counts
   - View both cards and chart views

### For Aspirants

1. **Login** with your aspirant account
2. **Dashboard** → "My Campaign"
3. **Track** your vote tally in real-time
4. **Monitor** competitors

### For Admins

1. **Login** with admin account
2. **Admin Panel** to:
   - Start/End elections
   - Approve candidates
   - Record offline votes
   - Export results

## Testing

### Test Accounts (After Seeding)

```
Admin:
  Email: admin@coop.ac.ke
  RegNumber: ADMIN/001

Student (BIT):
  Email: john.bit@coop.ac.ke
  RegNumber: BIT/2023/10001

Aspirant (CS):
  Email: eve.cs@coop.ac.ke
  RegNumber: CS/2022/30002
```

### Manual Testing

1. **Start both servers**
2. **Login with test account**
3. **Run through voting workflow**
4. **Check Admin panel**
5. **Verify results are updating**

## Security Considerations

- ✅ JWT tokens stored in secure HTTP-only cookies
- ✅ Passwords hashed with bcrypt
- ✅ Rate limiting on auth endpoints
- ✅ Helmet.js for security headers
- ✅ Unique vote constraint at database level
- ✅ Role-based access control
- ✅ Input validation on all endpoints
- ✅ CORS configured appropriately

## Performance Optimizations

- React Query for efficient caching and data fetching
- MongoDB indexes on frequently queried fields
- Vote record transactions for consistency
- Real-time result polling every 30 seconds
- Lazy loading of components
- Optimized database queries with aggregation

## Deployment

### Prerequisites for Production
- Node.js hosting (Heroku, AWS, DigitalOcean, etc.)
- MongoDB Atlas or self-hosted MongoDB
- Domain name
- SSL/TLS certificate

### Environment Variables for Production

**Server:**
```env
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
MONGODB_URI=<mongodb-atlas-uri>
FRONTEND_URL=https://yourdomain.com
```

**Client:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Build Commands

**Backend:**
```bash
cd server
npm install
npm start
```

**Frontend:**
```bash
cd client
npm install
npm run build
# Serve the dist folder with a static server or CDN
```

## Troubleshooting

### MongoDB Connection Issues

```javascript
// Ensure MongoDB is running
// macOS: brew services start mongodb-community
// Linux: sudo systemctl start mongod
// Docker: docker run -d -p 27017:27017 mongo
```

### Port Already in Use

```bash
# Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
```

### CORS Errors

- Check `FRONTEND_URL` in server `.env`
- Ensure CORS middleware in server is configured correctly

### Seed Data Not Loading

```bash
# Check MongoDB connection
# Run seed script directly
node seeders/seed.js

# Verify data with MongoDB client
mongo coopvotes
db.users.find()
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Email: support@coopvotes.co.ke

## Acknowledgments

- The Co-operative University of Kenya for the vision
- Built with MERN stack best practices
- Tailwind CSS for beautiful styling
- Chart.js for data visualization

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Production Ready
