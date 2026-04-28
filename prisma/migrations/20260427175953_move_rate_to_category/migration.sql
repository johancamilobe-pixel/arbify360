/*
  Warnings:

  - You are about to drop the column `ratePerGame` on the `AcademyMembership` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AcademyMembership" DROP COLUMN "ratePerGame";

-- AlterTable
ALTER TABLE "RefereeCategory" ADD COLUMN     "ratePerGame" DECIMAL(10,2);
