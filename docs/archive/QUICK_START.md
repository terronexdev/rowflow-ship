# Quick Start Guide

## ✅ Completed
1. ✅ Fixed NextAuth API route handler
2. ✅ Updated .env file with your credentials
3. ✅ Fixed package.json dependencies
4. ✅ Generated database schema SQL

## 🔧 Next Steps (Required)

### Step 1: Set Up Database

Run this SQL file to create all tables:

```bash
psql -U row_tracker_user -d row_tracking_db -f database_schema.sql
```

Or if you have the project locally with Node.js:

```bash
npm run prisma:push
```

### Step 2: **CRITICAL** - Update Google OAuth Redirect URI

⚠️ **IMPORTANT**: You need to verify your Google OAuth redirect URI!

You need to update your Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `944871010247-agsjm057ua6ep5kmhlt356g4ticoki37`
3. Edit the **Authorized redirect URIs**
4. Make sure it includes:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Save changes

### Step 3: Start the Application

```bash
npm run dev
```

The app will run on http://localhost:3000

### Step 4: Test Login

1. Navigate to http://localhost:3000/login
2. Click "Sign in with Google"
3. Authorize with your Google account
4. You should be redirected to http://localhost:3000/dashboard

## 🐛 Troubleshooting

### "Redirect URI mismatch" error
- Verify the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- No trailing slash
- Correct port (3000)

### Database connection error
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Test connection: `psql -U row_tracker_user -d row_tracking_db`
- Check DATABASE_URL in .env matches your actual credentials

### "Can't resolve prisma client" error
- Run from your local machine: `npm run prisma:generate`
- This will generate the Prisma client locally

## 📝 Current Configuration

- **App URL**: http://localhost:3000
- **Database**: postgresql://row_tracker_user@localhost:5432/row_tracking_db
- **Google OAuth**: Configured (verify redirect URI!)
- **Stripe**: Configured with test keys

## 🎯 What Should Work After Setup

1. ✅ Google login
2. ✅ Automatic user creation
3. ✅ Free tier subscription creation
4. ✅ Dashboard access
5. ✅ Protected routes (redirects to login if not authenticated)

## 📞 Need Help?

Check the detailed SETUP_GUIDE.md for more information.
