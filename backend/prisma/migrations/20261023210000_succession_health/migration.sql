CREATE TABLE "SuccessionGauge" (
    "id" TEXT NOT NULL,
    "debtDependencyWeight" DOUBLE PRECISION NOT NULL,
    "debtLeverageWeight" DOUBLE PRECISION NOT NULL,
    "debtCap" DOUBLE PRECISION NOT NULL,
    "valueFloor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SuccessionGauge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HeirHealthWeight" (
    "id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "minReserveRatio" DOUBLE PRECISION,
    "maxReserveRatio" DOUBLE PRECISION,
    "minDebtRatio" DOUBLE PRECISION,
    "maxDebtRatio" DOUBLE PRECISION,
    "weightAdd" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HeirHealthWeight_pkey" PRIMARY KEY ("id")
);
