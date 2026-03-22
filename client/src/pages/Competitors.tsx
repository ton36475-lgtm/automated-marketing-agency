import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, Plus, Trash2, Brain, Loader2, Globe } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function Competitors() {
  const utils = trpc.useUtils();
  const { data: competitors, isLoading } = trpc.competitor.list.useQuery();
  const createMutation = trpc.competitor.create.useMutation({
    onSuccess: () => { utils.competitor.list.invalidate(); setOpen(false); resetForm(); toast.success("Competitor added"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.competitor.delete.useMutation({
    onSuccess: () => { utils.competitor.list.invalidate(); toast.success("Competitor removed"); },
  });
  const analysisMutation = trpc.agent.runCompetitorAnalysis.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.result);
      toast.success("Competitor analysis complete!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ competitorName: "", website: "", industry: "", ourProduct: "" });
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  const resetForm = () => setForm({ competitorName: "", website: "", industry: "", ourProduct: "" });

  const handleCreate = () => {
    if (!form.competitorName) return toast.error("Competitor name required");
    createMutation.mutate(form);
  };

  const handleAnalyze = (name: string, website?: string | null) => {
    setSelectedCompetitor(name);
    setAnalysisResult(null);
    analysisMutation.mutate({ competitorName: name, website: website || undefined, industry: form.industry || undefined, ourProduct: form.ourProduct || undefined });
  };

  const resultSections = analysisResult ? [
    { key: "overview", label: "COMPETITOR OVERVIEW", color: "var(--neon-cyan)" },
    { key: "strengths", label: "STRENGTHS", color: "var(--neon-green)" },
    { key: "weaknesses", label: "WEAKNESSES", color: "var(--neon-pink)" },
    { key: "adStrategy", label: "AD STRATEGY", color: "var(--neon-yellow)" },
    { key: "contentStrategy", label: "CONTENT STRATEGY", color: "var(--neon-purple)" },
    { key: "targetAudience", label: "TARGET AUDIENCE", color: "var(--neon-cyan)" },
    { key: "opportunities", label: "OUR OPPORTUNITIES", color: "var(--neon-green)" },
    { key: "threats", label: "THREATS TO WATCH", color: "var(--neon-pink)" },
    { key: "counterStrategy", label: "COUNTER STRATEGY", color: "var(--neon-yellow)" },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
            ◈ INTELLIGENCE
          </div>
          <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-purple)" }}>
            COMPETITOR ANALYSIS
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 font-orbitron text-xs tracking-wider"
              style={{ border: "1px solid var(--neon-purple)", color: "var(--neon-purple)", background: "rgba(191,95,255,0.05)" }}
            >
              <Plus className="w-3.5 h-3.5" /> ADD COMPETITOR
            </button>
          </DialogTrigger>
          <DialogContent style={{ background: "var(--dark-card)", border: "1px solid var(--dark-border)" }}>
            <DialogHeader>
              <DialogTitle className="font-orbitron text-sm" style={{ color: "var(--neon-purple)" }}>ADD COMPETITOR</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>COMPETITOR NAME *</Label>
                <Input value={form.competitorName} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>WEBSITE</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://competitor.com" className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>INDUSTRY</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>OUR PRODUCT (for comparison)</Label>
                <Input value={form.ourProduct} onChange={(e) => setForm({ ...form, ourProduct: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
              </div>
              <button onClick={handleCreate} disabled={createMutation.isPending} className="w-full py-2.5 font-orbitron text-xs tracking-wider" style={{ border: "1px solid var(--neon-purple)", color: "var(--neon-purple)", background: "rgba(191,95,255,0.1)" }}>
                {createMutation.isPending ? "ADDING..." : "[ ADD COMPETITOR ]"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitor List */}
        <div className="space-y-3">
          <div className="font-orbitron text-xs tracking-wider" style={{ color: "oklch(0.4 0.03 220)" }}>
            ◈ TRACKED COMPETITORS ({competitors?.length || 0})
          </div>
          {isLoading ? (
            <div className="font-mono-tech text-xs text-center py-8" style={{ color: "oklch(0.35 0.03 220)" }}>LOADING...</div>
          ) : !competitors?.length ? (
            <div className="cyber-card rounded-sm p-8 text-center" style={{ borderColor: "rgba(191,95,255,0.15)" }}>
              <Eye className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.3 0.03 220)" }} />
              <div className="font-orbitron text-xs" style={{ color: "oklch(0.35 0.03 220)" }}>NO COMPETITORS TRACKED</div>
            </div>
          ) : (
            competitors.map((c) => (
              <div
                key={c.id}
                className="cyber-card rounded-sm p-4 cursor-pointer transition-all"
                style={{ borderColor: selectedCompetitor === c.competitorName ? "rgba(191,95,255,0.5)" : "rgba(191,95,255,0.15)" }}
                onClick={() => setSelectedCompetitor(c.competitorName)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-orbitron text-xs font-bold" style={{ color: "oklch(0.85 0.05 200)" }}>{c.competitorName}</div>
                    {c.website && (
                      <div className="flex items-center gap-1 mt-1">
                        <Globe className="w-3 h-3" style={{ color: "oklch(0.4 0.03 220)" }} />
                        <span className="font-mono-tech text-xs truncate" style={{ color: "oklch(0.45 0.04 220)" }}>{c.website}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(c.competitorName, c.website); }}
                      disabled={analysisMutation.isPending}
                      className="p-1.5 rounded-sm"
                      style={{ color: "var(--neon-purple)" }}
                      title="AI Analyze"
                    >
                      {analysisMutation.isPending && selectedCompetitor === c.competitorName ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Brain className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: c.id }); }}
                      className="p-1.5 rounded-sm"
                      style={{ color: "oklch(0.4 0.03 220)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--neon-pink)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(0.4 0.03 220)")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-2 space-y-3">
          {!analysisResult && !analysisMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(191,95,255,0.15)" }}>
              <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: "oklch(0.25 0.03 260)" }} />
              <div className="font-orbitron text-sm mb-2" style={{ color: "oklch(0.35 0.03 220)" }}>SELECT A COMPETITOR</div>
              <div className="font-mono-tech text-xs" style={{ color: "oklch(0.3 0.03 220)" }}>
                Click the brain icon to run AI analysis on any competitor
              </div>
            </div>
          )}

          {analysisMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(191,95,255,0.3)" }}>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "var(--neon-purple)" }} />
              <div className="font-orbitron text-sm" style={{ color: "var(--neon-purple)" }}>ANALYZING {selectedCompetitor?.toUpperCase()}</div>
            </div>
          )}

          {analysisResult && (
            <>
              <div className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-purple)" }}>
                ◈ ANALYSIS: {selectedCompetitor?.toUpperCase()}
              </div>
              {resultSections.map((s) => {
                const val = analysisResult[s.key] as string;
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
