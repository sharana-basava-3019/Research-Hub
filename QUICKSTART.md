# RESEARCH-HUB - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and run RESEARCH-HUB locally.

---

## Prerequisites

Make sure you have installed:
- **Node.js** (v16+): https://nodejs.org/
- **Python** (v3.8+): https://www.python.org/
- **MongoDB** (local or Atlas): https://www.mongodb.com/
- **Git**: https://git-scm.com/

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/RESEARCH-HUB.git
cd RESEARCH-HUB
```

---

## Step 2: Setup Backend (Node.js)

### Install Dependencies
```bash
cd server
npm install
```

### Configure Environment
Create `.env` file:
```bash
copy .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/research-hub
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
ANALYTICS_API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
```

### Seed Database
```bash
npm run seed
```

### Start Server
```bash
npm run dev
```

✅ **Backend running at**: http://localhost:5000

---

## Step 3: Setup Python Analytics

### Install Dependencies
```bash
cd analytics
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment
Create `.env` file:
```bash
copy .env.example .env
```

### Start Analytics Service
```bash
python app.py
```

✅ **Analytics running at**: http://localhost:8000

---

## Step 4: Setup Frontend (React)

### Install Dependencies
```bash
cd client
npm install
```

### Configure Environment
Create `.env` file:
```bash
copy .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ANALYTICS_URL=http://localhost:8000
```

### Start Development Server
```bash
npm start
```

✅ **Frontend running at**: http://localhost:3000

---

## Step 5: Test the Application

### Login with Demo Account
```
Email: alice@university.edu
Password: password123
Role: Admin
```

### Available Users (from seed data):
1. **Alice Johnson** - alice@university.edu (Admin)
2. **Bob Smith** - bob@university.edu
3. **Carol Davis** - carol@university.edu
4. **David Wilson** - david@university.edu
5. **Emma Martinez** - emma@university.edu

All passwords: `password123`

---

## 🎯 What to Try Next

### 1. Explore Projects
- Browse existing research projects
- View project details
- Filter by research area or keywords

### 2. Create a Project
- Click "Create Project" button
- Fill in project details
- Add collaborators

### 3. Send Collaboration Requests
- Find researchers with similar interests
- Send collaboration requests
- Accept/reject incoming requests

### 4. View Analytics
- Check your dashboard
- See trending topics
- Get collaborator recommendations

### 5. Admin Panel (if admin)
- Manage users
- View all projects
- Monitor platform activity

---

## 📁 Project Structure

```
RESEARCH-HUB/
├── server/              # Node.js Backend
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, validation
│   └── server.js        # Entry point
│
├── FRONTEND/            # React Frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── services/    # API services
│   └── package.json
│
├── analytics/           # Python Analytics
│   ├── services/        # ML services
│   ├── app.py          # Flask app
│   └── requirements.txt
│
├── docs/               # Documentation
└── postman/            # API testing
```

---

## 🔍 API Endpoints

### Health Check
```bash
# Backend
curl http://localhost:5000/health

# Analytics
curl http://localhost:8000/health
```

### Swagger Documentation
http://localhost:5000/api-docs

---

## 🛠️ Development Commands

### Backend
```bash
npm run dev      # Start with nodemon
npm start        # Start production
npm run seed     # Seed database
npm test         # Run tests
```

### Frontend
```bash
npm start        # Development server
npm run build    # Production build
npm test         # Run tests
npm run lint     # Lint code
```

### Analytics
```bash
python app.py    # Start server
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas
# Update MONGO_URI in .env
```

### Port Already in Use
```bash
# Change PORT in .env files
# Backend: PORT=5001
# Analytics: PORT=8001
# Frontend: change in package.json
```

### Module Not Found
```bash
# Backend/Frontend
npm install

# Analytics
pip install -r requirements.txt
```

### CORS Errors
```bash
# Update CORS_ORIGINS in server/.env
CORS_ORIGINS=http://localhost:3000
```

---

## 📚 Next Steps

1. **Read Documentation**
   - [API Documentation](docs/API.md)
   - [Deployment Guide](docs/DEPLOYMENT.md)

2. **Import Postman Collection**
   - File: `postman/RESEARCH-HUB.postman_collection.json`
   - Test all API endpoints

3. **Customize**
   - Update branding/colors in Tailwind config
   - Modify models as needed
   - Add new features

4. **Deploy**
   - Follow deployment guide
   - Deploy to Render/Vercel/Railway

---

## 💡 Tips

- Use **ESLint** and **Prettier** for code formatting
- Check **Swagger docs** for complete API reference
- Monitor **console logs** for debugging
- Use **React DevTools** for frontend debugging
- Check **MongoDB Compass** for database inspection

---

## 🆘 Need Help?

- Check the logs in terminal
- Review error messages
- Verify environment variables
- Ensure all services are running
- Check MongoDB connection

---

## 📧 Support

For issues or questions:
- Email: support@research-hub.edu
- GitHub Issues: [Create an issue](https://github.com/yourusername/research-hub/issues)

---

**Happy Coding! 🎉**

Built with ❤️ for academic research collaboration
