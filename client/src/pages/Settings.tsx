import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, CheckCircle, AlertCircle, Key, Globe, Database } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { data: integrations, refetch } = trpc.integration.get.useQuery();
  const saveMutation = trpc.integration.save.useMutation({
    onSuccess: () => { refetch(); toast.success("Integration settings saved!"); },
    onError: (e) => toast.error(e.message),
  });

  const [hubspot, setHubspot] = useState({ apiKey: "", portalId: "" });
  const [meta, setMeta] = useState({ accessToken: "", adAccountId: "", pixelId: "" });

  useEffect(() => {
    if (integrations) {
      setHubspot({
        apiKey: integrations.hubspotApiKey || "",
        portalId: integrations.hubspotPortalId || "",
      });
      setMeta({
        accessToken: integrations.metaAccessToken || "",
        adAccountId: integrations.metaAdAccountId || "",
        pixelId: integrations.metaPixelId || "",
      });
    }
  }, [integrations]);

  const saveHubspot = () => {
    saveMutation.mutate({
      hubspotApiKey: hubspot.apiKey,
      hubspotPortalId: hubspot.portalId,
      isHubspotConnected: !!(hubspot.apiKey),
    });
  };

  const saveMeta = () => {
    saveMutation.mutate({
      metaAccessToken: meta.accessToken,
      metaAdAccountId: meta.adAccountId,
      metaPixelId: meta.pixelId,
      isMetaConnected: !!(meta.accessToken),
    });
  };

  const IntegrationCard = ({
    title,
    platformLabel,
    color,
    icon: Icon,
    children,
    onSave,
    isConnected,
  }: {
    title: string;
    platformLabel: string;
    color: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    children: React.ReactNode;
    onSave: () => void;
    isConnected: boolean;
  }) => (
    <div className="cyber-card rounded-sm p-5" style={{ borderColor: `${color}25` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <div className="font-orbitron text-sm font-bold" style={{ color }}>{title}</div>
            <div className="font-mono-tech text-xs" style={{ color: "oklch(0.4 0.03 220)" }}>{platformLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
              <span className="font-mono-tech text-xs" style={{ color: "var(--neon-green)" }}>CONNECTED</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" style={{ color: "oklch(0.45 0.04 220)" }} />
              <span className="font-mono-tech text-xs" style={{ color: "oklch(0.45 0.04 220)" }}>NOT CONNECTED</span>
            </>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {children}
        <button
          onClick={onSave}
          disabled={saveMutation.isPending}
          className="w-full py-2.5 font-orbitron text-xs tracking-wider flex items-center justify-center gap-2 transition-all"
          style={{ border: `1px solid ${color}`, color, background: `${color}08` }}
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? "SAVING..." : "[ SAVE INTEGRATION ]"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ SYSTEM CONFIGURATION
        </div>
        <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-pink)" }}>
          SETTINGS
        </h1>
        <p className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>
          Configure API integrations for HubSpot CRM and Meta Ads
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HubSpot */}
        <IntegrationCard
          title="HubSpot CRM"
          platformLabel="CRM INTEGRATION"
          color="var(--neon-pink)"
          icon={Database}
          onSave={saveHubspot}
          isConnected={integrations?.isHubspotConnected ?? false}
        >
          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>API KEY</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "oklch(0.4 0.03 220)" }} />
              <Input
                type="password"
                value={hubspot.apiKey}
                onChange={(e) => setHubspot({ ...hubspot, apiKey: e.target.value })}
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="pl-8 font-mono-tech text-sm"
                style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
              />
            </div>
          </div>
          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PORTAL ID</Label>
            <Input
              value={hubspot.portalId}
              onChange={(e) => setHubspot({ ...hubspot, portalId: e.target.value })}
              placeholder="12345678"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>
          <div className="p-3 rounded-sm" style={{ background: "rgba(255,45,120,0.05)", border: "1px solid rgba(255,45,120,0.15)" }}>
            <div className="font-mono-tech text-xs" style={{ color: "oklch(0.5 0.04 220)" }}>
              Features: Lead sync, contact management, deal pipeline, AI lead scoring
            </div>
          </div>
        </IntegrationCard>

        {/* Meta Ads */}
        <IntegrationCard
          title="Meta Ads"
          platformLabel="META MARKETING API"
          color="var(--neon-cyan)"
          icon={Globe}
          onSave={saveMeta}
          isConnected={integrations?.isMetaConnected ?? false}
        >
          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>ACCESS TOKEN</Label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "oklch(0.4 0.03 220)" }} />
              <Input
                type="password"
                value={meta.accessToken}
                onChange={(e) => setMeta({ ...meta, accessToken: e.target.value })}
                placeholder="EAAxxxxxxxxxxxxxxx"
                className="pl-8 font-mono-tech text-sm"
                style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
              />
            </div>
          </div>
          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>AD ACCOUNT ID</Label>
            <Input
              value={meta.adAccountId}
              onChange={(e) => setMeta({ ...meta, adAccountId: e.target.value })}
              placeholder="act_123456789"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>
          <div>
            <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PIXEL ID</Label>
            <Input
              value={meta.pixelId}
              onChange={(e) => setMeta({ ...meta, pixelId: e.target.value })}
              placeholder="123456789012345"
              className="mt-1 font-mono-tech text-sm"
              style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            />
          </div>
          <div className="p-3 rounded-sm" style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.15)" }}>
            <div className="font-mono-tech text-xs" style={{ color: "oklch(0.5 0.04 220)" }}>
              Features: Campaign creation, budget management, performance metrics, audience targeting
            </div>
          </div>
        </IntegrationCard>

        {/* System Info */}
        <div className="cyber-card rounded-sm p-5" style={{ borderColor: "rgba(191,95,255,0.2)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-sm" style={{ background: "rgba(191,95,255,0.15)", border: "1px solid rgba(191,95,255,0.3)" }}>
              <Settings className="w-4 h-4" style={{ color: "var(--neon-purple)" }} />
            </div>
            <div className="font-orbitron text-sm font-bold" style={{ color: "var(--neon-purple)" }}>AGENT STATUS</div>
          </div>
          <div className="space-y-2">
            {[
              "STRATEGY AGENT",
              "COPYWRITING AGENT",
              "VISUAL AGENT",
              "MEDIA BUYING AGENT",
              "OPTIMIZATION AGENT",
              "LEAD SCORING AGENT",
              "COMPETITOR ANALYSIS AGENT",
            ].map((label) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "var(--dark-border)" }}>
                <span className="font-mono-tech text-xs" style={{ color: "oklch(0.6 0.05 220)" }}>{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--neon-green)" }} />
                  <span className="font-mono-tech text-xs" style={{ color: "var(--neon-green)" }}>ONLINE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
