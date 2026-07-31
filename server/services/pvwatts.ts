/**
 * NREL PVWatts API Integration
 * Calculates solar potential and energy production estimates
 * API Docs: https://developer.nrel.gov/docs/solar/pvwatts/v8/
 */

interface PVWattsInput {
  latitude: number;
  longitude: number;
  systemCapacity: number; // kW
  moduleType: 0 | 1 | 2; // 0=monocrystalline, 1=polycrystalline, 2=thin_film
  losses: number; // percentage (default 14.08)
  arrayType: number; // 0=fixed open rack, 1=fixed close roof, 2=1-axis tracking
  tilt?: number; // degrees (default=latitude)
  azimuth?: number; // degrees (default=180 for southern hemisphere, 0 for northern)
  gcr?: number; // ground coverage ratio (default 0.4)
  inverterEfficiency?: number; // percentage (default 96)
}

interface PVWattsOutput {
  inputs: Record<string, unknown>;
  outputs: {
    ac_monthly: number[]; // Monthly AC energy (kWh)
    poa_monthly: number[]; // Monthly plane of array irradiance (kWh/m2)
    solrad_monthly: number[]; // Monthly average daily solar radiation (kWh/m2/day)
    dc_monthly: number[]; // Monthly DC energy (kWh)
    ac_annual: number; // Annual AC energy (kWh)
    solrad_annual: number; // Annual average daily solar radiation (kWh/m2/day)
    capacity_factor: number; // Capacity factor (%)
  };
  version: string;
  ssc_version: string;
}

interface SolarCalculationResult {
  systemCapacityKw: number;
  annualProductionKwh: number;
  monthlyProductionKwh: number[];
  capacityFactor: number;
  performanceRatio: number;
  estimatedAnnualSavings: number;
  paybackPeriodYears: number;
  roiPercent: number;
}

const NREL_API_KEY = process.env.NREL_PVWATTS_API_KEY || "demo";
const NREL_API_URL = "https://developer.nrel.gov/api/pvwatts/v8.json";

/**
 * Call NREL PVWatts API to calculate solar potential
 */
