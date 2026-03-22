import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Trash2, Star, Brain, Loader2 } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  hot: "var(--neon-pink)",
  warm: "var(--neon-yellow)",
  cold: "var(--neon-cyan)",
  converted: "var(--neon-green)",
  lost: "oklch(0.4 0.03 220)",
};

export default function Leads() {
  const utils = trpc.useUtils();
  const { data: leads, isLoading } = trpc.lead.list.useQuery();
  const createMutation = trpc.lead.create.useMutation({
    onSuccess: () => { utils.lead.list.invalidate(); setOpen(false); resetForm(); toast.success("Lead added"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.lead.delete.useMutation({
    onSuccess: () => { utils.lead.list.invalidate(); toast.success("Lead deleted"); },
  });
  const scoreMutation = trpc.agent.scoreLeads.useMutation({
    onSuccess: (data) => {
      utils.lead.list.invalidate();
      toast.success(`Lead scored: ${data.result.classification || "done"}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    company: "", jobTitle: "", source: "organic",
  });

  const resetForm = () => setForm({ firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", source: "organic" });

  const handleCreate = () => {
    if (!form.firstName || !form.email) return toast.error("First name and email required");
    createMutation.mutate(form);
  };

  const handleScore = (lead: typeof leads extends Array<infer T> | undefined ? T : never) => {
    scoreMutation.mutate({
      leadId: lead.id,
      lead: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        company: lead.company,
        jobTitle: lead.jobTitle,
        source: lead.source,
        status: lead.status,
      },
    });
  };

  const SOURCES = ["organic", "paid_ads", "referral", "social", "email", "hubspot", "other"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
            ◈ CRM SYSTEM
          </div>
          <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-cyan)" }}>
            LEADS & CRM
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 font-orbitron text-xs tracking-wider transition-all"
              style={{ border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", background: "rgba(0,245,255,0.05)" }}
            >
              <Plus className="w-3.5 h-3.5" /> ADD LEAD
            </button>
          </DialogTrigger>
          <DialogContent style={{ background: "var(--dark-card)", border: "1px solid var(--dark-border)" }}>
            <DialogHeader>
              <DialogTitle className="font-orbitron text-sm" style={{ color: "var(--neon-cyan)" }}>ADD NEW LEAD</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>FIRST NAME *</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
                </div>
                <div>
                  <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>LAST NAME</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
                </div>
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>EMAIL *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>PHONE</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
                </div>
                <div>
                  <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>COMPANY</Label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-1 font-mono-tech text-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} />
                </div>
              </div>
              <div>
                <Label className="font-mono-tech text-xs" style={{ color: "oklch(0.55 0.05 220)" }}>SOURCE</Label>
                <select className="w-full mt-1 px-3 py-2 font-mono-tech text-sm rounded-sm" style={{ background: "var(--dark-bg)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} disabled={createMutation.isPending} className="w-full py-2.5 font-orbitron text-xs tracking-wider" style={{ border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", background: "rgba(0,245,255,0.1)" }}>
                {createMutation.isPending ? "ADDING..." : "[ ADD LEAD ]"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {leads && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["hot", "warm", "cold", "converted", "lost"].map((status) => {
            const count = leads.filter((l) => l.status === status).length;
            const color = STATUS_COLORS[status];
            return (
              <div key={status} className="cyber-card rounded-sm p-3 text-center" style={{ borderColor: `${color}25` }}>
                <div className="font-orbitron text-xl font-bold" style={{ color }}>{count}</div>
                <div className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>{status.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leads Table */}
      {isLoading ? (
        <div className="font-mono-tech text-xs text-center py-16" style={{ color: "oklch(0.35 0.03 220)" }}>LOADING LEADS...</div>
      ) : !leads?.length ? (
        <div className="cyber-card rounded-sm p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.3 0.03 220)" }} />
          <div className="font-orbitron text-sm mb-2" style={{ color: "oklch(0.4 0.03 220)" }}>NO LEADS FOUND</div>
        </div>
      ) : (
        <div className="cyber-card rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--dark-border)" }}>
                {["NAME", "EMAIL", "COMPANY", "SOURCE", "STATUS", "SCORE", "ACTIONS"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-orbitron text-xs tracking-wider" style={{ color: "oklch(0.4 0.03 220)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const statusColor = STATUS_COLORS[lead.status] || "oklch(0.4 0.03 220)";
                return (
                  <tr key={lead.id} className="border-b transition-colors" style={{ borderColor: "var(--dark-border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,245,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="font-orbitron text-xs" style={{ color: "oklch(0.85 0.05 200)" }}>
                        {lead.firstName} {lead.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono-tech text-xs" style={{ color: "oklch(0.6 0.05 220)" }}>{lead.email}</td>
                    <td className="px-4 py-3 font-mono-tech text-xs" style={{ color: "oklch(0.6 0.05 220)" }}>{lead.company || "—"}</td>
                    <td className="px-4 py-3 font-mono-tech text-xs" style={{ color: "oklch(0.5 0.04 220)" }}>{lead.source?.replace(/_/g, " ") || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono-tech text-xs px-2 py-0.5 rounded-sm" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                        {lead.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.score ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" style={{ color: "var(--neon-yellow)" }} />
                          <span className="font-mono-tech text-xs" style={{ color: "var(--neon-yellow)" }}>{lead.score}</span>
                        </div>
                      ) : (
                        <span className="font-mono-tech text-xs" style={{ color: "oklch(0.35 0.03 220)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleScore(lead)}
                          disabled={scoreMutation.isPending}
                          className="p-1.5 rounded-sm transition-colors"
                          style={{ color: "var(--neon-purple)" }}
                          title="AI Score Lead"
                        >
                          {scoreMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate({ id: lead.id })}
                          className="p-1.5 rounded-sm transition-colors"
                          style={{ color: "oklch(0.4 0.03 220)" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--neon-pink)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(0.4 0.03 220)")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
