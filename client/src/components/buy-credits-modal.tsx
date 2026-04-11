/**
 * Token Usage Info Modal
 * Shows token allowance details and overage billing explanation.
 * Credit purchasing has been removed — platform uses per-seat billing.
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cpu, TrendingUp, Check } from "lucide-react";

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            AI Token Allowance
          </DialogTitle>
          <DialogDescription>
            CoAIleague uses per-seat billing. Your plan includes a monthly token allowance for all AI features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Token allowance is included in your subscription — no separate credit purchases needed.</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>AI never stops working when you exceed your allowance — overage continues at $2.00 per 100,000 tokens.</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>To increase your monthly token allowance, upgrade to a higher subscription tier.</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button asChild>
              <a href="/settings/billing">View Plans</a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
