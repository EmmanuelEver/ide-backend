/*
  Warnings:

  - Added the required column `shortDescripition` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "shortDescripition" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_ActivityToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityToStudent_AB_unique" ON "_ActivityToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityToStudent_B_index" ON "_ActivityToStudent"("B");

-- AddForeignKey
ALTER TABLE "_ActivityToStudent" ADD CONSTRAINT "_ActivityToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityToStudent" ADD CONSTRAINT "_ActivityToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
