# How to Run Database Migrations in Supabase

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv/sql/new
2. You should see a SQL editor with a text area

### Step 2: Copy the Migration SQL
Copy the ENTIRE contents of the `SUPABASE_MIGRATION.sql` file and paste it into the SQL editor.

### Step 3: Run the SQL
1. Click the "Run" button (or press Cmd/Ctrl + Enter)
2. Wait for it to complete (should take a few seconds)
3. You should see a success message

### Step 4: Verify Tables Were Created
1. Go to: https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv/editor
2. In the left sidebar under "Tables", you should now see:
   - Article
   - CityData
   - Media
   - ColumnMapping

If you see these tables, the migration was successful!

### Step 5: Test Your Vercel App
1. Go back to: https://bnbcalc-press-kit.vercel.app/
2. Refresh the page
3. The 404 error should be gone and your app should load

---

## Alternative: Copy-Paste Ready SQL

If you prefer, here's the complete SQL to paste directly:

```sql
-- PostgreSQL Migration for BNBCalc Press Kit
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "ogImage" TEXT,
    "metaDescription" TEXT,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CityData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "grossYield" DOUBLE PRECISION,
    "grossYieldRank" INTEGER,
    "totalRevenue" DOUBLE PRECISION,
    "totalRevenueRank" INTEGER,
    "totalListings" INTEGER,
    "totalListingsRank" INTEGER,
    "revenuePerListing" DOUBLE PRECISION,
    "revenuePerListingRank" INTEGER,
    "occupancy" DOUBLE PRECISION,
    "occupancyRank" INTEGER,
    "nightlyRate" DOUBLE PRECISION,
    "nightlyRateRank" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'media',
    "platform" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ColumnMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "columnName" TEXT NOT NULL,
    "mappedField" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Article_url_key" ON "Article"("url");
CREATE INDEX IF NOT EXISTS "Article_category_idx" ON "Article"("category");
CREATE INDEX IF NOT EXISTS "CityData_city_idx" ON "CityData"("city");

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CityData' AND column_name = 'state'
    ) THEN
        ALTER TABLE "CityData" ADD COLUMN "state" TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Media' AND column_name = 'platform'
    ) THEN
        ALTER TABLE "Media" ADD COLUMN "platform" TEXT;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_article_updated_at ON "Article";
CREATE TRIGGER update_article_updated_at BEFORE UPDATE ON "Article"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_citydata_updated_at ON "CityData";
CREATE TRIGGER update_citydata_updated_at BEFORE UPDATE ON "CityData"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_updated_at ON "Media";
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON "Media"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_columnmapping_updated_at ON "ColumnMapping";
CREATE TRIGGER update_columnmapping_updated_at BEFORE UPDATE ON "ColumnMapping"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```



