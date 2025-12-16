# Deployment Guide

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=careerforge-uploads

# External APIs
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...

# Email
SENDGRID_API_KEY=...

# Server
NODE_ENV=production
PORT=5000
```

## Local Development

```bash
cd backend
npm install
npm run dev
```

## Production Deployment

### Prerequisites

- Node.js 18+
- MongoDB Atlas
- AWS S3 bucket
- Stripe account
- SendGrid account

### Build Process

```bash
npm run lint
npm test
npm run build
```

### Server Startup

```bash
NODE_ENV=production npm start
```

## Docker Deployment

### Build Image

```bash
docker build -t careerforge-backend .
```

### Run Container

```bash
docker run -p 5000:5000 --env-file .env careerforge-backend
```

## Monitoring

- Health check: `GET /health`
- Logs: Check `backend/logs/` directory
- Error tracking: Monitor Winston logs

## Scaling Considerations

- Use PM2 for process management
- Implement Redis for session caching
- Consider horizontal scaling with load balancer