export async function calculateSolarPotential(input: PVWattsInput): Promise<PVWattsOutput> {
  const params = new URLSearchParams({
    api_key: NREL_API_KEY,
    lat: input.latitude.toString(),
    lon: input.longitude.toString(),
    system_capacity: input.systemCapacity.toString(),
    module_type: input.moduleType.toString(),
    losses: (input.losses || 14.08).toString(),
    array_type: input.arrayType.toString(),
    tilt: (input.tilt || input.latitude).toString(),
    azimuth: (input.azimuth || 180).toString(),
    gcr: (input.gcr || 0.4).toString(),
    inv_eff: (input.inverterEfficiency || 96).toString(),
  });

  try {
    const response = await fetch(`${NREL_API_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`PVWatts API error: ${response.statusText}`);
    }

    const data: { outputs?: Record<string, unknown>; version?: string; ssc_version?: string } =
      await response.json();
    return data as PVWattsOutput;
  } catch (error) {
    console.error("PVWatts API error:", error);
    throw new Error("Failed to calculate solar potential");
  }
}

/**
 * Convert PVWatts output to solar calculation result
 */
export function processPVWattsResult(
  pvwattsOutput: PVWattsOutput,
  systemCostPerKw: number,
  electricityRate: number = 0.12 // $/kWh
): SolarCalculationResult {
  const { ac_annual, capacity_factor, ac_monthly } = pvwattsOutput.outputs;

  // Calculate estimated annual savings
  const estimatedAnnualSavings = ac_annual * electricityRate;

  // Assume average system cost of $2.50/W (includes equipment, labor, permitting)
  const totalSystemCost = pvwattsOutput.inputs.system_capacity * systemCostPerKw;

  // Federal ITC (30% tax credit)
  const federalTaxCredit = totalSystemCost * 0.3;
  const netCost = totalSystemCost - federalTaxCredit;

  // Calculate payback period
  const paybackPeriodYears = netCost / estimatedAnnualSavings;

  // Calculate ROI (25-year system lifespan)
  const systemLifespan = 25;
  const totalSavings = estimatedAnnualSavings * systemLifespan;
  const roiPercent = ((totalSavings - netCost) / netCost) * 100;

  // Calculate performance ratio (actual vs theoretical)
  const performanceRatio = (capacity_factor || 0) / 25; // Typical capacity factor is 15-25%

  return {
    systemCapacityKw: pvwattsOutput.inputs.system_capacity as number,
    annualProductionKwh: ac_annual,
    monthlyProductionKwh: ac_monthly,
    capacityFactor: capacity_factor,
    performanceRatio,
    estimatedAnnualSavings,
    paybackPeriodYears,
    roiPercent,
  };
}

/**
 * Estimate system size based on annual electricity consumption
 */
export function estimateSystemSize(
  annualElectricityConsumptionKwh: number,
  productionRatio: number = 0.85 // Account for losses
): number {
  // Assume average capacity factor of 20%
  const capacityFactor = 0.2;
  const hoursPerYear = 365 * 24;

  // System capacity = Annual consumption / (Capacity factor * Hours per year * Production ratio)
  const systemCapacityKw = annualElectricityConsumptionKwh / (capacityFactor * hoursPerYear * productionRatio);

  return Math.round(systemCapacityKw * 10) / 10; // Round to nearest 0.1 kW
}

/**
 * Calculate financing options
 */
export interface FinancingOption {
  type: "cash" | "loan" | "lease" | "ppa";
  monthlyPayment: number;
  totalCost: number;
  netCost: number;
  interestRate?: number;
  term?: number;
  downPayment?: number;
}

export function calculateFinancingOptions(
  systemCost: number,
  federalTaxCredit: number,
  annualSavings: number
): FinancingOption[] {
  const netCost = systemCost - federalTaxCredit;

  return [
    {
      type: "cash",
      monthlyPayment: 0,
      totalCost: systemCost,
      netCost,
    },
    {
      type: "loan",
      monthlyPayment: calculateMonthlyPayment(netCost, 0.05, 20),
      totalCost: systemCost,
      netCost,
      interestRate: 0.05,
      term: 20,
      downPayment: netCost * 0.1,
    },
    {
      type: "lease",
      monthlyPayment: annualSavings / 12 * 0.7, // 70% of savings
      totalCost: 0,
      netCost: 0,
    },
    {
      type: "ppa",
      monthlyPayment: annualSavings / 12 * 0.8, // 80% of savings
      totalCost: 0,
      netCost: 0,
    },
  ];
}

/**
 * Calculate monthly payment using amortization formula
 */
function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const monthlyRate = annualRate / 12;
  const numberOfPayments = years * 12;

  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Generate quote summary
 */
export interface QuoteSummary {
  systemCapacityKw: number;
  annualProductionKwh: number;
  estimatedAnnualSavings: number;
  paybackPeriodYears: number;
  roiPercent: number;
  systemCost: number;
  federalTaxCredit: number;
  netCost: number;
  financingOptions: FinancingOption[];
}

export function generateQuoteSummary(
  solarResult: SolarCalculationResult,
  systemCost: number
): QuoteSummary {
  const federalTaxCredit = systemCost * 0.3;
  const netCost = systemCost - federalTaxCredit;
  const financingOptions = calculateFinancingOptions(systemCost, federalTaxCredit, solarResult.estimatedAnnualSavings);

  return {
    systemCapacityKw: solarResult.systemCapacityKw,
    annualProductionKwh: solarResult.annualProductionKwh,
    estimatedAnnualSavings: solarResult.estimatedAnnualSavings,
    paybackPeriodYears: solarResult.paybackPeriodYears,
    roiPercent: solarResult.roiPercent,
    systemCost,
    federalTaxCredit,
    netCost,
    financingOptions,
  };
}
