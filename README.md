# BNBCalc Press Kit

A comprehensive media kit application for BNBCalc featuring press releases, city data analysis, and media management.

## Features

### Public-Facing Features
- **Past Press**: Browse national and local news articles about BNBCalc
- **Search by City**: Search and analyze city-specific Airbnb market data with detailed metrics
- **Media Gallery**: View images and videos

### Admin Features
- **Password-protected admin panel** at `/admin`
- **Past Press Management**: Add articles by URL (automatically extracts OG data)
- **City Data Management**: Upload CSV files and map columns to database fields
- **Media Management**: Upload, edit, and delete images and videos

## Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"  # Optional, for media storage
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"  # Optional, for media storage
```

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. (Optional) Set up Supabase Storage for media:
   - Create a Supabase project
   - Create a storage bucket named `media`
   - Set it to public
   - Add your Supabase URL and anon key to `.env.local`

5. Create the uploads directory (for local fallback):
```bash
mkdir -p public/uploads/image public/uploads/video
```

6. Run the development server:
```bash
npm run dev
```

7. Access the application:
- Public site: http://localhost:3000
- Admin panel: http://localhost:3000/admin
- Admin password: `BNBCalc123$`

## Deployment to Vercel + Supabase

### Prerequisites
- Supabase account and project
- Vercel account

### Steps

1. **Set up Supabase Database:**
   - Create a new Supabase project
   - Go to Settings > Database
   - Copy the connection string (use the "Connection pooling" URI for better performance)
   - Run migrations: `npx prisma migrate deploy`

2. **Set up Supabase Storage (for media uploads):**
   - In Supabase dashboard, go to Storage
   - Create a new bucket named `media`
   - Set it to public
   - Copy your Supabase URL and anon key

3. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel:
     - `DATABASE_URL`: Your Supabase PostgreSQL connection string
     - `JWT_SECRET`: A random secret string
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Deploy!

4. **Run database migrations:**
   After first deployment, run:
   ```bash
   npx prisma migrate deploy
   ```
   Or use Vercel's build command to run migrations automatically.

### Vercel Configuration

Add to `vercel.json` (optional, for build-time migrations):
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

## Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** (Supabase) - Database
- **Supabase Storage** - Media file storage
- **Tailwind CSS** - Styling
- **open-graph-scraper** - Extract OG data from URLs
- **PapaParse** - CSV parsing

## Database Schema

- **Article**: Stores press articles with OG metadata
- **CityData**: Stores city-specific Airbnb metrics
- **Media**: Stores uploaded images and videos
- **ColumnMapping**: Stores CSV column mappings

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/articles/*` - Article management
- `/api/cities/*` - City data management
- `/api/media/*` - Media management
- `/api/press-release` - Press release generation

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (optional, for media storage)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (optional, for media storage)

