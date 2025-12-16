# Debugging 404 Error on Vercel

The 404 error indicates Vercel can't find the route. Here's how to diagnose:

## Step 1: Check Vercel Build Logs

1. Go to: https://vercel.com/dashboard
2. Click on your project: `bnbcalc-press-kit`
3. Go to the "Deployments" tab
4. Click on the latest deployment
5. Check the "Build Logs" section

**Look for:**
- Any build errors
- Prisma generation errors
- TypeScript errors
- Missing dependencies

## Step 2: Check Function Logs

1. In the same deployment page
2. Click on the "Functions" tab
3. Try accessing the URL again
4. Check the logs for runtime errors

**Common errors to look for:**
- `PrismaClientInitializationError` - Database connection issue
- `Cannot find module` - Missing dependencies
- Environment variable errors

## Step 3: Test Individual Routes

Try accessing these URLs to see which ones work:

- https://bnbcalc-press-kit.vercel.app/ (homepage - currently 404)
- https://bnbcalc-press-kit.vercel.app/admin (admin page)
- https://bnbcalc-press-kit.vercel.app/api/auth/check (API route test)

If `/admin` works but `/` doesn't, there's a specific issue with `app/page.tsx`.

## Step 4: Verify Environment Variables

In Vercel project settings, confirm these are all set:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 5: Check Database Connection

The issue might be that Prisma is trying to connect during build/runtime. 

**Quick test:** Check if the Prisma client can connect:
1. Go to Supabase dashboard
2. Test a simple query in the SQL editor:
```sql
SELECT COUNT(*) FROM "Article";
```

## Step 6: Common Causes

1. **Build Failure**: Check if the build actually completed successfully
2. **Missing Dependencies**: Some npm packages might not be installed
3. **Prisma Generation Issue**: The Prisma client might not be generated correctly
4. **Database Connection**: If Prisma tries to validate schema during build

## Next Steps

Once you check the build logs, share what errors you see and I can help fix them.

