-- CreateTable
CREATE TABLE "GamePhase" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePhase_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "Game" ADD COLUMN "gamePhaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GamePhase_academyId_name_key" ON "GamePhase"("academyId", "name");

-- AddForeignKey
ALTER TABLE "GamePhase" ADD CONSTRAINT "GamePhase_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_gamePhaseId_fkey" FOREIGN KEY ("gamePhaseId") REFERENCES "GamePhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
