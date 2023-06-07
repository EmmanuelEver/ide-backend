/*
  Warnings:

  - Added the required column `openDate` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openDate` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "closeDate" TIMESTAMP(3),
ADD COLUMN     "openDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "closeDate" TIMESTAMP(3),
ADD COLUMN     "openDate" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
