# Deploying QR Code Management System to Vercel

Follow these steps to deploy your QR Code Management System to Vercel so you and your friends can use it anywhere on phones and laptops.

---

## Method 1: Deploy via GitHub (Recommended & Easiest)

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g., `qr-code-manager`).
2. Run these commands in your project folder (`C:\Users\differenz96\.gemini\antigravity\scratch\qr-code-manager`):

```bash
git add .
git commit -m "Initial commit for QR Code Management System"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/qr-code-manager.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** $\to$ **"Project"**.
3. Select your `qr-code-manager` repository from GitHub.
4. Leave all default settings as they are (Vercel automatically detects `vercel.json`).
5. Click **"Deploy"**.
6. Within 1 minute, you will have your live link: `https://your-project.vercel.app`!

---

## Enabling Persistent Cloud Storage (So You & Your Friends Share Data)

On Vercel, serverless functions run in temporary containers. To ensure that QR codes added by your friend remain permanently saved across all devices and serverless restarts:

### Option A: 1-Click Free Vercel KV / Upstash (Recommended)
1. In your project dashboard on Vercel, click on the **"Storage"** tab.
2. Click **"Create Database"** and select **"KV"** (powered by Upstash).
3. Click **"Continue"** and connect it to your project.
4. Vercel automatically sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
5. Redeploy your project. That's it! All QR codes and URLs are now synchronized across the cloud in real-time.

### Option B: MongoDB Atlas (Free Tier)
1. If you already have a MongoDB Atlas account, copy your connection string:
   `mongodb+srv://<user>:<password>@cluster0.mongodb.net/qrcodes?retryWrites=true&w=majority`
2. In Vercel Project Settings $\to$ **Environment Variables**, add:
   - Name: `MONGODB_URI`
   - Value: *(your connection string)*
3. Redeploy.

---

## Alternative: 1-Click Deploy on Render.com (No Cloud DB Needed)

If you prefer **not** to configure any external database at all:
- Go to [render.com](https://render.com).
- Click **"New Web Service"** $\to$ Connect your GitHub repo.
- Build Command: `cd client && npm install && npm run build && cd ../server && npm install`
- Start Command: `node server/src/index.js`
- Render provides a persistent server where our file-backed database (`qrcode_db.json`) works 24/7 out of the box with zero external database setup!
