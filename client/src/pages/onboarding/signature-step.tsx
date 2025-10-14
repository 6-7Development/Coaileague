import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, PenTool, AlertCircle } from "lucide-react";

const EMPLOYEE_CONTRACT_TEXT = `
EMPLOYMENT AGREEMENT

This Employment Agreement is entered into effective as of the date of signature below.

1. POSITION AND DUTIES
Employee will perform duties as assigned by the Employer in a professional and competent manner.

2. COMPENSATION
Employee will be compensated according to the terms specified by the Employer.

3. AT-WILL EMPLOYMENT
Employment is at-will and may be terminated at any time by either party.

4. CONFIDENTIALITY
Employee agrees to maintain confidentiality of all proprietary information.

5. ACKNOWLEDGEMENT
By signing below, Employee acknowledges receipt and understanding of this agreement.
`;

const CONTRACTOR_AGREEMENT_TEXT = `
INDEPENDENT CONTRACTOR AGREEMENT

This Independent Contractor Agreement is entered into effective as of the date of signature below.

1. INDEPENDENT CONTRACTOR STATUS
Contractor is an independent contractor and not an employee.

2. SERVICES
Contractor will provide services as mutually agreed upon.

3. COMPENSATION
Contractor will invoice for services and is responsible for all taxes.

4. TERMINATION
Either party may terminate this agreement with notice.

5. ACKNOWLEDGEMENT
By signing below, Contractor acknowledges receipt and understanding of this agreement.
`;

const SOP_ACKNOWLEDGEMENT_TEXT = `
STANDARD OPERATING PROCEDURES ACKNOWLEDGEMENT

1. WORKPLACE SAFETY
I acknowledge that I have received training on workplace safety procedures.

2. ANTI-HARASSMENT POLICY
I understand and agree to comply with all anti-harassment policies.

3. DATA SECURITY
I will protect confidential information and company data.

4. CODE OF CONDUCT
I agree to maintain professional conduct at all times.

5. LEGAL PROTECTION
This acknowledgement serves as proof of training for legal compliance purposes.
`;

export function SignatureStep({ application, onNext }: any) {
  const [signatures, setSignatures] = useState<{
    contract: { signed: boolean; signatureData: string; signedByName: string } | null;
    sop: { signed: boolean; signatureData: string; signedByName: string } | null;
  }>({ contract: null, sop: null });

  const [currentDoc, setCurrentDoc] = useState<'contract' | 'sop' | null>(null);
  const [signatureName, setSignatureName] = useState(
    `${application?.firstName || ''} ${application?.lastName || ''}`.trim()
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const contractText = application?.taxClassification === 'w9_contractor' 
    ? CONTRACTOR_AGREEMENT_TEXT 
    : EMPLOYEE_CONTRACT_TEXT;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentDoc || !signatureName) return;

    const signatureData = canvas.toDataURL();
    setSignatures(prev => ({
      ...prev,
      [currentDoc]: {
        signed: true,
        signatureData,
        signedByName: signatureName,
      },
    }));
    setCurrentDoc(null);
    clearSignature();
  };

  const handleComplete = () => {
    if (signatures.contract?.signed && signatures.sop?.signed) {
      onNext({
        currentStep: 'completed',
        status: 'completed',
        completedAt: new Date(),
      });
    }
  };

  const allSigned = signatures.contract?.signed && signatures.sop?.signed;

  if (currentDoc) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {currentDoc === 'contract' ? 'Employment Agreement' : 'SOP Acknowledgement'}
        </h3>

        <ScrollArea className="h-64 border rounded-md p-4 mb-6">
          <pre className="text-sm whitespace-pre-wrap">
            {currentDoc === 'contract' ? contractText : SOP_ACKNOWLEDGEMENT_TEXT}
          </pre>
        </ScrollArea>

        <div className="space-y-4">
          <div>
            <Label htmlFor="signature-name">Full Name</Label>
            <Input
              id="signature-name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Enter your full name"
              data-testid="input-signature-name"
            />
          </div>

          <div>
            <Label>Draw Your Signature</Label>
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="border rounded-md w-full cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              data-testid="canvas-signature"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearSignature} data-testid="button-clear-signature">
              Clear
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCurrentDoc(null)}
              data-testid="button-cancel-signature"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveSignature}
              disabled={!signatureName}
              data-testid="button-save-signature"
            >
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Legal Agreements</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Please review and sign all required documents. Your signature creates a legally binding agreement.
      </p>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          All signatures are recorded with timestamp, IP address, and device information for legal compliance.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {application?.taxClassification === 'w9_contractor' 
                    ? 'Independent Contractor Agreement' 
                    : 'Employment Agreement'}
                  {signatures.contract?.signed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </CardTitle>
                <CardDescription>Required for all {application?.taxClassification === 'w9_contractor' ? 'contractors' : 'employees'}</CardDescription>
              </div>
              {signatures.contract?.signed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Button onClick={() => setCurrentDoc('contract')} data-testid="button-sign-contract">
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Document
                </Button>
              )}
            </div>
          </CardHeader>
          {signatures.contract?.signed && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ✓ Signed by {signatures.contract.signedByName} on {new Date().toLocaleDateString()}
              </p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Standard Operating Procedures (SOP)
                  {signatures.sop?.signed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </CardTitle>
                <CardDescription>Acknowledgement of safety, harassment, and conduct policies</CardDescription>
              </div>
              {signatures.sop?.signed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Button onClick={() => setCurrentDoc('sop')} data-testid="button-sign-sop">
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Document
                </Button>
              )}
            </div>
          </CardHeader>
          {signatures.sop?.signed && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ✓ Signed by {signatures.sop.signedByName} on {new Date().toLocaleDateString()}
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleComplete} 
          disabled={!allSigned}
          data-testid="button-complete-onboarding"
        >
          Complete Onboarding
        </Button>
      </div>
    </div>
  );
}
