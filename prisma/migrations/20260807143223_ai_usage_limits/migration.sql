-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsage_day_idx" ON "AiUsage"("day");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsage_key_day_key" ON "AiUsage"("key", "day");
