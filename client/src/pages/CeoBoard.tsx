import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import {
  Brain,
  Crown,
  Users,
  Zap,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  RefreshCw,
  ChevronRight,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  DollarSign,
  Settings2,
  MessageSquare,
  FileText,
  Activity,
  Globe,
  LineChart,
  Coins,
  Link2,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
  Search,
  BarChart2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type GemRole = "ceo" | "cmo" | "cto" | "cfo" | "coo" | "strategy" | "creative" | "media" | "optimization" | "analytics";

const ROLE_CONFIG: Record<GemRole, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  ceo: { icon: Crown, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  cmo: { icon: Megaphone, color: "text-pink-400", bgColor: "bg-pink-500/10" },
  cto: { icon: Settings2, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  cfo: { icon: DollarSign, color: "text-green-400", bgColor: "bg-green-500/10" },
  coo: { icon: Activity, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  strategy: { icon: Target, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  creative: { icon: Sparkles, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  media: { icon: TrendingUp, color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  optimization: { icon: Zap, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  analytics: { icon: BarChart3, color: "text-teal-400", bgColor: "bg-teal-500/10" },
};

import { Megaphone } from "lucide-react";

// ─── Component ───────────────────────────────────────────────────────────────
export default function CeoBoard() {
  const [activeTab, setActiveTab] = useState<"overview" | "gems" | "decisions" | "meetings" | "directives" | "systems">("overview");
  const [crossAnalysisType, setCrossAnalysisType] = useState<"cross_system_review" | "synergy_analysis" | "risk_assessment" | "resource_optimization" | "unified_report">("cross_system_review");
  const [crossAnalysisResult, setCrossAnalysisResult] = useState<any>(null);
  const [meetingTopic, setMeetingTopic] = useState("");
  const [directiveText, setDirectiveText] = useState("");
  const [directiveTarget, setDirectiveTarget] = useState("");
  const [directivePriority, setDirectivePriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [analysisType, setAnalysisType] = useState<"full_review" | "campaign_review" | "budget_review" | "performance_review">("full_review");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // ─── Queries ─────────────────────────────────────────────────────────────
  const dashboardQuery = trpc.ceo.dashboard.useQuery();
  const gemsQuery = trpc.ceo.gems.list.useQuery();
  const decisionsQuery = trpc.ceo.decisions.list.useQuery({ limit: 20 });
  const meetingsQuery = trpc.ceo.meetings.list.useQuery({ limit: 10 });
  const directivesQuery = trpc.ceo.directives.list.useQuery({ limit: 20 });

  // Cross-system queries
  const crossOverviewQuery = trpc.crossSystem.modules.overview.useQuery();
  const crossAnalysisHistoryQuery = trpc.crossSystem.analysis.history.useQuery({ limit: 5 });

  // ─── Mutations ───────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const initBoard = trpc.ceo.gems.initializeBoard.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.ceo.gems.list.invalidate();
      utils.ceo.dashboard.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const triggerMeeting = trpc.ceo.meetings.trigger.useMutation({
    onSuccess: () => {
      toast.success("Board meeting completed");
      setMeetingTopic("");
      utils.ceo.meetings.list.invalidate();
      utils.ceo.decisions.list.invalidate();
      utils.ceo.dashboard.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const issueDirective = trpc.ceo.directives.issue.useMutation({
    onSuccess: () => {
      toast.success("Directive issued");
      setDirectiveText("");
      setDirectiveTarget("");
      utils.ceo.directives.list.invalidate();
      utils.ceo.dashboard.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const runAnalysis = trpc.ceo.analyze.useMutation({
    onSuccess: (data) => {
      toast.success("Analysis complete");
      setAnalysisResult(data);
      utils.ceo.decisions.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const takeSnapshot = trpc.ceo.snapshots.take.useMutation({
    onSuccess: () => {
      toast.success("Performance snapshot taken");
      utils.ceo.snapshots.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleGem = trpc.ceo.gems.update.useMutation({
    onSuccess: () => {
      utils.ceo.gems.list.invalidate();
      utils.ceo.dashboard.invalidate();
    },
  });

  // Cross-system mutations
  const initSeo = trpc.crossSystem.seo.initialize.useMutation({
    onSuccess: () => {
      toast.success("Travobet SEO connected");
      utils.crossSystem.modules.overview.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const syncSeo = trpc.crossSystem.seo.sync.useMutation({
    onSuccess: () => {
      toast.success("SEO data synced");
      utils.crossSystem.modules.overview.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const initTrading = trpc.crossSystem.trading.initialize.useMutation({
    onSuccess: () => {
      toast.success("Polymarket Trading connected");
      utils.crossSystem.modules.overview.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const syncTrading = trpc.crossSystem.trading.sync.useMutation({
    onSuccess: () => {
      toast.success("Trading data synced");
      utils.crossSystem.modules.overview.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const runCrossAnalysis = trpc.crossSystem.analysis.run.useMutation({
    onSuccess: (data) => {
      toast.success("Cross-system analysis complete");
      setCrossAnalysisResult(data);
      utils.crossSystem.analysis.history.invalidate();
      utils.crossSystem.modules.overview.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateDecisionStatus = trpc.ceo.decisions.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Decision status updated");
      utils.ceo.decisions.list.invalidate();
    },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const stats = dashboardQuery.data;
  const gems = gemsQuery.data || [];
  const decisions = decisionsQuery.data || [];
  const meetings = meetingsQuery.data || [];
  const directives = directivesQuery.data || [];

  const handleTriggerMeeting = () => {
    if (!meetingTopic.trim()) {
      toast.error("Please enter a meeting topic");
      return;
    }
    const firstGem = gems[0];
    if (!firstGem) {
      toast.error("Please initialize the board first");
      return;
    }
    triggerMeeting.mutate({ topic: meetingTopic, triggerType: "manual" });
  };

  const handleIssueDirective = () => {
    if (!directiveText.trim() || !directiveTarget) {
      toast.error("Please fill in all directive fields");
      return;
    }
    const ceoGem = gems.find((g) => g.gemRole === "ceo") || gems[0];
    if (!ceoGem) {
      toast.error("Please initialize the board first");
      return;
    }
    issueDirective.mutate({
      fromGemId: ceoGem.id,
      toGemRole: directiveTarget,
      directive: directiveText,
      priority: directivePriority,
    });
  };

  // ─── Tab Navigation ──────────────────────────────────────────────────────
  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Crown },
    { id: "gems" as const, label: "Board Members", icon: Users },
    { id: "decisions" as const, label: "Decisions", icon: CheckCircle2 },
    { id: "meetings" as const, label: "Meetings", icon: MessageSquare },
    { id: "directives" as const, label: "Directives", icon: FileText },
    { id: "systems" as const, label: "Systems", icon: Globe },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
            CEO Gem Executive Board
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered executive team managing all systems autonomously
          </p>
        </div>
        <div className="flex gap-2">
          {gems.length === 0 && (
            <Button
              onClick={() => initBoard.mutate()}
              disabled={initBoard.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {initBoard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Initialize Board
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => takeSnapshot.mutate()}
            disabled={takeSnapshot.isPending}
          >
            {takeSnapshot.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Take Snapshot
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <OverviewTab
          stats={stats}
          gems={gems}
          decisions={decisions}
          meetings={meetings}
          analysisType={analysisType}
          setAnalysisType={setAnalysisType}
          analysisResult={analysisResult}
          runAnalysis={runAnalysis}
        />
      )}

      {activeTab === "gems" && (
        <GemsTab gems={gems} toggleGem={toggleGem} initBoard={initBoard} />
      )}

      {activeTab === "decisions" && (
        <DecisionsTab decisions={decisions} updateDecisionStatus={updateDecisionStatus} />
      )}

      {activeTab === "meetings" && (
        <MeetingsTab
          meetings={meetings}
          meetingTopic={meetingTopic}
          setMeetingTopic={setMeetingTopic}
          handleTriggerMeeting={handleTriggerMeeting}
          triggerMeeting={triggerMeeting}
        />
      )}

      {activeTab === "directives" && (
        <DirectivesTab
          directives={directives}
          gems={gems}
          directiveText={directiveText}
          setDirectiveText={setDirectiveText}
          directiveTarget={directiveTarget}
          setDirectiveTarget={setDirectiveTarget}
          directivePriority={directivePriority}
          setDirectivePriority={setDirectivePriority}
          handleIssueDirective={handleIssueDirective}
          issueDirective={issueDirective}
        />
      )}

      {activeTab === "systems" && (
        <SystemsTab
          overview={crossOverviewQuery.data}
          isLoading={crossOverviewQuery.isLoading}
          analysisHistory={crossAnalysisHistoryQuery.data || []}
          initSeo={initSeo}
          syncSeo={syncSeo}
          initTrading={initTrading}
          syncTrading={syncTrading}
          runCrossAnalysis={runCrossAnalysis}
          crossAnalysisType={crossAnalysisType}
          setCrossAnalysisType={setCrossAnalysisType}
          crossAnalysisResult={crossAnalysisResult}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({
  stats,
  gems,
  decisions,
  meetings,
  analysisType,
  setAnalysisType,
  analysisResult,
  runAnalysis,
}: any) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Board Members"
          value={stats?.totalGems ?? 0}
          subtitle={`${stats?.activeGems ?? 0} active`}
          icon={Users}
          color="text-amber-400"
        />
        <StatCard
          title="Decisions Made"
          value={stats?.totalDecisions ?? 0}
          subtitle={`${stats?.pendingDecisions ?? 0} pending`}
          icon={CheckCircle2}
          color="text-green-400"
        />
        <StatCard
          title="Board Meetings"
          value={stats?.totalMeetings ?? 0}
          subtitle="Total sessions"
          icon={MessageSquare}
          color="text-blue-400"
        />
        <StatCard
          title="Directives"
          value={stats?.totalDirectives ?? 0}
          subtitle={`${stats?.pendingDirectives ?? 0} pending`}
          icon={FileText}
          color="text-purple-400"
        />
      </div>

      {/* Board Members Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Executive Board
            </CardTitle>
            <CardDescription>Active AI board members and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {gems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No board members yet. Click "Initialize Board" to set up the executive team.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gems.map((gem: any) => {
                  const config = ROLE_CONFIG[gem.gemRole as GemRole] || ROLE_CONFIG.analytics;
                  const Icon = config.icon;
                  return (
                    <div
                      key={gem.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        gem.isActive ? "border-border" : "border-border/50 opacity-60"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{gem.gemName}</div>
                        <div className="text-xs text-muted-foreground uppercase">{gem.gemRole}</div>
                      </div>
                      <Badge variant={gem.isActive ? "default" : "secondary"} className="text-xs">
                        {gem.isActive ? "Active" : "Idle"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CEO Analysis Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              CEO Analysis
            </CardTitle>
            <CardDescription>Run AI-powered executive analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Type</label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              >
                <option value="full_review">Full System Review</option>
                <option value="campaign_review">Campaign Review</option>
                <option value="budget_review">Budget Review</option>
                <option value="performance_review">Performance Review</option>
              </select>
            </div>
            <Button
              onClick={() => runAnalysis.mutate({ analysisType })}
              disabled={runAnalysis.isPending}
              className="w-full"
            >
              {runAnalysis.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>

            {analysisResult && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Health Score</span>
                  <Badge
                    variant={
                      (analysisResult.result?.healthScore || 0) >= 80
                        ? "default"
                        : (analysisResult.result?.healthScore || 0) >= 50
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {analysisResult.result?.healthScore || 0}/100
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysisResult.result?.overallAssessment?.substring(0, 200)}...
                </p>
                {analysisResult.result?.keyInsights && (
                  <div>
                    <span className="text-xs font-medium">Key Insights:</span>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      {(analysisResult.result.keyInsights as string[]).slice(0, 3).map((insight: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {insight.substring(0, 100)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4" />
              Recent Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No decisions yet</p>
            ) : (
              <div className="space-y-3">
                {decisions.slice(0, 5).map((d: any) => (
                  <div key={d.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="mt-0.5">
                      <StatusIcon status={d.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{d.decisionType.replace(/_/g, " ")}</div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4" />
              Recent Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No meetings yet</p>
            ) : (
              <div className="space-y-3">
                {meetings.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="mt-0.5">
                      <StatusIcon status={m.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.topic}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.triggerType} | {(m.participants as any[])?.length || 0} participants
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Gems Tab ────────────────────────────────────────────────────────────────
function GemsTab({ gems, toggleGem, initBoard }: any) {
  return (
    <div className="space-y-6">
      {gems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Crown className="w-16 h-16 mx-auto mb-4 text-amber-400 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No Board Members</h3>
            <p className="text-muted-foreground mb-4">Initialize the executive board to create AI board members</p>
            <Button onClick={() => initBoard.mutate()} disabled={initBoard.isPending}>
              {initBoard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Initialize Board
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gems.map((gem: any) => {
            const config = ROLE_CONFIG[gem.gemRole as GemRole] || ROLE_CONFIG.analytics;
            const Icon = config.icon;
            return (
              <Card key={gem.id} className={!gem.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{gem.gemName}</CardTitle>
                        <CardDescription className="uppercase text-xs">{gem.gemRole}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGem.mutate({ id: gem.id, isActive: !gem.isActive })}
                      className={gem.isActive ? "text-green-400" : "text-muted-foreground"}
                    >
                      {gem.isActive ? "Active" : "Inactive"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {gem.personality || "No personality defined"}
                  </p>
                  <div>
                    <span className="text-xs font-medium">Goals:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(gem.goals as string[] || []).slice(0, 3).map((goal: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {goal.length > 30 ? goal.substring(0, 30) + "..." : goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Decisions: {gem.totalDecisions || 0}</span>
                    <span>Success: {gem.successRate || 0}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Decisions Tab ───────────────────────────────────────────────────────────
function DecisionsTab({ decisions, updateDecisionStatus }: any) {
  return (
    <div className="space-y-4">
      {decisions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No Decisions Yet</h3>
            <p className="text-muted-foreground">Run a board meeting or CEO analysis to generate decisions</p>
          </CardContent>
        </Card>
      ) : (
        decisions.map((d: any) => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <StatusIcon status={d.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{d.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {d.decisionType.replace(/_/g, " ")}
                    </Badge>
                    {d.confidence && (
                      <Badge variant="secondary" className="text-xs">
                        {Number(d.confidence).toFixed(0)}% confidence
                      </Badge>
                    )}
                  </div>
                  {d.reasoning && (
                    <p className="text-sm text-muted-foreground mb-2">{d.reasoning.substring(0, 200)}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={d.status === "executed" ? "default" : d.status === "pending" ? "secondary" : "outline"}>
                      {d.status}
                    </Badge>
                    {d.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateDecisionStatus.mutate({ id: d.id, status: "executed" })}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Execute
                      </Button>
                    )}
                    {d.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDecisionStatus.mutate({ id: d.id, status: "approved" })}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => updateDecisionStatus.mutate({ id: d.id, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── Meetings Tab ────────────────────────────────────────────────────────────
function MeetingsTab({ meetings, meetingTopic, setMeetingTopic, handleTriggerMeeting, triggerMeeting }: any) {
  return (
    <div className="space-y-6">
      {/* Trigger Meeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Call Board Meeting
          </CardTitle>
          <CardDescription>
            Trigger a multi-agent deliberation session where all board members discuss and decide on a topic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <input
              type="text"
              value={meetingTopic}
              onChange={(e) => setMeetingTopic(e.target.value)}
              placeholder="Enter meeting topic (e.g., 'Q1 Budget Reallocation Strategy')"
              className="flex-1 p-2 rounded-md border bg-background text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleTriggerMeeting()}
            />
            <Button onClick={handleTriggerMeeting} disabled={triggerMeeting.isPending}>
              {triggerMeeting.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Meeting in progress...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Meeting
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meeting History */}
      {meetings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No Meetings Yet</h3>
            <p className="text-muted-foreground">Call a board meeting to start multi-agent deliberation</p>
          </CardContent>
        </Card>
      ) : (
        meetings.map((m: any) => (
          <MeetingCard key={m.id} meeting={m} />
        ))
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: any }) {
  const [expanded, setExpanded] = useState(false);
  const participants = (meeting.participants as any[]) || [];
  const discussions = (meeting.discussion as any[]) || [];
  const meetingDecisions = (meeting.decisions as any[]) || [];
  const actionItems = (meeting.actionItems as any[]) || [];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{meeting.topic}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{meeting.triggerType}</Badge>
              <Badge variant={meeting.status === "completed" ? "default" : "secondary"} className="text-xs">
                {meeting.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {participants.length} participants
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </Button>
        </div>

        {expanded && (
          <div className="space-y-4 mt-4 pt-4 border-t">
            {/* Discussions */}
            {discussions.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Discussion</h5>
                <div className="space-y-2">
                  {discussions.map((d: any, i: number) => {
                    let parsed: any = {};
                    try { parsed = JSON.parse(d.response); } catch { parsed = { assessment: d.response }; }
                    return (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="font-medium text-xs mb-1">
                          {d.gemName} ({d.gemRole})
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {parsed.assessment?.substring(0, 200) || "No assessment"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Decisions */}
            {meetingDecisions.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Decisions</h5>
                {meetingDecisions.map((dec: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm">
                    <p className="font-medium">{dec.decision || "Decision made"}</p>
                    {dec.reasoning && <p className="text-xs text-muted-foreground mt-1">{dec.reasoning.substring(0, 200)}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Action Items ({actionItems.length})</h5>
                <div className="space-y-1">
                  {actionItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{item.from}:</span>
                      <span className="text-muted-foreground">{item.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Directives Tab ──────────────────────────────────────────────────────────
function DirectivesTab({
  directives,
  gems,
  directiveText,
  setDirectiveText,
  directiveTarget,
  setDirectiveTarget,
  directivePriority,
  setDirectivePriority,
  handleIssueDirective,
  issueDirective,
}: any) {
  const roles = ["strategy", "copywriting", "visual", "media_buying", "optimization", "lead_scoring", "competitor_analysis"];

  return (
    <div className="space-y-6">
      {/* Issue Directive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Issue CEO Directive
          </CardTitle>
          <CardDescription>Send a command from the CEO to any agent or department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Target Agent/Role</label>
              <select
                value={directiveTarget}
                onChange={(e) => setDirectiveTarget(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              >
                <option value="">Select target...</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <select
                value={directivePriority}
                onChange={(e) => setDirectivePriority(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Directive</label>
            <textarea
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              placeholder="Enter directive details..."
              className="w-full p-2 rounded-md border bg-background text-sm min-h-[80px] resize-y"
            />
          </div>
          <Button onClick={handleIssueDirective} disabled={issueDirective.isPending}>
            {issueDirective.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Issuing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Issue Directive
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Directive History */}
      {directives.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No Directives Yet</h3>
            <p className="text-muted-foreground">Issue a CEO directive to command agents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {directives.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <PriorityIcon priority={d.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">To: {d.toGemRole.replace(/_/g, " ").toUpperCase()}</span>
                      <Badge
                        variant={
                          d.priority === "critical"
                            ? "destructive"
                            : d.priority === "high"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {d.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {d.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.directive}</p>
                    {d.response && (
                      <p className="text-xs text-green-400 mt-1">Response: {d.response}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Systems Tab (Cross-System Integration) ────────────────────────────────
function SystemsTab({
  overview,
  isLoading,
  analysisHistory,
  initSeo,
  syncSeo,
  initTrading,
  syncTrading,
  runCrossAnalysis,
  crossAnalysisType,
  setCrossAnalysisType,
  crossAnalysisResult,
}: any) {
  const seo = overview?.seo;
  const trading = overview?.trading;
  const marketing = overview?.marketing;
  const latestAnalysis = overview?.latestAnalysis;

  return (
    <div className="space-y-6">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marketing System */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                </div>
                Marketing Automation
              </CardTitle>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                <Wifi className="w-3 h-3 mr-1" /> Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Campaigns</p>
                <p className="text-lg font-bold">{marketing?.stats?.totalCampaigns ?? 0}</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-lg font-bold text-emerald-600">{marketing?.stats?.activeCampaigns ?? 0}</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-lg font-bold">{marketing?.stats?.totalLeads ?? 0}</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Agents</p>
                <p className="text-lg font-bold">{marketing?.stats?.activeAgents ?? 5}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Always connected as the primary platform</p>
          </CardContent>
        </Card>

        {/* Travobet SEO System */}
        <Card className={`border-l-4 ${seo?.isConnected ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${seo?.isConnected ? 'bg-blue-500/10' : 'bg-gray-100'}`}>
                  <Search className={`w-4 h-4 ${seo?.isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                Travobet SEO
              </CardTitle>
              <Badge className={seo?.isConnected ? 'bg-blue-500/10 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
                {seo?.isConnected ? <><Wifi className="w-3 h-3 mr-1" /> Online</> : <><WifiOff className="w-3 h-3 mr-1" /> Offline</>}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {seo?.isConnected && seo?.latestData ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Organic Traffic</p>
                    <p className="text-lg font-bold">{(seo.latestData.organicTraffic || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Domain Authority</p>
                    <p className="text-lg font-bold text-blue-600">{seo.latestData.domainAuthority || 0}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Keywords</p>
                    <p className="text-lg font-bold">{(seo.latestData.totalKeywords || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Backlinks</p>
                    <p className="text-lg font-bold">{(seo.latestData.totalBacklinks || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => syncSeo.mutate()} disabled={syncSeo.isPending}>
                    {syncSeo.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Sync Data
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Last sync: {seo.latestData.snapshotDate ? new Date(seo.latestData.snapshotDate).toLocaleString() : 'Never'}</p>
              </>
            ) : (
              <div className="text-center py-4">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-muted-foreground mb-3">Not connected</p>
                <Button size="sm" onClick={() => initSeo.mutate()} disabled={initSeo.isPending} className="bg-blue-500 hover:bg-blue-600 text-white">
                  {initSeo.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                  Connect Travobet SEO
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Polymarket Trading System */}
        <Card className={`border-l-4 ${trading?.isConnected ? 'border-l-purple-500' : 'border-l-gray-300'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${trading?.isConnected ? 'bg-purple-500/10' : 'bg-gray-100'}`}>
                  <Coins className={`w-4 h-4 ${trading?.isConnected ? 'text-purple-500' : 'text-gray-400'}`} />
                </div>
                Polymarket Trading
              </CardTitle>
              <Badge className={trading?.isConnected ? 'bg-purple-500/10 text-purple-600 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
                {trading?.isConnected ? <><Wifi className="w-3 h-3 mr-1" /> Online</> : <><WifiOff className="w-3 h-3 mr-1" /> Offline</>}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {trading?.isConnected && trading?.latestData ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Portfolio Value</p>
                    <p className="text-lg font-bold">${(trading.latestData.portfolioValue || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Total P&L</p>
                    <p className={`text-lg font-bold ${(trading.latestData.totalPnl || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {(trading.latestData.totalPnl || 0) >= 0 ? '+' : ''}${(trading.latestData.totalPnl || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Open Positions</p>
                    <p className="text-lg font-bold">{trading.latestData.openPositions || 0}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="text-lg font-bold text-purple-600">{trading.latestData.winRate || 0}%</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => syncTrading.mutate()} disabled={syncTrading.isPending}>
                    {syncTrading.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Sync Data
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Last sync: {trading.latestData.snapshotDate ? new Date(trading.latestData.snapshotDate).toLocaleString() : 'Never'}</p>
              </>
            ) : (
              <div className="text-center py-4">
                <Coins className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-muted-foreground mb-3">Not connected</p>
                <Button size="sm" onClick={() => initTrading.mutate()} disabled={initTrading.isPending} className="bg-purple-500 hover:bg-purple-600 text-white">
                  {initTrading.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                  Connect Polymarket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cross-System Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Cross-System Analysis
            </CardTitle>
            <CardDescription>AI-powered analysis across Marketing, SEO, and Trading</CardDescription>
          </CardHeader>
          <CardContent>
            {crossAnalysisResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Overall Health Score</span>
                    <p className="text-3xl font-bold mt-1">
                      {crossAnalysisResult.unified?.overallHealthScore || 0}
                      <span className="text-sm font-normal text-muted-foreground">/100</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total ROI</p>
                    <p className={`text-xl font-bold ${(crossAnalysisResult.unified?.overallROI || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {(crossAnalysisResult.unified?.overallROI || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Insights */}
                {crossAnalysisResult.unified?.insights?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" /> Key Insights
                    </h4>
                    <div className="space-y-1.5">
                      {crossAnalysisResult.unified.insights.slice(0, 4).map((insight: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synergies */}
                {crossAnalysisResult.unified?.synergies?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5" /> Cross-System Synergies
                    </h4>
                    <div className="space-y-1.5">
                      {crossAnalysisResult.unified.synergies.slice(0, 3).map((synergy: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                          <span>{synergy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {crossAnalysisResult.unified?.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Recommendations
                    </h4>
                    <div className="space-y-1.5">
                      {crossAnalysisResult.unified.recommendations.slice(0, 3).map((rec: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {crossAnalysisResult.unified?.risks?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Risks
                    </h4>
                    <div className="space-y-1.5">
                      {crossAnalysisResult.unified.risks.slice(0, 3).map((risk: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowDownRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : latestAnalysis ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Analysis Health Score</span>
                  <Badge variant={latestAnalysis.healthScore >= 70 ? 'default' : 'destructive'}>
                    {latestAnalysis.healthScore}/100
                  </Badge>
                </div>
                {latestAnalysis.insights && (latestAnalysis.insights as string[]).slice(0, 3).map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{insight}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Analyzed: {new Date(latestAnalysis.createdAt).toLocaleString()}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No cross-system analysis yet. Connect systems and run an analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Run Analysis
            </CardTitle>
            <CardDescription>Cross-system AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Type</label>
              <select
                value={crossAnalysisType}
                onChange={(e) => setCrossAnalysisType(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              >
                <option value="cross_system_review">Cross-System Review</option>
                <option value="synergy_analysis">Synergy Analysis</option>
                <option value="risk_assessment">Risk Assessment</option>
                <option value="resource_optimization">Resource Optimization</option>
                <option value="unified_report">Unified Report</option>
              </select>
            </div>
            <Button
              onClick={() => runCrossAnalysis.mutate({ type: crossAnalysisType })}
              disabled={runCrossAnalysis.isPending}
              className="w-full"
            >
              {runCrossAnalysis.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Cross-System Analysis
                </>
              )}
            </Button>

            {/* Quick Actions */}
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Quick Actions</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (!seo?.isConnected) initSeo.mutate();
                  if (!trading?.isConnected) initTrading.mutate();
                  if (seo?.isConnected && trading?.isConnected) {
                    syncSeo.mutate();
                    syncTrading.mutate();
                  }
                }}
                disabled={syncSeo.isPending || syncTrading.isPending || initSeo.isPending || initTrading.isPending}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                {seo?.isConnected && trading?.isConnected ? 'Sync All Systems' : 'Connect All Systems'}
              </Button>
            </div>

            {/* Analysis History */}
            {analysisHistory.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Recent Analyses</p>
                <div className="space-y-2">
                  {analysisHistory.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate">{a.analysisType.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-xs">
                        {Number(a.overallHealthScore || 0).toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
    case "executed":
    case "approved":
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case "pending":
    case "scheduled":
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case "in_progress":
    case "running":
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case "failed":
    case "rejected":
    case "error":
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default:
      return <Shield className="w-4 h-4 text-muted-foreground" />;
  }
}

function PriorityIcon({ priority }: { priority: string }) {
  switch (priority) {
    case "critical":
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case "high":
      return <Zap className="w-4 h-4 text-orange-400" />;
    case "medium":
      return <Target className="w-4 h-4 text-blue-400" />;
    default:
      return <Shield className="w-4 h-4 text-muted-foreground" />;
  }
}
