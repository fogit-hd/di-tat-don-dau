export type ProductionEffect = {
  id: string; title: string; icon: string; year?: number; yearsLeft: number;
  outputMul: number; priceMul: number; revenueMul: number; costMul: number; cashPerYear: number; investmentMul: number;
}
export type ProductionPlanView = {
  engineers: number; machines: number; engineersPerMachine: number; operating: number; idle: number; staffMissing: number;
  stopped?: number;
  defective?: number; saleable?: number; defectRatePct?: number; defectMin?: number; defectMax?: number;
  workerBonus?: number; machineBonus?: number; conditionFactor?: number;
  baseOutput: number; techFactor: number; theoreticalOutput: number; outputNoise: number; priceNoise: number;
  outputMul: number; priceMul: number; revenueMul: number; costMul: number;
  output: number; sold: number; delivery: number; basePrice: number; price: number; pricePenalty: number;
  revenue: number; inputCost: number; logisticsCost: number; otherCost: number; idleCost: number; opex: number; net: number;
  inputDiscount: number; logisticsDiscount: number; pollution: number; emissions: number; treatment: number;
  appliedEffects: ProductionEffect[];
}
export type ProductionReportView = ProductionPlanView & {
  conditionBefore?: number; conditionAfter?: number; conditionWearPct?: number;
  year: number; unit: string; inflation: number; inflationRate: number; interest: number; ongoing: number;
}
export type ProductionForecastView = {
  expected: ProductionPlanView;
  range: { outputMin: number; outputMax: number; soldMin: number; soldMax: number; priceMin: number; priceMax: number;
    revenueMin: number; revenueMax: number; netMin: number; netMax: number;
    outputNoiseMin: number; outputNoiseMax: number; priceNoiseMin: number; priceNoiseMax: number };
  interestRate: number; interest: number; ongoing: number; inflationMin: number; inflationMax: number; cashMin: number; cashMax: number;
}
export type CompanyBooksView = {
  cash: number; workforce: number; machines: number; support: number; infra: number; green: number; brand: number;
  pollutionPenalty: number; dependencyPenalty: number; total: number; reportedValue: number;
}
