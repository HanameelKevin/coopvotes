# Project Architecture

Comprehensive guide to CoopVotes system architecture, design patterns, and technical implementation.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CoopVotes System Architecture               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │   React Client   │◄────────────►│   Express Server     │    │
│  │  (Vite + SPA)    │   REST API   │   (Node.js + JWT)    │    │
│  └──────────────────┘              └──────────────────────┘    │
│         │                                    │                 │
│         │ HTTP/HTTPS                        │ TCP              │
│         │                                    │                 │
│  ┌──────▼──────────┐              ┌─────────▼──────────┐      │
│  │  Tailwind CSS   │              │    MongoDB         │      │
│  │  Chart.js       │              │    (Database)      │      │
│  │  Query Client   │              │                    │      │
│  └─────────────────┘              └────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet.js, bcryptjs
- **Rate Limiting**: express-rate-limit
- **Validation**: express-validator

### Layered Architecture

```
┌─────────────────────────────────┐
│  Routes Layer                   │
│  (HTTP endpoints)               │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Middleware Layer               │
│  (Auth, Validation, Error)      │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Controllers Layer              │
│  (Business Logic)               │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Models Layer                   │
│  (Data Objects)                 │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Database Layer                 │
│  (MongoDB)                      │
└─────────────────────────────────┘
```

### Directory Structure

```
server/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── candidateController.js # Candidate management
│   ├── voteController.js     # Voting logic
│   └── electionController.js # Election management
├── middleware/
│   ├── auth.js               # JWT & RBAC
│   └── validate.js           # Input validation & error handling
├── models/
│   ├── User.js
│   ├── Candidate.js
│   ├── Vote.js
│   └── Election.js
├── routes/
│   ├── auth.js
│   ├── candidates.js
│   ├── votes.js
│   └── election.js
├── utils/
│   ├── regParser.js          # Parse registration numbers
│   └── emailValidator.js     # Validate emails
├── seeders/
│   └── seed.js               # Database seeding
├── server.js                 # Express app setup
└── package.json
```

### Request Flow

```
HTTP Request
     │
     ▼
[Router] - Route to appropriate handler
     │
     ▼
[Middleware] - Auth check, validation
     │
     ▼
[Controller] - Business logic execution
     │
     ▼
[Model] - Database operations
     │
     ▼
[MongoDB] - Persist/retrieve data
     │
     ▼
[Controller] - Format response
     │
     ▼
[Response] - JSON response
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 19
- **Bundler**: Vite
- **Routing**: React Router v7
- **State Management**: React Context + TanStack React Query
- **CSS**: Tailwind CSS
- **HTTP**: Axios
- **Charts**: Chart.js + react-chartjs-2
- **Cache**: TanStack React Query

### Component Hierarchy

```
App
├── AuthProvider
│   ├── AppContent
│   │   ├── Navbar
│   │   └── Routes
│   │       ├── Login
│   │       ├── Dashboard
│   │       ├── VotingBooth
│   │       │   └── CandidateCard (multiple)
│   │       ├── Results
│   │       │   ├── VoteBarChart
│   │       │   └── VotePieChart
│   │       ├── AspirantDashboard
│   │       │   └── VoteChart
│   │       └── AdminPanel
│   │           └── (Tab content)
│   ├── ElectionStatus (global)
│   └── Toast (notifications)
└── Loading (global)
```

### Directory Structure

```
client/
├── src/
│   ├── components/           # Reusable components
│   │   ├── CandidateCard.jsx
│   │   ├── VoteChart.jsx
│   │   ├── Toast.jsx
│   │   ├── ElectionStatus.jsx
│   │   ├── Navbar.jsx
│   │   └── Loading.jsx
│   ├── pages/                # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── VotingBooth.jsx
│   │   ├── Results.jsx
│   │   ├── AspirantDashboard.jsx
│   │   └── AdminPanel.jsx
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state
│   ├── utils/
│   │   ├── api.js            # Axios instance
│   │   └── helpers.js        # Utility functions
│   ├── App.jsx               # Main component
│   ├── main.jsx
│   └── index.css
├── .env                      # Environment variables
└── vite.config.js
```

### Data Flow

```
User Action
     │
     ▼
