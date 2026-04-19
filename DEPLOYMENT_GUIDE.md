# CoopVotes Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup

Create `.env` file in `/server` directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://coopvotes.cuk.ac.ke

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coopvotes?retryWrites=true&w=majority

# Security Keys (Generate these!)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
COOKIE_SECRET=your-cookie-secret-min-32-chars
VOTE_ENCRYPTION_KEY=your-64-char-hex-encryption-key

# Generate encryption key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Migration

```bash
cd server
node migrations/migrateSecurity.js
```

### 3. Security Tests

```bash
node tests/securityTests.js
```

## Production Deployment Options

### Option 1: AWS Deployment (Recommended)

#### Architecture
```
CloudFront (CDN)
    ↓
Application Load Balancer (HTTPS)
    ↓
ECS/EKS (Docker containers)
    ↓
DocumentDB/MongoDB Atlas
    ↓
S3 (backups/logs)
```

#### Steps

1. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name coopvotes-cluster
```

2. **Create Task Definition**
```json
{
  "family": "coopvotes-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "coopvotes",
    "image": "your-registry/coopvotes:latest",
    "portMappings": [{"containerPort": 5000}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "secrets": [
      {"name": "VOTE_ENCRYPTION_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
    ]
  }]
}
```

3. **Deploy**
```bash
aws ecs run-task --cluster coopvotes-cluster --task-definition coopvotes-server
```

### Option 2: Google Cloud Platform (GCP)

#### Architecture
```
Cloud CDN
    ↓
Cloud Load Balancing
    ↓
Cloud Run / GKE
    ↓
MongoDB Atlas / Firestore
    ↓
Cloud Storage (backups)
```

#### Steps

1. **Build Container**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/coopvotes
```

2. **Deploy to Cloud Run**
```bash
gcloud run deploy coopvotes \
  --image gcr.io/PROJECT_ID/coopvotes \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets VOTE_ENCRYPTION_KEY=vote-key:latest
```

### Option 3: Azure Deployment

```bash
# Create resource group
az group create --name coopvotes-rg --location eastus

# Create container instance
az container create \
  --resource-group coopvotes-rg \
  --name coopvotes \
  --image your-registry/coopvotes:latest \
  --ports 5000 \
  --environment-variables NODE_ENV=production \
  --secrets VOTE_ENCRYPTION_KEY=your-key
```

### Option 4: VPS (DigitalOcean/Linode/AWS EC2)

#### Using Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: coopvotes:latest
    container_name: coopvotes-app
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - VOTE_ENCRYPTION_KEY=${VOTE_ENCRYPTION_KEY}
      - FRONTEND_URL=https://coopvotes.cuk.ac.ke
    volumes:
      - ./logs:/app/logs
    depends_on:
      - redis

  redis:
    image: redis:alpine
    container_name: coopvotes-redis
    restart: always
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    container_name: coopvotes-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  redis-data:
```

#### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name coopvotes.cuk.ac.ke;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name coopvotes.cuk.ac.ke;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://app:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Configuration

### 1. SSL/TLS Certificate

Using Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d coopvotes.cuk.ac.ke

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 2. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. MongoDB Security

```javascript
// Enable authentication
use admin
db.createUser({
  user: "coopvotes",
  pwd: "secure-password",
  roles: [
    { role: "readWrite", db: "coopvotes" },
    { role: "dbAdmin", db: "coopvotes" }
  ]
});

// Connection string
mongodb://coopvotes:secure-password@localhost:27017/coopvotes?authSource=admin
```

### 4. Secrets Management

#### AWS Secrets Manager
```bash
aws secretsmanager create-secret \
  --name coopvotes/prod/encryption-key \
  --secret-string '{"VOTE_ENCRYPTION_KEY":"your-key"}'
```

#### HashiCorp Vault
```bash
vault kv put secret/coopvotes/prod VOTE_ENCRYPTION_KEY=your-key
```

## Monitoring & Alerting

### 1. Application Monitoring (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name coopvotes
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### 2. Health Checks

```bash
# Add to crontab (every 5 minutes)
*/5 * * * * curl -f https://coopvotes.cuk.ac.ke/api/health || pm2 restart coopvotes
```

### 3. Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

## Backup Strategy

### 1. Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backups/coopvotes_$DATE
tar -czf /backups/coopvotes_$DATE.tar.gz /backups/coopvotes_$DATE
rm -rf /backups/coopvotes_$DATE

# Keep last 30 days
find /backups -name "coopvotes_*.tar.gz" -mtime +30 -delete
```

### 2. Automated Backups (AWS S3)

```bash
# Upload to S3
aws s3 cp /backups/coopvotes_$DATE.tar.gz s3://coopvotes-backups/

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket coopvotes-backups \
  --versioning-configuration Status=Enabled
```

## Post-Deployment Verification

### 1. Security Headers

```bash
curl -I https://coopvotes.cuk.ac.ke

# Expected:
# strict-transport-security: max-age=31536000
# x-content-type-options: nosniff
# x-frame-options: DENY
# x-xss-protection: 1; mode=block
```

### 2. Rate Limiting

```bash
# Test auth rate limiting (should fail after 5)
for i in {1..6}; do
  curl -X POST https://coopvotes.cuk.ac.ke/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@student.cuk.ac.ke","regNumber":"C026/000000/2024"}'
done
```

### 3. Vote Verification

```bash
# Cast a test vote (in development only)
curl -X POST https://coopvotes.cuk.ac.ke/api/vote \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"...","position":"President","department":null}'

# Verify the vote
 curl "https://coopvotes.cuk.ac.ke/api/vote/verify?hash=RECEIPT_HASH"
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check network access rules
   - Verify credentials
   - Check connection string format

2. **Encryption Key Error**
   ```
   Error: VOTE_ENCRYPTION_KEY is not set
   ```
   - Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Verify key length: 64 hex characters

3. **CORS Errors**
   - Verify `FRONTEND_URL` in .env
   - Check CORS configuration in server.js

4. **Rate Limiting Too Strict**
   - Adjust limits in `middleware/rateLimiter.js`
   - Consider using Redis for distributed rate limiting

### Emergency Procedures

**If Vote Chain is Broken:**
1. Stop election immediately
2. Preserve database state
3. Contact security team
4. Follow incident response plan

**If Unauthorized Access Detected:**
1. Revoke all sessions
2. Force password reset
3. Review audit logs
4. Block suspicious IPs

## Maintenance

### Regular Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review audit logs
- **Monthly**: Rotate encryption keys (optional)
- **Quarterly**: Security audit

### Updates

```bash
# Update dependencies
npm audit
npm update

# Deploy update
pm2 reload coopvotes --update-env
```

---

**Support**: For deployment issues, contact the CoopVotes technical team.

**Last Updated**: 2024
**Version**: 2.0.0
