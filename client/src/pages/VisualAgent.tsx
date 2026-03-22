import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Image, Loader2, Download, Sparkles } from "lucide-react";
import { useState } from "react";

interface AdCreative {
  id?: number;
  name: string;
  imageUrl?: string;
  promptUsed?: string;
  format?: string;
  status?: string;
}

export default function VisualAgent() {
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: creatives, refetch: refetchCreatives } = trpc.creative.list.useQuery();
  const visualMutation = trpc.agent.runVisual.useMutation({
    onSuccess: (data) => {
      const result = data.result as { imageUrl?: string; prompt?: string; name?: string };
      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast.success("Visual generated successfully!");
        refetchCreatives();
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    prompt: "",
    style: "cyberpunk",
    brand: "",
    platform: "meta",
    campaignId: undefined as number | undefined,
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleRun = () => {
    if (!form.prompt) return toast.error("Product description required");
    visualMutation.mutate(form);
  };

  const STYLES = [
    "cyberpunk", "minimalist", "bold", "luxury", "playful",
    "professional", "retro", "futuristic", "natural", "urban"
  ];
  const FORMATS = [
    { value: "square", label: "Square (1:1) - Feed" },
    { value: "portrait", label: "Portrait (4:5) - Instagram" },
    { value: "landscape", label: "Landscape (16:9) - Banner" },
    { value: "story", label: "Story (9:16) - Stories/Reels" },
  ];
  const [selectedFormat, setSelectedFormat] = useState("square");
  const EMOTIONS = ["excitement", "trust", "urgency", "aspiration", "fear_of_missing_out", "joy", "curiosity"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ AI AGENT
        </div>
        <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-cyan)" }}>
          VISUAL AGENT
        </h1>
        <p className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>
          AI-powered ad creative generation with brand-consistent visuals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="cyber-card rounded-sm p-5 space-y-4" style={{ borderColor: "rgba(0, 245, 255, 0.25)" }}>
          <div className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-cyan)" }}>
            ◈ VISUAL PARAMETERS
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
          <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PRODUCT / CONCEPT *</Label>
              <Textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder="Describe what to visualize..."
              rows={3}
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>VISUAL STYLE</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, style: s })}
                  className="px-2 py-1 font-mono-tech text-xs rounded-sm transition-all"
                  style={{
                    border: `1px solid ${form.style === s ? "var(--neon-cyan)" : "var(--dark-border)"}`,
                    color: form.style === s ? "var(--neon-cyan)" : "oklch(0.45 0.04 220)",
                    background: form.style === s ? "rgba(0,245,255,0.1)" : "transparent",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>AD FORMAT</Label>
            <select
              className="w-full mt-1 px-3 py-2 font-mono-tech text-sm rounded-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>BRAND / PRODUCT NAME</Label>
            <Input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="e.g. NEXUS AI, TechBrand"
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
              <option value="tiktok">TikTok</option>
              <option value="general">General</option>
            </select>
          </div>

          <button
            onClick={handleRun}
            disabled={visualMutation.isPending}
            className="w-full py-3 font-orbitron text-sm tracking-wider transition-all flex items-center justify-center gap-2"
            style={{
              border: "1px solid var(--neon-cyan)",
              color: "var(--neon-cyan)",
              background: visualMutation.isPending ? "rgba(0,245,255,0.1)" : "rgba(0,245,255,0.05)",
            }}
          >
            {visualMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING VISUAL...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> [ GENERATE VISUAL ]</>
            )}
          </button>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="cyber-card rounded-sm overflow-hidden" style={{ borderColor: "rgba(0,245,255,0.2)" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--dark-border)" }}>
              <Image className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} />
              <span className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-cyan)" }}>
                GENERATED PREVIEW
              </span>
            </div>
            <div className="p-4">
              {visualMutation.isPending ? (
                <div
                  className="aspect-square rounded-sm flex flex-col items-center justify-center"
                  style={{ background: "var(--dark-bg)", border: "1px dashed var(--dark-border)" }}
                >
                  <div className="flex gap-1 mb-3">
                    {[0,1,2,3,4].map((i) => (
                      <div key={i} className="w-1 h-8 rounded-full" style={{ background: "var(--neon-cyan)", animation: `pulse-green 0.8s infinite ${i*0.1}s` }} />
                    ))}
                  </div>
                  <div className="font-orbitron text-xs" style={{ color: "var(--neon-cyan)" }}>RENDERING...</div>
                </div>
              ) : generatedImage ? (
                <div className="relative">
                  <img
                    src={generatedImage}
                    alt="Generated Ad Creative"
                    className="w-full rounded-sm"
                    style={{ border: "1px solid rgba(0,245,255,0.2)" }}
                  />
                  <a
                    href={generatedImage}
                    download="ad-creative.png"
                    className="absolute top-2 right-2 p-2 rounded-sm flex items-center gap-1 font-mono-tech text-xs"
                    style={{ background: "rgba(0,0,0,0.7)", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)" }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    SAVE
                  </a>
                </div>
              ) : (
                <div
                  className="aspect-square rounded-sm flex flex-col items-center justify-center"
                  style={{ background: "var(--dark-bg)", border: "1px dashed var(--dark-border)" }}
                >
                  <Image className="w-16 h-16 mb-3" style={{ color: "oklch(0.25 0.03 260)" }} />
                  <div className="font-orbitron text-xs" style={{ color: "oklch(0.35 0.03 220)" }}>NO VISUAL GENERATED</div>
                  <div className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.3 0.03 220)" }}>Configure and run the agent</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Creatives */}
          {creatives && creatives.length > 0 && (
            <div className="cyber-card rounded-sm p-4" style={{ borderColor: "rgba(0,245,255,0.15)" }}>
              <div className="font-orbitron text-xs tracking-wider mb-3" style={{ color: "var(--neon-cyan)" }}>
                ◈ RECENT CREATIVES
              </div>
              <div className="grid grid-cols-3 gap-2">
                {creatives.slice(0, 6).map((c) => (
                  <div key={c.id} className="relative group">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.title || c.type}
                        className="w-full aspect-square object-cover rounded-sm cursor-pointer"
                        style={{ border: "1px solid var(--dark-border)" }}
                        onClick={() => setGeneratedImage(c.imageUrl!)}
                      />
                    ) : (
                      <div
                        className="w-full aspect-square rounded-sm flex items-center justify-center"
                        style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)" }}
                      >
                        <Image className="w-6 h-6" style={{ color: "oklch(0.3 0.03 220)" }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm flex items-end p-1">
                      <span className="font-mono-tech text-xs truncate" style={{ color: "var(--neon-cyan)" }}>{c.title || c.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
