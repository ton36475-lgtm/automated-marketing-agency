import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { calculateSolarPotential, processPVWattsResult, estimateSystemSize } from "../services/pvwatts";
import { generateQuoteContent, generateQuoteHTML } from "../services/quoteGenerator";
import { scoreAndQualifyLead, generateFollowUpEmail } from "../services/solarSalesEngine";
import {
  createSolarClient,
  getSolarClientsByUserId,
  getSolarClientById,
  updateSolarClient,
  deleteSolarClient,
  createSolarSite,
  getSolarSitesByClientId,
  getSolarSiteById,
  updateSolarSite,
  deleteSolarSite,
  createSolarCalculation,
  getSolarCalculationBySiteId,
  getSolarCalculationById,
  createSolarOffer,
  getSolarOffersByClientId,
  getSolarOffersBySiteId,
  getSolarOfferById,
  updateSolarOffer,
  deleteSolarOffer,
  createSolarPerformanceData,
  getSolarPerformanceDataBySiteId,
  createSolarSalesPipeline,
  getSolarSalesPipelineByClientId,
  getSolarSalesPipelineById,
  updateSolarSalesPipeline,
  getSolarPipelineByStage,
} from "../solar.db";

// ─── Solar Clients Router ─────────────────────────────────────────────────────
const solarClientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getSolarClientsByUserId(ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const client = await getSolarClientById(input.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      return client;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        companyName: z.string().optional(),
        annualElectricityCost: z.number().optional(),
        roofAge: z.number().optional(),
        roofCondition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createSolarClient({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        companyName: z.string().optional(),
        annualElectricityCost: z.number().optional(),
        roofAge: z.number().optional(),
        roofCondition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSolarClient(id, data);
      return getSolarClientById(id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSolarClient(input.id);
      return { success: true };
    }),
});

// ─── Solar Sites Router ───────────────────────────────────────────────────────
const solarSitesRouter = router({
  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => getSolarSitesByClientId(input.clientId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const site = await getSolarSiteById(input.id);
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      return site;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        areaSqft: z.number().optional(),
        roofType: z.enum(["asphalt", "metal", "tile", "flat", "ground_mount"]).optional(),
        roofTiltAngle: z.number().optional(),
        roofAzimuth: z.number().optional(),
        shadingFactor: z.number().optional(),
        polygonCoordinates: z.any().optional(),
        satelliteImageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createSolarSite({
        clientId: input.clientId,
        salesEngineerId: ctx.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        areaSqft: z.number().optional(),
        roofType: z.enum(["asphalt", "metal", "tile", "flat", "ground_mount"]).optional(),
        roofTiltAngle: z.number().optional(),
        roofAzimuth: z.number().optional(),
        shadingFactor: z.number().optional(),
        polygonCoordinates: z.any().optional(),
        satelliteImageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSolarSite(id, data);
      return getSolarSiteById(id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSolarSite(input.id);
      return { success: true };
    }),
});

// ─── Solar Calculations Router ────────────────────────────────────────────────
const solarCalculationsRouter = router({
  getBySite: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ input }) => getSolarCalculationBySiteId(input.siteId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const calc = await getSolarCalculationById(input.id);
      if (!calc) throw new TRPCError({ code: "NOT_FOUND", message: "Calculation not found" });
      return calc;
    }),

  create: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        systemCapacityKw: z.number(),
        moduleType: z.enum(["monocrystalline", "polycrystalline", "thin_film"]),
        moduleEfficiency: z.number(),
        inverterEfficiency: z.number(),
        systemLossesPercent: z.number(),
        annualProductionKwh: z.number(),
        monthlyProduction: z.any().optional(),
        performanceRatio: z.number().optional(),
        capacityFactor: z.number().optional(),
        pvwattsResponse: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createSolarCalculation({
        ...input,
        calculationTimestamp: new Date(),
      });
    }),

  runPVWatts: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        systemCapacityKw: z.number(),
        moduleType: z.enum(["monocrystalline", "polycrystalline", "thin_film"]),
        tiltAngle: z.number().optional(),
        azimuth: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const moduleTypeMap = { monocrystalline: 0, polycrystalline: 1, thin_film: 2 };
      const pvwattsResult = await calculateSolarPotential({
        latitude: input.latitude,
        longitude: input.longitude,
        systemCapacity: input.systemCapacityKw,
        moduleType: moduleTypeMap[input.moduleType],
        losses: 14.08,
        arrayType: 0,
        tilt: input.tiltAngle,
        azimuth: input.azimuth,
      });

      const solarResult = processPVWattsResult(pvwattsResult, 2500);

      return createSolarCalculation({
        siteId: input.siteId,
        systemCapacityKw: solarResult.systemCapacityKw,
        moduleType: input.moduleType,
        moduleEfficiency: 20,
        inverterEfficiency: 96,
        systemLossesPercent: 14.08,
        annualProductionKwh: solarResult.annualProductionKwh,
        monthlyProduction: solarResult.monthlyProductionKwh,
        performanceRatio: solarResult.performanceRatio,
        capacityFactor: solarResult.capacityFactor,
        pvwattsResponse: pvwattsResult,
        calculationTimestamp: new Date(),
      });
    })
});

