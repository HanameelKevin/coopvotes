# 🚀 Deployment Guide

Production deployment checklist and instructions for CoopVotes.

## Pre-Deployment Checklist

### Code Review
- [ ] All sensitive data removed from code (JWT secrets, passwords, keys)
- [ ] Error messages don't leak system information
- [ ] Debugging code removed
- [ ] Console.log statements cleaned up (keep only critical logs)
- [ ] Test data/routes removed or disabled

### Security
- [ ] JWT_SECRET changed to strong random value (32+ chars)
- [ ] CORS whitelist configured for production domain
- [ ] HTTPS enabled
- [ ] Database access restricted to app IP
- [ ] API rate limiting configured
- [ ] CSRF protection in place (if needed)
- [ ] Helmet.js security headers active
- [ ] Input validation on all endpoints

### Performance
- [ ] Database indexes verified
- [ ] Queries optimized
- [ ] Images optimized
- [ ] Caching strategy implemented
- [ ] CDN configured (if applicable)
- [ ] Frontend bundle analyzed for size
- [ ] Minification enabled

### Testing
- [ ] All endpoint tests passing
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Load testing performed
- [ ] Backup & recovery procedures tested
- [ ] Rollback procedures documented

---

## Backend Deployment

### Option 1: Heroku

```bash
# 1. Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create app
heroku create coopvotes-api

# 4. Set environment variables
heroku config:set -a coopvotes-api \
  JWT_SECRET=$(openssl rand -hex 32) \
  JWT_EXPIRE=7d \
  NODE_ENV=production \
  FRONTEND_URL=https://yourdomain.com \
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/coopvotes

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs -a coopvotes-api -t

# 7. Verify
curl https://coopvotes-api.herokuapp.com/api/health
```

### Option 2: DigitalOcean App Platform

```yaml
# app.yaml
name: coopvotes-api
services:
- name: backend
  github:
    repo: your-org/coopvotes
    branch: main
  build_command: npm install
  run_command: npm start
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    scope: RUN_AND_BUILD_TIME
    value: ${JWT_SECRET}
  - key: MONGODB_URI
    scope: RUN_AND_BUILD_TIME
    value: ${MONGODB_URI}
  http_port: 5000
```

### Option 3: AWS EC2

```bash
# 1. SSH into EC2 instance
ssh -i key.pem ubuntu@instance-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://github.com/your-org/coopvotes.git
cd coopvotes/server

# 4. Create .env file
cat > .env << EOF
PORT=5000
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://yourdomain.com
EOF

# 5. Install dependencies
npm install

# 6. Start with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "coopvotes" -- start
pm2 save

# 7. Configure Nginx reverse proxy
# (See Nginx configuration section)
```

### Option 4: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build and push
docker build -t yourdockerhub/coopvotes:1.0.0 .
docker push yourdockerhub/coopvotes:1.0.0

# Run with environment file
docker run -d \
  --name coopvotes \
  --env-file .env.production \
  -p 5000:5000 \
  yourdockerhub/coopvotes:1.0.0
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended for React)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy from client directory
cd client
vercel

# 3. During deployment, set environment variables:
# VITE_API_URL=https://api.yourdomain.com/api

# 4. Link to custom domain (optional)
vercel domains add yourdomain.com
```

### Option 2: Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build and deploy
cd client
npm run build
netlify deploy --prod --dir=dist

# 3. Set environment variable
# In Netlify UI: Settings → Build & Deploy → Environment
# VITE_API_URL=https://api.yourdomain.com/api
```

### Option 3: GitHub Pages

```bash
# Copy dist to gh-pages branch
cd client
npm run build
git checkout -b gh-pages
git add -f dist
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages:gh-pages

# Enable GitHub Pages in repo settings
# Source: gh-pages branch
# Custom domain: yourdomain.com (if desired)
```

### Option 4: AWS S3 + CloudFront

```bash
# 1. Build
cd client
npm run build

# 2. Create S3 bucket
aws s3api create-bucket \
  --bucket coopvotes-frontend \
  --region us-east-1

# 3. Enable static website hosting
aws s3 website s3://coopvotes-frontend/ \
  --index-document index.html \
  --error-document index.html

# 4. Upload build
aws s3 sync dist/ s3://coopvotes-frontend/ --delete

# 5. Create CloudFront distribution (UI recommended)
# Set default root to index.html
# Set error document to index.html (for SPA routing)
```

---

## Database Deployment

### MongoDB Atlas (Recommended)

```bash
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create account and free cluster
# 3. Create database user
# 4. Add IP whitelist (0.0.0.0/0 for testing, restrict for production)
# 5. Get connection string
# 6. Update MONGODB_URI in server .env

# Example:
# MONGODB_URI=mongodb+srv://user:password@cluster0.mongodb.net/coopvotes?retryWrites=true&w=majority

# Test connection
mongo "mongodb+srv://user:password@cluster0.mongodb.net/coopvotes"
```

### Self-Hosted MongoDB on AWS EC2

```bash
# 1. Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 2. Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 3. Seed database
# Copy seed.js to server, then:
# NODE_ENV=production MONGO_URI=mongodb://localhost:27017/coopvotes node seeders/seed.js

# 4. Backup strategy
# Daily backup to S3
# 0 2 * * * mongodump --out /backups/$(date +\%Y\%m\%d) && aws s3 sync /backups s3://coopvotes-backups/
```

