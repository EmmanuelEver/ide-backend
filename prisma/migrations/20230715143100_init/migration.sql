-- AlterEnum
ALTER TYPE "ErrorType" ADD VALUE 'IncompatibleTypeError';

-- AlterTable
ALTER TABLE "Compilations" ADD COLUMN     "eqScore" DOUBLE PRECISION;
