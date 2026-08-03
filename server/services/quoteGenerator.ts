/**
 * Automated Quote Generation Engine
 * Generates professional solar installation quotes with financing options
 */

import { invokeLLM } from "../_core/llm";
import { generateQuoteSummary, QuoteSummary } from "./pvwatts";

interface QuoteGenerationInput {
  clientName: string;
  clientEmail: string;
  siteAddress: string;
  systemCapacityKw: number;
  annualProductionKwh: number;
  estimatedAnnualSavings: number;
  paybackPeriodYears: number;
  roiPercent: number;
  systemCost: number;
  federalTaxCredit: number;
  netCost: number;
}

interface GeneratedQuote {
  title: string;
  summary: string;
  costBreakdown: string;
  financingOptions: string;
  benefits: string;
  nextSteps: string;
}

/**
 * Generate professional quote content using LLM
 */
export async function generateQuoteContent(input: QuoteGenerationInput): Promise<GeneratedQuote> {
  const prompt = `Generate a professional solar installation quote for the following project:

Client: ${input.clientName}
Site: ${input.siteAddress}
System Size: ${input.systemCapacityKw} kW
Annual Production: ${input.annualProductionKwh} kWh
Annual Savings: $${input.estimatedAnnualSavings.toFixed(2)}
Payback Period: ${input.paybackPeriodYears.toFixed(1)} years
ROI: ${input.roiPercent.toFixed(1)}%

System Cost: $${input.systemCost.toFixed(2)}
Federal Tax Credit (30%): $${input.federalTaxCredit.toFixed(2)}
Net Cost: $${input.netCost.toFixed(2)}

Please provide:
1. A compelling quote title
2. A 2-3 sentence executive summary
3. Detailed cost breakdown
4. Financing options explanation
5. Key benefits of solar installation
6. Next steps for the client

Format as JSON with keys: title, summary, costBreakdown, financingOptions, benefits, nextSteps`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional solar sales engineer. Generate compelling, accurate solar installation quotes that highlight financial benefits and environmental impact.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "solar_quote",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Quote title" },
              summary: { type: "string", description: "Executive summary" },
              costBreakdown: { type: "string", description: "Detailed cost breakdown" },
              financingOptions: { type: "string", description: "Financing options explanation" },
              benefits: { type: "string", description: "Key benefits" },
              nextSteps: { type: "string", description: "Next steps for client" },
            },
            required: ["title", "summary", "costBreakdown", "financingOptions", "benefits", "nextSteps"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const parsed = JSON.parse(content);
    return parsed as GeneratedQuote;
  } catch (error) {
    console.error("Quote generation error:", error);
    throw new Error("Failed to generate quote content");
  }
}

/**
 * Generate HTML quote document
 */
