-- AlterTable
ALTER TABLE "product_analyses" ADD COLUMN     "snapshot" JSONB;

-- AlterTable
ALTER TABLE "sourced_products" ADD COLUMN     "analysisId" TEXT;

-- CreateIndex
CREATE INDEX "sourced_products_teamId_soldDate_idx" ON "sourced_products"("teamId", "soldDate");

-- AddForeignKey
ALTER TABLE "sourced_products" ADD CONSTRAINT "sourced_products_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill the decision->outcome link for purchases recorded before this column
-- existed, so calibration has history to work with on day one instead of
-- starting empty. For each purchase, take the team's most recent analysis of
-- that product at or just before the purchase date; the one-day grace window
-- covers date-only purchase dates entered after the fact. Purchases with no
-- matching analysis stay NULL and are simply excluded from calibration.
UPDATE "sourced_products" sp
SET "analysisId" = (
  SELECT pa."id"
  FROM "product_analyses" pa
  WHERE pa."teamId" = sp."teamId"
    AND pa."productId" = sp."productId"
    AND pa."createdAt" <= sp."purchaseDate" + INTERVAL '1 day'
  ORDER BY pa."createdAt" DESC
  LIMIT 1
)
WHERE sp."analysisId" IS NULL;
