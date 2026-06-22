-- CreateEnum
CREATE TYPE "ExperienceMode" AS ENUM ('beginner', 'creator', 'builder');
CREATE TYPE "UserTier" AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE "CollectionStatus" AS ENUM ('draft', 'generating', 'generated', 'deploying', 'deployed', 'published', 'archived');
CREATE TYPE "MintCurrency" AS ENUM ('SUI', 'LOFI', 'USDC', 'USDsui');
CREATE TYPE "NftItemStatus" AS ENUM ('pending', 'generated', 'uploaded', 'deployed', 'failed');
CREATE TYPE "DeploymentNetwork" AS ENUM ('testnet', 'mainnet');
CREATE TYPE "NftType" AS ENUM ('standard', 'dynamic', 'membership', 'event_ticket', 'soulbound', 'loyalty');
CREATE TYPE "DeploymentStatus" AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE "MarketplaceName" AS ENUM ('tradeport', 'bluemove', 'clutchy');
CREATE TYPE "ListingStatus" AS ENUM ('pending', 'active', 'inactive', 'failed');
CREATE TYPE "PaymentCurrency" AS ENUM ('SUI', 'LOFI', 'USDC', 'USDsui');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE "FeeCategory" AS ENUM ('generation', 'storage', 'deployment', 'premium_ai', 'marketplace', 'subscription');
CREATE TYPE "JobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE "AgentType" AS ENUM ('creator_coach', 'nft_architect', 'metadata', 'marketplace', 'deployment', 'support');

-- CreateTable
CREATE TABLE "salt_vault" (
    "id" UUID NOT NULL,
    "encrypted_salt" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "salt_vault_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "display_name" VARCHAR(100),
    "avatar_url" TEXT,
    "zklogin_iss" VARCHAR(255) NOT NULL,
    "zklogin_sub" VARCHAR(255) NOT NULL,
    "zklogin_aud" VARCHAR(255) NOT NULL,
    "sui_address" VARCHAR(66) NOT NULL,
    "salt_ref_id" UUID NOT NULL,
    "experience_mode" "ExperienceMode" NOT NULL DEFAULT 'beginner',
    "tier" "UserTier" NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sui_address" VARCHAR(66) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memory_spaces" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "memwal_space_id" VARCHAR(100),
    "space_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memory_spaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "symbol" VARCHAR(10),
    "supply" INTEGER NOT NULL,
    "status" "CollectionStatus" NOT NULL DEFAULT 'draft',
    "art_style" JSONB,
    "royalty_bps" INTEGER NOT NULL DEFAULT 500,
    "mint_price" BIGINT,
    "mint_currency" "MintCurrency" NOT NULL DEFAULT 'SUI',
    "preview_url" TEXT,
    "memwal_space_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trait_layers" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "blend_mode" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trait_layers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trait_assets" (
    "id" UUID NOT NULL,
    "layer_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "file_path" TEXT NOT NULL,
    "walrus_blob_id" VARCHAR(100),
    "rarity_weight" INTEGER NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trait_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nft_items" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "token_id" INTEGER NOT NULL,
    "name" VARCHAR(200),
    "image_blob_id" VARCHAR(100),
    "image_url" TEXT,
    "trait_hash" VARCHAR(64) NOT NULL,
    "rarity_score" DECIMAL(10,4),
    "rarity_rank" INTEGER,
    "status" "NftItemStatus" NOT NULL DEFAULT 'pending',
    "sui_object_id" VARCHAR(66),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nft_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metadata_records" (
    "id" UUID NOT NULL,
    "nft_item_id" UUID NOT NULL,
    "walrus_blob_id" VARCHAR(100),
    "metadata_uri" TEXT,
    "schema_version" VARCHAR(10) NOT NULL DEFAULT '1.0',
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "metadata_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "walrus_blobs" (
    "id" UUID NOT NULL,
    "blob_id" VARCHAR(100) NOT NULL,
    "content_type" VARCHAR(100),
    "size_bytes" BIGINT,
    "cost_wal" DECIMAL(18,8),
    "pinned_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "walrus_blobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deployments" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "package_id" VARCHAR(66),
    "publisher_cap" VARCHAR(66),
    "transfer_policy" VARCHAR(66),
    "kiosk_cap" VARCHAR(66),
    "tx_digest" VARCHAR(44),
    "network" "DeploymentNetwork" NOT NULL DEFAULT 'mainnet',
    "nft_type" "NftType" NOT NULL DEFAULT 'standard',
    "status" "DeploymentStatus" NOT NULL DEFAULT 'pending',
    "deployed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_listings" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "marketplace" "MarketplaceName" NOT NULL,
    "external_id" VARCHAR(100),
    "listing_url" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'pending',
    "listed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" "PaymentCurrency" NOT NULL,
    "fee_category" "FeeCategory" NOT NULL,
    "tx_digest" VARCHAR(44),
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "collection_id" UUID,
    "agent_type" "AgentType",
    "memwal_thread_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_sui_address_key" ON "users"("sui_address");
CREATE UNIQUE INDEX "users_zklogin_iss_zklogin_sub_zklogin_aud_key" ON "users"("zklogin_iss", "zklogin_sub", "zklogin_aud");
CREATE UNIQUE INDEX "wallets_sui_address_key" ON "wallets"("sui_address");
CREATE UNIQUE INDEX "memory_spaces_user_id_space_type_key" ON "memory_spaces"("user_id", "space_type");
CREATE INDEX "collections_user_id_idx" ON "collections"("user_id");
CREATE INDEX "collections_status_idx" ON "collections"("status");
CREATE UNIQUE INDEX "collections_user_id_slug_key" ON "collections"("user_id", "slug");
CREATE UNIQUE INDEX "nft_items_collection_id_token_id_key" ON "nft_items"("collection_id", "token_id");
CREATE UNIQUE INDEX "nft_items_collection_id_trait_hash_key" ON "nft_items"("collection_id", "trait_hash");
CREATE INDEX "nft_items_collection_id_idx" ON "nft_items"("collection_id");
CREATE INDEX "nft_items_collection_id_rarity_rank_idx" ON "nft_items"("collection_id", "rarity_rank");
CREATE UNIQUE INDEX "metadata_records_nft_item_id_key" ON "metadata_records"("nft_item_id");
CREATE UNIQUE INDEX "walrus_blobs_blob_id_key" ON "walrus_blobs"("blob_id");
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at" DESC);
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_salt_ref_id_fkey" FOREIGN KEY ("salt_ref_id") REFERENCES "salt_vault"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memory_spaces" ADD CONSTRAINT "memory_spaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trait_layers" ADD CONSTRAINT "trait_layers_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trait_assets" ADD CONSTRAINT "trait_assets_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "trait_layers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nft_items" ADD CONSTRAINT "nft_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_records" ADD CONSTRAINT "metadata_records_nft_item_id_fkey" FOREIGN KEY ("nft_item_id") REFERENCES "nft_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;