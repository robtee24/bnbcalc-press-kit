# Vercel Environment Variables

Copy these exactly into your Vercel project settings:

## Environment Variables

### DATABASE_URL
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

### JWT_SECRET
Use this generated secret:
```
t/KYDkk3WVC/7HX+z6Ab0jlGVLcXJPz6mng6iXmDER8=
```

### NEXT_PUBLIC_SUPABASE_URL
```
https://dbwglsptiubjulmegmbv.supabase.co
```

### NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid2dsc3B0aXVianVsbWVnbWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjM2OTcsImV4cCI6MjA4MTQ5OTY5N30.NHZvsm4TmY6GPwJUHOJEkyG63yJcHDdvr0MAm58SLj0
```

## Next Steps

1. **Verify Supabase Storage Bucket:**
   - Go to https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv/storage
   - Ensure a bucket named `media` exists
   - If not, create it and make it public

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Import the repository: https://github.com/robtee24/bnbcalc-press-kit
   - Add the environment variables above
   - Deploy

3. **Run Database Migrations:**
   After deployment, run migrations using one of these methods:
   
   **Option A: Using Supabase SQL Editor**
   - Go to SQL Editor in Supabase
   - Run the migration SQL files from `prisma/migrations/` in order
   
   **Option B: Using local CLI**
   ```bash
   DATABASE_URL="postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres" npx prisma migrate deploy
   ```

