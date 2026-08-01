-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "partnershipType" TEXT NOT NULL DEFAULT 'barter';

-- CreateIndex
CREATE INDEX "Listing_partnershipType_idx" ON "Listing"("partnershipType");
