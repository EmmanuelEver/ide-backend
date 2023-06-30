-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('SYNTAX', 'LOGIC', 'RUNTIME', 'OTHER');

-- AlterTable
ALTER TABLE "Compilations" ADD COLUMN     "errorType" "ErrorType";
