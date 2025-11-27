# RESEARCH-HUB API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-api-url.com/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 🔐 Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@university.edu",
  "password": "password123",
  "institution": "Stanford University",
  "department": "Computer Science",
  "designation": "PhD Student",
  "researchInterests": ["Machine Learning", "AI"]
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": { ...user_object },
    "token": "jwt_token_here"
  }
}
```

---

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@university.edu",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": { ...user_object },
    "token": "jwt_token_here"
  }
}
```

---

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@university.edu",
      ...
    }
  }
}
```

---

### 📊 Projects

#### Get All Projects
```http
GET /projects?page=1&limit=10&search=AI&researchArea=ML&status=In Progress
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in title/description
- `researchArea` (string): Filter by research area
- `status` (string): Filter by status
- `keywords` (string): Comma-separated keywords
- `openForCollaboration` (boolean): Filter open projects

**Response:** `200 OK`
```json
{
  "status": "success",
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": {
    "projects": [ ...array_of_projects ]
  }
}
```

---

#### Get Project by ID
```http
GET /projects/:id
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "project": {
      "_id": "project_id",
      "title": "Project Title",
      "description": "...",
      "owner": { ...user_object },
      "collaborators": [ ...array ],
      "comments": [ ...array ],
      ...
    }
  }
}
```

---

#### Create Project
```http
POST /projects
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Research Project",
  "description": "Detailed description...",
  "researchArea": "Artificial Intelligence",
  "keywords": ["AI", "ML", "Deep Learning"],
  "methodology": "CNN-based approach",
  "status": "Planning",
  "isOpenForCollaboration": true,
  "requiredSkills": ["Python", "TensorFlow"],
  "tags": ["AI", "Healthcare"]
}
```

**Response:** `201 Created`

---

#### Update Project
```http
PUT /projects/:id
Authorization: Bearer <token>
```

**Request Body:** (partial update)
```json
{
  "status": "In Progress",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

#### Delete Project
```http
DELETE /projects/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

### 🤝 Collaborations

#### Get User's Collaborations
```http
GET /collaborations?status=Pending&type=received
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Pending | Accepted | Rejected | Cancelled
- `type`: sent | received

**Response:** `200 OK`
```json
{
  "status": "success",
  "count": 5,
  "data": {
    "collaborations": [
      {
        "_id": "collab_id",
        "sender": { ...user_object },
        "receiver": { ...user_object },
        "project": { ...project_object },
        "message": "...",
        "status": "Pending",
        "proposedRole": "Contributor"
      }
    ]
  }
}
```

---

#### Send Collaboration Request
```http
POST /collaborations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "receiverId": "user_id",
  "projectId": "project_id",
  "message": "Would love to collaborate!",
  "proposedRole": "Co-Investigator"
}
```

**Response:** `201 Created`

---

#### Accept Collaboration
```http
PUT /collaborations/:id/accept
Authorization: Bearer <token>
```

**Request Body:** (optional)
```json
{
  "message": "Happy to collaborate!"
}
```

**Response:** `200 OK`

---

#### Reject Collaboration
```http
PUT /collaborations/:id/reject
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

#### Cancel Collaboration
```http
DELETE /collaborations/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

### 📈 Analytics

#### Get Collaborator Recommendations
```http
GET /analytics/recommendations
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "recommendations": [
    {
      "user": { ...user_object },
      "matchScore": 0.85,
      "matchPercentage": 85,
      "matchingInterests": ["AI", "ML"],
      "matchingInterestsCount": 2
    }
  ],
  "count": 10,
  "algorithm": "TF-IDF + Cosine Similarity"
}
```

---

#### Get Trending Topics
```http
GET /analytics/trends
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "trends": {
    "trendingKeywords": [
      {
        "keyword": "machine learning",
        "count": 45,
        "percentage": 30.5,
        "momentum": "rising-fast"
      }
    ],
    "trendingAreas": [ ...array ],
    "totalProjects": 150
  }
}
```

---

#### Get Project Keywords
```http
GET /analytics/keywords/:projectId
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "keywords": [
    {
      "keyword": "deep learning",
      "score": 0.85,
      "confidence": "high"
    }
  ],
  "count": 15
}
```

---

#### Get Analytics Dashboard
```http
GET /analytics/dashboard
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "dashboard": {
      "projects": {
        "total": 5,
        "byStatus": {
          "Planning": 1,
          "In Progress": 3,
          "Completed": 1
        }
      },
      "collaborations": { ...object },
      "totalViews": 1250
    }
  }
}
```

---

### 👥 Users (Admin Only)

#### Get All Users
```http
GET /users?page=1&limit=20
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

---

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

---

#### Update User
```http
PUT /users/:id
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

---

#### Delete User
```http
DELETE /users/:id
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Not authorized. Please login."
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Server Error"
}
```

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

---

## Pagination

List endpoints support pagination:

**Request:**
```http
GET /projects?page=2&limit=20
```

**Response includes:**
```json
{
  "count": 20,
  "total": 150,
  "page": 2,
  "pages": 8,
  "data": { ... }
}
```

---

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:5000/api-docs
```

---

**Version**: 1.0.0  
**Last Updated**: November 2025
