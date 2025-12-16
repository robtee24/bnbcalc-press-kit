# Deployment Guide for Vercel + Supabase

## Quick Start

### 1. Supabase Setup

1. **Create a Supabase Project:**
   - Go to https://supabase.com
   - Create a new project
   - Wait for the database to be ready

2. **Get Database Connection String:**
   - Go to Settings > Database
   - Under "Connection string", select "URI"
   - Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
   - For better performance, use the "Connection pooling" URI instead

3. **Set up Supabase Storage:**
   - Go to Storage in the Supabase dashboard
   - Click "New bucket"
   - Name it `media`
   - Make it **public**
   - Click "Create bucket"

4. **Get Supabase Credentials:**
   - Go to Settings > API
   - Copy your "Project URL" (NEXT_PUBLIC_SUPABASE_URL)
   - Copy your "anon public" key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 2. Vercel Setup

1. **Connect Repository:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Add Environment Variables:**
   In Vercel project settings, add these environment variables:
   
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   JWT_SECRET=your-random-secret-key-here
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete

### 3. Run Database Migrations

After the first deployment, you need to run the database migrations:

**Option A: Using Vercel CLI (Recommended)**
```bash
npm install -g vercel
vercel login
vercel link
npx prisma migrate deploy
```

**Option B: Using Supabase SQL Editor**
1. Go to Supabase Dashboard > SQL Editor
2. Run the migration SQL manually (from `prisma/migrations` folder)

**Option C: Local Migration**
```bash
# Set DATABASE_URL in your local .env
DATABASE_URL="your-supabase-connection-string"
npx prisma migrate deploy
```

### 4. Verify Deployment

1. Visit your Vercel deployment URL
2. Test the admin panel at `/admin` (password: `BNBCalc123$`)
3. Upload a test image/video to verify Supabase Storage is working
4. Add a test article to verify OG scraping works

## Troubleshooting

### Database Connection Issues
- Make sure you're using the correct connection string format
- Check that your Supabase project is active
- Verify the password in the connection string is correct

### Media Upload Not Working
- Verify Supabase Storage bucket `media` exists and is public
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
- Check browser console for errors

### Build Failures
- Make sure all environment variables are set in Vercel
- Check that Prisma can generate the client (should happen automatically)
- Review build logs in Vercel dashboard

## Local Development with Supabase

1. Copy `.env.example` to `.env.local`
2. Add your Supabase credentials
3. Run `npx prisma generate`
4. Run `npx prisma migrate dev`
5. Start dev server: `npm run dev`

## Production Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables set in Vercel
- [ ] Supabase Storage bucket created and public
- [ ] Admin password changed (if desired - update in code)
- [ ] Test all admin features
- [ ] Test public-facing features
- [ ] Verify media uploads work
- [ ] Check OG image extraction works

