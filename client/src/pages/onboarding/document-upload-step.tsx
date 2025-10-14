import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DocumentUploadStep({ application, onNext }: any) {
  const [uploadedDocs, setUploadedDocs] = useState<{
    governmentId?: File;
    proofOfEligibility?: File;
    certifications?: File[];
  }>({});

  const handleFileUpload = (docType: string, file: File | null) => {
    if (file) {
      setUploadedDocs(prev => ({ ...prev, [docType]: file }));
    }
  };

  const handleNext = () => {
    // In a real app, you would upload files to a storage service here
    // For now, we'll just simulate the upload
    onNext({
      // Store file metadata or URLs in the application
    });
  };

  const hasRequiredDocs = uploadedDocs.governmentId && uploadedDocs.proofOfEligibility;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Document Upload</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Please upload the required documents. All files must be in color and clearly legible.
      </p>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          For legal compliance, all documents must be uploaded in color. Ensure text is clear and readable.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Government ID */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Government-Issued ID*
                  {uploadedDocs.governmentId && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </CardTitle>
                <CardDescription>Driver's License, Passport, or State ID</CardDescription>
              </div>
              <Badge variant={uploadedDocs.governmentId ? "default" : "secondary"}>
                {uploadedDocs.governmentId ? "Uploaded" : "Required"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="government-id">Upload Color Copy</Label>
              <Input
                id="government-id"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('governmentId', e.target.files?.[0] || null)}
                data-testid="input-file-government-id"
              />
              {uploadedDocs.governmentId && (
                <p className="text-sm text-muted-foreground">
                  ✓ {uploadedDocs.governmentId.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proof of Work Eligibility (I-9) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Proof of Work Eligibility (I-9)*
                  {uploadedDocs.proofOfEligibility && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </CardTitle>
                <CardDescription>Social Security Card, Birth Certificate, or Passport</CardDescription>
              </div>
              <Badge variant={uploadedDocs.proofOfEligibility ? "default" : "secondary"}>
                {uploadedDocs.proofOfEligibility ? "Uploaded" : "Required"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="proof-eligibility">Upload Color Copy</Label>
              <Input
                id="proof-eligibility"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('proofOfEligibility', e.target.files?.[0] || null)}
                data-testid="input-file-eligibility"
              />
              {uploadedDocs.proofOfEligibility && (
                <p className="text-sm text-muted-foreground">
                  ✓ {uploadedDocs.proofOfEligibility.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Certifications (Optional) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Professional Certifications</CardTitle>
                <CardDescription>Licenses, certificates, or required credentials (if applicable)</CardDescription>
              </div>
              <Badge variant="outline">Optional</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="certifications">Upload Certificates</Label>
              <Input
                id="certifications"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setUploadedDocs(prev => ({ ...prev, certifications: files }));
                }}
                data-testid="input-file-certifications"
              />
              {uploadedDocs.certifications && uploadedDocs.certifications.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  ✓ {uploadedDocs.certifications.length} file(s) selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-6">
        <p className="text-sm text-muted-foreground">
          * Required documents
        </p>
        <Button 
          onClick={handleNext} 
          disabled={!hasRequiredDocs}
          data-testid="button-next-documents"
        >
          Continue to Agreements
        </Button>
      </div>
    </div>
  );
}
