# Troubleshooting 404 Error on Vercel

If you're seeing a 404 error on your Vercel deployment, here are the most common causes and solutions:

## 1. Database Migrations Not Run

**Most Common Issue**: The database tables don't exist yet because migrations haven't been run.

### Solution: Run Database Migrations

**Option A: Using Supabase SQL Editor (Recommended)**
1. Go to: https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv/sql/new
2. Copy the SQL from each migration file in `prisma/migrations/` and run them in order:
   - `20251216192551_init/migration.sql` (creates initial tables)
   - `20251216194517_add_category_to_media/migration.sql`
   - `20251216201130_add_state_to_city/migration.sql`
   - `20251216213658_add_platform_to_media/migration.sql`

**Option B: Using Prisma CLI**
```bash
DATABASE_URL="postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres" npx prisma migrate deploy
```

## 2. Check Vercel Build Logs

1. Go to your Vercel dashboard: https://vercel.com
2. Click on your project
3. Go to the "Deployments" tab
4. Click on the latest deployment
5. Check the "Build Logs" for any errors

Common errors you might see:
- `PrismaClientInitializationError` - Database connection issue
- `Environment variable not found` - Missing env vars
- Build failures

## 3. Verify Environment Variables

In Vercel project settings, verify these are all set:

- ✅ `DATABASE_URL` - Should start with `postgresql://`
- ✅ `JWT_SECRET` - Should be set
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Should be `https://dbwglsptiubjulmegmbv.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Should be set

## 4. Check Function Logs

1. In Vercel dashboard, go to your deployment
2. Click on "Functions" tab
3. Try accessing the page and check for runtime errors
4. Look for any Prisma/database connection errors

## 5. Test Database Connection

You can test if your database is accessible by checking Supabase:
1. Go to: https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv
2. Go to "Table Editor" - you should see tables (Article, CityData, Media, ColumnMapping)
3. If tables don't exist, run migrations (see #1)

## 6. Common Issues

### Issue: "Cannot find module '@prisma/client'"
**Solution**: The build command should include `prisma generate`. Your `vercel.json` already has this.

### Issue: Database connection timeout
**Solution**: Make sure you're using the connection pooling URL (port 6543) not the direct connection (port 5432)

### Issue: "Table does not exist"
**Solution**: Run database migrations (see #1)

## Quick Checklist

- [ ] Database migrations have been run (check Supabase Table Editor)
- [ ] All 4 environment variables are set in Vercel
- [ ] Build completed successfully (check Vercel build logs)
- [ ] No runtime errors in Function logs
- [ ] Storage bucket `media` exists and is public in Supabase

## Getting More Info

If the issue persists, check:
1. Vercel deployment logs
2. Browser console (F12) for client-side errors
3. Network tab to see which requests are failing

