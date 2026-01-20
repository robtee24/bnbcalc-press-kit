# Fix for Connection Pooling Error

The error you're seeing is because Supabase's connection pooler (PgBouncer) doesn't support prepared statements, which Prisma uses by default.

## Solution: Update DATABASE_URL in Vercel

You need to add `?pgbouncer=true` to your DATABASE_URL in Vercel to disable prepared statements.

### Steps:

1. Go to: https://vercel.com/dashboard
2. Click on your project: `bnbcalc-press-kit`
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL`
5. Edit it and add `?pgbouncer=true` at the end

### Current DATABASE_URL:
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

### Updated DATABASE_URL:
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

6. Save the changes
7. Vercel will automatically redeploy with the new environment variable

After the redeployment completes, try uploading your CSV again. The error should be resolved.

## Alternative: Use Direct Connection (Not Recommended)

If you still have issues, you can use the direct connection (port 5432) instead of the pooler (port 6543), but this is less efficient for serverless environments:

```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

However, the `?pgbouncer=true` solution is recommended as it works with connection pooling while disabling prepared statements.



