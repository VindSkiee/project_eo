-- AlterTable
ALTER TABLE "CommunityGroup" ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "CommunityGroup" ADD CONSTRAINT "CommunityGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
