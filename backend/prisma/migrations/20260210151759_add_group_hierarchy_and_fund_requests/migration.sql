-- CreateEnum
CREATE TYPE "FundRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ApprovalRule" ADD COLUMN     "isCrossGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minAmount" DECIMAL(15,2);

-- CreateTable
CREATE TABLE "FundRequest" (
    "id" TEXT NOT NULL,
    "requesterGroupId" INTEGER NOT NULL,
    "targetGroupId" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FundRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FundRequest" ADD CONSTRAINT "FundRequest_requesterGroupId_fkey" FOREIGN KEY ("requesterGroupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundRequest" ADD CONSTRAINT "FundRequest_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundRequest" ADD CONSTRAINT "FundRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundRequest" ADD CONSTRAINT "FundRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
