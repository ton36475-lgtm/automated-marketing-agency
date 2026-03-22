import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Link2, Unlink2, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function IntegrationSettings() {
  const [loading, setLoading] = useState<"hubspot" | "meta" | null>(null);

  // Get integration status
  const { data: status, isLoading: statusLoading, refetch } = trpc.integration.oauth.status.useQuery();

  // Get HubSpot auth URL
  const { data: hubspotAuthUrl } = trpc.integration.oauth.hubspot.getAuthUrl.useQuery();

  // Get Meta Ads auth URL
  const { data: metaAuthUrl } = trpc.integration.oauth.metaAds.getAuthUrl.useQuery();

  // Get Meta Ads accounts
  const { data: metaAccounts } = trpc.integration.oauth.metaAds.getAccounts.useQuery(undefined, {
    enabled: status?.metaAds.connected,
  });

  // Disconnect mutations
  const disconnectHubspot = trpc.integration.oauth.hubspot.disconnect.useMutation({
    onSuccess: () => {
      toast.success("HubSpot disconnected");
      refetch();
    },
    onError: () => {
      toast.error("Failed to disconnect HubSpot");
    },
  });

  const disconnectMeta = trpc.integration.oauth.metaAds.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Meta Ads disconnected");
      refetch();
    },
    onError: () => {
      toast.error("Failed to disconnect Meta Ads");
    },
  });

  // Switch Meta account
  const switchAccount = trpc.integration.oauth.metaAds.switchAccount.useMutation({
    onSuccess: () => {
      toast.success("Ad account switched");
      refetch();
    },
    onError: () => {
      toast.error("Failed to switch account");
    },
  });

  const handleHubspotConnect = () => {
    if (hubspotAuthUrl?.url) {
      setLoading("hubspot");
      window.location.href = hubspotAuthUrl.url;
    }
  };

  const handleMetaConnect = () => {
    if (metaAuthUrl?.url) {
      setLoading("meta");
      window.location.href = metaAuthUrl.url;
    }
  };

  if (statusLoading) {
    return (
      <div className="container-safe py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading integration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-safe py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Integration Settings</h1>
        <p className="text-muted-foreground">Connect your HubSpot and Meta Ads accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HubSpot Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">HubSpot CRM</h2>
              <p className="text-sm text-muted-foreground">Sync contacts, leads, and deals</p>
            </div>
            {status?.hubspot.connected ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-500" />
            )}
          </div>

          <div className="space-y-4">
            {status?.hubspot.connected ? (
              <>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    ✓ Connected to HubSpot
                  </p>
                  {status.hubspot.portalId && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Portal ID: {status.hubspot.portalId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleHubspotConnect()}
                    disabled={loading === "hubspot"}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Switch Account
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => disconnectHubspot.mutate()}
                    disabled={disconnectHubspot.isPending}
                  >
                    <Unlink2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-sm text-foreground mb-3">Available Actions</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Sync contacts and leads</li>
                    <li>✓ AI-powered lead scoring</li>
                    <li>✓ Pipeline management</li>
                    <li>✓ Deal tracking</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Connect your HubSpot account to sync leads and contacts automatically
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleHubspotConnect}
                  disabled={loading === "hubspot" || !hubspotAuthUrl}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {loading === "hubspot" ? "Connecting..." : "Connect HubSpot"}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Meta Ads Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Meta Ads Manager</h2>
              <p className="text-sm text-muted-foreground">Create and manage ad campaigns</p>
            </div>
            {status?.metaAds.connected ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-500" />
            )}
          </div>

          <div className="space-y-4">
            {status?.metaAds.connected ? (
              <>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    ✓ Connected to Meta Ads
                  </p>
                  {status.metaAds.adAccountId && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Ad Account: {status.metaAds.adAccountId}
                    </p>
                  )}
                </div>

                {metaAccounts && metaAccounts.accounts.length > 1 && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Switch Ad Account
                    </label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    value={status.metaAds.adAccountId || ""}
                    onChange={(e) => switchAccount.mutate({ adAccountId: e.target.value })}
                    disabled={switchAccount.isPending}
                  >
                    {metaAccounts.accounts.map((account: any) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleMetaConnect()}
                    disabled={loading === "meta"}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Switch Account
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => disconnectMeta.mutate()}
                    disabled={disconnectMeta.isPending}
                  >
                    <Unlink2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-sm text-foreground mb-3">Available Actions</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Create campaigns</li>
                    <li>✓ Manage budgets</li>
                    <li>✓ Configure targeting</li>
                    <li>✓ Track performance</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Connect your Meta Ads account to create and manage campaigns
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleMetaConnect}
                  disabled={loading === "meta" || !metaAuthUrl}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {loading === "meta" ? "Connecting..." : "Connect Meta Ads"}
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Integration Status Overview */}
      <Card className="mt-8 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">Integration Status</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium text-foreground">HubSpot</span>
            <Badge variant={status?.hubspot.connected ? "default" : "secondary"}>
              {status?.hubspot.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium text-foreground">Meta Ads</span>
            <Badge variant={status?.metaAds.connected ? "default" : "secondary"}>
              {status?.metaAds.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Tip:</strong> Connect both HubSpot and Meta Ads to enable full automation. Your AI Agents will
            automatically sync leads, create campaigns, and optimize performance.
          </p>
        </div>
      </Card>
    </div>
  );
}
