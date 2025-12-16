-- PostgreSQL Migration for BNBCalc Press Kit
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dbwglsptiubjulmegmbv/sql/new

-- Step 1: Create initial tables
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

-- Step 2: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Article_url_key" ON "Article"("url");
CREATE INDEX IF NOT EXISTS "Article_category_idx" ON "Article"("category");
CREATE INDEX IF NOT EXISTS "CityData_city_idx" ON "CityData"("city");

-- Step 3: Add state column to CityData (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CityData' AND column_name = 'state'
    ) THEN
        ALTER TABLE "CityData" ADD COLUMN "state" TEXT;
    END IF;
END $$;

-- Step 4: Add platform column to Media (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Media' AND column_name = 'platform'
    ) THEN
        ALTER TABLE "Media" ADD COLUMN "platform" TEXT;
    END IF;
END $$;

-- Step 5: Create function to update updatedAt timestamp (optional but recommended)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create triggers for updatedAt (if they don't exist)
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

