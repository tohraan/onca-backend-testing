# Google Sheets OAuth Setup Guide - UPDATED
## Step-by-Step Instructions (Using Web App OAuth)

This guide will walk you through setting up Google Sheets OAuth integration for ONCA using the **Web Application** OAuth credentials.

---

## ✅ Step 0: Update OAuth Credentials (COMPLETED)

Your environment has been updated to use the Web App OAuth client:
- **Client ID**: `94158489136-c2ad11uphfpk69p9kinmsv2d35f48su7.apps.googleusercontent.com`
- **Type**: Web Application (correct for Next.js)

---

## 📋 Your Next Steps

Follow these steps in order. I've marked what's already done and what you need to do.

---

## ✅ Step 1: Add Google Client Secret (ACTION REQUIRED)

### What You Need to Do:

1. **Go to Google Cloud Console**
   - Open: https://console.cloud.google.com/apis/credentials
   - Sign in if needed

2. **Find "ONCA Prod Web"**
   - Look in the "OAuth 2.0 Client IDs" section
   - Find the one with type "Web application"
   - Client ID should end in: `...35f48su7.apps.googleusercontent.com`

3. **Click the pencil/edit icon** next to "ONCA Prod Web"

4. **Copy the Client Secret**
   - You'll see "Client secret" with a value like `GOCSPX-xxxxx`
   - Click the copy icon or select and copy the value

5. **Add it to your environment**
   - Open Terminal
   - Run this command (replace `YOUR_SECRET` with the actual value):
   
   ```bash
   cd /Users/tohraan/onca-prod
   echo 'GOOGLE_CLIENT_SECRET=YOUR_SECRET' >> apps/web/.env.local
   ```

6. **Verify it was added**
   ```bash
   tail -2 apps/web/.env.local
   ```
   - You should see both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

---

## ✅ Step 2: Configure Redirect URIs (ACTION REQUIRED)

**While you're still in the Google Cloud Console editing "ONCA Prod Web":**

### 2.1 Add Redirect URIs

1. **Scroll to "Authorized redirect URIs"**

2. **Check if this URI already exists**:
   - `http://localhost:3000/api/sheets/oauth/callback`

3. **If it doesn't exist, add it**:
   - Click "+ ADD URI"
   - Type exactly: `http://localhost:3000/api/sheets/oauth/callback`
   - Press Enter

4. **For production** (optional, add later if needed):
   - Click "+ ADD URI"
   - Type: `https://yourdomain.com/api/sheets/oauth/callback`
   - Replace `yourdomain.com` with your actual domain

5. **Click "SAVE"** at the bottom

### 2.2 Verify Scopes

1. **Still on the same page, scroll to "Scopes for Google APIs"**

2. **Verify these scopes are present**:
   - `https://www.googleapis.com/auth/spreadsheets.readonly`
   - `https://www.googleapis.com/auth/drive.readonly`

3. **If they're missing**:
   - Click "ADD OR REMOVE SCOPES"
   - Filter for "Google Sheets API"
   - Check: `.../auth/spreadsheets.readonly`
   - Filter for "Google Drive API"  
   - Check: `.../auth/drive.readonly`
   - Click "UPDATE"
   - Click "SAVE"

---

## ✅ Step 3: Run Database Migration (ACTION REQUIRED)

### 3.1 Get Your Database URL

**If using Supabase:**

1. Go to: https://app.supabase.com/
2. Select your ONCA project
3. Click Settings (⚙️) → Database
4. Copy the "Connection string" (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual password

**If you have it in .env.local already:**

```bash
cd /Users/tohraan/onca-prod
grep DATABASE_URL apps/web/.env.local
```

### 3.2 Run the Migration

```bash
cd /Users/tohraan/onca-prod

# Set your database URL (replace with your actual URL)
export DATABASE_URL="postgresql://postgres:yourpassword@db.xxx.supabase.co:5432/postgres"

# Run the migration
psql $DATABASE_URL -f db/migrations/001_google_sheets_oauth.sql
```

### 3.3 Expected Output

You should see:
```
CREATE TABLE
CREATE TABLE
CREATE INDEX
...
CREATE POLICY
...
```

### 3.4 Verify Tables

```bash
psql $DATABASE_URL -c "\dt google_sheets*"
```

You should see:
- `google_sheets_connections`
- `connected_sheets`

---

## ✅ Step 4: Test the Integration

### 4.1 Start the Dev Server

```bash
cd /Users/tohraan/onca-prod/apps/web
npm run dev
```

Wait for: `✓ Ready in X.Xs`

### 4.2 Test OAuth Flow

1. **Open browser**: http://localhost:3000/sheets

2. **You should see**:
   - Green card: "Connect Your Google Sheets"
   - "Sign in with Google" button

3. **Click "Sign in with Google"**

4. **Google OAuth screen appears**:
   - Select your Google account
   - Review permissions
   - Click "Allow"

5. **Redirected back to ONCA**:
   - URL: `http://localhost:3000/sheets?connected=true`
   - Green success card: "Connected to Google Sheets"
   - Your email displayed
   - List of all your spreadsheets

6. **Test selecting a sheet**:
   - Click "Select" on any spreadsheet
   - URL auto-populates

---

## 🎉 You're Done!

Once you complete these steps, your Google Sheets OAuth integration will be fully functional!

---

## 📝 Quick Checklist

- [ ] Added GOOGLE_CLIENT_SECRET to .env.local
- [ ] Added redirect URI: `http://localhost:3000/api/sheets/oauth/callback`
- [ ] Verified scopes (spreadsheets.readonly, drive.readonly)
- [ ] Ran database migration
- [ ] Verified tables created
- [ ] Started dev server
- [ ] Tested OAuth flow
- [ ] Saw spreadsheets list

---

## 🆘 Troubleshooting

### "redirect_uri_mismatch" error
- **Cause**: Redirect URI not added or doesn't match exactly
- **Fix**: Make sure you added `http://localhost:3000/api/sheets/oauth/callback` (no trailing slash)

### "access_denied" error
- **Cause**: User denied permissions or scopes not enabled
- **Fix**: Check that both scopes are enabled in Google Cloud Console

### "Invalid client" error
- **Cause**: Wrong client ID or secret
- **Fix**: Verify you're using the Web App credentials, not Desktop App

### Build errors
```bash
cd /Users/tohraan/onca-prod/apps/web
npm run build
```
Should complete successfully with all OAuth routes listed.

---

## � Need Help?

If you get stuck on any step, check:
1. The error message in browser console (F12)
2. Terminal output for detailed errors
3. Google Cloud Console audit logs

---

**Current Status**: ✅ OAuth Client ID updated to Web App version. Complete Steps 1-4 above to finish setup.
