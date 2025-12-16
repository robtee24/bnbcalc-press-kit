# IMPORTANT: Fix Connection Pooling Error

You're experiencing database errors because Supabase's connection pooler doesn't support prepared statements. This affects ALL database operations (uploading articles, importing CSV data, etc.).

## REQUIRED FIX: Update DATABASE_URL in Vercel

**You MUST add `?pgbouncer=true` to your DATABASE_URL** in Vercel environment variables.

### Steps:

1. Go to: https://vercel.com/dashboard
2. Click on your project: `bnbcalc-press-kit`
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and click **Edit**
5. **Add `?pgbouncer=true` at the end** of the connection string

### Your Current DATABASE_URL:
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

### Your Updated DATABASE_URL (ADD `?pgbouncer=true`):
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

6. Click **Save**
7. Vercel will automatically redeploy with the new environment variable
8. Wait for deployment to complete (2-3 minutes)

## Why This Fixes It:

- Supabase uses PgBouncer for connection pooling
- PgBouncer doesn't support prepared statements
- Prisma uses prepared statements by default
- Adding `?pgbouncer=true` tells Prisma to disable prepared statements
- This makes Prisma compatible with PgBouncer

## After the Fix:

Once you've updated the DATABASE_URL and the deployment completes, try:
- Uploading a news article
- Importing CSV city data
- Uploading media files

All should work without the "prepared statement already exists" error.

