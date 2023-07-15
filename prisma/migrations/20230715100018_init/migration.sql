-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ErrorType" ADD VALUE 'LogicError';
ALTER TYPE "ErrorType" ADD VALUE 'SegmentationFaultError';
ALTER TYPE "ErrorType" ADD VALUE 'FloatingPointError';
ALTER TYPE "ErrorType" ADD VALUE 'AssertionError';
ALTER TYPE "ErrorType" ADD VALUE 'InfiniteLoopError';
ALTER TYPE "ErrorType" ADD VALUE 'SystemCallError';
