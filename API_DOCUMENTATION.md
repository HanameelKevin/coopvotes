# API Documentation

Complete reference for CoopVotes REST API endpoints.

**Base URL**: `http://localhost:5000/api` (development)

## Table of Contents
- [Authentication](#authentication)
- [Candidates](#candidates)
- [Voting](#voting)
- [Elections](#elections)
- [Error Handling](#error-handling)

---

## Authentication

### Login
Create a new session and get JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@coop.ac.ke",
  "regNumber": "BIT/2022/12345"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@coop.ac.ke",
    "regNumber": "BIT/2022/12345",
    "department": "BIT",
    "departmentName": "Business Information Technology",
    "yearOfStudy": 2,
    "role": "student",
    "hasVoted": false,
    "votedPositions": [],
    "isVerified": true
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid email format or registration number
- `401 Unauthorized`: Email not from @coop.ac.ke domain

---

### Get Current User
Retrieve authenticated user's profile.

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@coop.ac.ke",
    "regNumber": "BIT/2022/12345",
    "department": "BIT",
    "departmentName": "Business Information Technology",
    "yearOfStudy": 2,
    "role": "student",
    "hasVoted": false,
    "votedPositions": ["President"],
    "isVerified": true
  }
}
```

---

### Logout
End current session.

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Election Status
Check if voting is currently active.

```http
GET /auth/election-status
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "election": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Student Government Election 2026",
      "year": 2026,
      "startTime": "2026-04-10T10:00:00Z",
      "endTime": null
    }
  }
}
```

---

## Candidates

### Get All Candidates
Retrieve candidates with optional filters.

```http
GET /candidates?position=President&department=BIT&approved=true
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| position | string | Filter by position (President, Congress Person, Male Delegate, Female Delegate) |
| department | string | Filter by department (BIT, BBM, CS, etc.) |
| approved | boolean | Filter by approval status |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": {
        "_id": "507f1f77bcf86cd799439014",
        "email": "john@coop.ac.ke",
        "regNumber": "BIT/2022/10001"
      },
      "position": "Congress Person",
      "department": "BIT",
      "manifesto": "I will fight for better facilities...",
      "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      "votes": 45,
      "offlineVotes": 10,
      "isApproved": true,
      "totalVotes": 55,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-10T15:30:00Z"
    }
  ]
}
```

---

### Get Single Candidate
Retrieve detailed candidate information.

```http
GET /candidates/:id
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Candidate MongoDB ObjectId |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": {
      "_id": "507f1f77bcf86cd799439014",
      "email": "john@coop.ac.ke",
      "regNumber": "BIT/2022/10001",
      "department": "BIT"
    },
    "position": "Congress Person",
    "department": "BIT",
    "manifesto": "I will fight for better facilities...",
    "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    "votes": 45,
    "offlineVotes": 10,
    "isApproved": true,
    "totalVotes": 55
  }
}
```

---

### Create Candidate
Add a new candidate (Admin only).

```http
POST /candidates
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439014",
  "position": "Congress Person",
  "department": "BIT",
  "manifesto": "I promise to improve campus facilities and student welfare",
  "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
}
```

**Required Fields:**
- userId: Valid User MongoDB ObjectId
- position: One of predefined positions
- manifesto: Max 2000 characters
- department: Required for non-President positions

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439014",
    "position": "Congress Person",
    "department": "BIT",
    "manifesto": "I promise to improve campus facilities...",
    "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    "votes": 0,
    "offlineVotes": 0,
    "isApproved": true
  }
}
```

---

### Update Offline Votes
Record offline votes for a candidate (Admin only).

```http
PATCH /candidates/:id/offlineVotes
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "offlineVotes": 25
}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Candidate MongoDB ObjectId |
| offlineVotes | number | New offline vote count |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "votes": 45,
    "offlineVotes": 25,
    "totalVotes": 70
  }
}
```

---

## Voting

### Cast a Vote
Submit a vote for a candidate.

```http
POST /vote
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "candidateId": "507f1f77bcf86cd799439013",
  "position": "Congress Person",
  "department": "BIT"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| candidateId | string | ✓ | Candidate MongoDB ObjectId |
| position | string | ✓ | Position category |
| department | string | | Required for department positions, null for President |

**Validation Rules:**
- Only students can vote
- One vote per position per user
- Cannot vote for department positions outside your department
- Election must be active

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "vote": {
      "_id": "507f1f77bcf86cd799439015",
      "voterId": "507f1f77bcf86cd799439011",
      "candidateId": "507f1f77bcf86cd799439013",
      "position": "Congress Person",
      "department": "BIT",
      "createdAt": "2026-04-10T15:45:00Z"
    },
    "candidate": {
      "id": "507f1f77bcf86cd799439013",
      "name": "john@coop.ac.ke",
      "totalVotes": 46
    }
  }
}
```