export function generateQuoteHTML(input: QuoteGenerationInput, generatedContent: GeneratedQuote): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; }
    .header p { margin: 10px 0 0 0; font-size: 18px; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .section p { margin: 10px 0; }
    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .metric { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
    .cost-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .cost-table th, .cost-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .cost-table th { background: #f5f5f5; font-weight: bold; }
    .cost-table tr:last-child td { border-bottom: 2px solid #667eea; font-weight: bold; }
    .financing { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .cta { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 30px 0; }
    .cta button { background: white; color: #667eea; border: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 5px; cursor: pointer; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${generatedContent.title}</h1>
    <p>Solar Installation Proposal</p>
  </div>

  <div class="container">
    <!-- Client Info -->
    <div class="section">
      <h2>Proposal Details</h2>
      <p><strong>Client:</strong> ${input.clientName}</p>
      <p><strong>Email:</strong> ${input.clientEmail}</p>
      <p><strong>Site:</strong> ${input.siteAddress}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2>Executive Summary</h2>
      <p>${generatedContent.summary}</p>
    </div>

    <!-- Key Metrics -->
    <div class="section">
      <h2>System Overview</h2>
      <div class="metrics">
        <div class="metric">
          <div class="metric-label">System Size</div>
          <div class="metric-value">${input.systemCapacityKw} kW</div>
        </div>
        <div class="metric">
          <div class="metric-label">Annual Production</div>
          <div class="metric-value">${input.annualProductionKwh.toLocaleString()} kWh</div>
        </div>
        <div class="metric">
          <div class="metric-label">Annual Savings</div>
          <div class="metric-value">$${input.estimatedAnnualSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Payback Period</div>
          <div class="metric-value">${input.paybackPeriodYears.toFixed(1)} years</div>
        </div>
      </div>
    </div>

    <!-- Cost Breakdown -->
    <div class="section">
      <h2>Cost Breakdown</h2>
      ${generatedContent.costBreakdown}
      <table class="cost-table">
        <tr>
          <th>Item</th>
          <th style="text-align: right;">Amount</th>
        </tr>
        <tr>
          <td>System Equipment & Installation</td>
          <td style="text-align: right;">$${input.systemCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td>Federal Tax Credit (30% ITC)</td>
          <td style="text-align: right;">-$${input.federalTaxCredit.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td>Net Cost After Tax Credit</td>
          <td style="text-align: right;">$${input.netCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
        </tr>
      </table>
    </div>

    <!-- Financing Options -->
    <div class="section">
      <h2>Financing Options</h2>
      <div class="financing">
        ${generatedContent.financingOptions}
      </div>
    </div>

    <!-- Benefits -->
    <div class="section">
      <h2>Key Benefits</h2>
      ${generatedContent.benefits}
    </div>

    <!-- ROI -->
    <div class="section">
      <h2>Return on Investment</h2>
      <p><strong>25-Year ROI: ${input.roiPercent.toFixed(1)}%</strong></p>
      <p>Your solar system will generate significant returns over its 25-year lifespan, providing energy independence and protection against rising electricity rates.</p>
    </div>

    <!-- Next Steps -->
    <div class="section">
      <h2>Next Steps</h2>
      ${generatedContent.nextSteps}
    </div>

    <!-- CTA -->
    <div class="cta">
      <p>Ready to go solar?</p>
      <button>Accept Proposal</button>
    </div>
  </div>

  <div class="footer">
    <p>This proposal is valid for 30 days. For questions, please contact us.</p>
    <p>&copy; ${new Date().getFullYear()} Solar Engineering. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate plain text quote for email
 */
export function generateQuoteText(input: QuoteGenerationInput, generatedContent: GeneratedQuote): string {
  return `
${generatedContent.title}
${"=".repeat(generatedContent.title.length)}

PROPOSAL FOR: ${input.clientName}
SITE: ${input.siteAddress}
DATE: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
${"-".repeat(50)}
${generatedContent.summary}

SYSTEM OVERVIEW
${"-".repeat(50)}
System Size: ${input.systemCapacityKw} kW
Annual Production: ${input.annualProductionKwh.toLocaleString()} kWh
Estimated Annual Savings: $${input.estimatedAnnualSavings.toLocaleString('en-US', { maximumFractionDigits: 2 })}
Payback Period: ${input.paybackPeriodYears.toFixed(1)} years
25-Year ROI: ${input.roiPercent.toFixed(1)}%

COST BREAKDOWN
${"-".repeat(50)}
System Cost: $${input.systemCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
Federal Tax Credit (30%): -$${input.federalTaxCredit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
Net Cost: $${input.netCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}

${generatedContent.costBreakdown}

FINANCING OPTIONS
${"-".repeat(50)}
${generatedContent.financingOptions}

KEY BENEFITS
${"-".repeat(50)}
${generatedContent.benefits}

NEXT STEPS
${"-".repeat(50)}
${generatedContent.nextSteps}

---
This proposal is valid for 30 days.
For questions, please contact us.
  `;
}
