/*
  Warnings:

  - You are about to drop the column `Error` on the `Compilations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Compilations" DROP COLUMN "Error",
ADD COLUMN     "error" BOOLEAN;
