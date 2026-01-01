# CareerForge - Railway Deployment Guide

Complete step-by-step instructions for deploying CareerForge to Railway.

---

## Prerequisites
- GitHub repo already connected (✅ Done: `HythamTag/careerforge-backend`)
- Railway account (free tier works)
- Local Ollama running on your PC

---

## Step 1: Add MongoDB Database

1. Open your Railway project dashboard
2. Click **"+ New"** button (top right)
3. Select **"Database"** → **"MongoDB"**
4. Wait for it to provision (~30 seconds)
5. Railway automatically creates `MONGODB_URL` variable

> **Important:** Click on the MongoDB service → **"Connect"** tab → Copy the **"MONGO_URL"** value. You'll need to add it manually as `MONGODB_URI` to your backend service.

---

## Step 2: Add Redis Database

1. Click **"+ New"** button again
2. Select **"Database"** → **"Redis"**
3. Wait for it to provision (~30 seconds)
4. Railway automatically creates `REDIS_URL` variable

> **Note:** Redis connection is auto-injected, but verify the variable name matches what your app expects.

---

## Step 3: Add Environment Variables to Backend

1. Click on your **`careerforge-backend`** service
2. Go to the **"Variables"** tab
3. Click **"RAW Editor"** button (faster than one-by-one)
4. Paste the following:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=CareerForge2026SecureRandomKeyHere!@#$%
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AI_PROVIDER=ollama
```

5. Click **"Update Variables"**

---

## Step 4: Link Database Variables

After adding MongoDB and Redis, you need to reference their URLs:

1. Still in the **"Variables"** tab of `careerforge-backend`
2. Add these **Reference Variables**:

| Variable Name | Value |
|---------------|-------|
| `MONGODB_URI` | `${{MongoDB.MONGO_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |

> **Tip:** The `${{ServiceName.VARIABLE}}` syntax references variables from other services.

---

## Step 5: Set Up Ollama (Your Local GPU)

Since Ollama runs on your local PC, you need to expose it via ngrok:

### On Your PC:

1. Open a terminal
2. Run: `ngrok http 11434`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### In Railway Variables:

Add these to your backend service:

```env
OLLAMA_HOST=https://abc123.ngrok-free.app
OLLAMA_PARSER_HOST=https://abc123.ngrok-free.app
OLLAMA_OPTIMIZER_HOST=https://abc123.ngrok-free.app
OLLAMA_ATS_HOST=https://abc123.ngrok-free.app
```

> **Important:** Replace `abc123.ngrok-free.app` with YOUR actual ngrok URL.

---

## Step 6: Deploy

1. After adding all variables, Railway shows **"Staged Changes"**
2. Click **"Deploy"** to apply the changes
3. Railway will rebuild and restart your service

---

## Step 7: Verify Deployment

1. Go to your service → **"Settings"** tab
2. Find **"Domains"** section
3. Click **"Generate Domain"** to get a public URL
4. Open: `https://your-app.up.railway.app/health`
5. You should see: `{"status":"ok"}`

---

## Complete Variables Checklist

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | `5000` |
| `JWT_SECRET` | ✅ | `YourSecureRandomString123!@#` |
| `JWT_EXPIRES_IN` | ❌ | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | `7d` |
| `MONGODB_URI` | ✅ | `${{MongoDB.MONGO_URL}}` |
| `REDIS_URL` | ✅ | `${{Redis.REDIS_URL}}` |
| `AI_PROVIDER` | ✅ | `ollama` |
| `OLLAMA_HOST` | ✅ | `https://your-ngrok-url` |
| `OLLAMA_PARSER_HOST` | ✅ | `https://your-ngrok-url` |
| `OLLAMA_OPTIMIZER_HOST` | ✅ | `https://your-ngrok-url` |
| `OLLAMA_ATS_HOST` | ✅ | `https://your-ngrok-url` |

---

## Troubleshooting

### "Container failed to start"
- Check Variables tab — are all required variables set?
- Check Logs tab for specific error messages

### "Cannot connect to MongoDB/Redis"
- Verify the reference variable syntax: `${{ServiceName.VAR}}`
- Check if databases are running (green status)

### "AI requests timing out"
- Verify ngrok is running on your PC
- Check if Ollama is running: `ollama list`
- Ensure ngrok URL is correct and not expired

---

## Notes

- ngrok free tier URLs change every restart — update Railway variables when this happens
- For production, consider ngrok paid plan or deploy Ollama to a cloud GPU
