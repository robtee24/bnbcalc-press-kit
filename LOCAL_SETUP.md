# Local Development Setup

## Quick Start

The application is now configured for local testing with SQLite. The development server should be starting.

### Access the Application

- **Public Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Admin Password**: `BNBCalc123$`

### What's Been Set Up

1. ✅ Database created (SQLite at `./dev.db`)
2. ✅ Migrations applied
3. ✅ Upload directories created
4. ✅ Development server starting

### To Start/Stop the Server

**Start the server:**
```bash
DATABASE_URL="file:./dev.db" JWT_SECRET="local-dev-secret-key" npm run dev
```

Or use the convenience script:
```bash
./start-local.sh
```

**Stop the server:**
Press `Ctrl+C` in the terminal where it's running

### Testing the Application

1. **Test Public Pages:**
   - Visit http://localhost:3000
   - Try the sidebar menu items
   - Test "Search by City" (you'll need to add city data first via admin)

2. **Test Admin Panel:**
   - Visit http://localhost:3000/admin
   - Login with password: `BNBCalc123$`
   - Try adding an article (paste a news article URL)
   - Try uploading an image or video
   - Try uploading a CSV with city data

### Adding Test Data

**Add a Test Article:**
1. Go to Admin > Past Press
2. Paste a news article URL (e.g., from BBC, CNN, etc.)
3. Select category (National or Local)
4. Click "Add Article"

**Add City Data:**
1. Go to Admin > Search By City
2. Upload a CSV file with columns like:
   - city, grossYield, grossYieldRank, totalRevenue, totalRevenueRank, etc.
3. Map the CSV columns to database fields
4. Click "Import Data"

**Add Media:**
1. Go to Admin > Media
2. Select Images or Videos tab
3. Upload a file with title and description
4. Files will be stored in `public/uploads/`

### Switching to PostgreSQL for Production

When you're ready to deploy or test with PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set your PostgreSQL connection string:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

### Notes

- SQLite is used for local development (quick setup, no database server needed)
- PostgreSQL is used for production (Supabase/Vercel)
- Media files are stored locally in `public/uploads/` for local dev
- For production, configure Supabase Storage (see DEPLOYMENT.md)

