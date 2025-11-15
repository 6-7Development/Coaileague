import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  // Check if user has platform admin role (root_admin or deputy_admin)
  const platformRole = (user as any)?.platformRole;
  const isPlatformAdmin = platformRole === 'root_admin' || platformRole === 'deputy_admin';

  if (!isPlatformAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle data-testid="text-unauthorized-title">Platform Admin Access Required</CardTitle>
                <CardDescription>Restricted Area</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground" data-testid="text-unauthorized-message">
              This area is restricted to platform administrators only. You need root_admin or deputy_admin privileges to access platform management features.
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2" data-testid="button-back-dashboard">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
