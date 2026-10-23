ALTER TABLE "GameEvent" ADD COLUMN "group" TEXT NOT NULL DEFAULT '';

CREATE TABLE "EventIndustryTag" (
    "eventId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,

    CONSTRAINT "EventIndustryTag_pkey" PRIMARY KEY ("eventId","industryId")
);

CREATE TABLE "EventContextTag" (
    "eventId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,

    CONSTRAINT "EventContextTag_pkey" PRIMARY KEY ("eventId","contextId")
);

ALTER TABLE "EventIndustryTag" ADD CONSTRAINT "EventIndustryTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventIndustryTag" ADD CONSTRAINT "EventIndustryTag_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventContextTag" ADD CONSTRAINT "EventContextTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventContextTag" ADD CONSTRAINT "EventContextTag_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;
