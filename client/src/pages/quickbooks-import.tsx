import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Download
} from 'lucide-react';
import { SiQuickbooks } from 'react-icons/si';
import { Link } from 'wouter';

interface QBOEmployee {
  qboId: string;
  displayName: string;
  givenName: string;
  familyName: string;
  email: string;
  phone: string;
  active: boolean;
}

interface QBOCustomer {
  qboId: string;
  displayName: string;
  companyName: string;
  email: string;
  phone: string;
  active: boolean;
}

interface PreviewData {
  employees: QBOEmployee[];
  customers: QBOCustomer[];
  connectionId: string;
  companyName: string;
}

interface ConnectionStatus {
  quickbooks?: {
    connected: boolean;
    companyName?: string;
    lastSync?: string;
  };
}

export default function QuickBooksImportPage() {
  const { toast } = useToast();
  const [selectedEmployees, setSelectedEmployees] = useState<QBOEmployee[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<QBOCustomer[]>([]);
  const [activeTab, setActiveTab] = useState('employees');

  // Get workspace ID from current user
  const { data: workspace } = useQuery<{ id: string; orgCode: string }>({
    queryKey: ['/api/workspace'],
  });

  // Check connection status
  const { data: connectionStatus, isLoading: isLoadingConnection } = useQuery<ConnectionStatus>({
    queryKey: ['/api/integrations/connections', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return {};
      const res = await fetch(`/api/integrations/connections?workspaceId=${workspace.id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch connections');
      const connections = await res.json();
      const qbConnection = connections.find((c: any) => c.partnerType === 'quickbooks');
      return {
        quickbooks: qbConnection ? {
          connected: qbConnection.status === 'connected',
          companyName: qbConnection.companyName,
          lastSync: qbConnection.lastSyncAt,
        } : undefined,
      };
    },
    enabled: !!workspace?.id,
  });

  const isConnected = connectionStatus?.quickbooks?.connected;

  // Fetch preview data
  const { data: previewData, isLoading: isLoadingPreview, refetch: refetchPreview } = useQuery<PreviewData>({
    queryKey: ['/api/integrations/quickbooks/preview', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) throw new Error('No workspace');
      const res = await fetch(`/api/integrations/quickbooks/preview?workspaceId=${workspace.id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch preview');
      }
      return res.json();
    },
    enabled: !!workspace?.id && isConnected,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/integrations/quickbooks/connect', {
        workspaceId: workspace?.id,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to QuickBooks',
        variant: 'destructive',
      });
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/integrations/quickbooks/import', {
        workspaceId: workspace?.id,
        selectedEmployees,
        selectedCustomers,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const imported = data.importedEmployees + data.importedClients;
      const skipped = (data.skippedEmployees || 0) + (data.skippedClients || 0);
      
      let description = `Imported ${data.importedEmployees} employees and ${data.importedClients} clients`;
      if (skipped > 0) {
        description += `. ${skipped} already existed and were skipped.`;
      }
      
      toast({
        title: imported > 0 ? 'Import Complete' : 'No New Items',
        description,
        variant: imported > 0 ? 'default' : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedEmployees([]);
      setSelectedCustomers([]);
      refetchPreview();
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import data',
        variant: 'destructive',
      });
    },
  });

  const toggleEmployee = (emp: QBOEmployee) => {
    setSelectedEmployees(prev => 
      prev.find(e => e.qboId === emp.qboId)
        ? prev.filter(e => e.qboId !== emp.qboId)
        : [...prev, emp]
    );
  };

  const toggleCustomer = (cust: QBOCustomer) => {
    setSelectedCustomers(prev => 
      prev.find(c => c.qboId === cust.qboId)
        ? prev.filter(c => c.qboId !== cust.qboId)
        : [...prev, cust]
    );
  };

  const selectAllEmployees = () => {
    if (previewData?.employees) {
      if (selectedEmployees.length === previewData.employees.length) {
        setSelectedEmployees([]);
      } else {
        setSelectedEmployees([...previewData.employees]);
      }
    }
  };

  const selectAllCustomers = () => {
    if (previewData?.customers) {
      if (selectedCustomers.length === previewData.customers.length) {
        setSelectedCustomers([]);
      } else {
        setSelectedCustomers([...previewData.customers]);
      }
    }
  };

  const totalSelected = selectedEmployees.length + selectedCustomers.length;

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#2CA01C] flex items-center justify-center">
            <SiQuickbooks className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">QuickBooks Import</h1>
            <p className="text-sm text-muted-foreground">
              Import employees and clients from QuickBooks
            </p>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#2CA01C]/10 flex items-center justify-center mb-4">
              <SiQuickbooks className="h-8 w-8 text-[#2CA01C]" />
            </div>
            <CardTitle>Connect to QuickBooks</CardTitle>
            <CardDescription>
              Link your QuickBooks account to import employees and clients automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Import employees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Import clients</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Sync invoices</span>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || !workspace?.id}
              className="bg-[#2CA01C] hover:bg-[#248016]"
              data-testid="button-connect-quickbooks"
            >
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Connect QuickBooks
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#2CA01C] flex items-center justify-center">
                  <SiQuickbooks className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base" data-testid="text-company-name">
                    {previewData?.companyName || connectionStatus?.quickbooks?.companyName || 'QuickBooks'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Connected
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPreview()}
                disabled={isLoadingPreview}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
          </Card>

          {isLoadingPreview ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading QuickBooks data...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="employees" className="flex items-center gap-2" data-testid="tab-employees">
                    <Users className="h-4 w-4" />
                    Employees ({previewData?.employees?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="flex items-center gap-2" data-testid="tab-customers">
                    <Building2 className="h-4 w-4" />
                    Clients ({previewData?.customers?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="employees" className="mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap py-3">
                      <CardTitle className="text-base">Select Employees to Import</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllEmployees}
                        data-testid="button-select-all-employees"
                      >
                        {selectedEmployees.length === previewData?.employees?.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {!previewData?.employees?.length ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No employees found in QuickBooks</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {previewData.employees.map((emp) => {
                            const isSelected = selectedEmployees.some(e => e.qboId === emp.qboId);
                            return (
                              <label
                                key={emp.qboId}
                                className="flex items-center gap-4 p-4 hover-elevate cursor-pointer"
                                data-testid={`row-employee-${emp.qboId}`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleEmployee(emp)}
                                  data-testid={`checkbox-employee-${emp.qboId}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{emp.displayName}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {emp.email || 'No email'} {emp.phone && `• ${emp.phone}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="customers" className="mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap py-3">
                      <CardTitle className="text-base">Select Clients to Import</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllCustomers}
                        data-testid="button-select-all-customers"
                      >
                        {selectedCustomers.length === previewData?.customers?.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {!previewData?.customers?.length ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No clients found in QuickBooks</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {previewData.customers.map((cust) => {
                            const isSelected = selectedCustomers.some(c => c.qboId === cust.qboId);
                            return (
                              <label
                                key={cust.qboId}
                                className="flex items-center gap-4 p-4 hover-elevate cursor-pointer"
                                data-testid={`row-customer-${cust.qboId}`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleCustomer(cust)}
                                  data-testid={`checkbox-customer-${cust.qboId}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{cust.companyName || cust.displayName}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {cust.email || 'No email'} {cust.phone && `• ${cust.phone}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {totalSelected > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
                  <div className="container max-w-4xl flex items-center justify-between gap-4">
                    <div className="text-sm">
                      <span className="font-medium">{totalSelected}</span> items selected
                      <span className="text-muted-foreground ml-2">
                        ({selectedEmployees.length} employees, {selectedCustomers.length} clients)
                      </span>
                    </div>
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={importMutation.isPending}
                      data-testid="button-import"
                    >
                      {importMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Import Selected
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
