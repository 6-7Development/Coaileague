import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, ArrowLeft, Lock } from "lucide-react";

export default function Error403() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, hsl(243 75% 59%) 0%, hsl(264 70% 50%) 100%)'
    }}>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-amber-600 dark:text-amber-400" data-testid="icon-error-403" />
          </div>
          <h1 className="text-4xl font-bold" data-testid="text-error-title">403 - Access Denied</h1>
          <p className="text-lg text-muted-foreground mt-2" data-testid="text-error-description">
            You don't have permission to access this resource
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2 flex items-center">
              <Lock className="mr-2 h-4 w-4" />
              Why am I seeing this?
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>You may not have the required role (Owner, Manager, or Employee)</li>
              <li>This feature might be restricted to platform administrators</li>
              <li>Your account may need additional permissions</li>
              <li>This workspace feature may require a higher subscription tier</li>
            </ul>
          </div>

          <div className="grid gap-3 mt-6">
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full justify-start"
              variant="outline"
              data-testid="button-go-home"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>

            <Button 
              onClick={() => window.history.back()} 
              className="w-full justify-start"
              variant="outline"
              data-testid="button-go-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <Button 
              onClick={() => setLocation("/billing")} 
              className="w-full justify-start"
              variant="outline"
              data-testid="button-view-billing"
            >
              <Lock className="mr-2 h-4 w-4" />
              View Subscription & Upgrade
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex-col text-center space-y-2 pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            Need access? <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setLocation("/support")} data-testid="link-contact-support">Contact Your Administrator</Button>
          </p>
          <p className="text-xs text-muted-foreground">
            WorkforceOS - Enterprise-Grade Security & Access Control
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
