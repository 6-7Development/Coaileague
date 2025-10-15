import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServerCrash, Home, RefreshCw, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function Error500() {
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, hsl(243 75% 59%) 0%, hsl(264 70% 50%) 100%)'
    }}>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <ServerCrash className="h-10 w-10 text-red-600 dark:text-red-400" data-testid="icon-error-500" />
          </div>
          <h1 className="text-4xl font-bold" data-testid="text-error-title">500 - Server Error</h1>
          <p className="text-lg text-muted-foreground mt-2" data-testid="text-error-description">
            Something went wrong on our end
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">We're working on it</h3>
            <p className="text-sm text-muted-foreground">
              Our team has been notified and is investigating the issue. This is usually temporary and should be resolved shortly.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">What can you do?</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-6 list-disc">
              <li>Try refreshing the page</li>
              <li>Clear your browser cache and cookies</li>
              <li>Wait a few minutes and try again</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="grid gap-3 mt-6">
            <Button 
              onClick={handleRefresh} 
              className="w-full justify-start"
              variant="default"
              disabled={isRefreshing}
              data-testid="button-refresh-page"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Page'}
            </Button>

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
              onClick={() => setLocation("/support")} 
              className="w-full justify-start"
              variant="outline"
              data-testid="button-contact-support"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex-col text-center space-y-2 pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            Error Code: 500 - Internal Server Error
          </p>
          <p className="text-xs text-muted-foreground">
            WorkforceOS - 99.9% Uptime SLA Guarantee
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
