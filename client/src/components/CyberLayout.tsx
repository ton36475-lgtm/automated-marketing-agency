import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  BarChart3,
  Bot,
  Brain,
  ChevronLeft,
  ChevronRight,
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
  color: string;
  agentType?: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "DASHBOARD", path: "/", color: "var(--neon-cyan)" },
  { icon: Megaphone, label: "CAMPAIGNS", path: "/campaigns", color: "var(--neon-pink)" },
  { icon: Brain, label: "STRATEGY", path: "/strategy", color: "var(--neon-purple)", agentType: "strategy" },
  { icon: Zap, label: "COPYWRITING", path: "/copywriting", color: "var(--neon-yellow)", agentType: "copywriting" },
  { icon: Image, label: "VISUAL AI", path: "/visual", color: "var(--neon-cyan)", agentType: "visual" },
  { icon: ShoppingCart, label: "MEDIA BUYING", path: "/media-buying", color: "var(--neon-pink)", agentType: "media_buying" },
  { icon: TrendingUp, label: "OPTIMIZATION", path: "/optimization", color: "var(--neon-green)", agentType: "optimization" },
  { icon: Users, label: "CRM / LEADS", path: "/leads", color: "var(--neon-cyan)" },
  { icon: Eye, label: "COMPETITORS", path: "/competitors", color: "var(--neon-purple)" },
  { icon: BarChart3, label: "ANALYTICS", path: "/analytics", color: "var(--neon-yellow)" },
  { icon: Link2, label: "INTEGRATIONS", path: "/integrations", color: "var(--neon-green)" },
  { icon: Settings, label: "SETTINGS", path: "/settings", color: "var(--neon-pink)" },
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dark-bg)" }}>
        <div className="text-center">
          <div className="font-orbitron text-2xl text-neon-pink animate-flicker mb-4">NEXUS AI</div>
          <div className="font-mono-tech text-sm text-neon-cyan animate-pulse">INITIALIZING SYSTEM...</div>
          <div className="mt-4 flex gap-1 justify-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 h-6 rounded-full"
                style={{
                  background: "var(--neon-cyan)",
                  animation: `pulse-green 1s infinite ${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center cyber-grid" style={{ background: "var(--dark-bg)" }}>
        <div className="text-center max-w-md px-8 py-12 cyber-card rounded-sm" style={{ borderColor: "var(--neon-pink)" }}>
          <div className="font-orbitron text-4xl font-black mb-2 glow-pink" style={{ color: "var(--neon-pink)" }}>
            NEXUS
          </div>
          <div className="font-orbitron text-lg mb-1" style={{ color: "var(--neon-cyan)" }}>
            MARKETING AI
          </div>
          <div className="font-mono-tech text-xs mb-8" style={{ color: "var(--neon-cyan)", opacity: 0.6 }}>
            MULTI-AGENT AUTOMATION PLATFORM v2.0
          </div>
          <div className="w-full h-px mb-8" style={{ background: "linear-gradient(90deg, transparent, var(--neon-pink), transparent)" }} />
          <p className="text-sm mb-8" style={{ color: "oklch(0.55 0.05 220)" }}>
            Authentication required to access the system. Please verify your identity to continue.
          </p>
          <a
            href={getLoginUrl()}
            className="block w-full py-3 text-center font-orbitron text-sm tracking-widest transition-all duration-200"
            style={{
              border: "1px solid var(--neon-pink)",
              color: "var(--neon-pink)",
              background: "rgba(255, 45, 120, 0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255, 45, 120, 0.15)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(255, 45, 120, 0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255, 45, 120, 0.05)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            [ AUTHENTICATE ]
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--dark-bg)" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 relative z-20"
        style={{
          width: collapsed ? "60px" : "220px",
          background: "var(--dark-card)",
          borderRight: "1px solid var(--dark-border)",
          boxShadow: "4px 0 20px rgba(0, 245, 255, 0.05)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid var(--dark-border)" }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-sm"
            style={{ background: "rgba(255, 45, 120, 0.15)", border: "1px solid var(--neon-pink)" }}
          >
            <Bot className="w-4 h-4" style={{ color: "var(--neon-pink)" }} />
          </div>
          {!collapsed && (
            <div>
              <div className="font-orbitron text-sm font-bold leading-none" style={{ color: "var(--neon-pink)" }}>
                NEXUS
              </div>
              <div className="font-mono-tech text-xs leading-none mt-1" style={{ color: "var(--neon-cyan)", opacity: 0.7 }}>
                MARKETING AI
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className="flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-sm cursor-pointer transition-all duration-150 group"
                  style={{
                    background: isActive ? `${item.color}15` : "transparent",
                    borderLeft: isActive ? `2px solid ${item.color}` : "2px solid transparent",
                    color: isActive ? item.color : "oklch(0.55 0.05 220)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = `${item.color}08`;
                      (e.currentTarget as HTMLElement).style.color = item.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "oklch(0.55 0.05 220)";
                    }
                  }}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-orbitron text-xs tracking-wider truncate">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div
                      className="ml-auto w-1 h-1 rounded-full"
                      style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + Collapse */}
        <div style={{ borderTop: "1px solid var(--dark-border)" }}>
          {!collapsed && user && (
            <div className="px-4 py-3 flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-orbitron flex-shrink-0"
                style={{ background: "rgba(0, 245, 255, 0.1)", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)" }}
              >
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: "var(--neon-cyan)" }}>
                  {user.name || "USER"}
                </div>
                <div className="font-mono-tech text-xs truncate" style={{ color: "oklch(0.4 0.03 220)" }}>
                  {user.role?.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-1 rounded-sm transition-colors"
                style={{ color: "oklch(0.4 0.03 220)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--neon-pink)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(0.4 0.03 220)")}
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 transition-colors"
            style={{ color: "oklch(0.4 0.03 220)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--neon-cyan)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(0.4 0.03 220)")}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
