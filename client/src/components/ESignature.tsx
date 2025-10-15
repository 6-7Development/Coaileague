import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FileSignature } from "lucide-react";

interface ESignatureProps {
  value?: {
    agreed: boolean;
    signatureName: string;
    signedAt: string;
  };
  onChange?: (value: {
    agreed: boolean;
    signatureName: string;
    signedAt: string;
  }) => void;
  agreementText?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ESignature({
  value = { agreed: false, signatureName: "", signedAt: "" },
  onChange,
  agreementText = "I agree that my typed name below constitutes a legal electronic signature.",
  required = false,
  disabled = false,
}: ESignatureProps) {
  const [agreed, setAgreed] = useState(value.agreed);
  const [signatureName, setSignatureName] = useState(value.signatureName);

  const handleAgreementChange = (checked: boolean) => {
    setAgreed(checked);
    const signedAt = checked ? new Date().toISOString() : "";
    onChange?.({
      agreed: checked,
      signatureName: checked ? signatureName : "",
      signedAt,
    });
  };

  const handleNameChange = (name: string) => {
    setSignatureName(name);
    if (agreed) {
      onChange?.({
        agreed,
        signatureName: name,
        signedAt: value.signedAt || new Date().toISOString(),
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            Electronic Signature
            {required && <span className="text-destructive ml-1">*</span>}
          </h3>
        </div>

        {/* Agreement Checkbox */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="signature-agreement"
            checked={agreed}
            onCheckedChange={handleAgreementChange}
            disabled={disabled}
            data-testid="checkbox-signature-agreement"
          />
          <Label
            htmlFor="signature-agreement"
            className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
          >
            {agreementText}
          </Label>
        </div>

        {/* Signature Name Input */}
        <div className="space-y-2">
          <Label htmlFor="signature-name" className="text-sm font-medium">
            Full Legal Name{required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id="signature-name"
            type="text"
            placeholder="Type your full legal name"
            value={signatureName}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={!agreed || disabled}
            className="font-serif text-lg italic"
            data-testid="input-signature-name"
          />
          {agreed && signatureName && (
            <p className="text-xs text-muted-foreground">
              Signed on {new Date(value.signedAt || new Date()).toLocaleString()}
            </p>
          )}
        </div>

        {/* Visual Signature Display */}
        {agreed && signatureName && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">Electronic Signature:</p>
            <div className="bg-muted/30 p-3 rounded border-2 border-dashed">
              <p className="font-serif text-2xl italic text-foreground" data-testid="text-signature-display">
                {signatureName}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
