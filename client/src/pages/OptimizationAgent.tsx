import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp, Loader2, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function OptimizationAgent() {
  const utils = trpc.useUtils();
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: rules, refetch: refetchRules } = trpc.optimization.rules.useQuery();
  const optimizeMutation = trpc.agent.runOptimization.useMutation({
    onSuccess: (data) => {
      setResult(data.result);
      toast.success("Optimization analysis complete!");
    },
    onError: (e) => toast.error(e.message),
  });
  const createRuleMutation = trpc.optimization.createRule.useMutation({
    onSuccess: () => { refetchRules(); setShowAddRule(false); toast.success("Rule created"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleRuleMutation = trpc.optimization.toggleRule.useMutation({
    onSuccess: () => refetchRules(),
  });

  const [form, setForm] = useState({
    campaignId: undefined as number | undefined,
    metrics: {} as Record<string, number>,
  });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    ruleName: "",
    ruleType: "stop_loss" as "stop_loss" | "scale_winners" | "aggressive_scaling" | "fight_fatigue" | "custom",
    conditions: {} as Record<string, unknown>,
    actions: {} as Record<string, unknown>,
  });
  const [metricsInput, setMetricsInput] = useState({
    ctr: "",
    cpc: "",
    cpa: "",
    roas: "",
    impressions: "",
    clicks: "",
    conversions: "",
    spend: "",
  });

  const handleRun = () => {
    const metrics: Record<string, number> = {};
    Object.entries(metricsInput).forEach(([k, v]) => {
      if (v) metrics[k] = parseFloat(v);
    });
    optimizeMutation.mutate({ campaignId: form.campaignId, metrics });
  };

  const RULE_TYPES = ["stop_loss", "scale_winners", "aggressive_scaling", "fight_fatigue", "custom"];
  const RULE_COLORS: Record<string, string> = {
    stop_loss: "var(--neon-pink)",
    scale_winners: "var(--neon-green)",
    aggressive_scaling: "var(--neon-yellow)",
    fight_fatigue: "var(--neon-cyan)",
    custom: "var(--neon-purple)",
  };

  const resultSections = result ? [
    { key: "performanceSummary", label: "PERFORMANCE SUMMARY", color: "var(--neon-cyan)" },
    { key: "issues", label: "DETECTED ISSUES", color: "var(--neon-pink)" },
    { key: "recommendations", label: "RECOMMENDATIONS", color: "var(--neon-green)" },
    { key: "budgetAdjustments", label: "BUDGET ADJUSTMENTS", color: "var(--neon-yellow)" },
    { key: "audienceInsights", label: "AUDIENCE INSIGHTS", color: "var(--neon-purple)" },
    { key: "creativeOptimization", label: "CREATIVE OPTIMIZATION", color: "var(--neon-cyan)" },
    { key: "automationRules", label: "AUTOMATION RULES", color: "var(--neon-pink)" },
    { key: "nextSteps", label: "NEXT STEPS", color: "var(--neon-green)" },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ AI AGENT
        </div>
        <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-green)" }}>
          OPTIMIZATION AGENT
        </h1>
        <p className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>
          ROAS analysis, automated scaling rules, and performance optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="cyber-card rounded-sm p-5 space-y-4" style={{ borderColor: "rgba(57, 255, 20, 0.2)" }}>
            <div className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-green)" }}>
              ◈ PERFORMANCE METRICS
            </div>

            {campaigns && campaigns.length > 0 && (
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>CAMPAIGN</Label>
                <select
                  className="w-full mt-1 px-3 py-2 font-mono-tech text-sm rounded-sm"
                  style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                  value={form.campaignId || ""}
                  onChange={(e) => setForm({ ...form, campaignId: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">-- No Campaign --</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(metricsInput).map(([key, val]) => (
                <div key={key}>
                  <Label className="font-mono-tech text-xs uppercase" style={{ color: "oklch(0.55 0.05 220)" }}>{key}</Label>
                  <Input
                    type="number"
                    value={val}
                    onChange={(e) => setMetricsInput((m) => ({ ...m, [key]: e.target.value }))}
                    placeholder="0"
                    className="mt-1 font-mono-tech text-sm"
                    style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleRun}
              disabled={optimizeMutation.isPending}
              className="w-full py-3 font-orbitron text-sm tracking-wider transition-all flex items-center justify-center gap-2"
              style={{
                border: "1px solid var(--neon-green)",
                color: "var(--neon-green)",
                background: optimizeMutation.isPending ? "rgba(57,255,20,0.1)" : "rgba(57,255,20,0.05)",
              }}
            >
              {optimizeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> ANALYZING...</>
              ) : (
                <><TrendingUp className="w-4 h-4" /> [ RUN OPTIMIZATION ]</>
              )}
            </button>
          </div>

          {/* Automation Rules */}
          <div className="cyber-card rounded-sm p-4" style={{ borderColor: "rgba(57,255,20,0.15)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-green)" }}>
                ◈ AUTOMATION RULES
              </span>
              <button
                onClick={() => setShowAddRule(!showAddRule)}
                className="flex items-center gap-1 font-mono-tech text-xs"
                style={{ color: "var(--neon-green)" }}
              >
                <Plus className="w-3.5 h-3.5" /> ADD RULE
              </button>
            </div>

            {showAddRule && (
              <div className="space-y-3 mb-4 p-3 rounded-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)" }}>
                <Input
                  value={newRule.ruleName}
                  onChange={(e) => setNewRule({ ...newRule, ruleName: e.target.value })}
                  placeholder="Rule name"
                  className="font-mono-tech text-xs"
                  style={{ background: "var(--dark-card)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                />
                <select
                  className="w-full px-3 py-2 font-mono-tech text-xs rounded-sm"
                  style={{ background: "var(--dark-card)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                  value={newRule.ruleType}
                  onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value as typeof newRule.ruleType })}
                >
                  {RULE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").toUpperCase()}</option>)}
                </select>
                <button
                  onClick={() => createRuleMutation.mutate({
                    ruleName: newRule.ruleName,
                    ruleType: newRule.ruleType,
                    conditions: newRule.conditions,
                    actions: newRule.actions,
                  })}
                  disabled={!newRule.ruleName}
                  className="w-full py-2 font-orbitron text-xs tracking-wider"
                  style={{ border: "1px solid var(--neon-green)", color: "var(--neon-green)", background: "rgba(57,255,20,0.05)" }}
                >
                  SAVE RULE
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {!rules?.length ? (
                <div className="font-mono-tech text-xs text-center py-4" style={{ color: "oklch(0.35 0.03 220)" }}>
                  NO RULES CONFIGURED
                </div>
              ) : (
                rules.map((rule) => {
                  const color = RULE_COLORS[rule.ruleType] || "var(--neon-cyan)";
                  return (
                    <div key={rule.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--dark-border)" }}>
                      <div>
                        <div className="font-orbitron text-xs" style={{ color: "oklch(0.85 0.05 200)" }}>{rule.ruleName}</div>
                        <span className="font-mono-tech text-xs" style={{ color }}>{rule.ruleType.replace(/_/g, " ").toUpperCase()}</span>
                      </div>
                      <button
                        onClick={() => toggleRuleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                        style={{ color: rule.isActive ? "var(--neon-green)" : "oklch(0.4 0.03 220)" }}
                      >
                        {rule.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {!result && !optimizeMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(57,255,20,0.15)" }}>
              <TrendingUp className="w-16 h-16 mx-auto mb-4" style={{ color: "oklch(0.25 0.03 260)" }} />
              <div className="font-orbitron text-sm mb-2" style={{ color: "oklch(0.35 0.03 220)" }}>AWAITING METRICS</div>
              <div className="font-mono-tech text-xs" style={{ color: "oklch(0.3 0.03 220)" }}>
                Enter performance metrics to generate optimization recommendations
              </div>
            </div>
          )}

          {optimizeMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(57,255,20,0.3)" }}>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "var(--neon-green)" }} />
              <div className="font-orbitron text-sm" style={{ color: "var(--neon-green)" }}>OPTIMIZATION AGENT RUNNING</div>
            </div>
          )}

          {result && resultSections.map((s) => {
            const val = result[s.key] as string;
            if (!val) return null;
            return (
              <div key={s.key} className="cyber-card rounded-sm p-4" style={{ borderColor: `${s.color}20` }}>
                <div className="font-orbitron text-xs tracking-wider mb-2" style={{ color: s.color }}>{s.label}</div>
                <div className="font-mono-tech text-xs leading-relaxed" style={{ color: "oklch(0.75 0.05 200)" }}>
                  <Streamdown>{val}</Streamdown>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
