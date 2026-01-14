#!/bin/bash

# Google Sheets OAuth Environment Setup
# This script helps you add the required environment variables to .env.local

ENV_FILE="apps/web/.env.local"

echo "🔐 Setting up Google Sheets OAuth environment variables..."
echo ""

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE..."
    touch "$ENV_FILE"
fi

# Generate encryption key from the setup script output
ENCRYPTION_KEY="75794cf3487db0216587d81e25defbcca27caa79a668dc3ae7d97d6385f6415e"

# Google OAuth credentials (from your client_secret file)
GOOGLE_CLIENT_ID="94158489136-l5k2ngi51gfp2pqc5h19qpv4b7habkv8.apps.googleusercontent.com"

echo "📝 The following variables will be added to $ENV_FILE:"
echo ""
echo "ENCRYPTION_KEY=<generated>"
echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET=<from your client_secret JSON file>"
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000"
echo ""

# Check if variables already exist
if grep -q "ENCRYPTION_KEY" "$ENV_FILE"; then
    echo "⚠️  ENCRYPTION_KEY already exists in $ENV_FILE"
else
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$ENV_FILE"
    echo "✅ Added ENCRYPTION_KEY"
fi

if grep -q "GOOGLE_CLIENT_ID" "$ENV_FILE"; then
    echo "⚠️  GOOGLE_CLIENT_ID already exists in $ENV_FILE"
else
    echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" >> "$ENV_FILE"
    echo "✅ Added GOOGLE_CLIENT_ID"
fi

if grep -q "NEXT_PUBLIC_APP_URL" "$ENV_FILE"; then
    echo "⚠️  NEXT_PUBLIC_APP_URL already exists in $ENV_FILE"
else
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> "$ENV_FILE"
    echo "✅ Added NEXT_PUBLIC_APP_URL"
fi

echo ""
echo "⚠️  ACTION REQUIRED:"
echo "You need to manually add GOOGLE_CLIENT_SECRET to $ENV_FILE"
echo ""
echo "1. Open your client_secret JSON file from Downloads"
echo "2. Copy the 'client_secret' value"
echo "3. Add this line to $ENV_FILE:"
echo "   GOOGLE_CLIENT_SECRET=<paste_your_secret_here>"
echo ""
echo "Or run this command (replace YOUR_SECRET with actual value):"
echo "   echo 'GOOGLE_CLIENT_SECRET=YOUR_SECRET' >> $ENV_FILE"
echo ""
