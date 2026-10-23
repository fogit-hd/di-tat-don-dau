ALTER TABLE "Room" ALTER COLUMN "yearMinSeconds" SET DEFAULT 5;

CREATE TABLE "TraitCopy" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TraitCopy_pkey" PRIMARY KEY ("id")
);
