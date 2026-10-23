-- DropTable
DROP TABLE IF EXISTS "Theme";
DROP TABLE IF EXISTS "Question";
DROP TABLE IF EXISTS "EventTemplate";

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "art" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "worker" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "leap" TEXT NOT NULL,
    "weak" TEXT NOT NULL,
    "epl" DOUBLE PRECISION NOT NULL,
    "tech" DOUBLE PRECISION NOT NULL,
    "support" DOUBLE PRECISION NOT NULL,
    "infra" DOUBLE PRECISION NOT NULL,
    "emission" DOUBLE PRECISION NOT NULL,
    "baseOutput" DOUBLE PRECISION NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "opex" DOUBLE PRECISION NOT NULL,
    "idleCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryDirection" (
    "industryId" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "IndustryDirection_pkey" PRIMARY KEY ("industryId","line")
);

-- CreateTable
CREATE TABLE "IndustryNamePattern" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "IndustryNamePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "roleTemplate" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Scale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Context" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "cashMul" DOUBLE PRECISION NOT NULL,
    "engineers" DOUBLE PRECISION NOT NULL,
    "machines" DOUBLE PRECISION NOT NULL,
    "pollution" DOUBLE PRECISION NOT NULL,
    "dependency" DOUBLE PRECISION NOT NULL,
    "condition" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "regionId" TEXT,
    "scaleId" TEXT,
    "contextId" TEXT,
    "role" TEXT,
    "mission" TEXT,
    "factoryName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopyTemplate" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CopyTemplate_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "InvestmentLine" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "log" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "InvestmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionType" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "QuestionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "typeId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "correctOptionId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "questionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("questionId","key")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "visual" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "exposure" TEXT NOT NULL,
    "effect" JSONB NOT NULL,
    "timeoutChoice" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVariant" (
    "eventId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "EventVariant_pkey" PRIMARY KEY ("eventId","industryId")
);

-- CreateTable
CREATE TABLE "EventChoice" (
    "eventId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "patch" JSONB NOT NULL,

    CONSTRAINT "EventChoice_pkey" PRIMARY KEY ("eventId","key")
);

-- CreateTable
CREATE TABLE "Ending" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "requiresProduction" BOOLEAN NOT NULL DEFAULT false,
    "productionMul" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "minRatio" DOUBLE PRECISION,
    "maxRatio" DOUBLE PRECISION,
    "minTech" DOUBLE PRECISION,
    "maxDependency" DOUBLE PRECISION,
    "minMachines" DOUBLE PRECISION,

    CONSTRAINT "Ending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceConfig" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "BalanceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndustryNamePattern_industryId_sort_key" ON "IndustryNamePattern"("industryId", "sort");

-- CreateIndex
CREATE INDEX "Question_topic_idx" ON "Question"("topic");

-- CreateIndex
CREATE INDEX "GameEvent_scope_idx" ON "GameEvent"("scope");

-- AddForeignKey
ALTER TABLE "IndustryDirection" ADD CONSTRAINT "IndustryDirection_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryNamePattern" ADD CONSTRAINT "IndustryNamePattern_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "QuestionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVariant" ADD CONSTRAINT "EventVariant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVariant" ADD CONSTRAINT "EventVariant_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChoice" ADD CONSTRAINT "EventChoice_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
