# Deployment Setup Checklist

## ✅ Completed
- [x] Code pushed to GitHub: https://github.com/robtee24/bnbcalc-press-kit
- [x] Prisma schema updated to PostgreSQL
- [x] Environment variables documented

## 🔲 To Do: Supabase Setup

### 1. Create Storage Bucket
1. Go to: https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv/storage
2. Click **"New bucket"**
3. Name: `media`
4. **Make it Public** (toggle ON)
5. Click **"Create bucket"**

### 2. Run Database Migrations

You need to create the database tables. Choose one method:

**Option A: Using Supabase SQL Editor (Easiest)**
1. Go to: https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv/sql
2. Copy and paste the SQL from each migration file in order:
   - First: `prisma/migrations/20251216192551_init/migration.sql`
   - Then: `prisma/migrations/20251216194517_add_category_to_media/migration.sql`
   - Then: `prisma/migrations/20251216201130_add_state_to_city/migration.sql`
   - Finally: `prisma/migrations/20251216213658_add_platform_to_media/migration.sql`
3. Run each SQL script in the Supabase SQL Editor

**Option B: Using Prisma CLI (Local)**
```bash
DATABASE_URL="postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres" npx prisma migrate deploy
```

## 🔲 To Do: Vercel Deployment

### 1. Import Repository
1. Go to: https://vercel.com
2. Click **"Add New"** > **"Project"**
3. Import from GitHub: `robtee24/bnbcalc-press-kit`
4. Vercel will auto-detect Next.js

### 2. Add Environment Variables
In Vercel project settings, add these 4 environment variables:

**DATABASE_URL:**
```
postgresql://postgres.dbwglsptiubjulmegmbv:JeremyParker500!@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

**JWT_SECRET:**
```
t/KYDkk3WVC/7HX+z6Ab0jlGVLcXJPz6mng6iXmDER8=
```

**NEXT_PUBLIC_SUPABASE_URL:**
```
https://dbwglsptiubjulmegmbv.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid2dsc3B0aXVianVsbWVnbWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjM2OTcsImV4cCI6MjA4MTQ5OTY5N30.NHZvsm4TmY6GPwJUHOJEkyG63yJcHDdvr0MAm58SLj0
```

### 3. Deploy
1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)

### 4. Verify Deployment
1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. Test admin login at `/admin` (password: `BNBCalc123$`)
3. Test uploading media to verify Supabase Storage is working
4. Test adding an article via URL

## Important Notes

- The database migrations MUST be run before the app will work properly
- The `media` storage bucket MUST be public for images/videos to display
- Make sure all 4 environment variables are set in Vercel before deploying



