-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "lastActivity" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "lastActivity" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "lastActivity" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastUpdated" TIMESTAMP(3);
