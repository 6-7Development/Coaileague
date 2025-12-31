import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface PaymentErrorResponse {
  code: 'PAYMENT_REQUIRED' | 'ORGANIZATION_INACTIVE';
  message: string;
  reason: 'suspended' | 'cancelled';
  forceLogout?: boolean;
  redirectTo?: string;
  isOwner?: boolean;
  workspaceName?: string;
}

interface PaymentModalState {
  isOpen: boolean;
  workspaceName: string;
  reason: string;
  redirectTo: string;
}

const PaymentModalContext = createContext<{
  showPaymentModal: (data: PaymentErrorResponse) => void;
  isModalOpen: boolean;
} | null>(null);

export function usePaymentEnforcement() {
  const context = useContext(PaymentModalContext);
  return { 
    showPaymentModal: context?.showPaymentModal,
    isModalOpen: context?.isModalOpen ?? false
  };
}

export function PaymentEnforcementProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<PaymentModalState>({
    isOpen: false,
    workspaceName: '',
    reason: '',
    redirectTo: '/org-management'
  });

  const showPaymentModal = useCallback((data: PaymentErrorResponse) => {
    console.log('[PaymentEnforcement] Showing modal for:', data);
    setModalState({
      isOpen: true,
      workspaceName: data.workspaceName || 'Your organization',
      reason: data.reason || 'suspended',
      redirectTo: data.redirectTo || '/org-management'
    });
  }, []);

  const handleActivate = useCallback(() => {
    window.location.href = modalState.redirectTo;
  }, [modalState.redirectTo]);

  // Intercept fetch calls
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check for payment-related errors on API calls
      if ((response.status === 402 || response.status === 404) && 
          args[0]?.toString().includes('/api/')) {
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          console.log('[PaymentEnforcement] Intercepted:', response.status, data);
          
          // IMPORTANT: Check isOwner FIRST before checking forceLogout
          if (data.isOwner === true) {
            // Owner with payment issue - show modal, never logout
            console.log('[PaymentEnforcement] Owner detected - showing modal');
            setModalState({
              isOpen: true,
              workspaceName: data.workspaceName || 'Your organization',
              reason: data.reason || 'suspended',
              redirectTo: data.redirectTo || '/org-management'
            });
          } else if (data.forceLogout === true && data.isOwner === false) {
            // Explicitly non-owner with force logout - log them out
            console.log('[PaymentEnforcement] Non-owner - forcing logout');
            apiRequest('POST', '/api/auth/logout').finally(() => {
              window.location.href = '/';
            });
          }
        } catch (e) {
          // JSON parse error - ignore
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <PaymentModalContext.Provider value={{ showPaymentModal, isModalOpen: modalState.isOpen }}>
      {children}
      
      {/* Compact Payment Modal - SaaS style */}
      <AlertDialog open={modalState.isOpen}>
        <AlertDialogContent className="max-w-xs p-4 gap-3">
          <AlertDialogHeader className="gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDialogTitle className="text-base font-semibold">
                Subscription Inactive
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              {modalState.workspaceName} is {modalState.reason}. Reactivate to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-1">
            <AlertDialogAction 
              onClick={handleActivate}
              className="w-full h-8 text-sm"
              data-testid="button-activate-subscription"
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PaymentModalContext.Provider>
  );
}
