/**
 * Solar Sales Automation Engine
 * Orchestrates the entire sales process from lead to close
 */

import { invokeLLM } from "../_core/llm";
import { calculateSolarPotential, processPVWattsResult, estimateSystemSize } from "./pvwatts";
import { generateQuoteContent, generateQuoteHTML, generateQuoteText } from "./quoteGenerator";

interface LeadData {
  clientId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  annualElectricityCost: number;
  roofAge: number;
  roofCondition: string;
}

interface SiteData {
  latitude: number;
  longitude: number;
  address: string;
  areaSqft: number;
  roofType: string;
  roofTiltAngle: number;
  roofAzimuth: number;
  shadingFactor: number;
}

interface SalesAutomationResult {
  leadScore: number;
  leadQuality: "hot" | "warm" | "cold";
  recommendation: string;
  nextAction: string;
  estimatedSystemSize: number;
  estimatedAnnualProduction: number;
  estimatedAnnualSavings: number;
  estimatedPaybackPeriod: number;
}

/**
 * Score leads based on multiple factors
 */
export async function scoreAndQualifyLead(lead: LeadData): Promise<SalesAutomationResult> {
  // Calculate base score from electricity cost
  let score = 0;

  // Electricity cost scoring (higher cost = better lead)
  if (lead.annualElectricityCost > 2000) score += 30;
  else if (lead.annualElectricityCost > 1500) score += 20;
  else if (lead.annualElectricityCost > 1000) score += 10;

  // Roof condition scoring
  if (lead.roofCondition === "excellent") score += 25;
  else if (lead.roofCondition === "good") score += 15;
  else if (lead.roofCondition === "fair") score += 5;

  // Roof age scoring (newer roof = better)
  if (lead.roofAge < 5) score += 20;
  else if (lead.roofAge < 10) score += 10;
  else if (lead.roofAge > 20) score -= 10;

  // Use LLM for advanced qualification
  const llmAnalysis = await analyzeLead(lead);

  // Combine scores
  const finalScore = Math.min(100, score + llmAnalysis.additionalScore);

  // Determine quality tier
  let quality: "hot" | "warm" | "cold" = "cold";
  if (finalScore >= 75) quality = "hot";
  else if (finalScore >= 50) quality = "warm";

  // Estimate system size
  const estimatedSystemSize = estimateSystemSize(lead.annualElectricityCost / 0.12); // Assume $0.12/kWh

  // Estimate production (rough estimate)
  const estimatedAnnualProduction = estimatedSystemSize * 1200; // 1200 kWh/kW/year average

  // Estimate savings
  const estimatedAnnualSavings = estimatedAnnualProduction * 0.12;

  // Estimate payback
  const systemCost = estimatedSystemSize * 2500; // $2.50/W average
  const netCost = systemCost * 0.7; // After 30% tax credit
  const estimatedPaybackPeriod = netCost / estimatedAnnualSavings;

  return {
    leadScore: finalScore,
    leadQuality: quality,
    recommendation: llmAnalysis.recommendation,
    nextAction: determineNextAction(quality, lead),
    estimatedSystemSize,
    estimatedAnnualProduction,
    estimatedAnnualSavings,
    estimatedPaybackPeriod,
  };
}

/**
 * Analyze lead using LLM
 */
async function analyzeLead(
  lead: LeadData
): Promise<{ additionalScore: number; recommendation: string }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a solar sales expert. Analyze leads and determine their quality and potential for solar installation.",
        },
        {
          role: "user",
          content: `Analyze this lead for solar installation:
Name: ${lead.name}
Annual Electricity Cost: $${lead.annualElectricityCost}
Roof Age: ${lead.roofAge} years
Roof Condition: ${lead.roofCondition}

Provide:
1. Additional score (0-20 points) based on lead quality
2. A brief recommendation for sales approach

Format as JSON with keys: additionalScore, recommendation`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              additionalScore: { type: "number", description: "Additional score 0-20" },
              recommendation: { type: "string", description: "Sales recommendation" },
            },
            required: ["additionalScore", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { additionalScore: 0, recommendation: "Contact for initial consultation" };
    }

    const parsed = JSON.parse(content);
    return {
      additionalScore: Math.min(20, Math.max(0, parsed.additionalScore || 0)),
      recommendation: parsed.recommendation || "Contact for initial consultation",
    };
  } catch (error) {
    console.error("Lead analysis error:", error);
    return { additionalScore: 0, recommendation: "Contact for initial consultation" };
  }
}

