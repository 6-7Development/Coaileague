import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pen, Eraser, Download, Upload, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SignaturePadProps {
  title?: string;
  description?: string;
  documentType: string; // i9_form, w4_form, w9_form, etc.
  employeeId?: string;
  onSave?: (signatureId: string) => void;
  initialSignature?: string;
  readOnly?: boolean;
}

export function SignaturePad({
  title = "Electronic Signature",
  description = "Please sign in the box below",
  documentType,
  employeeId,
  onSave,
  initialSignature,
  readOnly = false
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(initialSignature || null);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Save signature mutation
  const saveSignatureMutation = useMutation({
    mutationFn: async (data: { signatureData: string; documentType: string; employeeId?: string }) => {
      return await apiRequest('POST', '/api/signatures', data);
    },
    onSuccess: (data: any) => {
      setIsSaved(true);
      toast({
        title: "Signature Saved",
        description: "Your signature has been securely stored with audit trail",
      });
      if (onSave && data.id) {
        onSave(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save signature",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialSignature;
    }

    // Set drawing style
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#000';
  }, [initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (readOnly) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save signature data
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
  };

  const clearSignature = () => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleSave = () => {
    if (!signatureData) {
      toast({
        title: "No Signature",
        description: "Please sign before saving",
        variant: "destructive",
      });
      return;
    }

    saveSignatureMutation.mutate({
      signatureData,
      documentType,
      employeeId,
    });
  };

  const handleDownload = () => {
    if (!signatureData) return;

    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = signatureData;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full border-2 border-dashed rounded-lg cursor-crosshair bg-white dark:bg-slate-950"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            data-testid="signature-canvas"
          />
          {readOnly && (
            <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                data-testid="button-clear-signature"
              >
                <Eraser className="h-4 w-4 mr-1" />
                Clear
              </Button>
              {onSave && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!signatureData || saveSignatureMutation.isPending || isSaved}
                  data-testid="button-save-signature"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Saved
                    </>
                  ) : saveSignatureMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Save Signature
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          {signatureData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              data-testid="button-download-signature"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
        </div>

        {readOnly && signatureData && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Pen className="h-3 w-3" />
            This signature is locked and cannot be modified
          </div>
        )}
      </CardContent>
    </Card>
  );
}
