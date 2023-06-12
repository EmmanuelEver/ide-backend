/*
  Warnings:

  - Added the required column `compilationCount` to the `ActivitySession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActivitySession" ADD COLUMN     "compilationCount" INTEGER NOT NULL;