**Errors:**
- `400 Bad Request`: Already voted for this position
- `403 Forbidden`: Cannot vote outside your department
- `404 Not Found`: Candidate not found
- `400 Bad Request`: Election not active

---

### Get Vote Status
Get current user's voting status.

```http
GET /vote/status
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hasVoted": true,
    "votedPositions": [
      {
        "position": "President",
        "department": null,
        "candidateId": "507f1f77bcf86cd799439013",
        "votedAt": "2026-04-10T15:45:00Z"
      },
      {
        "position": "Congress Person",
        "department": "BIT",
        "candidateId": "507f1f77bcf86cd799439014",
        "votedAt": "2026-04-10T15:46:00Z"
      }
    ]
  }
}
```

---

### Get Results
Retrieve current election results.

```http
GET /vote/results
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "election": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Student Government Election 2026",
      "year": 2026,
      "totalVoters": 150,
      "totalVotes": 89,
      "turnout": 59.33
    },
    "results": {
      "President": [
        {
          "id": "507f1f77bcf86cd799439013",
          "name": "john@coop.ac.ke",
          "regNumber": "BIT/2022/10001",
          "votes": 45,
          "offlineVotes": 5,
          "totalVotes": 50
        },
        {
          "id": "507f1f77bcf86cd799439014",
          "name": "jane@coop.ac.ke",
          "regNumber": "BBM/2022/20001",
          "votes": 39,
          "offlineVotes": 0,
          "totalVotes": 39
        }
      ],
      "Congress Person": {
        "BIT": [...],
        "BBM": [...],
        "CS": [...]
      }
    }
  }
}
```

---

### Export Results as CSV
Download results in CSV format (Admin only).

```http
GET /vote/results/export
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```csv
Position,Department,Candidate Email,Reg Number,Online Votes,Offline Votes,Total Votes
President,Global,john@coop.ac.ke,BIT/2022/10001,45,5,50
Congress Person,BIT,jane@coop.ac.ke,BIT/2022/10002,32,3,35
```

---

## Elections

### Get Election Status
Get current election information.

```http
GET /election
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "election": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Student Government Election 2026",
      "year": 2026,
      "status": "active",
      "startTime": "2026-04-10T10:00:00Z",
      "endTime": null,
      "totalVoters": 150,
      "totalVotes": 89,
      "turnout": 59.33
    }
  }
}
```

---

### Start Election
Begin a new election (Admin only).

```http
POST /election/start
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Student Government Election 2026",
  "year": 2026
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "message": "Election started successfully",
    "election": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Student Government Election 2026",
      "year": 2026,
      "isActive": true,
      "status": "active",
      "startTime": "2026-04-10T15:50:00Z",
      "totalVoters": 150,
      "totalVotes": 0
    }
  }
}
```

---

### End Election
Stop the current election (Admin only).

```http
POST /election/end
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Election ended successfully",
    "election": {
      "_id": "507f1f77bcf86cd799439012",
      "isActive": false,
      "status": "completed",
      "endTime": "2026-04-10T16:00:00Z"
    }
  }
}
```

---

### Get Election Statistics
Get detailed election stats (Admin only).

```http
GET /election/:id/stats
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "election": {
      "name": "Student Government Election 2026",
      "status": "active",
      "totalVoters": 150,
      "totalVotes": 89,
      "turnout": 59.33
    },
    "voteCountsByPosition": [
      { "_id": "President", "count": 45 },
      { "_id": "Congress Person", "count": 44 }
    ],
    "candidateStats": [
      { "_id": "President", "totalCandidates": 5, "avgVotes": 9 }
    ]
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

### Common Errors

**Invalid Email Domain**
```json
{
  "success": false,
  "message": "Email must be a @coop.ac.ke address"
}
```

**Invalid Registration Number**
```json
{
  "success": false,
  "message": "Invalid registration number format. Expected: DEPT/YEAR/SEQUENCE"
}
```

**Duplicate Vote**
```json
{
  "success": false,
  "message": "You have already voted for President"
}
```

**Election Not Active**
```json
{
  "success": false,
  "message": "Voting is not currently active"
}
```

**Insufficient Permissions**
```json
{
  "success": false,
  "message": "User role 'student' is not authorized to access this route"
}
```

---

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1712777400
```

When exceeded: `429 Too Many Requests`

---

## Authentication

Include JWT token in request headers:

```http
Authorization: Bearer <your_token_here>
```

Token is valid for 7 days. After expiry, user must login again.

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.bit@coop.ac.ke",
    "regNumber": "BIT/2023/10001"
  }'
```

### Get Results
```bash
curl http://localhost:5000/api/vote/results
```

### Cast Vote
```bash
curl -X POST http://localhost:5000/api/vote \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "507f1f77bcf86cd799439013",
    "position": "Congress Person",
    "department": "BIT"
  }'
```

---

**Last Updated**: April 2026  
**API Version**: 1.0.0