/**
 * Determine next action based on lead quality
 */
function determineNextAction(quality: "hot" | "warm" | "cold", lead: LeadData): string {
  switch (quality) {
    case "hot":
      return `Call ${lead.name} immediately to schedule site survey. High-priority lead with strong solar potential.`;
    case "warm":
      return `Send email to ${lead.email} with solar potential estimate. Follow up with call in 2-3 days.`;
    case "cold":
      return `Add to nurture sequence. Send educational content about solar benefits. Revisit in 30 days.`;
  }
}

/**
 * Generate automated follow-up email
 */
export async function generateFollowUpEmail(
  lead: LeadData,
  leadScore: number,
  estimatedSavings: number
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional solar sales email writer. Generate compelling follow-up emails that encourage leads to take action.",
        },
        {
          role: "user",
          content: `Generate a follow-up email for this solar lead:
Name: ${lead.name}
Annual Electricity Cost: $${lead.annualElectricityCost}
Estimated Annual Savings: $${estimatedSavings.toFixed(2)}
Lead Quality Score: ${leadScore}/100

The email should:
1. Be personalized and friendly
2. Highlight their specific savings potential
3. Include a clear call to action
4. Be 3-4 paragraphs max

Return only the email body (no subject line).`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return content || "We'd love to help you save on energy costs with solar. Let's discuss your options.";
  } catch (error) {
    console.error("Email generation error:", error);
    return "We'd love to help you save on energy costs with solar. Let's discuss your options.";
  }
}

/**
 * Calculate deal probability based on pipeline stage
 */
export function calculateDealProbability(stage: string): number {
  const stageProbabilities: Record<string, number> = {
    lead: 10,
    qualified: 25,
    site_survey: 40,
    design: 60,
    proposal: 75,
    negotiation: 85,
    closed_won: 100,
    closed_lost: 0,
  };

  return stageProbabilities[stage] || 0;
}

/**
 * Recommend next stage based on current activity
 */
export async function recommendNextStage(
  currentStage: string,
  daysInStage: number,
  clientEngagement: number
): Promise<{ recommendedStage: string; reasoning: string }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a solar sales process expert. Recommend the next sales stage based on current progress.",
        },
        {
          role: "user",
          content: `Recommend the next stage in the solar sales pipeline:
Current Stage: ${currentStage}
Days in Current Stage: ${daysInStage}
Client Engagement Level (1-10): ${clientEngagement}

Stages: lead → qualified → site_survey → design → proposal → negotiation → closed_won

Provide:
1. Recommended next stage
2. Brief reasoning

Format as JSON with keys: recommendedStage, reasoning`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "stage_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendedStage: { type: "string", description: "Recommended next stage" },
              reasoning: { type: "string", description: "Reasoning for recommendation" },
            },
            required: ["recommendedStage", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { recommendedStage: currentStage, reasoning: "Continue current stage activities" };
    }

    const parsed = JSON.parse(content);
    return {
      recommendedStage: parsed.recommendedStage || currentStage,
      reasoning: parsed.reasoning || "Continue current stage activities",
    };
  } catch (error) {
    console.error("Stage recommendation error:", error);
    return { recommendedStage: currentStage, reasoning: "Continue current stage activities" };
  }
}

/**
 * Generate deal closing email
 */
export async function generateClosingEmail(
  lead: LeadData,
  systemSize: number,
  totalSavings: number,
  paybackPeriod: number
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a solar sales closer. Generate compelling closing emails that encourage deal completion.",
        },
        {
          role: "user",
          content: `Generate a closing email for this solar deal:
Client: ${lead.name}
System Size: ${systemSize} kW
25-Year Savings: $${totalSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
Payback Period: ${paybackPeriod.toFixed(1)} years

The email should:
1. Summarize the key financial benefits
2. Create urgency (limited-time offer)
3. Include a clear call to action
4. Be warm and professional

Return only the email body.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return content || "We're excited to help you go solar. Let's finalize your installation today.";
  } catch (error) {
    console.error("Closing email generation error:", error);
    return "We're excited to help you go solar. Let's finalize your installation today.";
  }
}
