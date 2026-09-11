-- Additive columns for ROWScope seed (access acres, encroach $, matrix access $/ac)
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "accessAcres" DECIMAL(10,3);
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "accessTemp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "encroachAmount" DECIMAL(12,2);
ALTER TABLE "land_payment_matrices" ADD COLUMN IF NOT EXISTS "tempAccessPct" DOUBLE PRECISION NOT NULL DEFAULT 0.5;
ALTER TABLE "land_payment_matrix_rows" ADD COLUMN IF NOT EXISTS "accessAmount" DECIMAL(12,2);
