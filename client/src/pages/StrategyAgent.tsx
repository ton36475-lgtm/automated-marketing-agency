import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Brain, Loader2, ChevronDown, ChevronUp, Target, Users, TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function StrategyAgent() {
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const strategyMutation = trpc.agent.runStrategy.useMutation({
    onSuccess: (data) => {
      setResult(data.result);
      toast.success("Strategy analysis complete!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    product: "",
    targetMarket: "",
    budget: 0,
    competitors: "",
    objectives: "",
    campaignId: undefined as number | undefined,
  });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("marketAnalysis");

  const handleRun = () => {
    if (!form.product) return toast.error("Product/Service description required");
    strategyMutation.mutate({
      product: form.product,
      targetMarket: form.targetMarket || undefined,
      budget: form.budget || undefined,
      competitors: form.competitors ? form.competitors.split(",").map((s) => s.trim()) : undefined,
      objectives: form.objectives ? form.objectives.split(",").map((s) => s.trim()) : undefined,
      campaignId: form.campaignId,
    });
  };

  const RESULT_SECTIONS = [
    { key: "marketAnalysis", label: "MARKET ANALYSIS", color: "var(--neon-cyan)", icon: TrendingUp },
    { key: "icp", label: "IDEAL CUSTOMER PROFILE", color: "var(--neon-purple)", icon: Users },
    { key: "positioning", label: "POSITIONING STATEMENT", color: "var(--neon-pink)", icon: Target },
    { key: "campaignPhases", label: "CAMPAIGN PHASES", color: "var(--neon-yellow)", icon: Brain },
    { key: "kpiGoals", label: "KPI GOALS", color: "var(--neon-green)", icon: TrendingUp },
    { key: "platforms", label: "PLATFORMS & FORMATS", color: "var(--neon-cyan)", icon: Target },
    { key: "contentPillars", label: "CONTENT PILLARS", color: "var(--neon-purple)", icon: Brain },
    { key: "budgetAllocation", label: "BUDGET ALLOCATION", color: "var(--neon-yellow)", icon: DollarSign },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ AI AGENT
        </div>
        <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-purple)" }}>
          STRATEGY AGENT
        </h1>
        <p className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>
          Market analysis, ICP profiling, and comprehensive campaign strategy generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="cyber-card rounded-sm p-5 space-y-4" style={{ borderColor: "rgba(191, 95, 255, 0.3)" }}>
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, var(--neon-purple), transparent)" }}
          />
          <div className="font-orbitron text-xs tracking-wider mb-4" style={{ color: "var(--neon-purple)" }}>
            ◈ INPUT PARAMETERS
          </div>

          {campaigns && campaigns.length > 0 && (
            <div>
              <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>LINK TO CAMPAIGN (OPTIONAL)</Label>
              <select
                className="w-full mt-1 px-3 py-2 font-mono-tech text-sm rounded-sm"
                style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                value={form.campaignId || ""}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">-- No Campaign --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PRODUCT / SERVICE *</Label>
            <Textarea
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              placeholder="Describe your product or service in detail..."
              rows={3}
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>TARGET MARKET</Label>
            <Input
              value={form.targetMarket}
              onChange={(e) => setForm({ ...form, targetMarket: e.target.value })}
              placeholder="e.g. SMB owners in Southeast Asia, 25-45 years old"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>MONTHLY BUDGET (USD)</Label>
            <Input
              type="number"
              value={form.budget || ""}
              onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
              placeholder="e.g. 10000"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>COMPETITORS (comma-separated)</Label>
            <Input
              value={form.competitors}
              onChange={(e) => setForm({ ...form, competitors: e.target.value })}
              placeholder="e.g. Competitor A, Competitor B"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>OBJECTIVES (comma-separated)</Label>
            <Input
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              placeholder="e.g. Increase leads, Boost ROAS, Brand awareness"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <button
            onClick={handleRun}
            disabled={strategyMutation.isPending}
            className="w-full py-3 font-orbitron text-sm tracking-wider transition-all flex items-center justify-center gap-2"
            style={{
              border: "1px solid var(--neon-purple)",
              color: "var(--neon-purple)",
              background: strategyMutation.isPending ? "rgba(191,95,255,0.1)" : "rgba(191,95,255,0.05)",
            }}
          >
            {strategyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ANALYZING MARKET...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                [ RUN STRATEGY AGENT ]
              </>
            )}
          </button>
        </div>

        {/* Result Panel */}
        <div className="space-y-3">
          {!result && !strategyMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(191,95,255,0.2)" }}>
              <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: "oklch(0.25 0.03 260)" }} />
              <div className="font-orbitron text-sm mb-2" style={{ color: "oklch(0.35 0.03 220)" }}>
                AWAITING INPUT
              </div>
              <div className="font-mono-tech text-xs" style={{ color: "oklch(0.3 0.03 220)" }}>
                Configure parameters and run the agent to generate strategy
              </div>
            </div>
          )}

          {strategyMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(191,95,255,0.3)" }}>
              <div className="flex gap-1 justify-center mb-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-8 rounded-full"
                    style={{ background: "var(--neon-purple)", animation: `pulse-green 0.8s infinite ${i * 0.1}s` }}
                  />
                ))}
              </div>
              <div className="font-orbitron text-sm" style={{ color: "var(--neon-purple)" }}>
                STRATEGY AGENT RUNNING
              </div>
              <div className="font-mono-tech text-xs mt-2" style={{ color: "oklch(0.45 0.04 220)" }}>
                Analyzing market data and generating strategy...
              </div>
            </div>
          )}

          {result && RESULT_SECTIONS.map((section) => {
            const value = result[section.key] as string;
            if (!value) return null;
            const isExpanded = expandedSection === section.key;
            return (
              <div
                key={section.key}
                className="cyber-card rounded-sm overflow-hidden"
                style={{ borderColor: `${section.color}25` }}
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                  style={{ background: isExpanded ? `${section.color}08` : "transparent" }}
                  onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="w-3.5 h-3.5" style={{ color: section.color }} />
                    <span className="font-orbitron text-xs tracking-wider" style={{ color: section.color }}>
                      {section.label}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: section.color }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: "oklch(0.4 0.03 220)" }} />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4" style={{ borderTop: `1px solid ${section.color}20` }}>
                    <div className="mt-3 font-mono-tech text-xs leading-relaxed" style={{ color: "oklch(0.75 0.05 200)" }}>
                      <Streamdown>{value}</Streamdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
