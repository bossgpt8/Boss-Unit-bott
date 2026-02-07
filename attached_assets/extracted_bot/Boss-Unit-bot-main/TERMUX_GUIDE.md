# Boss Bot - Termux Installation Guide

This guide will help you run Boss Bot locally on your Android device using Termux.

## Prerequisites
1. Download and install **Termux** from F-Droid (not Play Store).
2. Open Termux and run the following commands.

## Step 1: Install System Dependencies
Update your packages and install Node.js, Git, and other required tools:
```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git build-essential python -y
```

## Step 2: Clone and Setup the Project
Clone your project repository (replace with your repo URL):
```bash
git clone <your-repository-url>
cd boss-bot
```

Install dependencies:
```bash
npm install
```

## Step 3: Configure Environment Variables
You need to set your `DATABASE_URL` and `OPENROUTER_API_KEY`. You can use a local PostgreSQL or a remote one (like Neon.tech).
```bash
cp .env.example .env
nano .env
```
*Edit the file and save (Ctrl+O, Enter, Ctrl+X).*

## Step 4: Database Setup
Push the schema to your database:
```bash
npm run db:push
```

## Step 5: Start the Bot
Run the development server:
```bash
npm run dev
```

## Tips for Termux
- **Stay Awake**: Run `termux-wake-lock` to prevent the system from killing the process when the screen is off.
- **Node Version**: If you face issues with sharp/canvas, ensure you have the correct build tools installed.
- **Accessing Dashboard**: Once running, open `http://localhost:5000` in your mobile browser.
