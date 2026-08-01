-- Replace the free-text `timeline` field with a real expiry date.
-- Only one non-empty legacy value existed (test data), so no backfill is needed.
ALTER TABLE "Listing" DROP COLUMN "timeline";
ALTER TABLE "Listing" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "Listing_expiresAt_idx" ON "Listing"("expiresAt");
