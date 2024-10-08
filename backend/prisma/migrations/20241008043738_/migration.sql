/*
  Warnings:

  - The values [user,admin] on the enum `roleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `accesstoken` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshtoken` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `photo` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "roleType_new" AS ENUM ('student', 'instructor');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "roleType_new" USING ("role"::text::"roleType_new");
ALTER TYPE "roleType" RENAME TO "roleType_old";
ALTER TYPE "roleType_new" RENAME TO "roleType";
DROP TYPE "roleType_old";
COMMIT;

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleId",
DROP COLUMN "name",
ADD COLUMN     "accesstoken" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "refreshtoken" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "photo" SET NOT NULL,
ALTER COLUMN "photo" SET DEFAULT 'https://www.google.co.in/imgres?q=avatar%20for%20progile&imgurl=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F014%2F212%2F681%2Foriginal%2Ffemale-user-profile-avatar-is-a-woman-a-character-for-a-screen-saver-with-emotions-for-website-and-mobile-app-design-illustration-on-a-white-isolated-background-vector.jpg&imgrefurl=https%3A%2F%2Fwww.vecteezy.com%2Fvector-art%2F14212681-female-user-profile-avatar-is-a-woman-a-character-for-a-screen-saver-with-emotions-for-website-and-mobile-app-design-vector-illustration-on-a-white-isolated-background&docid=PLuN01VZotFH4M&tbnid=lsrv_IqhsJhCDM&vet=12ahUKEwjGxuPEu_yIAxWnVWwGHTHmGJ4QM3oECH0QAA..i&w=1920&h=1920&hcb=2&ved=2ahUKEwjGxuPEu_yIAxWnVWwGHTHmGJ4QM3oECH0QAA',
ALTER COLUMN "role" SET DEFAULT 'student';
