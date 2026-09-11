# Setup Guide for Google Login and Dashboard Routing

## Issues Fixed

1. ✅ **Fixed NextAuth API Route Handler** (src/app/api/auth/[...nextauth]/route.ts)
   - Corrected the export of GET and POST handlers from the `handlers` object

2. ✅ **Created .env file** with secure NEXTAUTH_SECRET
   - Generated secure random secret using OpenSSL
   - Added all required environment variables

3. ✅ **Fixed package.json dependencies**
   - Updated React to v18.3.1 (compatible with react-leaflet)
   - Updated @stripe/stripe-js to v8.1.0 (latest available)
   - Updated React type definitions

## Setup Steps Required

### 1. Configure Google OAuth

To enable Google login, you need to set up OAuth credentials:

#### A. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Configure OAuth consent screen:
   - Application name: ROW Tracking
   - Authorized domains: localhost (for development)
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: ROW Tracking App
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`

7. Copy the **Client ID** and **Client Secret**

#### B. Update .env file

Edit `/home/user/row-tracking-improved/.env` and replace:

```bash
GOOGLE_CLIENT_ID="your-actual-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
```

### 2. Set Up Database

The application uses PostgreSQL with Prisma ORM.

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   ```bash
   createdb row_tracking
   ```
3. Update the DATABASE_URL in .env:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/row_tracking"
   ```

#### Option B: Use a Cloud Database (Recommended for Development)

Services like [Supabase](https://supabase.com), [Railway](https://railway.app), or [Neon](https://neon.tech) offer free PostgreSQL databases:

1. Sign up for a service
2. Create a new PostgreSQL database
3. Copy the connection string
4. Update DATABASE_URL in .env

#### C. Initialize Database

Once your database is configured:

```bash
# Generate Prisma Client (may require network access)
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Or run migrations
npm run prisma:migrate
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Testing the Login Flow

1. Navigate to `http://localhost:3000/login`
2. Click **"Sign in with Google"**
3. You'll be redirected to Google's consent screen
4. After authentication, you'll be redirected to `/dashboard`
5. The middleware will protect all routes under `/dashboard`, `/projects`, and `/parcels`

## Authentication Flow

```
User → /login
  ↓
Click "Sign in with Google"
  ↓
Redirect to Google OAuth
  ↓
User grants permission
  ↓
Google redirects to /api/auth/callback/google
  ↓
NextAuth creates session with JWT
  ↓
Creates user in database (if new)
  ↓
Creates FREE tier subscription
  ↓
Redirect to /dashboard
```

## Protected Routes

The following routes require authentication:
- `/dashboard` - Main dashboard
- `/projects` - Project management
- `/parcels` - Parcel management
- `/analytics` - Analytics page
- `/settings` - User settings

If a user tries to access these routes without being logged in, they'll be redirected to `/login` with a callback URL.

## Session Management

- **Strategy**: JWT (JSON Web Token)
- **Duration**: 30 days
- **Storage**: Stored in HTTP-only cookies
- **Data included**:
  - User ID
  - Email
  - Name
  - Role (USER/ADMIN)
  - Subscription Tier (FREE/BASIC/PRO/ENTERPRISE)

## Troubleshooting

### Google Login Not Working

1. **Check .env variables**:
   ```bash
   cat .env | grep GOOGLE
   ```
   Ensure CLIENT_ID and CLIENT_SECRET are set correctly

2. **Verify redirect URI**:
   - Make sure `http://localhost:3000/api/auth/callback/google` is added in Google Console

3. **Check NextAuth configuration**:
   - Ensure NEXTAUTH_URL is set to your application URL
   - Ensure NEXTAUTH_SECRET is a secure random string (already configured)

### Database Connection Issues

1. **Test connection**:
   ```bash
   npm run prisma:studio
   ```
   This will open Prisma Studio if the connection works

2. **Check DATABASE_URL format**:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

3. **Verify Prisma Client is generated**:
   ```bash
   ls -la node_modules/.prisma/
   ```

### Routing Issues

1. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check middleware**:
   The middleware in `src/middleware.ts` handles route protection and redirects

### Session Issues

1. **Clear cookies**: Delete all cookies for localhost:3000 in your browser
2. **Restart dev server**: Sometimes the session needs a fresh start

## Additional Configuration (Optional)

### GitHub OAuth

If you also want to enable GitHub login:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Update .env with GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET

### Email/Password Authentication

The credentials provider is already configured in `src/lib/auth.ts`. Users can register using the `/register` page.

## Next Steps

1. ✅ Complete Google OAuth setup
2. ✅ Configure database connection
3. ✅ Run database migrations
4. ✅ Start the dev server
5. Test login and dashboard access
6. Configure additional features (Stripe, Blob Storage, etc.) as needed

## Support

If you encounter issues:
1. Check the console output for error messages
2. Review the Network tab in browser DevTools
3. Check the database logs
4. Verify all environment variables are set correctly

For more information about NextAuth.js, visit: https://authjs.dev/