### Backup Strategy

```bash
# MongoDB Atlas automatic backups (enable in console)
# Manual backup before deployment
mongodump --uri "mongodb+srv://..." --out=./backup

# Restore from backup
mongorestore --uri "mongodb+srv://..." ./backup
```

---

## DNS & SSL Setup

### Route53 (AWS) or Similar

```bash
# 1. Update DNS records
# A record: api.yourdomain.com → Load Balancer IP / Heroku DNS
# CNAME record: www.yourdomain.com → yourdomain.com
# A record: yourdomain.com → CDN / S3 CloudFront

# 2. SSL Certificate (free with Let's Encrypt)
# If using Certbot:
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## Nginx Reverse Proxy (EC2)

```nginx
# /etc/nginx/sites-available/coopvotes

upstream backend {
    server localhost:5000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS backend
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend (if serving from same server)
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    root /var/www/coopvotes/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api.yourdomain.com;
    }
}
```

## PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "coopvotes",
    script: "npm",
    args: "start",
    cwd: "./server",
    error_file: "./logs/pm2-error.log",
    out_file: "./logs/pm2-out.log",
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    },
    watch: false,
    ignore_watch: ["node_modules", "logs"],
    instances: "max",
    exec_mode: "cluster"
  }]
};

// Usage
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Monitoring & Logging

### Application Insights (Azure) / Datadog

```bash
# Install monitoring agent
npm install applicationinsights
# or
npm install dd-trace
```

### CloudWatch (AWS)

```bash
# Install CloudWatch agent
npm install aws-sdk

# Configure in app
const cloudwatch = new AWS.CloudWatch();

// Send metrics
cloudwatch.putMetricData({
    Namespace: 'CoopVotes',
    MetricData: [{
        MetricName: 'VotesCast',
        Value: count,
        Unit: 'Count'
    }]
}).promise();
```

### LogStash / ELK Stack

```bash
# Install winston for logging
npm install winston winston-elasticsearch

# Configure
const logger = winston.createLogger({
    transports: [
        new winston.transports.Elasticsearch({
            level: 'info',
            clientOpts: { node: 'https://elasticsearch:9200' }
        })
    ]
});

logger.info('Election started');
```

---

## Post-Deployment Testing

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Response should be:
# {"success":true,"message":"CoopVotes API is running","timestamp":"2026-04-10T..."}

# Database connection
curl https://api.yourdomain.com/api/candidates

# Frontend
curl https://yourdomain.com | grep "html"
```

### Smoke Tests

```bash
# Test login endpoint
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coop.ac.ke","regNumber":"ADMIN/001"}'

# Test results endpoint
curl https://api.yourdomain.com/api/vote/results

# Test frontend loads
curl https://yourdomain.com | grep "CoopVotes"
```

### Load Testing (k6)

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let response = http.get('https://api.yourdomain.com/api/vote/results');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

```bash
# Run
k6 run load-test.js
```

---

## Rollback Procedure

### Git Rollback

```bash
# Revert to previous commit
git revert <commit-hash>
git push

# Rebuild and redeploy (service will auto-redeploy)
```

### Database Rollback

```bash
# From MongoDB backup
mongorestore --uri "mongodb+srv://..." \
  --archive=backup-$(date +%Y%m%d).archive
```

---

## Maintenance & Updates

### Weekly Checks
- [ ] Reviews logs for errors
- [ ] Check storage usage (database, backups)
- [ ] Verify backups completed
- [ ] Monitor API response times

### Monthly Tasks
- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit fix`
- [ ] Review performance metrics
- [ ] Update SSL certificates (if self-hosted)

### Quarterly Tasks
- [ ] Security penetration testing
- [ ] Performance optimization review
- [ ] Capacity planning
- [ ] Update documentation

---

## Disaster Recovery

### Plan A: Database Corruption
1. Restore from latest backup
2. Verify election data integrity
3. Notify users
4. Clear vote cache
5. Resync from backup

### Plan B: Authentication Failure
1. Revert JWT changes
2. Roll back to previous commit
3. Verify auth middleware
4. Test with seed data

### Plan C: Complete Outage
1. Switch to backup instance
2. Point DNS to backup
3. Restore database
4. Verify functionality
5. Communicate status

---

## Cost Optimization

### Services & Approximate Monthly Costs
- **MongoDB Atlas**: $0 - $500 (free to advanced)
- **Heroku**: $7 - $50 (Eco Dynos recommended)
- **Vercel/Netlify**: $0 - $20 (free tier available)
- **AWS EC2**: $5 - $100 (t3.micro free for 1 year)
- **Domain**: $10 - $15 (annual)

---

## Checklist for First Production Deployment

- [ ] All secrets changed (JWT_SECRET, DB URI, etc.)
- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] SSL/HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring alerts set up
- [ ] Smoke tests passing
- [ ] Load tests acceptable
- [ ] Team trained on rollback
- [ ] On-call rotation established
- [ ] Documentation updated
- [ ] Initial data backup taken

---

**Ready to deploy? Start with Option 1 (Heroku) for fastest deployment!**

---

**Last Updated**: April 2026  
**Version**: 1.0.0