Component Event Handler
     │
     ▼
Call API (Axios)
     │
     ▼
Send Request to Backend
     │
     ▼
Backend Process
     │
     ▼
Return Response
     │
     ▼
Update Query Cache (React Query)
     │
     ▼
Re-render Component
     │
     ▼
Display Updated UI
```

## Database Schema

### Collections Relationship

```
User
├── _id
├── email ──────────┐
├── regNumber       │
├── department      │
├── yearOfStudy     │
├── role            │
└── ...             │
                    │
             ┌──────┴──────┐
             │             │
           ┌─▼──────────┐  │
           │ Candidate  │  │
           │            │  │
           │ userId ◄───┘  │
           │ position       │
           │ votes          │
           │ offlineVotes   │
           └─┬──────────────┘
             │
        ┌────┴────┬──────────┐
        │          │          │
      ┌─▼─┐    ┌──▼──┐    ┌──▼──┐
      │V1 │    │ V2  │    │ Vn  │
      │   │    │     │    │     │
      │ V └────┐     └────┐     │
      │ o └────┐          └────┐│
      │ t      │               ││
      │ e      │   Election    ││
      │        │               ││
      └────────┴───────────────┘│
                                │
             ┌──────────────────┘
             │
        ┌────▼──────┐
        │  Vote     │
        │           │
        │ voterId ──┐
        │candidateId├─→ Candidate
        │position   │
        │timestamp  │
        └───────────┘
```

## Security Architecture

### Authentication Flow

```
User Input (email + regNumber)
        │
        ▼
Validate Email Format
        │
        ▼
Check @coop.ac.ke Domain
        │
        ▼
Parse Registration Number
        │
        ▼
Auto-assign Department & Year
        │
        ▼
Upsert User in Database
        │
        ▼
Generate JWT Token
        │
        ▼
Send HttpOnly Cookie + Response Token
```

### Authorization Strategy

```
Request with Token
        │
        ▼
Extract Token from Header/Cookie
        │
        ▼
Verify JWT Signature
        │
        ▼
Get User from Database
        │
        ▼
Attach User to Request
        │
        ▼
Check Role with authorize() middleware
        │
        ├─► Admin       ─→ Full Access
        ├─► Student     ─→ Vote Access
        └─► Aspirant    ─→ Dashboard Access
```

### Password Hashing

```
Password
    │
    ▼
Generate Salt (bcrypt rounds: 10)
    │
    ▼
Hash Password with Salt
    │
    ▼
Store Hash in Database
    │
    ▼
(Never store plain passwords)
```

## Data Consistency

### Vote Recording Transaction

```
Start Transaction
        │
        ├─ Verify Election Active
        ├─ Check No Duplicate Vote
        ├─ Validate Candidate Approved
        ├─ Check Department Restrictions
        │
        ├─ INSERT Vote Record
        ├─ INCREMENT Candidate Votes
        ├─ UPDATE User hasVoted
        ├─ UPDATE Election totalVotes
        │
        ├─ Commit on Success
        └─ Rollback on Any Error
```

## Caching Strategy

### React Query Caching

```
Component Mounts
        │
        ▼
Check Query Cache
        │
        ├─ Found & Fresh    ─→ Use Cached Data
        ├─ Found & Stale    ─→ Use Cache + Background Refetch
        └─ Not Found        ─→ Fetch from Server
        │
        ▼
Update Component
        │
        ▼
