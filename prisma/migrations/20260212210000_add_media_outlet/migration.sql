-- CreateTable
CREATE TABLE "MediaOutlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaOutlet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaOutlet_market_idx" ON "MediaOutlet"("market");

-- CreateIndex
CREATE INDEX "MediaOutlet_type_idx" ON "MediaOutlet"("type");
