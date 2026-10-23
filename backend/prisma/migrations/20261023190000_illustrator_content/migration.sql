ALTER TABLE "Industry" ADD COLUMN "group" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Industry" ADD COLUMN "groupName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Industry" ADD COLUMN "anchors" JSONB;

ALTER TABLE "Scale" ADD COLUMN "capitalFactor" DOUBLE PRECISION NOT NULL DEFAULT 1;

ALTER TABLE "Scenario" ADD COLUMN "body" TEXT NOT NULL DEFAULT '';

CREATE TABLE "FactoryNamePart" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    CONSTRAINT "FactoryNamePart_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GameEvent" ADD COLUMN "industryId" TEXT;
ALTER TABLE "GameEvent" ADD COLUMN "effectCode" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "GameEvent" ADD COLUMN "severity" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "GameEvent_industryId_idx" ON "GameEvent"("industryId");
