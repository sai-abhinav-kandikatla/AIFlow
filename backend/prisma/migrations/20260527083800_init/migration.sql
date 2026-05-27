-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'starter', 'pro', 'team');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('share_link', 'file_upload', 'raw_text', 'manual_description');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "subscription_status" TEXT,
    "subscription_current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threads" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "key_decisions" JSONB NOT NULL,
    "last_point" TEXT NOT NULL,
    "next_step" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "raw_input" TEXT NOT NULL,
    "input_method" "InputMethod" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_prompts" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "model_name" TEXT NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "threads_user_id_created_at_idx" ON "threads"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "generated_prompts_thread_id_idx" ON "generated_prompts"("thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "generated_prompts_thread_id_model_name_key" ON "generated_prompts"("thread_id", "model_name");

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_prompts" ADD CONSTRAINT "generated_prompts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
