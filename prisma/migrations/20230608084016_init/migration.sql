/*
  Warnings:

  - A unique constraint covering the columns `[accessCode]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accessCode` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "accessCode" TEXT NOT NULL,
ALTER COLUMN "openDate" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Section_accessCode_key" ON "Section"("accessCode");
