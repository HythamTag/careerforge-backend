# CareerForge - Quick Start Guide

This guide is for beginners. Follow these steps exactly to get the project running locally.

---

## Step 1: Install Docker Desktop

1. **Download Docker Desktop for Windows:**
   [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

2. **Run the installer** and follow the instructions.
   - It will ask to restart your computer - say **YES**.

3. **After restart, open Docker Desktop.**
   - Wait for it to fully start (you'll see a steady whale icon in the system tray).

---

## Step 2: Download Docker Images

1. Open **Command Prompt (cmd)** or **PowerShell**.

2. **Navigate to the project folder:**
   ```bash
   cd "C:\Users\Tag\Desktop\Careerforg ITI GRADUATION PROJECT\CV Enhancer"
   ```

3. **Run the installer script:**
   ```bash
   SETUP.bat
   ```

4. **Wait for all images to download.** This may take 10-20 minutes depending on your internet speed.

---

## Step 3: Start the Project

1. From the project root folder, run:
   ```bash
   START.bat
   ```

2. **This will start all essential services:**
   - MongoDB (Database)
   - Redis (Job Queue)
   - Ollama (AI Server)
   - Frontend (Web Interface)
   - Backend (API Server)

3. **Open your browser and go to:**
   [http://localhost:5173](http://localhost:5173)

---

## What are Docker Images?

Think of Docker images like "installer files" for software. Instead of installing MongoDB, Redis, etc., directly on your computer, Docker runs them in isolated **containers**. This keeps your computer clean and ensures everyone has the exact same setup.

**Key Services:**
- `mongo:latest`: Database
- `redis:7-alpine`: Job Queue
- `ollama/ollama:latest`: AI Server
- `browserless/chrome`: PDF Generation Tool

---

## Troubleshooting

- **"Docker is not running"**: Open Docker Desktop and wait for the whale icon to turn steady.
- **"Port already in use"**: Close other programs using ports 27017, 6379, 11434, 3000, or 5173.
- **"Permission denied"**: Ensure you have administrator rights when running `.bat` files.

---

## Need Help?

1. Check if Docker Desktop is running.
2. Check running containers: `docker ps`
3. Read the [Deployment Guide](./deployment/RAILWAY-DEPLOYMENT.md) if you want to share your project online!
