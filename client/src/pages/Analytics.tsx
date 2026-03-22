import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, DollarSign, Target, Users, Eye } from "lucide-react";
import { useState, useMemo } from "react";

const NEON_COLORS = ["#ff2d78", "#00f5ff", "#39ff14", "#ffff00", "#bf5fff"];

export default function Analytics() {
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: stats } = trpc.analytics.dashboard.useQuery();
  const [selectedCampaign, setSelectedCampaign] = useState<number | undefined>(undefined);
  const { data: campaignAnalytics } = trpc.analytics.byCampaign.useQuery(
    { campaignId: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  // Mock chart data for visualization
  const performanceData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      impressions: Math.floor(Math.random() * 50000) + 10000,
      clicks: Math.floor(Math.random() * 2000) + 500,
      conversions: Math.floor(Math.random() * 100) + 20,
      spend: Math.floor(Math.random() * 500) + 100,
    }));
  }, []);

  const platformData = [
    { name: "Meta", value: 45 },
    { name: "Google", value: 30 },
    { name: "TikTok", value: 15 },
    { name: "LINE", value: 10 },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-sm p-3" style={{ background: "var(--dark-card)", border: "1px solid var(--dark-border)" }}>
          <div className="font-orbitron text-xs mb-2" style={{ color: "var(--neon-cyan)" }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} className="font-mono-tech text-xs" style={{ color: p.color }}>
              {p.name}: {p.value.toLocaleString()}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ PERFORMANCE DATA
        </div>
        <h1 className="font-orbitron text-2xl font-black" style={{ color: "var(--neon-yellow)" }}>
          ANALYTICS
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "TOTAL IMPRESSIONS", value: "1.2M", icon: Eye, color: "var(--neon-cyan)", change: "+12%" },
          { label: "TOTAL CLICKS", value: "48.5K", icon: Target, color: "var(--neon-pink)", change: "+8%" },
          { label: "CONVERSIONS", value: "2,340", icon: TrendingUp, color: "var(--neon-green)", change: "+24%" },
          { label: "AD SPEND", value: "$12,450", icon: DollarSign, color: "var(--neon-yellow)", change: "-3%" },
        ].map((kpi) => (
          <div key={kpi.label} className="cyber-card rounded-sm p-4 relative" style={{ borderColor: `${kpi.color}25` }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)`, opacity: 0.5 }} />
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono-tech text-xs mb-2" style={{ color: "oklch(0.45 0.04 220)" }}>{kpi.label}</div>
                <div className="font-orbitron text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="font-mono-tech text-xs mt-1" style={{ color: kpi.change.startsWith("+") ? "var(--neon-green)" : "var(--neon-pink)" }}>
                  {kpi.change} vs last week
                </div>
              </div>
              <div className="p-2 rounded-sm" style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Selector */}
      {campaigns && campaigns.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="font-mono-tech text-xs" style={{ color: "oklch(0.45 0.04 220)" }}>FILTER BY CAMPAIGN:</span>
          <select
            className="px-3 py-2 font-mono-tech text-sm rounded-sm"
            style={{ background: "var(--dark-card)", border: "1px solid var(--dark-border)", color: "oklch(0.9 0.02 200)" }}
            value={selectedCampaign || ""}
            onChange={(e) => setSelectedCampaign(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Line Chart */}
        <div className="lg:col-span-2 cyber-card rounded-sm p-4" style={{ borderColor: "rgba(0,245,255,0.15)" }}>
          <div className="font-orbitron text-xs tracking-wider mb-4" style={{ color: "var(--neon-cyan)" }}>
            ◈ WEEKLY PERFORMANCE
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "oklch(0.45 0.04 220)", fontSize: 10, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.45 0.04 220)", fontSize: 10, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="clicks" stroke="#00f5ff" strokeWidth={2} dot={false} name="Clicks" />
              <Line type="monotone" dataKey="conversions" stroke="#39ff14" strokeWidth={2} dot={false} name="Conversions" />
              <Line type="monotone" dataKey="spend" stroke="#ff2d78" strokeWidth={2} dot={false} name="Spend ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="cyber-card rounded-sm p-4" style={{ borderColor: "rgba(255,45,120,0.15)" }}>
          <div className="font-orbitron text-xs tracking-wider mb-4" style={{ color: "var(--neon-pink)" }}>
            ◈ PLATFORM SPLIT
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {platformData.map((_, index) => (
                  <Cell key={index} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {platformData.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: NEON_COLORS[i] }} />
                  <span className="font-mono-tech text-xs" style={{ color: "oklch(0.6 0.05 220)" }}>{p.name}</span>
                </div>
                <span className="font-mono-tech text-xs" style={{ color: NEON_COLORS[i] }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impressions Bar Chart */}
      <div className="cyber-card rounded-sm p-4" style={{ borderColor: "rgba(57,255,20,0.15)" }}>
        <div className="font-orbitron text-xs tracking-wider mb-4" style={{ color: "var(--neon-green)" }}>
          ◈ DAILY IMPRESSIONS
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(57,255,20,0.05)" />
            <XAxis dataKey="day" tick={{ fill: "oklch(0.45 0.04 220)", fontSize: 10, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.45 0.04 220)", fontSize: 10, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="impressions" fill="#39ff14" opacity={0.7} radius={[2, 2, 0, 0]} name="Impressions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
