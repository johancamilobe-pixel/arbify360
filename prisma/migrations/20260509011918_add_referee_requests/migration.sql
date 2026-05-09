-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttendanceResponse" AS ENUM ('ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RefereeRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "response" "AttendanceResponse" NOT NULL DEFAULT 'ACCEPTED';

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "subscriptionEndsAt" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "lastPaymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefereeRequest" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "supabaseId" TEXT,
    "status" "RefereeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefereeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_academyId_key" ON "Subscription"("academyId");

-- CreateIndex
CREATE UNIQUE INDEX "RefereeRequest_email_academyId_key" ON "RefereeRequest"("email", "academyId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefereeRequest" ADD CONSTRAINT "RefereeRequest_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
