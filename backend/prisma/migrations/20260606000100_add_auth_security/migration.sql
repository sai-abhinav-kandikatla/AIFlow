-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'user',
ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locked_until" TIMESTAMP(3),
ADD COLUMN "last_login_at" TIMESTAMP(3),
ADD COLUMN "last_password_reset_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "email_hash" TEXT,
    "ip_hash" TEXT,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "metadata" JSONB,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_events_event_type_created_at_idx" ON "security_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "security_events_email_hash_created_at_idx" ON "security_events"("email_hash", "created_at");

-- CreateIndex
CREATE INDEX "security_events_ip_hash_created_at_idx" ON "security_events"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "security_events_user_id_created_at_idx" ON "security_events"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
