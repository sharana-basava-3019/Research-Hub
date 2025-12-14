# 🚀 Production Setup Quickstart

This guide will help you quickly set up RESEARCH-HUB for production deployment.

## ⚡ Quick Start (5 minutes)

### 1. Configure Environment Variables

#### Backend Configuration
```bash
cd server
cp .env.production .env
```

**🚨 REQUIRED: Edit `server/.env` and update these critical values:**

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in .env:
JWT_SECRET=<paste-generated-secret-here>
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/research-hub
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Frontend Configuration
```bash
cd FRONTEND
cp .env.production .env.production.local
```

**Edit `FRONTEND/.env.production.local`:**
```bash
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### 2. Build the Application

#### Windows:
```powershell
.\deploy-production.ps1
```

#### Linux/Mac:
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

Or manually:
```bash
# Install dependencies
cd server && npm install --production && cd ..
cd FRONTEND && npm install && cd ..

# Build frontend
cd FRONTEND && npm run build && cd ..
```

### 3. Test Locally (Optional)

```bash
# Start backend
cd server
npm start

# Backend should be running on http://localhost:5000
# Frontend build files are in FRONTEND/build/
```

### 4. Deploy

Choose your deployment method:
- **[Full Deployment Guide](./PRODUCTION_DEPLOYMENT.md)** - Comprehensive deployment instructions
- **Quick options:**
  - Backend: Heroku, Railway, Render, DigitalOcean, AWS
  - Frontend: Vercel, Netlify, Cloudflare Pages

## 🔍 Verify Configuration

Before deploying, verify these are set:

**Backend (`server/.env`):**
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` (32+ random characters)
- ✅ `MONGO_URI` (production database)
- ✅ `CORS_ORIGINS` (your frontend URLs)

**Frontend (`.env.production.local`):**
- ✅ `REACT_APP_API_URL` (your API URL)

## 📊 Post-Deployment Checks

After deployment, verify:

```bash
# 1. API Health Check
curl https://api.yourdomain.com/health

# 2. API Documentation
# Visit: https://api.yourdomain.com/api-docs

# 3. Frontend
# Visit: https://yourdomain.com
```

## 🆘 Quick Troubleshooting

**CORS Errors?**
- Check `CORS_ORIGINS` matches your frontend URL exactly
- No trailing slashes
- Include protocol (https://)

**500 Errors?**
- Check backend logs
- Verify MongoDB connection string
- Ensure JWT_SECRET is set

**Can't connect to API?**
- Verify `REACT_APP_API_URL` is correct
- Check API is running
- Verify CORS is configured

## 📚 Full Documentation

- **[Complete Deployment Guide](./PRODUCTION_DEPLOYMENT.md)** - Step-by-step instructions
- **[API Documentation](./API.md)** - API endpoints reference
- **[Security Guide](../COLLABORATION_SECURITY_AUDIT.md)** - Security best practices

## 🔐 Security Reminders

- ✅ Never commit `.env` files
- ✅ Use strong, random JWT secrets
- ✅ Restrict CORS to your domains only
- ✅ Use HTTPS in production
- ✅ Regular security updates: `npm audit fix`
- ✅ Enable MongoDB Atlas IP whitelist
- ✅ Set up automated backups

## 📞 Need Help?

- Check the [Full Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- Review error logs
- Check environment variables
- Verify all dependencies are installed

---

**Ready to deploy?** Follow the [Complete Deployment Guide](./PRODUCTION_DEPLOYMENT.md) for detailed instructions.
