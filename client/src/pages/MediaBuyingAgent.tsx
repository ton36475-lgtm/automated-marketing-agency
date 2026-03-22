import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, Loader2, DollarSign, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function MediaBuyingAgent() {
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const mediaMutation = trpc.agent.runMediaBuying.useMutation({
    onSuccess: (data) => {
      setResult(data.result);
      toast.success("Media buying strategy generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    budget: 0,
    objective: "conversions",
    platforms: [] as string[],
    targetCPA: 0,
    targetROAS: 0,
    campaignId: undefined as number | undefined,
  });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const PLATFORMS = ["meta", "google", "tiktok", "line", "youtube"];
  const OBJECTIVES = ["conversions", "traffic", "awareness", "leads", "sales"];

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));
  };

  const handleRun = () => {
    if (!form.budget) return toast.error("Budget is required");
    if (!form.platforms.length) return toast.error("Select at least one platform");
    mediaMutation.mutate(form);
  };

  const PLATFORM_COLORS: Record<string, string> = {
    meta: "var(--neon-cyan)",
    google: "var(--neon-yellow)",
    tiktok: "var(--neon-pink)",
    line: "var(--neon-green)",
    youtube: "#ff0000",
  };

  const resultSections = result ? [
    { key: "budgetAllocation", label: "BUDGET ALLOCATION", color: "var(--neon-pink)" },
    { key: "bidStrategy", label: "BID STRATEGY", color: "var(--neon-cyan)" },
    { key: "audienceTargeting", label: "AUDIENCE TARGETING", color: "var(--neon-purple)" },
    { key: "adSchedule", label: "AD SCHEDULE", color: "var(--neon-yellow)" },
    { key: "platformRecommendations", label: "PLATFORM RECOMMENDATIONS", color: "var(--neon-green)" },
    { key: "kpiTargets", label: "KPI TARGETS", color: "var(--neon-cyan)" },
    { key: "scalingTriggers", label: "SCALING TRIGGERS", color: "var(--neon-pink)" },
    { key: "riskMitigation", label: "RISK MITIGATION", color: "var(--neon-yellow)" },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ AI AGENT
        </div>
        <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-pink)" }}>
          MEDIA BUYING AGENT
        </h1>
        <p className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>
          Budget allocation, bid strategy, and multi-platform media buying optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="cyber-card rounded-sm p-5 space-y-4" style={{ borderColor: "rgba(255, 45, 120, 0.25)" }}>
          <div className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-pink)" }}>
            ◈ CAMPAIGN PARAMETERS
          </div>

          {campaigns && campaigns.length > 0 && (
            <div>
              <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>LINK CAMPAIGN</Label>
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

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>MONTHLY BUDGET (USD) *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.4 0.03 220)" }} />
              <Input
                type="number"
                value={form.budget || ""}
                onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                placeholder="10000"
                className="pl-8 font-mono-tech text-sm"
                style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
              />
            </div>
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>CAMPAIGN OBJECTIVE</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj}
                  onClick={() => setForm({ ...form, objective: obj })}
                  className="px-3 py-1 font-mono-tech text-xs rounded-sm transition-all"
                  style={{
                    border: `1px solid ${form.objective === obj ? "var(--neon-pink)" : "var(--dark-border)"}`,
                    color: form.objective === obj ? "var(--neon-pink)" : "oklch(0.45 0.04 220)",
                    background: form.objective === obj ? "rgba(255,45,120,0.1)" : "transparent",
                  }}
                >
                  {obj.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PLATFORMS *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLATFORMS.map((p) => {
                const color = PLATFORM_COLORS[p];
                const selected = form.platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className="px-3 py-1 font-mono-tech text-xs rounded-sm transition-all"
                    style={{
                      border: `1px solid ${selected ? color : "var(--dark-border)"}`,
                      color: selected ? color : "oklch(0.45 0.04 220)",
                      background: selected ? `${color}15` : "transparent",
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>TARGET CPA (USD)</Label>
              <Input
                type="number"
                value={form.targetCPA || ""}
                onChange={(e) => setForm({ ...form, targetCPA: Number(e.target.value) })}
                placeholder="e.g. 25"
                className="mt-1 font-mono-tech text-sm"
                style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
              />
            </div>
            <div>
              <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>TARGET ROAS (x)</Label>
              <Input
                type="number"
                value={form.targetROAS || ""}
                onChange={(e) => setForm({ ...form, targetROAS: Number(e.target.value) })}
                placeholder="e.g. 4"
                className="mt-1 font-mono-tech text-sm"
                style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
              />
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={mediaMutation.isPending}
            className="w-full py-3 font-orbitron text-sm tracking-wider transition-all flex items-center justify-center gap-2"
            style={{
              border: "1px solid var(--neon-pink)",
              color: "var(--neon-pink)",
              background: mediaMutation.isPending ? "rgba(255,45,120,0.1)" : "rgba(255,45,120,0.05)",
            }}
          >
            {mediaMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> ANALYZING...</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> [ RUN MEDIA BUYING AGENT ]</>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {!result && !mediaMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(255,45,120,0.15)" }}>
              <ShoppingCart className="w-16 h-16 mx-auto mb-4" style={{ color: "oklch(0.25 0.03 260)" }} />
              <div className="font-orbitron text-sm mb-2" style={{ color: "oklch(0.35 0.03 220)" }}>AWAITING INPUT</div>
              <div className="font-mono-tech text-xs" style={{ color: "oklch(0.3 0.03 220)" }}>
                Set budget and platforms to generate media buying strategy
              </div>
            </div>
          )}

          {mediaMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(255,45,120,0.3)" }}>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "var(--neon-pink)" }} />
              <div className="font-orbitron text-sm" style={{ color: "var(--neon-pink)" }}>MEDIA BUYING AGENT RUNNING</div>
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