Cache Invalidation (on mutation)
```

### Cache Keys

```
Query Keys Used:
- ['candidates']           - All candidates
- ['voteStatus']          - User's vote status
- ['results']             - Election results
- ['election']            - Election status
- ['user']                - Current user profile
```

## Error Handling

### Backend Error Flow

```
Request Processing
        │
        ├─ Validation Error
        │  │
        │  ▼
        │ Return 400 Bad Request
        │
        ├─ Authentication Error
        │  │
        │  ▼
        │ Return 401 Unauthorized
        │
        ├─ Authorization Error
        │  │
        │  ▼
        │ Return 403 Forbidden
        │
        ├─ Not Found
        │  │
        │  ▼
        │ Return 404 Not Found
        │
        └─ Server Error
           │
           ▼
        Log Error + Return 500
```

### Frontend Error Handling

```
API Error Caught
        │
        ├─ 401 Unauthorized
        │  │
        │  ▼
        │ Clear Auth + Redirect to Login
        │
        ├─ Other Error
        │  │
        │  ▼
        │ Show Toast Notification
        │
        └─ Mutation Error
           │
           ▼
        Store in Error State
```

## Performance Optimizations

### Backend Optimizations

1. **Database Indexing**
   - Email (unique)
   - RegNumber (unique)
   - Position + Department pair
   - voterId + position (unique constraint)

2. **Query Optimization**
   - Populate foreign keys efficiently
   - Aggregate votes at query time
   - Pagination for large datasets

3. **Caching Strategy**
   - Election status cached in memory
   - Vote counts calculated on-demand
   - Results aggregated efficiently

### Frontend Optimizations

1. **Component Optimization**
   - Lazy loading routes
   - Memoization of heavy components
   - Virtualization for long lists

2. **Data Fetching**
   - React Query automatic caching
   - Background refetching
   - Stale-while-revalidate pattern

3. **Bundle Size**
   - Tree-shaking unused code
   - Dynamic imports for large charts
   - CSS pruning with Tailwind

## Scalability Considerations

### Horizontal Scaling
- Stateless backend servers
- MongoDB replication set
- Load balancer for API
- CDN for static assets

### Vertical Scaling
- Database indexing
- Query optimization
- Caching layer (Redis)
- Read replicas

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│              Production Architecture        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │      CDN / Static Hosting             │ │
│  │  (React Build - dist folder)          │ │
│  └───────────────┬───────────────────────┘ │
│                  │                         │
│  ┌───────────────▼───────────────────────┐ │
│  │      Load Balancer                    │ │
│  │  (Nginx / CloudFlare)                 │ │
│  └───────────────┬───────────────────────┘ │
│                  │                         │
│      ┌───────────┬───────────┐             │
│      │           │           │             │
│  ┌───▼─┐    ┌────▼──┐   ┌───▼───┐        │
│  │ API  │    │ API   │   │ API   │        │
│  │ v1   │    │ v2    │   │ v3    │        │
│  └───┬──┘    └───┬───┘   └───┬───┘        │
│      │           │           │             │
│  ┌───▼───────────▼───────────▼───────────┐ │
│  │    MongoDB Atlas Cluster              │ │
│  │    (Replicated, Backed up)            │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests
- Models validation
- Utility functions
- Helper functions

### Integration Tests
- API endpoints
- Database operations
- Auth workflow

### E2E Tests
- User login flow
- Voting process
- Results display
- Admin panel

### Manual Testing Checklist
- [ ] Login with all user roles
- [ ] Vote casting workflow
- [ ] Results update in real-time
- [ ] Admin controls function
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Offline vote handling

## Monitoring & Logging

### Backend Logging
- Request logging middleware
- Error logging with stack traces
- Database operation timing
- Authentication attempts

### Frontend Logging
- Component lifecycle tracking
- API request/response logging
- Error boundary catches
- Performance metrics

### Metrics to Monitor
- API response times
- Database query times
- Error rates
- Voter turnout
- System uptime

---

**Last Updated**: April 2026  
**Version**: 1.0.0
