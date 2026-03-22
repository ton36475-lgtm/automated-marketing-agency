import { trpc } from "@/lib/trpc";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle,
  Image,
  Megaphone,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const AGENT_CARDS: Array<{
  type: string;
  label: string;
  icon: IconComponent;
  color: string;
  desc: string;
  path: string;
}> = [
  {
    type: "strategy",
    label: "Strategy Agent",
    icon: Brain,
    color: "var(--neon-purple)",
    desc: "Market analysis & campaign planning",
    path: "/strategy",
  },
  {
    type: "copywriting",
    label: "Copywriting Agent",
    icon: Zap,
    color: "var(--neon-yellow)",
    desc: "Ad copy & content generation",
    path: "/copywriting",
  },
  {
    type: "visual",
    label: "Visual Agent",
    icon: Image,
    color: "var(--neon-cyan)",
    desc: "AI image & creative generation",
    path: "/visual",
  },
  {
    type: "media_buying",
    label: "Media Buying Agent",
    icon: ShoppingCart,
    color: "var(--neon-pink)",
    desc: "Budget & ad placement management",
    path: "/media-buying",
  },
  {
    type: "optimization",
    label: "Optimization Agent",
    icon: TrendingUp,
    color: "var(--neon-green)",
    desc: "ROAS analysis & automated scaling",
    path: "/optimization",
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: IconComponent;
  color: string;
  sub?: string;
}) {
  return (
    <div
      className="cyber-card rounded-sm p-4 relative"
      style={{ borderColor: `${color}30` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono-tech text-xs mb-2" style={{ color: "oklch(0.45 0.04 220)" }}>
            {label}
          </div>
          <div className="font-orbitron text-2xl font-bold" style={{ color }}>
            {value}
          </div>
          {sub && (
            <div className="font-mono-tech text-xs mt-1" style={{ color: "oklch(0.45 0.04 220)" }}>
              {sub}
            </div>
          )}
        </div>
        <div
          className="p-2 rounded-sm"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function AgentStatusCard({
  agent,
}: {
  agent: (typeof AGENT_CARDS)[0];
}) {
  return (
    <Link href={agent.path}>
      <div
        className="cyber-card rounded-sm p-4 cursor-pointer transition-all duration-200 group"
        style={{ borderColor: `${agent.color}20` }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `${agent.color}60`;
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${agent.color}15`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `${agent.color}20`;
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="p-2 rounded-sm"
            style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
          >
            <agent.icon className="w-4 h-4" style={{ color: agent.color }} />
          </div>
          <div>
            <div className="font-orbitron text-xs font-bold" style={{ color: agent.color }}>
              {agent.label.toUpperCase()}
            </div>
          </div>
          <div className="ml-auto status-dot-idle" />
        </div>
        <p className="font-mono-tech text-xs" style={{ color: "oklch(0.45 0.04 220)" }}>
          {agent.desc}
        </p>
        <div
          className="mt-3 text-xs font-orbitron tracking-wider"
          style={{ color: `${agent.color}80` }}
        >
          [ ACTIVATE → ]
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.dashboard.useQuery();
  const { data: tasks } = trpc.agent.tasks.useQuery({ limit: 10 });
  const { data: activityLog } = trpc.agent.activityLog.useQuery({ limit: 15 });
  const { data: campaigns } = trpc.campaign.list.useQuery();

  const recentActivity = useMemo(() => activityLog?.slice(0, 8) || [], [activityLog]);

  const activeCampaigns = useMemo(
    () => campaigns?.filter((c) => c.status === "active") || [],
    [campaigns]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: "oklch(0.4 0.03 220)" }}>
            ◈ SYSTEM OVERVIEW
          </div>
          <h1 className="font-orbitron text-2xl font-black text-gradient-pink-cyan">
            COMMAND CENTER
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-dot-active" />
          <span className="font-mono-tech text-xs" style={{ color: "var(--neon-green)" }}>
            ALL SYSTEMS ONLINE
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL CAMPAIGNS"
          value={statsLoading ? "..." : (stats?.totalCampaigns ?? 0)}
          icon={Megaphone}
          color="var(--neon-pink)"
          sub={`${stats?.activeCampaigns ?? 0} active`}
        />
        <StatCard
          label="TOTAL LEADS"
          value={statsLoading ? "..." : (stats?.totalLeads ?? 0)}
          icon={Users}
          color="var(--neon-cyan)"
        />
        <StatCard
          label="AGENT TASKS"
          value={statsLoading ? "..." : (stats?.totalTasks ?? 0)}
          icon={Bot}
          color="var(--neon-purple)"
          sub={`${stats?.completedTasks ?? 0} completed`}
        />
        <StatCard
          label="SUCCESS RATE"
          value={
            stats && stats.totalTasks > 0
              ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
              : "N/A"
          }
          icon={CheckCircle}
          color="var(--neon-green)"
        />
      </div>

      {/* Agent Grid */}
      <div>
        <div className="font-orbitron text-xs tracking-widest mb-3" style={{ color: "oklch(0.4 0.03 220)" }}>
          ◈ ACTIVE AGENTS
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {AGENT_CARDS.map((agent) => (
            <AgentStatusCard key={agent.type} agent={agent} />
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="cyber-card rounded-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} />
            <span className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-cyan)" }}>
              AGENT ACTIVITY LOG
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="font-mono-tech text-xs text-center py-8" style={{ color: "oklch(0.35 0.03 220)" }}>
                NO ACTIVITY RECORDED
              </div>
            ) : (
              recentActivity.map((log) => {
                const levelColor =
                  log.level === "success"
                    ? "var(--neon-green)"
                    : log.level === "error"
                    ? "var(--neon-pink)"
                    : log.level === "warning"
                    ? "var(--neon-yellow)"
                    : "var(--neon-cyan)";
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 py-1.5 border-b"
                    style={{ borderColor: "var(--dark-border)" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: levelColor, boxShadow: `0 0 4px ${levelColor}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono-tech text-xs truncate" style={{ color: "oklch(0.75 0.05 200)" }}>
                        [{log.agentType.toUpperCase()}] {log.action}
                      </div>
                      <div className="font-mono-tech text-xs" style={{ color: "oklch(0.35 0.03 220)" }}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="cyber-card rounded-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: "var(--neon-pink)" }} />
              <span className="font-orbitron text-xs tracking-wider" style={{ color: "var(--neon-pink)" }}>
                ACTIVE CAMPAIGNS
              </span>
            </div>
            <Link href="/campaigns">
              <span className="font-mono-tech text-xs cursor-pointer" style={{ color: "oklch(0.4 0.03 220)" }}>
                VIEW ALL →
              </span>
            </Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activeCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <div className="font-mono-tech text-xs mb-3" style={{ color: "oklch(0.35 0.03 220)" }}>
                  NO ACTIVE CAMPAIGNS
                </div>
                <Link href="/campaigns">
                  <div
                    className="inline-block px-4 py-2 font-orbitron text-xs tracking-wider cursor-pointer transition-all"
                    style={{ border: "1px solid var(--neon-pink)", color: "var(--neon-pink)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "rgba(255,45,120,0.1)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    [ CREATE CAMPAIGN ]
                  </div>
                </Link>
              </div>
            ) : (
              activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: "var(--dark-border)" }}
                >
                  <div>
                    <div className="font-orbitron text-xs" style={{ color: "oklch(0.85 0.05 200)" }}>
                      {campaign.name}
                    </div>
                    <div className="font-mono-tech text-xs" style={{ color: "oklch(0.4 0.03 220)" }}>
                      {campaign.objective || "General"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="status-dot-active" />
                    <span className="font-mono-tech text-xs" style={{ color: "var(--neon-green)" }}>
                      LIVE
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
