/*
  Warnings:

  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleId",
ADD COLUMN     "firstname" TEXT,
ADD COLUMN     "lastname" TEXT;
