import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapPin, Zap, FileText, TrendingUp } from "lucide-react";

export function SolarPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: clients, isLoading: clientsLoading } = trpc.solar.clients.list.useQuery();
  const { data: sites } = trpc.solar.sites.listByClient.useQuery(
    { clientId: clients?.[0]?.id ?? 0 },
    { enabled: !!clients?.[0]?.id }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-blue-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Solar Engineering</h1>
              <p className="mt-1 text-gray-600">Sales Engineering Automation Platform</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Sites
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quotes
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card className="border-blue-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{clients?.length ?? 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Active clients</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Sites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{sites?.length ?? 0}</div>
                  <p className="mt-1 text-xs text-gray-500">Active sites</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">0</div>
                  <p className="mt-1 text-xs text-gray-500">Awaiting response</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">$0</div>
                  <p className="mt-1 text-xs text-gray-500">Total opportunity</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Follow these steps to set up your first solar project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add a Client</h3>
                    <p className="text-sm text-gray-600">Create a new client profile with contact information</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Map the Site</h3>
                    <p className="text-sm text-gray-600">Draw the roof polygon on the map and capture site details</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Calculate Solar Potential</h3>
                    <p className="text-sm text-gray-600">Run PVWatts analysis to estimate annual production</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">4</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Generate Quote</h3>
                    <p className="text-sm text-gray-600">Create an automated quote with financing options</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>Manage your solar installation clients</CardDescription>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="text-center text-gray-500">Loading clients...</div>
                ) : clients && clients.length > 0 ? (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <p className="text-sm text-gray-600">{client.email || client.phone}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No clients yet. Create one to get started.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sites Tab */}
          <TabsContent value="sites" className="space-y-4">
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle>Installation Sites</CardTitle>
                <CardDescription>Manage solar installation sites</CardDescription>
              </CardHeader>
              <CardContent>
                {sites && sites.length > 0 ? (
                  <div className="space-y-2">
                    {sites.map((site) => (
                      <div key={site.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{site.name || "Unnamed Site"}</h3>
                          <p className="text-sm text-gray-600">{site.address}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Analyze
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No sites yet. Add a client and create a site.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle>Quotes & Proposals</CardTitle>
                <CardDescription>Track all generated quotes and proposals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">No quotes generated yet.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Monitor installed system performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">No performance data available.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
