ALTER TABLE "GameEvent" ADD COLUMN "good" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "EventNarration" (
    "eventId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL DEFAULT '',
    "contextId" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "EventNarration_pkey" PRIMARY KEY ("eventId","regionId","contextId")
);

ALTER TABLE "EventNarration" ADD CONSTRAINT "EventNarration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
