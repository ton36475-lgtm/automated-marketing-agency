import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Edit, Play, Pause, BarChart2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--neon-cyan)",
  active: "var(--neon-green)",
  paused: "var(--neon-yellow)",
  completed: "var(--neon-purple)",
  archived: "oklch(0.4 0.03 220)",
};

export default function Campaigns() {
  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.campaign.list.useQuery();
  const createMutation = trpc.campaign.create.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate();
      setOpen(false);
      setForm({ name: "", objective: "", budget: "", targetAudience: "" });
      toast.success("Campaign created");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.campaign.update.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate();
      toast.success("Campaign updated");
    },
  });
  const deleteMutation = trpc.campaign.delete.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate();
      toast.success("Campaign deleted");
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", objective: "", budget: "", targetAudience: "" });

  const handleCreate = () => {
    if (!form.name) return toast.error("Campaign name required");
    createMutation.mutate(form);
  };

  const toggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    updateMutation.mutate({ id, status: newStatus as "active" | "paused" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
            ◈ CAMPAIGN MANAGEMENT
          </div>
          <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-pink)" }}>
            CAMPAIGNS
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 font-orbitron text-xs tracking-wider transition-all"
              style={{ border: "1px solid var(--neon-pink)", color: "var(--neon-pink)", background: "rgba(255,45,120,0.05)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,45,120,0.15)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,45,120,0.05)")}
            >
              <Plus className="w-3.5 h-3.5" />
              NEW CAMPAIGN
            </button>
          </DialogTrigger>
          <DialogContent style={{ background: "var(--dark-card)", border: "1px solid var(--dark-border)" }}>
            <DialogHeader>
              <DialogTitle className="font-orbitron text-sm" style={{ color: "var(--neon-pink)" }}>
                CREATE NEW CAMPAIGN
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>CAMPAIGN NAME *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Q1 Product Launch"
                  className="mt-1 font-mono-tech text-sm"
                  style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                />
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>OBJECTIVE</Label>
                <Input
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  placeholder="e.g. Lead Generation, Sales, Brand Awareness"
                  className="mt-1 font-mono-tech text-sm"
                  style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                />
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>DAILY BUDGET (USD)</Label>
                <Input
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="e.g. 500"
                  className="mt-1 font-mono-tech text-sm"
                  style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                />
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>TARGET AUDIENCE</Label>
                <Textarea
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  placeholder="Describe your target audience..."
                  rows={3}
                  className="mt-1 font-mono-tech text-sm"
                  style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full py-2.5 font-orbitron text-xs tracking-wider transition-all"
                style={{ border: "1px solid var(--neon-pink)", color: "var(--neon-pink)", background: "rgba(255,45,120,0.1)" }}
              >
                {createMutation.isPending ? "CREATING..." : "[ CREATE CAMPAIGN ]"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="font-mono-tech text-xs text-center py-16" style={{ color: "oklch(0.35 0.03 220)" }}>
          LOADING CAMPAIGNS...
        </div>
      ) : !campaigns?.length ? (
        <div className="cyber-card rounded-sm p-16 text-center">
          <Megaphone className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.3 0.03 220)" }} />
          <div className="font-orbitron text-sm mb-2" style={{ color: "oklch(0.4 0.03 220)" }}>
            NO CAMPAIGNS FOUND
          </div>
          <div className="font-mono-tech text-xs" style={{ color: "oklch(0.3 0.03 220)" }}>
            Create your first campaign to get started
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const statusColor = STATUS_COLORS[campaign.status] || "oklch(0.4 0.03 220)";
            return (
              <div
                key={campaign.id}
                className="cyber-card rounded-sm p-4"
                style={{ borderColor: `${statusColor}20` }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="font-orbitron text-sm font-bold truncate" style={{ color: "oklch(0.9 0.02 200)" }}>
                        {campaign.name}
                      </div>
                      <span
                        className="font-mono-tech text-xs px-2 py-0.5 rounded-sm flex-shrink-0"
                        style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}
                      >
                        {campaign.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono-tech text-xs" style={{ color: "oklch(0.45 0.04 220)" }}>
                      {campaign.objective && <span>OBJ: {campaign.objective}</span>}
                      {campaign.budget && <span>BUDGET: ${campaign.budget}/day</span>}
                      <span>CREATED: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleStatus(campaign.id, campaign.status)}
                      className="p-2 rounded-sm transition-colors"
                      style={{ color: campaign.status === "active" ? "var(--neon-yellow)" : "var(--neon-green)" }}
                      title={campaign.status === "active" ? "Pause" : "Activate"}
                    >
                      {campaign.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <Link href={`/analytics?campaignId=${campaign.id}`}>
                      <button className="p-2 rounded-sm transition-colors" style={{ color: "var(--neon-cyan)" }}>
                        <BarChart2 className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => deleteMutation.mutate({ id: campaign.id })}
                      className="p-2 rounded-sm transition-colors"
                      style={{ color: "oklch(0.4 0.03 220)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--neon-pink)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(0.4 0.03 220)")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
