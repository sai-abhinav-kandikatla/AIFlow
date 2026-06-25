-- AlterTable
ALTER TABLE "threads" ADD COLUMN "share_token" TEXT,
ADD COLUMN "is_shared" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "threads_share_token_key" ON "threads"("share_token");
