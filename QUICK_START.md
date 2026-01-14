# 🚀 Quick Start - Next 3 Steps

**You're almost done! Just 3 more steps to complete the setup.**

---

## ✅ What's Already Done:
- OAuth Client ID updated to Web App version
- Encryption key configured
- All code implemented and tested

---

## 📋 What You Need to Do Now:

### Step 1: Add Client Secret (2 minutes)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find "ONCA Prod Web" (Web application)
3. Click the edit icon (pencil)
4. Copy the "Client secret" value
5. Run in Terminal:

```bash
cd /Users/tohraan/onca-prod
echo 'GOOGLE_CLIENT_SECRET=<paste_secret_here>' >> apps/web/.env.local
```

---

### Step 2: Add Redirect URI (1 minute)

**While still on the Google Cloud Console page:**

1. Scroll to "Authorized redirect URIs"
2. Click "+ ADD URI"
3. Type: `http://localhost:3000/api/sheets/oauth/callback`
4. Click "SAVE"

---

### Step 3: Run Database Migration (2 minutes)

```bash
cd /Users/tohraan/onca-prod

# Replace with your actual Supabase connection string
export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Run migration
psql $DATABASE_URL -f db/migrations/001_google_sheets_oauth.sql
```

---

## 🎉 Then Test It!

```bash
cd apps/web
npm run dev
```

Open: http://localhost:3000/sheets

Click "Sign in with Google" and you're done! 🚀

---

**Full instructions**: See `SETUP_GOOGLE_SHEETS_OAUTH.md`
