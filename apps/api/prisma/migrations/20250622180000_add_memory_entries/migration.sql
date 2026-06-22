-- CreateTable
CREATE TABLE "memory_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "space_type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "source" VARCHAR(20) NOT NULL DEFAULT 'postgres',
    "memwal_blob_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_entries_user_id_space_type_created_at_idx" ON "memory_entries"("user_id", "space_type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;