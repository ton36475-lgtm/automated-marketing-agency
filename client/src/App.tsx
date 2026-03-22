import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CyberLayout from "./components/CyberLayout";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import StrategyAgent from "./pages/StrategyAgent";
import CopywritingAgent from "./pages/CopywritingAgent";
import VisualAgent from "./pages/VisualAgent";
import MediaBuyingAgent from "./pages/MediaBuyingAgent";
import OptimizationAgent from "./pages/OptimizationAgent";
import Leads from "./pages/Leads";
import Competitors from "./pages/Competitors";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/strategy" component={StrategyAgent} />
      <Route path="/copywriting" component={CopywritingAgent} />
      <Route path="/visual" component={VisualAgent} />
      <Route path="/media-buying" component={MediaBuyingAgent} />
      <Route path="/optimization" component={OptimizationAgent} />
      <Route path="/leads" component={Leads} />
      <Route path="/competitors" component={Competitors} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <CyberLayout>
      <Router />
    </CyberLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