// ─── Solar Offers Router ──────────────────────────────────────────────────────
const solarOffersRouter = router({
  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => getSolarOffersByClientId(input.clientId)),

  listBySite: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ input }) => getSolarOffersBySiteId(input.siteId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const offer = await getSolarOfferById(input.id);
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      return offer;
    }),

  create: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        clientId: z.number(),
        systemCapacityKw: z.number(),
        systemCost: z.number(),
        equipmentCost: z.number(),
        installationCost: z.number(),
        permittingCost: z.number(),
        totalCost: z.number(),
        federalTaxCredit: z.number(),
        stateIncentives: z.number(),
        netCost: z.number(),
        monthlyPayment: z.number(),
        financingTermMonths: z.number(),
        estimatedAnnualSavings: z.number(),
        paybackPeriodYears: z.number(),
        roiPercent: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createSolarOffer({
        ...input,
        salesEngineerId: ctx.user.id,
        status: "draft",
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "viewed", "accepted", "rejected", "expired"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateSolarOffer(input.id, { status: input.status });
      return getSolarOfferById(input.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSolarOffer(input.id);
      return { success: true };
    }),

  generateQuote: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        clientId: z.number(),
        clientName: z.string(),
        clientEmail: z.string(),
        siteAddress: z.string(),
        systemCapacityKw: z.number(),
        annualProductionKwh: z.number(),
        estimatedAnnualSavings: z.number(),
        paybackPeriodYears: z.number(),
        roiPercent: z.number(),
        systemCost: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const federalTaxCredit = input.systemCost * 0.3;
      const netCost = input.systemCost - federalTaxCredit;

      const quoteContent = await generateQuoteContent({
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        siteAddress: input.siteAddress,
        systemCapacityKw: input.systemCapacityKw,
        annualProductionKwh: input.annualProductionKwh,
        estimatedAnnualSavings: input.estimatedAnnualSavings,
        paybackPeriodYears: input.paybackPeriodYears,
        roiPercent: input.roiPercent,
        systemCost: input.systemCost,
        federalTaxCredit,
        netCost,
      });

      const htmlContent = generateQuoteHTML({
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        siteAddress: input.siteAddress,
        systemCapacityKw: input.systemCapacityKw,
        annualProductionKwh: input.annualProductionKwh,
        estimatedAnnualSavings: input.estimatedAnnualSavings,
        paybackPeriodYears: input.paybackPeriodYears,
        roiPercent: input.roiPercent,
        systemCost: input.systemCost,
        federalTaxCredit,
        netCost,
      }, quoteContent);

      return createSolarOffer({
        siteId: input.siteId,
        clientId: input.clientId,
        salesEngineerId: ctx.user.id,
        systemCapacityKw: input.systemCapacityKw,
        systemCost: input.systemCost,
        equipmentCost: input.systemCost * 0.6,
        installationCost: input.systemCost * 0.25,
        permittingCost: input.systemCost * 0.15,
        totalCost: input.systemCost,
        federalTaxCredit,
        stateIncentives: 0,
        netCost,
        monthlyPayment: netCost / 240,
        financingTermMonths: 240,
        estimatedAnnualSavings: input.estimatedAnnualSavings,
        paybackPeriodYears: input.paybackPeriodYears,
        roiPercent: input.roiPercent,
        status: "draft",
        pdfUrl: htmlContent,
      });
    })
});

