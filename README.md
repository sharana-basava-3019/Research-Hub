# RESEARCH-HUB: University Research Collaboration Platform

A comprehensive full-stack platform for university research collaboration and analytics, built using the NiceSchool template design.

## 🎯 Project Overview

RESEARCH-HUB is an academic research collaboration platform that enables researchers to:
- Create and manage research projects
- Find and collaborate with other researchers
- Get AI-powered recommendations for collaborators
- Analyze trending research topics
- Track research activities with interactive dashboards

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Analytics**: Python (Flask/FastAPI) with NLP
- **Authentication**: JWT (JSON Web Tokens)
- **Version Control**: Git & GitHub

### Folder Structure
```
RESEARCH-HUB/
├── FRONTEND/                  # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── context/          # React context
│   │   ├── utils/            # Utility functions
│   │   └── App.js
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                    # Node.js Backend
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/               # Mongoose models
│   ├── routes/               # API routes
│   ├── utils/                # Utility functions
│   ├── server.js             # Entry point
│   └── package.json
│
├── analytics/                 # Python Analytics Service
│   ├── app.py                # Flask/FastAPI entry
│   ├── models/               # ML models
│   ├── services/             # Analytics services
│   ├── requirements.txt
│   └── config.py
│
├── docs/                      # Documentation
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── postman/                   # Postman collection
│   └── RESEARCH-HUB.postman_collection.json
│
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or Atlas)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/research-hub.git
cd research-hub
```

### 2. Backend Setup (Node.js)
```bash
cd server
npm install
```

Create `.env` file in server directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/research-hub
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
ANALYTICS_API_URL=http://localhost:8000
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

### 3. Frontend Setup (React)
```bash
cd FRONTEND
npm install
```

Create `.env` file in FRONTEND directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the development server:
```bash
npm start
```

### 4. Analytics Service Setup (Python - Optional)
The analytics service is optional and the system will work without it.

```bash
cd analytics
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file in analytics directory:
```env
FLASK_APP=app.py
FLASK_ENV=development
PORT=8000
MONGO_URI=mongodb://localhost:27017/research-hub
```

Start the analytics service:
```bash
python app.py
```

## 📊 Database Setup

### MongoDB Schema Collections
- **Users**: Researcher profiles and authentication
- **Projects**: Research projects and metadata
- **Collaborations**: Collaboration requests and status
- **Comments**: Project discussions
- **AnalyticsData**: Cached analytics and recommendations

### Seed Data
```bash
cd server
npm run seed
```

## 🔐 Authentication Flow

1. User registers with email and password
2. Password is hashed using bcrypt
3. JWT token is generated upon login
4. Token is stored in localStorage/cookies
5. Protected routes validate JWT on each request

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user
- `PUT /updateprofile` - Update user profile

### Users (`/api/users`)
- `GET /` - Get all users (admin)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (admin)

### Projects (`/api/projects`)
- `GET /` - Get all projects
- `GET /:id` - Get project by ID
- `POST /` - Create new project
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

### Collaborations (`/api/collaborations`)
- `GET /` - Get user's collaborations
- `POST /` - Send collaboration request
- `PUT /:id/accept` - Accept request
- `PUT /:id/reject` - Reject request
- `DELETE /:id` - Cancel request

### Analytics (`/api/analytics`)
- `GET /recommendations` - Get collaborator recommendations
- `GET /trends` - Get trending topics
- `GET /keywords/:projectId` - Get project keywords

## 🤖 Analytics Features

### Python NLP Service
- **Collaborator Recommendations**: Content-based similarity using TF-IDF
- **Trending Topics**: Keyword frequency analysis
- **Research Clustering**: Group similar research areas
- **Keyword Extraction**: Extract key terms from project descriptions

## 🎨 UI Components (NiceSchool Design)

All components maintain the exact NiceSchool template design:
- Color scheme: Primary blue (#0D6EFD)
- Typography: System fonts with clean hierarchy
- Layout: Responsive grid system
- Navigation: Bootstrap-based navbar
- Cards: Shadow-based card design
- Forms: Styled form inputs with validation

## 📱 Frontend Pages

1. **Login/Register** - JWT authentication with form validation
2. **Dashboard** - Overview with charts and statistics
3. **Profile** - Researcher information and publications
4. **Projects** - CRUD operations for research projects
5. **Collaborations** - Browse and manage collaboration requests
6. **Analytics** - AI-powered recommendations and insights
7. **Admin Panel** - User and project management

## 🧪 Testing

### Postman Collection
Import `postman/RESEARCH-HUB.postman_collection.json` into Postman for API testing.

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🚢 Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `cd server && npm install`
4. Set start command: `node server.js`
5. Add environment variables from `.env`

### Frontend (Vercel)
1. Import project to Vercel
2. Set root directory to `client`
3. Framework preset: Create React App
4. Add environment variables
5. Deploy

### Analytics (Railway)
1. Create new project on Railway
2. Add Python service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`
5. Add environment variables

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Whitelist IP addresses
3. Create database user
4. Update MONGO_URI in all services

## 📖 API Documentation

Swagger documentation available at:
- **Development**: http://localhost:5000/api-docs
- **Production**: https://your-api-url.com/api-docs

## 🚀 Production Deployment

Ready to deploy? Check out our comprehensive deployment guides:

- **[Quick Start Production Guide](./docs/QUICKSTART_PRODUCTION.md)** - 5-minute setup
- **[Complete Deployment Guide](./docs/PRODUCTION_DEPLOYMENT.md)** - Detailed step-by-step
- **[Production Checklist](./docs/PRODUCTION_CHECKLIST.md)** - Ensure everything is ready

### Quick Deploy Commands

```bash
# Windows
.\deploy-production.ps1

# Linux/Mac
chmod +x deploy-production.sh
./deploy-production.sh
```

### Production Requirements
- Node.js 16+ 
- MongoDB Atlas or hosted MongoDB
- HTTPS/SSL certificate
- Domain name configured

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- NiceSchool Template for UI design
- Bootstrap for responsive components
- Chart.js for data visualization
- Natural Language Toolkit (NLTK) for NLP features

## 📧 Contact

For questions or support, email: your.email@university.edu

---

**Note**: This is an academic project for MCA submission. Ensure proper attribution and follow your university's academic integrity guidelines.
