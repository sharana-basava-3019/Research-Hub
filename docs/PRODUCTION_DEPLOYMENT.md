# RESEARCH-HUB Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration

#### Backend (.env.production)
```bash
cd server
cp .env.production .env
```

Update the following critical values:
- [ ] `MONGO_URI` - Production MongoDB connection string
- [ ] `JWT_SECRET` - Strong random secret (32+ characters)
- [ ] `CORS_ORIGINS` - Your production frontend URL(s)
- [ ] `NODE_ENV=production`

Generate secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend (.env.production)
```bash
cd FRONTEND
cp .env.production .env.production.local
```

Update:
- [ ] `REACT_APP_API_URL` - Your production API URL

### 2. Security Verification

- [ ] All hardcoded URLs removed
- [ ] Environment variables configured
- [ ] CORS properly restricted to your domain
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] MongoDB injection protection enabled
- [ ] Strong JWT secret set

### 3. Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create database user with password
4. Whitelist IP addresses (or use 0.0.0.0/0 for all)
5. Get connection string
6. Update `MONGO_URI` in .env

#### Option B: Self-Hosted MongoDB
1. Install MongoDB on your server
2. Configure authentication
3. Set up backups
4. Update `MONGO_URI` in .env

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
# Backend
cd server
npm install --production

# Frontend
cd ../FRONTEND
npm install
```

### Step 2: Build Frontend

```bash
cd FRONTEND
npm run build
```

This creates an optimized production build in the `build/` directory.

### Step 3: Deploy Backend

#### Option A: Deploy on VPS (DigitalOcean, Linode, AWS EC2)

1. **SSH into your server**
```bash
ssh user@your-server-ip
```

2. **Install Node.js and MongoDB**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone your repository**
```bash
git clone https://github.com/yourusername/research-hub.git
cd research-hub/server
```

4. **Install dependencies**
```bash
npm install --production
```

5. **Set up environment**
```bash
nano .env
# Paste your production environment variables
```

6. **Install PM2 (Process Manager)**
```bash
sudo npm install -g pm2
```

7. **Start the application**
```bash
pm2 start server.js --name research-hub-api
pm2 save
pm2 startup
```

8. **Set up Nginx as reverse proxy**
```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/research-hub
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/research-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Set up SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

#### Option B: Deploy on Heroku

1. **Install Heroku CLI**
2. **Create Heroku app**
```bash
cd server
heroku create your-app-name
```

3. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-secret"
heroku config:set CORS_ORIGINS="https://yourdomain.com"
```

4. **Deploy**
```bash
git push heroku main
```

#### Option C: Deploy on Vercel/Railway/Render

Follow platform-specific documentation for Node.js apps.

### Step 4: Deploy Frontend

#### Option A: Vercel (Recommended for React)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd FRONTEND
vercel --prod
```

3. **Configure environment variables in Vercel dashboard**

#### Option B: Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Deploy**
```bash
cd FRONTEND
netlify deploy --prod --dir=build
```

3. **Configure environment variables in Netlify dashboard**

#### Option C: Static Hosting (Nginx on same server)

```bash
# Copy build files to web server
sudo cp -r FRONTEND/build/* /var/www/html/

# Configure Nginx
sudo nano /etc/nginx/sites-available/research-hub-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/research-hub-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔍 Post-Deployment Verification

### 1. Health Checks

```bash
# API Health
curl https://api.yourdomain.com/health

# Test Authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 2. Frontend Testing

- [ ] Visit your domain
- [ ] Test login/registration
- [ ] Test project creation
- [ ] Test file uploads
- [ ] Test collaboration features
- [ ] Check browser console for errors

### 3. Monitor Logs

```bash
# PM2 Logs
pm2 logs research-hub-api

# Nginx Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Maintenance

### Update Application

```bash
# Backend
cd server
git pull
npm install --production
pm2 restart research-hub-api

# Frontend
cd FRONTEND
git pull
npm install
npm run build
# Deploy new build
```

### Database Backup

```bash
# MongoDB backup
mongodump --uri="your-mongodb-uri" --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="your-mongodb-uri" /backups/20241128
```

### Monitor Application

```bash
# Server status
pm2 status

# Memory usage
pm2 monit

# Application logs
pm2 logs
```

## 🚨 Troubleshooting

### Issue: CORS Errors
- Verify `CORS_ORIGINS` includes your frontend URL
- Check browser console for exact origin
- Ensure no trailing slash in origins

### Issue: 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs`
- Verify port 5000 is not blocked

### Issue: MongoDB Connection Failed
- Verify `MONGO_URI` is correct
- Check if IP is whitelisted in MongoDB Atlas
- Test connection: `mongosh "your-connection-string"`

### Issue: JWT Token Invalid
- Verify `JWT_SECRET` matches between deployments
- Check token expiration time
- Clear browser localStorage and re-login

## 📊 Performance Optimization

### Backend
- [ ] Enable MongoDB indexes
- [ ] Set up Redis for caching
- [ ] Configure CDN for static files
- [ ] Enable gzip compression in Nginx

### Frontend
- [ ] Use CDN for build files
- [ ] Enable browser caching
- [ ] Lazy load images
- [ ] Code splitting optimization

## 🔐 Security Best Practices

- [ ] Regular security updates: `npm audit fix`
- [ ] Monitor failed login attempts
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Enable 2FA for admin accounts
- [ ] Regular penetration testing
- [ ] Monitor error logs for suspicious activity

## 📞 Support

For deployment issues, check:
- GitHub Issues
- Documentation: `/docs`
- API Documentation: `https://api.yourdomain.com/api-docs`

---

**Last Updated:** November 28, 2025
