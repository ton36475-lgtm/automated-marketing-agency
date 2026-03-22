import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Zap, Loader2, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

interface CopyVariant {
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  emotionalHook: string;
  framework: string;
}

export default function CopywritingAgent() {
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const copyMutation = trpc.agent.runCopywriting.useMutation({
    onSuccess: (data) => {
      const variants = (data.result.variants as CopyVariant[]) || [];
      setVariants(variants);
      toast.success(`Generated ${variants.length} copy variants!`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    product: "",
    audience: "",
    tone: "Professional yet conversational",
    platform: "meta",
    strategy: "",
    variants: 3,
    campaignId: undefined as number | undefined,
  });
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleRun = () => {
    if (!form.product) return toast.error("Product description required");
    copyMutation.mutate(form);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const PLATFORM_COLORS: Record<string, string> = {
    meta: "var(--neon-cyan)",
    google: "var(--neon-yellow)",
    tiktok: "var(--neon-pink)",
    line: "var(--neon-green)",
    general: "var(--neon-purple)",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ AI AGENT
        </div>
        <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-yellow)" }}>
          COPYWRITING AGENT
        </h1>
        <p className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>
          Generate high-converting ad copy using AIDA, PAS, and emotional persuasion frameworks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 cyber-card rounded-sm p-5 space-y-4" style={{ borderColor: "rgba(255, 255, 0, 0.2)" }}>
          <div className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-yellow)" }}>
            ◈ COPY PARAMETERS
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

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PRODUCT / SERVICE *</Label>
            <Textarea
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              placeholder="Describe your product or service..."
              rows={3}
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>TARGET AUDIENCE</Label>
            <Input
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              placeholder="e.g. Busy professionals, 30-45"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PLATFORM</Label>
            <select
              className="w-full mt-1 px-3 py-2 font-mono-tech text-sm rounded-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            >
              <option value="meta">Meta (Facebook/Instagram)</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="line">LINE Ads</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>TONE OF VOICE</Label>
            <Input
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              placeholder="e.g. Urgent, Friendly, Professional"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>NUMBER OF VARIANTS: {form.variants}</Label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.variants}
              onChange={(e) => setForm({ ...form, variants: Number(e.target.value) })}
              className="w-full mt-2"
              style={{ accentColor: "var(--neon-yellow)" }}
            />
          </div>

          <button
            onClick={handleRun}
            disabled={copyMutation.isPending}
            className="w-full py-3 font-orbitron text-sm tracking-wider transition-all flex items-center justify-center gap-2"
            style={{
              border: "1px solid var(--neon-yellow)",
              color: "var(--neon-yellow)",
              background: copyMutation.isPending ? "rgba(255,255,0,0.1)" : "rgba(255,255,0,0.05)",
            }}
          >
            {copyMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING COPY...</>
            ) : (
              <><Zap className="w-4 h-4" /> [ GENERATE COPY ]</>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-4">
          {!variants.length && !copyMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(255,255,0,0.15)" }}>
              <Zap className="w-16 h-16 mx-auto mb-4" style={{ color: "oklch(0.25 0.03 260)" }} />
              <div className="font-orbitron text-sm mb-2" style={{ color: "oklch(0.35 0.03 220)" }}>AWAITING GENERATION</div>
              <div className="font-mono-tech text-xs" style={{ color: "oklch(0.3 0.03 220)" }}>
                Configure parameters and generate copy variants
              </div>
            </div>
          )}

          {copyMutation.isPending && (
            <div className="cyber-card rounded-sm p-12 text-center" style={{ borderColor: "rgba(255,255,0,0.3)" }}>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "var(--neon-yellow)" }} />
              <div className="font-orbitron text-sm" style={{ color: "var(--neon-yellow)" }}>COPYWRITING AGENT RUNNING</div>
              <div className="font-mono-tech text-xs mt-2" style={{ color: "oklch(0.45 0.04 220)" }}>
                Crafting persuasive copy variants...
              </div>
            </div>
          )}

          {variants.map((v, idx) => {
            const platformColor = PLATFORM_COLORS[form.platform] || "var(--neon-cyan)";
            const fullText = `Headline: ${v.headline}\n\nPrimary Text: ${v.primaryText}\n\nDescription: ${v.description}\n\nCTA: ${v.cta}`;
            return (
              <div
                key={idx}
                className="cyber-card rounded-sm p-4"
                style={{ borderColor: `${platformColor}25` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron text-xs" style={{ color: platformColor }}>
                      VARIANT {idx + 1}
                    </span>
                    <span
                      className="font-mono-tech text-xs px-2 py-0.5 rounded-sm"
                      style={{ background: `${platformColor}15`, color: platformColor, border: `1px solid ${platformColor}30` }}
                    >
                      {v.framework}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(fullText, idx)}
                    className="flex items-center gap-1 font-mono-tech text-xs transition-colors"
                    style={{ color: copiedIdx === idx ? "var(--neon-green)" : "oklch(0.4 0.03 220)" }}
                  >
                    {copiedIdx === idx ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIdx === idx ? "COPIED" : "COPY"}
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-mono-tech text-xs" style={{ color: "oklch(0.4 0.03 220)" }}>HEADLINE: </span>
                    <span className="font-orbitron text-sm font-bold" style={{ color: platformColor }}>{v.headline}</span>
                  </div>
                  <div>
                    <span className="font-mono-tech text-xs" style={{ color: "oklch(0.4 0.03 220)" }}>PRIMARY TEXT: </span>
                    <span className="font-mono-tech text-xs" style={{ color: "oklch(0.8 0.05 200)" }}>{v.primaryText}</span>
                  </div>
                  <div>
                    <span className="font-mono-tech text-xs" style={{ color: "oklch(0.4 0.03 220)" }}>DESCRIPTION: </span>
                    <span className="font-mono-tech text-xs" style={{ color: "oklch(0.8 0.05 200)" }}>{v.description}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <span
                      className="font-orbitron text-xs px-3 py-1 rounded-sm"
                      style={{ background: `${platformColor}20`, color: platformColor, border: `1px solid ${platformColor}40` }}
                    >
                      {v.cta}
                    </span>
                    <span className="font-mono-tech text-xs" style={{ color: "oklch(0.4 0.03 220)" }}>
                      Hook: {v.emotionalHook}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
