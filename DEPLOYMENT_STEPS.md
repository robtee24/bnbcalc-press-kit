# Deployment Steps for BNBCalc Press Kit

## Step 1: Push to GitHub

1. Create a new repository on GitHub (don't initialize it with README, .gitignore, or license)

2. Add the remote and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Step 2: Set up Supabase

### 2.1 Create Supabase Project
1. Go to https://supabase.com and sign in/sign up
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `bnbcalc-press-kit` (or your preferred name)
   - Database Password: Generate a strong password (save this!)
   - Region: Choose closest to your users
5. Wait for project to be created (takes ~2 minutes)

### 2.2 Get Database Connection String
1. In your Supabase project, go to **Settings** > **Database**
2. Scroll down to **Connection string**
3. Under **Connection pooling**, copy the **URI** (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:6543/postgres`)
4. Replace `[YOUR-PASSWORD]` with the password you saved earlier

### 2.3 Set up Storage Bucket
1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `media`
4. Make it **Public**
5. Click **Create bucket**

### 2.4 Get Supabase URL and Anon Key
1. Go to **Settings** > **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

## Step 3: Deploy to Vercel

### 3.1 Connect Repository
1. Go to https://vercel.com and sign in
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Vercel will detect it's a Next.js project

### 3.2 Configure Environment Variables
In the Vercel project settings, add these environment variables:

1. **DATABASE_URL**
   - Value: Your Supabase connection string from Step 2.2

2. **JWT_SECRET**
   - Value: Generate a random string (e.g., use: `openssl rand -base64 32`)

3. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL from Step 2.4

4. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon key from Step 2.4

### 3.3 Configure Build Settings
1. **Framework Preset**: Next.js (should be auto-detected)
2. **Build Command**: `npm run build` (default)
3. **Output Directory**: `.next` (default)
4. **Install Command**: `npm install` (default)

### 3.4 Deploy
1. Click **Deploy**
2. Wait for the build to complete (first build takes ~2-3 minutes)

### 3.5 Run Database Migrations
After the first deployment:

**Option A: Using Vercel CLI (Recommended)**
```bash
npm i -g vercel
vercel login
vercel link  # Link to your project
npx prisma migrate deploy
```

**Option B: Using Supabase SQL Editor**
1. Go to your Supabase project > **SQL Editor**
2. Copy the contents of all migration files from `prisma/migrations/`
3. Run them in order in the SQL editor

**Option C: Using Prisma Studio**
1. Set your `.env` with `DATABASE_URL` pointing to Supabase
2. Run `npx prisma migrate deploy`

## Step 4: Verify Deployment

1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. Test the public pages
3. Test admin login at `/admin` (password: `BNBCalc123$`)
4. Upload test data through the admin panel

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL uses the connection pooling URI
- Verify password is correct in connection string
- Check Supabase project is active

### Storage Upload Issues
- Verify the `media` bucket exists and is public
- Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly
- Check browser console for errors

### Build Failures
- Check Vercel build logs for specific errors
- Ensure all environment variables are set
- Verify Prisma client is generated (should happen automatically in build)



