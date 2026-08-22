-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'AGENT', 'PROJECT_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ParcelPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED');

-- CreateEnum
CREATE TYPE "TitleStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'CURATIVE', 'HOLD');

-- CreateEnum
CREATE TYPE "TitleSearchType" AS ENUM ('FULL', 'UPDATE', 'CURRENT_OWNER', 'O_AND_E');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('NOT_STARTED', 'ORDERED', 'FIELD_WORK', 'DRAFTING', 'REVIEW', 'COMPLETE', 'HOLD');

-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('BOUNDARY', 'TOPOGRAPHIC', 'ALTA', 'ROW_STAKING', 'AS_BUILT');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('NOT_STARTED', 'ORDERED', 'INSPECTION_SCHEDULED', 'DRAFT_RECEIVED', 'UNDER_REVIEW', 'FINAL', 'HOLD');

-- CreateEnum
CREATE TYPE "AppraisalType" AS ENUM ('FEE_SIMPLE', 'EASEMENT', 'DAMAGES_ONLY', 'REVIEW');

-- CreateEnum
CREATE TYPE "AcquisitionStatus" AS ENUM ('NOT_STARTED', 'OWNER_CONTACTED', 'OFFER_PREPARED', 'OFFER_PRESENTED', 'NEGOTIATING', 'AGREEMENT_REACHED', 'CLOSING', 'ACQUIRED', 'CONDEMNATION_RECOMMENDED', 'HOLD');

-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('FEE_SIMPLE', 'PERMANENT_EASEMENT', 'TEMPORARY_EASEMENT', 'ACCESS_EASEMENT', 'EASEMENT');

