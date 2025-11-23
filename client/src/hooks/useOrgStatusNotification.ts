/**
 * Organization Status Notification Hook
 * Checks workspace status and shows appropriate toast
 * Dynamically configurable per organization
 * 
 * Handles:
 * - Payment suspension
 * - Policy violations
 * - Maintenance windows
 * - Trial expiration
 * - Account restrictions
 */

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  getOrgStatusMessage, 
  getCustomizedOrgMessage,
  OrgStatusType,
  ORG_STATUS_API,
  ORG_STATUS_TEST_IDS,
} from "@/config/orgStatusMessages";

export interface WorkspaceStatus {
  workspaceId: string;
  status: OrgStatusType;
  statusReason?: string;
  lastChecked: string;
  metadata?: {
    daysRemaining?: number;
    trialEndDate?: string;
    maintenanceEndTime?: string;
    suspensionReason?: string;
  };
}

export interface OrgCustomization {
  workspaceId: string;
  statusOverrides?: Record<string, any>;
  customMessages?: Record<string, string>;
}

export function useOrgStatusNotification(workspaceId?: string) {
  const { toast } = useToast();
  const [shown, setShown] = useState(false);

  // Fetch org status
  const { data: status, isLoading: statusLoading } = useQuery<WorkspaceStatus | null>({
    queryKey: [ORG_STATUS_API.getOrgStatus, workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      try {
        const response = await fetch(ORG_STATUS_API.getOrgStatus, {
          credentials: "include",
        });
        if (!response.ok) {
          console.warn("Failed to fetch org status");
          return null;
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching org status:", error);
        return null;
      }
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch org customizations
  const { data: customization } = useQuery<OrgCustomization | null>({
    queryKey: [ORG_STATUS_API.getCustomMessages, workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      try {
        const response = await fetch(ORG_STATUS_API.getCustomMessages, {
          credentials: "include",
        });
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 0,
  });

  // Show toast based on status
  const showOrgStatusToast = useCallback(() => {
    if (!status || shown) return;

    // Skip if active status
    if (status.status === "active") {
      // Could show welcome toast here
      setShown(true);
      return;
    }

    // Get message (with customizations if available)
    const message = getCustomizedOrgMessage(status.status, customization || undefined, {
      daysRemaining: status.metadata?.daysRemaining,
      trialEndDate: status.metadata?.trialEndDate,
      maintenanceEndTime: status.metadata?.maintenanceEndTime,
    });

    // Show toast
    const actionElement = message.actionLabel && message.actionUrl ? (
      <button
        onClick={() => {
          window.location.href = message.actionUrl || "/";
        }}
        className="px-2 py-1 text-sm font-medium hover:underline"
      >
        {message.actionLabel}
      </button>
    ) : undefined;

    toast({
      title: message.title,
      description: message.description,
      variant: message.severity === "error" ? "destructive" : message.severity === "warning" ? "default" : "default",
      duration: message.autoClose || undefined,
      action: actionElement,
    });

    setShown(true);
  }, [status, shown, customization, toast]);

  // Show toast when status loads
  useEffect(() => {
    if (!statusLoading && status) {
      showOrgStatusToast();
    }
  }, [statusLoading, status, showOrgStatusToast]);

  // Check if access is blocked
  const isAccessBlocked = status?.status && [
    "suspended_payment",
    "suspended_violation",
    "suspended_other",
    "trial_expired",
  ].includes(status.status);

  // Reset shown flag when workspace changes
  useEffect(() => {
    setShown(false);
  }, [workspaceId]);

  return {
    status: status?.status || "active",
    isLoading: statusLoading,
    isAccessBlocked,
    statusReason: status?.statusReason,
    metadata: status?.metadata,
    message: status && getOrgStatusMessage(status.status, {}),
  };
}

/**
 * Hook to show status banner instead of toast
 * Useful for persistent display (not auto-closing)
 */
export function useOrgStatusBanner(workspaceId?: string) {
  const { status, isLoading, isAccessBlocked, statusReason, metadata } = useOrgStatusNotification(workspaceId);

  return {
    status,
    isLoading,
    isAccessBlocked,
    statusReason,
    metadata,
    showBanner: status !== "active" && !isLoading,
  };
}
