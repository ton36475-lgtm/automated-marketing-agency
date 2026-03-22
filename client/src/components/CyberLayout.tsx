import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  BarChart3,
  Bot,
  Brain,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Image,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  section?: string;
}

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Crown, label: "CEO Board", path: "/ceo-board" },
      { icon: Megaphone, label: "Campaigns", path: "/campaigns" },
    ],
  },
  {
    title: "AI Agents",
    items: [
      { icon: Brain, label: "Strategy", path: "/strategy" },
      { icon: Zap, label: "Copywriting", path: "/copywriting" },
      { icon: Image, label: "Visual AI", path: "/visual" },
      { icon: ShoppingCart, label: "Media Buying", path: "/media-buying" },
      { icon: TrendingUp, label: "Optimization", path: "/optimization" },
    ],
  },
  {
    title: "Data",
    items: [
      { icon: Users, label: "CRM / Leads", path: "/leads" },
      { icon: Eye, label: "Competitors", path: "/competitors" },
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: Link2, label: "Integrations", path: "/integrations" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

interface CyberLayoutProps {
  children: React.ReactNode;
}

export default function CyberLayout({ children }: CyberLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-2">Marketing AI</div>
          <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
          <div className="mt-4 flex gap-1 justify-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 h-6 rounded-full bg-primary/30 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-8 py-12 border rounded-xl bg-card shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">Marketing AI</h1>
          <p className="text-sm text-muted-foreground mb-1">Multi-Agent Automation Platform</p>
          <p className="text-xs text-muted-foreground/60 mb-8">v3.0 — CEO Gem Executive Board</p>
          <div className="w-full h-px bg-border mb-8" />
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to access the executive dashboard and manage your AI marketing team.
          </p>
          <a
            href={getLoginUrl()}
            className="block w-full py-3 text-center text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r bg-card transition-all duration-300 ${
          collapsed ? "w-[60px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold leading-none">Marketing AI</div>
              <div className="text-xs text-muted-foreground leading-none mt-1">CEO Board v3.0</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              {!collapsed && (
                <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center gap-3 px-4 py-2 mx-2 my-0.5 rounded-lg cursor-pointer transition-all text-sm ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {isActive && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + Collapse */}
        <div className="border-t">
          {!collapsed && user && (
            <div className="px-4 py-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 bg-primary/10 text-primary">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{user.name || "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{user.role}</div>
              </div>
              <button
                onClick={() => logout()}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
