-- Allow free subscriptions to exist before a Stripe customer is created.
-- PostgreSQL unique indexes allow multiple NULL values, unlike repeated empty strings.
ALTER TABLE "subscriptions"
ALTER COLUMN "stripeCustomerId" DROP NOT NULL;

UPDATE "subscriptions"
SET "stripeCustomerId" = NULL
WHERE "stripeCustomerId" = '';
