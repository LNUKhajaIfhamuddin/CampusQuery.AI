# 🚀 Deployment Guide: Deploy CampusQuery AI to Render

This guide walks you through setting up credentials locally in `.env` and deploying the full-stack CampusQuery AI app live to **[Render](https://render.com/)**.

---

## 1. Local Configuration (`.env`)

A `.env` file has been generated in your project root:

```env
# CampusQuery AI - Environment Configuration

# Gemini API Key (Required for AI-powered answering & RAG citation)
# Get your API key from Google AI Studio: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Server Port (Default is 3000 locally; Render automatically assigns its own PORT)
PORT=3000

# Environment mode: 'development' for local Vite HMR, 'production' for serving built dist/
NODE_ENV=development

# App URL (optional; for self-referential links or hosted domain)
APP_URL=http://localhost:3000
```

> **Security Note:** Your `.env` file is already added to `.gitignore`, so your secret API key will never be pushed to GitHub.

---

## 2. Deploying to Render

You can deploy the app to Render using either **Blueprint (Recommended)** or **Manual Web Service**.

### Method A: Blueprint Deployment (Recommended & Automated)

This repository includes a [`render.yaml`](file:///render.yaml) file.

1. **Push your code to GitHub / GitLab:**
   ```bash
   git add .
   git commit -m "Configure Render deployment and environment variables"
   git push origin main
   ```
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your `CampusQuery.AI` repository.
5. Render will automatically detect `render.yaml`.
6. When prompted for `GEMINI_API_KEY`, paste your Gemini API key from Google AI Studio.
7. Click **Apply**. Render will automatically build the React frontend and launch the Express backend.

---

### Method B: Manual Web Service Setup

If you prefer to configure manually:

1. Push your repository to GitHub / GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
3. Select your repository.
4. Configure the settings:
   - **Name:** `campusquery-ai` (or your preferred name)
   - **Language / Runtime:** `Node`
   - **Region:** Any (e.g., Oregon, Ohio, Frankfurt, Singapore)
   - **Branch:** `main` (or `master`)
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Instance Type:** `Free`
5. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = `<your-gemini-api-key>`
6. (Optional) In **Advanced**, set **Health Check Path** to `/api/system/status`.
7. Click **Create Web Service**.

---

## 3. How It Works in Production on Render

- **Static Assets:** `npm run build` compiles the React TypeScript frontend with Vite into `dist/`.
- **Server:** Express serves the compiled `dist/` frontend and mounts the API routes at `/api`.
- **Port:** Render automatically sets the `PORT` environment variable (typically `10000`), which `server.ts` binds to with `0.0.0.0`.
- **Health Check:** `/api/system/status` reports server health and checks whether `GEMINI_API_KEY` is loaded.
