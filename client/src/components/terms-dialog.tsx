import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { WFLogoCompact } from "@/components/wf-logo";

interface TermsDialogProps {
  open: boolean;
  onAccept: (initials: string) => void;
  onDecline: () => void;
  userName?: string;
}

export function TermsDialog({ open, onAccept, onDecline, userName }: TermsDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [initials, setInitials] = useState("");

  const handleAccept = () => {
    if (agreed && initials.trim().length >= 2) {
      onAccept(initials.toUpperCase());
    }
  };

  // Suggest initials from user name
  const suggestedInitials = userName 
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3)
    : '';

  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className="max-w-3xl max-h-[95vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-testid="terms-dialog"
      >
        {/* Header with WorkforceOS Branding */}
        <DialogHeader className="border-b border-slate-300 pb-4">
          <div className="flex items-center gap-4">
            {/* WorkforceOS Logo */}
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-600 to-slate-700 shadow-lg">
              <WFLogoCompact size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-black text-slate-900">
                WorkforceOS™ Support Terms
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-1 font-semibold">
                Legal Agreement Required for Support Access
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 text-sm text-slate-700 py-2">
            <section className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="font-semibold text-blue-900">
                By accessing WorkforceOS™ HelpDesk support, you acknowledge and agree to the following terms.
                This agreement is legally binding and will be saved with your support ticket for compliance purposes.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base text-slate-900 mb-2">1. Service Agreement</h3>
              <p>
                This support service is provided "as is" for assistance with platform-related inquiries and technical support.
                WorkforceOS™ provides best-effort support but makes no guarantees regarding response time or issue resolution.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base text-slate-900 mb-2">2. Privacy & Data Collection</h3>
              <p className="mb-2">We collect and process the following information during your support session:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Chat messages and conversation history</li>
                <li>Email address and ticket information</li>
                <li>Account details you voluntarily provide</li>
                <li>Technical diagnostics (IP address, browser info, user agent)</li>
                <li>Support session metadata (timestamps, queue position)</li>
                <li>Your e-signature (initials) and acceptance timestamp</li>
              </ul>
              <p className="mt-2">
                All data is encrypted in transit and stored securely according to industry best practices and GDPR compliance.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base text-slate-900 mb-2">3. Acceptable Use</h3>
              <p className="mb-2">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use abusive, threatening, or inappropriate language</li>
                <li>Share sensitive credentials or payment information in chat</li>
                <li>Spam or flood the support system</li>
                <li>Impersonate others or provide false information</li>
                <li>Attempt to exploit or hack the platform</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base text-slate-900 mb-2">4. Limitation of Liability</h3>
              <p>
                WorkforceOS™ and its support staff provide assistance on a best-effort basis. We are not liable for any
                damages, data loss, or business interruption resulting from support interactions or advice provided.
                All recommendations should be reviewed by your IT team before implementation in production environments.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base text-slate-900 mb-2">5. Recording & Quality Assurance</h3>
              <p>
                Support conversations may be recorded, monitored, and reviewed for quality assurance, training purposes,
                and compliance auditing. By proceeding, you consent to this monitoring. Your acceptance of these terms,
                including your e-signature, will be saved with your ticket for audit purposes.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base text-slate-900 mb-2">6. AI-Powered Assistance</h3>
              <p>
                When HelpOS™ AI is enabled (client-pays-all model), your messages may be processed by third-party AI services.
                AI responses are supplementary and should not replace professional judgment for critical decisions.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base text-slate-900 mb-2">7. Termination</h3>
              <p>
                We reserve the right to terminate support access for violations of these terms, abusive behavior,
                or suspicious activity. Repeated violations may result in permanent account suspension.
              </p>
            </section>

            <section className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Important Legal Notice</p>
                  <p className="text-xs text-amber-800 mt-1">
                    These terms constitute a binding legal agreement. If you do not agree, please decline
                    and contact us via alternative support channels at support@workforceos.com
                  </p>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* E-Signature Section */}
        <div className="border-t border-slate-300 pt-4 space-y-3">
          <div className="bg-slate-100 rounded-md border border-slate-300 p-4">
            <Label htmlFor="initials" className="text-sm font-bold text-slate-900 mb-2 block">
              Electronic Signature (Your Initials) *
            </Label>
            <Input
              id="initials"
              type="text"
              placeholder={suggestedInitials || "e.g., JD"}
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              className="h-11 text-lg font-bold text-center tracking-widest uppercase"
              data-testid="input-initials"
            />
            <p className="text-xs text-slate-600 mt-2">
              By providing your initials, you electronically sign this agreement. 
              This signature will be legally binding and saved for audit compliance.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-md border border-blue-300">
            <Checkbox
              id="terms-agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1"
              data-testid="checkbox-agree-terms"
            />
            <label
              htmlFor="terms-agree"
              className="text-sm font-medium text-slate-900 cursor-pointer select-none flex-1"
            >
              I have read and agree to the Terms of Service and Privacy Agreement. I understand that
              my acceptance and e-signature will be saved with my support ticket for legal compliance.
            </label>
          </div>
        </div>

        {/* Footer with Required Buttons */}
        <DialogFooter className="gap-2 border-t border-slate-300 pt-4">
          <Button
            variant="outline"
            onClick={onDecline}
            className="border-slate-400 hover:bg-slate-100"
            data-testid="button-decline-terms"
          >
            Decline & Exit
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!agreed || initials.trim().length < 2}
            className="bg-gradient-to-r from-blue-600 to-slate-700 text-white font-semibold hover:from-blue-700 hover:to-slate-800 disabled:opacity-50"
            data-testid="button-accept-terms"
          >
            {!initials.trim() ? "Enter Initials to Accept" : !agreed ? "Check Agreement Box" : "Accept & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
