# Update DATABASE_URL - REQUIRED FIX

You need to update your DATABASE_URL in Vercel to include BOTH parameters:

## Steps:

1. Go to: https://vercel.com/dashboard
2. Click on your project: `bnbcalc-press-kit`
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and click **Edit**

## Your Current DATABASE_URL:
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

## Your Updated DATABASE_URL (ADD BOTH PARAMETERS):
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Important:** Add BOTH `?pgbouncer=true&connection_limit=1` at the end

5. Click **Save**
6. Vercel will automatically redeploy
7. Wait 2-3 minutes for deployment to complete
8. Try uploading again

The `connection_limit=1` parameter is important for serverless environments to prevent connection pool exhaustion.

