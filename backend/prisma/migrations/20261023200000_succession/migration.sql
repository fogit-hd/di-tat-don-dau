ALTER TABLE "Room" ADD COLUMN "yearMinSeconds" INTEGER NOT NULL DEFAULT 10;

CREATE TABLE "SuccessionOdds" (
    "minYear" INTEGER NOT NULL,
    "chance" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "SuccessionOdds_pkey" PRIMARY KEY ("minYear")
);

CREATE TABLE "SuccessionReason" (
    "id" TEXT NOT NULL,
    "industryId" TEXT,
    "contextId" TEXT,
    "text" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SuccessionReason_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HeirOutcome" (
    "id" TEXT NOT NULL,
    "outcomeType" TEXT NOT NULL,
    "industryId" TEXT,
    "contextId" TEXT,
    "label" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "HeirOutcome_pkey" PRIMARY KEY ("id")
);
