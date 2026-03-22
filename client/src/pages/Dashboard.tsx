import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Clock,
  AlertCircle,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AGENT_CARDS = [
  { type: "strategy", label: "Strategy Agent", icon: Brain, desc: "Market analysis & campaign planning", path: "/strategy" },
  { type: "copywriting", label: "Copywriting Agent", icon: Zap, desc: "Ad copy & content generation", path: "/copywriting" },
  { type: "visual", label: "Visual Agent", icon: Image, desc: "AI image & creative generation", path: "/visual" },
  { type: "media_buying", label: "Media Buying Agent", icon: ShoppingCart, desc: "Budget & ad placement", path: "/media-buying" },
  { type: "optimization", label: "Optimization Agent", icon: TrendingUp, desc: "ROAS analysis & scaling", path: "/optimization" },
];

const chartData = [
  { name: "Mon", impressions: 4000, clicks: 240, conversions: 24 },
  { name: "Tue", impressions: 3000, clicks: 221, conversions: 29 },
  { name: "Wed", impressions: 2000, clicks: 229, conversions: 20 },
  { name: "Thu", impressions: 2780, clicks: 200, conversions: 21 },
  { name: "Fri", impressions: 1890, clicks: 229, conversions: 22 },
  { name: "Sat", impressions: 2390, clicks: 200, conversions: 25 },
  { name: "Sun", impressions: 3490, clicks: 210, conversions: 20 },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.dashboard.useQuery();
  const { data: tasks } = trpc.agent.tasks.useQuery({ limit: 10 });
  const { data: activityLog } = trpc.agent.activityLog.useQuery({ limit: 15 });
  const { data: campaigns } = trpc.campaign.list.useQuery();

  const recentActivity = useMemo(() => activityLog?.slice(0, 8) || [], [activityLog]);
  const activeCampaigns = useMemo(() => campaigns?.filter((c) => c.status === "active") || [], [campaigns]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container-safe py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your marketing automation platform</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Campaigns"
            value={statsLoading ? "..." : stats?.totalCampaigns ?? 0}
            icon={Megaphone}
            trend={`${stats?.activeCampaigns ?? 0} active`}
          />
          <MetricCard
            title="Total Leads"
            value={statsLoading ? "..." : stats?.totalLeads ?? 0}
            icon={Users}
            trend="↑ 12% this week"
          />
          <MetricCard
            title="Agent Tasks"
            value={statsLoading ? "..." : stats?.totalTasks ?? 0}
            icon={Bot}
            trend={`${stats?.completedTasks ?? 0} completed`}
          />
          <MetricCard
            title="Success Rate"
            value={stats && stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : "N/A"}
            icon={CheckCircle}
            trend="On track"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Chart */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Weekly Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Agent Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Agent Status</h2>
            <div className="space-y-2">
              {AGENT_CARDS.map((agent) => (
                <div key={agent.type} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-foreground">{agent.label}</span>
                  </div>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Agents Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Active Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {AGENT_CARDS.map((agent) => {
              const Icon = agent.icon;
              return (
                <Link key={agent.type} href={agent.path}>
                  <Card className="p-4 hover:border-primary transition-all cursor-pointer h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">{agent.label}</h3>
                    <p className="text-xs text-muted-foreground">{agent.desc}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Automation & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Scheduled Tasks */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-foreground">Scheduled Tasks</h2>
            </div>
            <div className="space-y-3">
              <ScheduleItem title="Daily Campaign Optimization" time="8:00 AM" status="active" />
              <ScheduleItem title="Lead Scoring Update" time="12:00 PM" status="active" />
              <ScheduleItem title="Performance Report" time="6:00 PM" status="scheduled" />
            </div>
            <Button className="w-full mt-4" variant="outline">Add Schedule</Button>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              ) : (
                recentActivity.map((log) => (
                  <ActivityItem key={log.id} title={`[${log.agentType}] ${log.action}`} time={new Date(log.createdAt).toLocaleTimeString()} type={log.level} />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Active Campaigns */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Campaigns</h2>
            <Link href="/campaigns">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {activeCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active campaigns</p>
              <Link href="/campaigns">
                <Button>Create Campaign</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <Card key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                    <Badge>Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{campaign.objective}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Budget: ${campaign.budget}</span>
                    <span className="text-muted-foreground">Spent: ${campaign.budgetSpent}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link href="/campaigns">
              <Button variant="outline" className="w-full">Create Campaign</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full">View Analytics</Button>
            </Link>
            <Link href="/leads">
              <Button variant="outline" className="w-full">Manage Leads</Button>
            </Link>
            <Link href="/strategy">
              <Button variant="outline" className="w-full">Configure Agents</Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full">Settings</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <p className="text-xs text-green-600 dark:text-green-400">↑ {trend}</p>
    </Card>
  );
}

function ScheduleItem({ title, time, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <Badge variant={status === "active" ? "default" : "secondary"} className="text-xs">
        {status}
      </Badge>
    </div>
  );
}

function ActivityItem({ title, time, type }: any) {
  const typeClasses: Record<string, string> = {
    success: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    warning: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
    error: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  };

  return (
    <div className={`p-3 rounded-lg ${typeClasses[type] || typeClasses.info}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs opacity-75">{time}</p>
    </div>
  );
}