// ─── Solar Performance Router ─────────────────────────────────────────────────
const solarPerformanceRouter = router({
  getByDate: protectedProcedure
    .input(z.object({ siteId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getSolarPerformanceDataBySiteId(input.siteId, input.limit ?? 30)),

  record: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        date: z.date(),
        productionKwh: z.number(),
        expectedProductionKwh: z.number(),
        efficiencyPercent: z.number(),
        weatherCondition: z.string().optional(),
        temperatureCelsius: z.number().optional(),
        irradianceWm2: z.number().optional(),
        alerts: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createSolarPerformanceData(input);
    }),
});

// ─── Solar Sales Pipeline Router ──────────────────────────────────────────────
const solarPipelineRouter = router({
  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => getSolarSalesPipelineByClientId(input.clientId)),

  getByStage: protectedProcedure
    .input(z.object({ stage: z.string() }))
    .query(({ input }) => getSolarPipelineByStage(input.stage)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const pipeline = await getSolarSalesPipelineById(input.id);
      if (!pipeline) throw new TRPCError({ code: "NOT_FOUND", message: "Pipeline not found" });
      return pipeline;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        siteId: z.number().optional(),
        stage: z.enum(["lead", "qualified", "site_survey", "design", "proposal", "negotiation", "closed_won", "closed_lost"]),
        dealValue: z.number().optional(),
        probabilityPercent: z.number().optional(),
        expectedCloseDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createSolarSalesPipeline({
        ...input,
        salesEngineerId: ctx.user.id,
      });
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(["lead", "qualified", "site_survey", "design", "proposal", "negotiation", "closed_won", "closed_lost"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateSolarSalesPipeline(input.id, { stage: input.stage });
      return getSolarSalesPipelineById(input.id);
    }),
});

// ─── Main Solar Router ────────────────────────────────────────────────────────
export const solarRouter = router({
  clients: solarClientsRouter,
  sites: solarSitesRouter,
  calculations: solarCalculationsRouter,
  offers: solarOffersRouter,
  performance: solarPerformanceRouter,
  pipeline: solarPipelineRouter,
});

// ─── Lead Scoring Router ─────────────────────────────────────────────────────
const solarLeadScoringRouter = router({
  scoreLead: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        address: z.string(),
        annualElectricityCost: z.number(),
        roofAge: z.number(),
        roofCondition: z.enum(["excellent", "good", "fair", "poor"]),
      })
    )
    .mutation(async ({ input }) => {
      return scoreAndQualifyLead({
        clientId: input.clientId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        annualElectricityCost: input.annualElectricityCost,
        roofAge: input.roofAge,
        roofCondition: input.roofCondition,
      });
    }),

  generateFollowUp: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        name: z.string(),
        email: z.string(),
        annualElectricityCost: z.number(),
        leadScore: z.number(),
        estimatedSavings: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const email = await generateFollowUpEmail(
        {
          clientId: input.clientId,
          name: input.name,
          email: input.email,
          phone: "",
          address: "",
          annualElectricityCost: input.annualElectricityCost,
          roofAge: 0,
          roofCondition: "good",
        },
        input.leadScore,
        input.estimatedSavings
      );
      return { email };
    }),
});

// Update main router export
export const solarRouter = router({
  clients: solarClientsRouter,
  sites: solarSitesRouter,
  calculations: solarCalculationsRouter,
  offers: solarOffersRouter,
  performance: solarPerformanceRouter,
  pipeline: solarPipelineRouter,
  leads: solarLeadScoringRouter,
});
