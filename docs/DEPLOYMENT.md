# RESEARCH-HUB Deployment Guide

## Overview
This guide covers deploying RESEARCH-HUB to production using Render, Vercel, and Railway.

---

## Prerequisites

- GitHub account
- Render account (for backend & analytics)
- Vercel account (for frontend)
- MongoDB Atlas account (for database)

---

## 1. Database Deployment (MongoDB Atlas)

### Steps:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier available)
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/research-hub
   ```

---

## 2. Backend Deployment (Render)

### Steps:
1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `research-hub-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node

6. Add Environment Variables:
   ```
   PORT=10000
   NODE_ENV=production
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_super_secret_key_here
   JWT_EXPIRE=7d
   ANALYTICS_API_URL=https://your-analytics-service.railway.app
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

7. Click "Create Web Service"
8. Note your API URL: `https://research-hub-api.onrender.com`

---

## 3. Python Analytics Deployment (Railway)

### Steps:
1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `analytics`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

5. Add Environment Variables:
   ```
   FLASK_ENV=production
   PORT=8000
   MONGO_URI=mongodb+srv://...
   ```

6. Click "Deploy"
7. Note your Analytics URL: `https://your-analytics.railway.app`

---

## 4. Frontend Deployment (Vercel)

### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://research-hub-api.onrender.com/api
   REACT_APP_ANALYTICS_URL=https://your-analytics.railway.app
   REACT_APP_NAME=RESEARCH-HUB
   ```

6. Click "Deploy"
7. Your app will be live at: `https://your-app.vercel.app`

---

## 5. Post-Deployment Setup

### Seed Database
```bash
# Run this on your local machine
MONGO_URI=your_atlas_connection_string node server/utils/seedData.js
```

### Update CORS Origins
Update backend environment variable:
```
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
```

### Test API
```bash
curl https://research-hub-api.onrender.com/health
```

---

## 6. Custom Domain Setup (Optional)

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Render (Backend)
1. Go to Service → Settings → Custom Domains
2. Add your API subdomain (api.yourdomain.com)
3. Update DNS records

---

## 7. Environment Variables Summary

### Backend (.env)
```env
PORT=10000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/research-hub
JWT_SECRET=super_secret_key_change_this
JWT_EXPIRE=7d
ANALYTICS_API_URL=https://analytics.railway.app
CORS_ORIGINS=https://app.vercel.app
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://api.onrender.com/api
REACT_APP_ANALYTICS_URL=https://analytics.railway.app
```

### Analytics (.env)
```env
FLASK_ENV=production
PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/research-hub
```

---

## 8. Monitoring & Maintenance

### Logs
- **Render**: Dashboard → Logs tab
- **Railway**: Project → Deployments → View Logs
- **Vercel**: Project → Deployments → Function Logs

### Scaling
- **Render**: Upgrade plan for more resources
- **Railway**: Auto-scales based on usage
- **Vercel**: Serverless, auto-scales

### Backups
- MongoDB Atlas provides automated backups
- Download backups regularly

---

## 9. Troubleshooting

### API Not Connecting
- Check CORS settings
- Verify environment variables
- Check API URL in frontend

### Database Connection Failed
- Verify MongoDB connection string
- Check IP whitelist in Atlas
- Ensure database user has correct permissions

### Build Failures
- Check build logs
- Verify all dependencies in package.json
- Ensure environment variables are set

---

## 10. Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Environment variables configured
- [ ] Backend deployed on Render
- [ ] Analytics deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] Database seeded with initial data
- [ ] CORS configured correctly
- [ ] API endpoints tested
- [ ] SSL certificates active
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring set up
- [ ] Backups configured

---

## Support

For deployment issues:
- Check service status pages
- Review deployment logs
- Contact platform support:
  - Render: https://render.com/support
  - Vercel: https://vercel.com/support
  - Railway: https://railway.app/help

---

**Last Updated**: November 2025
