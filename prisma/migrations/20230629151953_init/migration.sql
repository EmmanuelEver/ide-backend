/*
  Warnings:

  - The values [SYNTAX,LOGIC,RUNTIME,OTHER] on the enum `ErrorType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProgLanguage" AS ENUM ('c', 'python');

-- AlterEnum
BEGIN;
CREATE TYPE "ErrorType_new" AS ENUM ('CompilationError', 'FileSystemError', 'ExecutionError', 'OtherError');
ALTER TABLE "Compilations" ALTER COLUMN "errorType" TYPE "ErrorType_new" USING ("errorType"::text::"ErrorType_new");
ALTER TYPE "ErrorType" RENAME TO "ErrorType_old";
ALTER TYPE "ErrorType_new" RENAME TO "ErrorType";
DROP TYPE "ErrorType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "lang" "ProgLanguage";
