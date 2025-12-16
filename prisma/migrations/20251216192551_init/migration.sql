-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "ogImage" TEXT,
    "metaDescription" TEXT,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CityData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "grossYield" REAL,
    "grossYieldRank" INTEGER,
    "totalRevenue" REAL,
    "totalRevenueRank" INTEGER,
    "totalListings" INTEGER,
    "totalListingsRank" INTEGER,
    "revenuePerListing" REAL,
    "revenuePerListingRank" INTEGER,
    "occupancy" REAL,
    "occupancyRank" INTEGER,
    "nightlyRate" REAL,
    "nightlyRateRank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ColumnMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "columnName" TEXT NOT NULL,
    "mappedField" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");

-- CreateIndex
CREATE INDEX "CityData_city_idx" ON "CityData"("city");