-- CreateEnum
CREATE TYPE "OfferResponse" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "CondemnationStatus" AS ENUM ('NOT_STARTED', 'NOTICE_SENT', 'PETITION_FILED', 'SERVED', 'HEARING_SCHEDULED', 'AWARD_ISSUED', 'APPEALED', 'TRIAL', 'JUDGMENT', 'POSSESSION_GRANTED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DamagesStatus" AS ENUM ('NOT_STARTED', 'INVESTIGATE', 'REPORT', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DamageType" AS ENUM ('CROP', 'TIMBER', 'FENCE', 'IRRIGATION', 'ACCESS', 'CONSTRUCTION', 'TCE_RENTAL', 'BUSINESS_LOSS', 'LANDSCAPING', 'WELL_SEPTIC', 'ENVIRONMENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DamageStatus" AS ENUM ('REPORTED', 'INVESTIGATING', 'ASSESSED', 'NEGOTIATING', 'APPROVED', 'PAID', 'DENIED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('EASEMENT', 'FEE_ACQUISITION', 'DAMAGES', 'TCE', 'RELOCATION', 'LEGAL', 'VENDOR', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'ISSUED', 'CLEARED', 'VOID', 'HOLD');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('PHONE', 'EMAIL', 'LETTER', 'IN_PERSON', 'TEXT', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'IMPORT', 'EXPORT', 'LOGIN');

-- CreateEnum
CREATE TYPE "SpecialConditionsStatus" AS ENUM ('NOT_STARTED', 'NOTIFICATION_REQUIRED', 'LOCKED_GATE', 'HERBICIDES', 'FORESTRY', 'OTHER');

-- CreateEnum
CREATE TYPE "StatusCategory" AS ENUM ('GENERAL', 'TITLE', 'SURVEY', 'APPRAISAL', 'ACQUISITION', 'CONDEMNATION', 'SPECIAL_CONDITIONS', 'DAMAGES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "projectLimit" INTEGER NOT NULL DEFAULT 2,
    "parcelLimitPerProject" INTEGER NOT NULL DEFAULT 50,
    "userLimit" INTEGER NOT NULL DEFAULT 1,
    "storageLimit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "clientName" TEXT,
    "contractNumber" TEXT,
    "workOrderNumber" TEXT,
    "projectType" TEXT,
    "landBudget" DECIMAL(12,2),
    "laborBudget" DECIMAL(12,2),
    "centerlineData" JSONB,
    "rowExtents" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parcelNumber" TEXT,
    "pin" TEXT,
    "owner" TEXT,
    "ownerAddress" TEXT,
    "ownerCity" TEXT,
    "ownerState" TEXT,
    "ownerZip" TEXT,
    "ownerPhone" TEXT,
    "ownerEmail" TEXT,
    "legalDesc" TEXT,
    "county" TEXT,
    "propertyAddress" TEXT,
    "state" TEXT,
    "status" "ParcelStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "titleStatus" "TitleStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "surveyStatus" "SurveyStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "appraisalStatus" "AppraisalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "acquisitionStatus" "AcquisitionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "condemnationStatus" "CondemnationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "damagesStatus" "DamagesStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "specialConditionsStatus" "SpecialConditionsStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sequence" INTEGER,
    "milepost" DOUBLE PRECISION,
    "geometry" JSONB,
    "acreage" DOUBLE PRECISION,
    "totalAcres" DECIMAL(10,3),
    "easementAcres" DECIMAL(10,3),
    "tceAcres" DECIMAL(10,3),
    "stationStart" TEXT,
    "stationEnd" TEXT,
    "priority" "ParcelPriority" NOT NULL DEFAULT 'NORMAL',
    "assignedAgentId" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "StatusCategory" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" "StatusCategory" NOT NULL DEFAULT 'GENERAL',
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "title_tracking" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "company" TEXT,
    "searchType" "TitleSearchType" NOT NULL DEFAULT 'FULL',
    "orderDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "curativeIssues" TEXT,
    "curativeComplete" TIMESTAMP(3),
    "commitmentDate" TIMESTAMP(3),
    "policyDate" TIMESTAMP(3),
    "cost" DECIMAL(8,2),
    "bpid" TEXT,
    "workOrder" TEXT,
    "status" "TitleStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "title_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_tracking" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "company" TEXT,
    "surveyType" "SurveyType" NOT NULL DEFAULT 'BOUNDARY',
    "acres" DECIMAL(10,3),
    "orderDate" TIMESTAMP(3),
    "fieldStartDate" TIMESTAMP(3),
    "fieldEndDate" TIMESTAMP(3),
    "stakingDate" TIMESTAMP(3),
    "draftDate" TIMESTAMP(3),
    "finalDate" TIMESTAMP(3),
    "cost" DECIMAL(8,2),
    "bpid" TEXT,
    "workOrder" TEXT,
    "monumentSet" BOOLEAN NOT NULL DEFAULT false,
    "status" "SurveyStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_tracking" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "appraiser" TEXT,
    "appraisalType" "AppraisalType" NOT NULL DEFAULT 'FEE_SIMPLE',
    "scope" TEXT,
    "orderDate" TIMESTAMP(3),
    "inspectionDate" TIMESTAMP(3),
    "draftDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "finalDate" TIMESTAMP(3),
    "beforeValue" DECIMAL(12,2),
    "afterValue" DECIMAL(12,2),
    "easementValue" DECIMAL(12,2),
    "damageValue" DECIMAL(12,2),
    "totalValue" DECIMAL(12,2),
    "cost" DECIMAL(8,2),
    "bpid" TEXT,
    "workOrder" TEXT,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acquisition_tracking" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "acquisitionType" "AcquisitionType" NOT NULL DEFAULT 'EASEMENT',
    "tier1Offer" DECIMAL(12,2),
    "tier1Date" TIMESTAMP(3),
    "tier1Response" "OfferResponse",
    "tier2Offer" DECIMAL(12,2),
    "tier2Date" TIMESTAMP(3),
    "tier2Response" "OfferResponse",
    "tier3Offer" DECIMAL(12,2),
    "tier3Date" TIMESTAMP(3),
    "tier3Response" "OfferResponse",
    "tier4Offer" DECIMAL(12,2),
    "tier4Date" TIMESTAMP(3),
    "tier4Response" "OfferResponse",
    "aboveTierOffer" DECIMAL(12,2),
    "approvalRequested" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "counterOfferAmount" DECIMAL(12,2),
    "counterOfferDate" TIMESTAMP(3),
    "finalAmount" DECIMAL(12,2),
    "agreementDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "recordingDate" TIMESTAMP(3),
    "documentNumber" TEXT,
    "agentFee" DECIMAL(8,2),
    "status" "AcquisitionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acquisition_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condemnation_tracking" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "caseNumber" TEXT,
    "court" TEXT,
    "judge" TEXT,
    "counsel" TEXT,
    "noticeSentDate" TIMESTAMP(3),
    "petitionFiledDate" TIMESTAMP(3),
    "servedDate" TIMESTAMP(3),
    "hearingDate" TIMESTAMP(3),
    "awardAmount" DECIMAL(12,2),
    "awardDate" TIMESTAMP(3),
    "appealFiled" BOOLEAN NOT NULL DEFAULT false,
    "trialDate" TIMESTAMP(3),
    "judgmentDate" TIMESTAMP(3),
    "possessionDate" TIMESTAMP(3),
    "legalCosts" DECIMAL(8,2),
    "status" "CondemnationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condemnation_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_claims" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "damageType" "DamageType" NOT NULL,
    "description" TEXT,
    "assessedAmount" DECIMAL(10,2),
    "negotiatedAmount" DECIMAL(10,2),
    "paidAmount" DECIMAL(10,2),
    "inspector" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "status" "DamageStatus" NOT NULL DEFAULT 'REPORTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "damage_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parcelId" TEXT,
    "payeeName" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'EASEMENT',
    "amount" DECIMAL(12,2) NOT NULL,
    "requestDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "checkNumber" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_logs" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "contactDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT,
    "summary" TEXT NOT NULL,
    "outcome" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "parcels_projectId_idx" ON "parcels"("projectId");

-- CreateIndex
CREATE INDEX "parcels_status_idx" ON "parcels"("status");

-- CreateIndex
CREATE INDEX "parcels_titleStatus_idx" ON "parcels"("titleStatus");

-- CreateIndex
CREATE INDEX "parcels_damagesStatus_idx" ON "parcels"("damagesStatus");

-- CreateIndex
CREATE INDEX "parcels_specialConditionsStatus_idx" ON "parcels"("specialConditionsStatus");

-- CreateIndex
CREATE INDEX "parcels_county_idx" ON "parcels"("county");

-- CreateIndex
CREATE INDEX "parcels_assignedAgentId_idx" ON "parcels"("assignedAgentId");

-- CreateIndex
CREATE INDEX "notes_parcelId_idx" ON "notes"("parcelId");

-- CreateIndex
CREATE INDEX "notes_category_idx" ON "notes"("category");

-- CreateIndex
CREATE INDEX "documents_parcelId_idx" ON "documents"("parcelId");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "milestones_projectId_idx" ON "milestones"("projectId");

-- CreateIndex
CREATE INDEX "milestones_targetDate_idx" ON "milestones"("targetDate");

-- CreateIndex
CREATE INDEX "title_tracking_parcelId_idx" ON "title_tracking"("parcelId");

-- CreateIndex
CREATE INDEX "title_tracking_status_idx" ON "title_tracking"("status");

-- CreateIndex
CREATE INDEX "survey_tracking_parcelId_idx" ON "survey_tracking"("parcelId");

-- CreateIndex
CREATE INDEX "survey_tracking_status_idx" ON "survey_tracking"("status");

-- CreateIndex
CREATE INDEX "appraisal_tracking_parcelId_idx" ON "appraisal_tracking"("parcelId");

-- CreateIndex
CREATE INDEX "appraisal_tracking_status_idx" ON "appraisal_tracking"("status");

-- CreateIndex
CREATE INDEX "acquisition_tracking_parcelId_idx" ON "acquisition_tracking"("parcelId");

-- CreateIndex
CREATE INDEX "acquisition_tracking_status_idx" ON "acquisition_tracking"("status");

-- CreateIndex
CREATE INDEX "condemnation_tracking_parcelId_idx" ON "condemnation_tracking"("parcelId");

-- CreateIndex
CREATE INDEX "condemnation_tracking_status_idx" ON "condemnation_tracking"("status");

-- CreateIndex
CREATE INDEX "damage_claims_parcelId_idx" ON "damage_claims"("parcelId");

-- CreateIndex
CREATE INDEX "damage_claims_status_idx" ON "damage_claims"("status");

-- CreateIndex
CREATE INDEX "payments_projectId_idx" ON "payments"("projectId");

-- CreateIndex
CREATE INDEX "payments_parcelId_idx" ON "payments"("parcelId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "contact_logs_parcelId_idx" ON "contact_logs"("parcelId");

-- CreateIndex
CREATE INDEX "contact_logs_contactDate_idx" ON "contact_logs"("contactDate");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_tracking" ADD CONSTRAINT "title_tracking_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_tracking" ADD CONSTRAINT "survey_tracking_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_tracking" ADD CONSTRAINT "appraisal_tracking_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisition_tracking" ADD CONSTRAINT "acquisition_tracking_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condemnation_tracking" ADD CONSTRAINT "condemnation_tracking_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_claims" ADD CONSTRAINT "damage_claims_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_logs" ADD CONSTRAINT "contact_logs_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

